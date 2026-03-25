# =============================
# IMPORTS
# =============================
import re
import json
import asyncio
from typing import List, Dict, Any, Optional, Set, AsyncGenerator

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# =============================
# CONFIG
# =============================

API_KEY = "YOUR_TINYFISH_API_KEY"
GEMINI_KEY = "YOUR_GEMINI_API_KEY"

BASE_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}"

TIMEOUT = 60
MAX_STEPS = 5
MAX_ITEMS = 20

app = FastAPI()

# =============================
# REQUEST MODEL
# =============================
class QueryRequest(BaseModel):
    query: str

# =============================
# STRICT INTENT CHECK
# =============================
def is_explicit_open(text: str) -> bool:
    return bool(re.match(r"^(open)\s+", text.strip(), re.IGNORECASE))

# =============================
# INTENT DETECTION
# =============================
def detect_intent(text: str) -> str:
    lower = text.lower()

    if any(k in lower for k in ["phone", "laptop", "buy"]):
        return "products"
    if any(k in lower for k in ["investor", "funding", "vc"]):
        return "investors"
    if any(k in lower for k in ["job", "hiring", "role"]):
        return "jobs"
    if any(k in lower for k in ["founder", "pm", "individual"]):
        return "people"

    return "general"

# =============================
# CONSTRAINT EXTRACTOR
# =============================
def extract_constraints(text: str):
    lower = text.lower()

    number_match = re.search(r"\b(\d+)\b", lower)
    words_to_numbers = {
        "one": 1, "two": 2, "three": 3,
        "four": 4, "five": 5
    }
    word_match = re.search(r"\b(one|two|three|four|five)\b", lower)

    count = None
    if number_match:
        count = int(number_match.group(1))
    elif word_match:
        count = words_to_numbers[word_match.group(1)]

    return {"count": count}

# =============================
# MEMORY
# =============================
class Memory:
    def __init__(self):
        self.data: List[Any] = []
        self.text: List[str] = []
        self.urls_visited: Set[str] = set()

    def add_data(self, d: List[Any]):
        self.data.extend(d)

    def add_text(self, t: str):
        if t:
            self.text.append(t)

    def add_url(self, url: str):
        self.urls_visited.add(url)

    def context(self):
        return {
            "data_count": len(self.data),
            "visited_urls": list(self.urls_visited)
        }

# =============================
# COUNT ENFORCER
# =============================
def enforce_count(memory: Memory, count: Optional[int]):
    if not count:
        return memory

    if memory.data:
        memory.data = memory.data[:count]
    elif memory.text:
        memory.text = memory.text[:count]

    return memory

# =============================
# PLANNER
# =============================
class PlannerAgent:
    def plan(self, goal: str, context: Dict, step: int):
        return {
            "execution_goal": f"""
You are an autonomous web agent.

OBJECTIVE:
{goal}

CONTEXT:
{json.dumps(context, indent=2)}

STEP {step}:
- Navigate
- Extract structured data
- Discover new URLs

RULES:
- JSON ONLY
- NO explanation

OUTPUT:
{{
 "data": [...],
 "next_urls": ["..."]
}}
"""
        }

# =============================
# EXECUTOR (SSE)
# =============================
class ExecutorAgent:
    async def execute(self, url: str, goal: str) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(
                BASE_URL,
                headers={
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
                json={"url": url, "goal": goal},
            )

            async for chunk in response.aiter_text():
                yield chunk

# =============================
# PARSER
# =============================
class ParserAgent:
    async def parse(self, stream: AsyncGenerator[str, None]):
        data, next_urls = [], []
        text = ""

        async for chunk in stream:
            lines = chunk.split("\n")

            for line in lines:
                if not line.startswith("data:"):
                    continue

                try:
                    parsed = json.loads(line.replace("data:", "").strip())

                    if "result" in parsed:
                        data.extend(parsed["result"].get("data", []))
                        next_urls.extend(parsed["result"].get("next_urls", []))
                        text += parsed["result"].get("text", "")

                    if "output" in parsed:
                        data.extend(parsed["output"].get("data", []))
                        next_urls.extend(parsed["output"].get("next_urls", []))
                        text += parsed["output"].get("text", "")

                    if "text" in parsed:
                        text += parsed["text"]

                except:
                    pass

        return {"data": data, "next_urls": next_urls, "text": text}

# =============================
# ANALYZER
# =============================
class AnalyzerAgent:
    def evaluate(self, memory: Memory):
        return {"enough_data": len(memory.data) >= 5}

# =============================
# FINAL AGENT
# =============================
class FinalAgent:
    def __init__(self):
        self.memory = Memory()
        self.planner = PlannerAgent()
        self.executor = ExecutorAgent()
        self.parser = ParserAgent()
        self.analyzer = AnalyzerAgent()

    def extract_direct_url(self, text: str):
        match = re.search(r"https?://\S+", text)
        return match.group(0) if match else None

    async def run(self, goal: str):
        constraints = extract_constraints(goal)
        count = constraints["count"]

        direct_url = self.extract_direct_url(goal)

        if direct_url:
            return await self.multi_step_run([direct_url], goal, count)

        return await self.multi_step_run(["https://www.google.com"], goal, count)

    async def multi_step_run(self, start_urls, goal, count):
        current_urls = start_urls

        for step in range(1, MAX_STEPS + 1):
            new_urls = []

            for url in current_urls:
                if url in self.memory.urls_visited:
                    continue

                plan = self.planner.plan(goal, self.memory.context(), step)
                stream = self.executor.execute(url, plan["execution_goal"])
                parsed = await self.parser.parse(stream)

                self.memory.add_url(url)
                self.memory.add_data(parsed["data"])
                self.memory.add_text(parsed["text"])

                new_urls.extend(parsed["next_urls"])

                if len(self.memory.data) >= MAX_ITEMS:
                    break

            if self.analyzer.evaluate(self.memory)["enough_data"]:
                break

            current_urls = list(set(new_urls))[:3] or ["https://www.google.com"]

        return enforce_count(self.memory, count)

# =============================
# FORMATTER (GEMINI)
# =============================
async def format_to_english(memory: Memory, user_query: str):
    try:
        intent = detect_intent(user_query)

        payload = {
            "data": memory.data[:6],
            "text": " ".join(memory.text),
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(
                GEMINI_URL,
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": f"Convert to clean English:\n{json.dumps(payload)}"}
                            ]
                        }
                    ]
                },
            )

        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    except:
        return "\n".join(memory.text) or "No response."

# =============================
# API ENDPOINT
# =============================
@app.post("/query")
async def query_agent(req: QueryRequest):
    try:
        agent = FinalAgent()
        memory = await agent.run(req.query)
        result = await format_to_english(memory, req.query)

        return {"response": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))