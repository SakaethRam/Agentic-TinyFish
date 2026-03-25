# =============================
# IMPORTS
# =============================
import json
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# =============================
# CONFIG
# =============================
API_KEY = "YOUR_TINYFISH_API_KEY"

if not API_KEY:
    raise Exception("Missing TinyFish API Key")

app = FastAPI()

# =============================
# TYPES (PYTHON EQUIVALENT)
# =============================
class SerperResult(BaseModel):
    title: str
    link: str
    snippet: Optional[str] = None

class SerperResponse(BaseModel):
    organic: Optional[List[SerperResult]] = None
    answerBox: Optional[Dict[str, Any]] = None
    knowledgeGraph: Optional[Dict[str, Any]] = None

class QueryRequest(BaseModel):
    query: str

# =============================
# RAW SEARCH
# =============================
async def search_serper(query: str) -> Optional[Dict]:
    try:
        print("[TinyFish] Parsing query...")
        print("Query:", query)

        print("[TinyFish] Sending request to TinyFish SearchEngine Module...")

        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://google.serper.dev/search",
                headers={
                    "X-API-KEY": SERPER_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "q": query,
                    "num": 5,
                },
            )

        if res.status_code != 200:
            print("Serper API Error:", res.text)
            return None

        print("[TinyFish] Data received")

        data = res.json()

        print("[TinyFish] Processing response..")

        return data

    except Exception as err:
        print("Serper Fetch Crash:", err)
        return None

# =============================
# FORMATTER
# =============================
def format_serper_results(data: Dict) -> str:
    output = ""

    # =============================
    # ANSWER BOX
    # =============================
    answer_box = data.get("answerBox")
    if answer_box:
        ans = answer_box.get("answer") or answer_box.get("snippet")

        if ans:
            output += f"1. {ans}\n"

            if answer_box.get("link"):
                domain = urlparse(answer_box["link"]).hostname.replace("www.", "")
                output += f"Here are the web URL Links for the {domain}: {answer_box['link']}\n\n"

    # =============================
    # KNOWLEDGE GRAPH
    # =============================
    kg = data.get("knowledgeGraph")
    if kg:
        title = kg.get("title", "")
        description = kg.get("description", "")

        if title or description:
            prefix = "" if output else "1. "
            output += f"{prefix}{title} {description}\n"

            if kg.get("website"):
                domain = urlparse(kg["website"]).hostname.replace("www.", "")
                output += f"Here are the web URL Links for the {domain}: {kg['website']}\n\n"

    # =============================
    # ORGANIC RESULTS
    # =============================
    organic = data.get("organic", [])
    if organic:
        for i, item in enumerate(organic[:5]):
            num = i + 1

            output += f"{num}. {item.get('title')}\n"

            if item.get("snippet"):
                output += f"{item.get('snippet')}\n"

            if item.get("link"):
                domain = urlparse(item["link"]).hostname.replace("www.", "")
                output += f"Here are the web URL Links for the {domain}: {item['link']}\n\n"

    return output.strip() or "No results found."

# =============================
# URL PICKER (FOR AGENTS)
# =============================
async def get_top_serper_url(query: str) -> str:
    print("[TinyFish] Agent started for URL navigation")

    data = await search_serper(query)

    if not data:
        return "https://www.google.com"

    if data.get("answerBox", {}).get("link"):
        print("[TinyFish] Using AnswerBox link")
        return data["answerBox"]["link"]

    if data.get("knowledgeGraph", {}).get("website"):
        print("[TinyFish] Using Knowledge Graph website")
        return data["knowledgeGraph"]["website"]

    if data.get("organic"):
        return data["organic"][0]["link"]

    return "https://www.google.com"

# =============================
# MAIN RESPONSE FUNCTION
# =============================
async def get_serper_response(query: str) -> str:
    try:
        data = await search_serper(query)

        if not data:
            return "Failed to fetch search results."

        print("[TinyFish] Formatting output...")

        try:
            formatted = format_serper_results(data)
            print("[TinyFish] Output ready")
            return formatted

        except Exception:
            fallback_link = (
                data.get("answerBox", {}).get("link")
                or data.get("knowledgeGraph", {}).get("website")
                or (data.get("organic")[0]["link"] if data.get("organic") else None)
                or "https://www.google.com"
            )

            return f"You can access the requested page here: {fallback_link}"

    except Exception as err:
        print("Serper Response Crash:", err)
        return "Search failed."

# =============================
# FASTAPI ENDPOINTS
# =============================
@app.post("/serper/search")
async def serper_search(req: QueryRequest):
    result = await get_serper_response(req.query)
    return {"response": result}

@app.post("/serper/url")
async def serper_url(req: QueryRequest):
    url = await get_top_serper_url(req.query)
    return {"url": url}