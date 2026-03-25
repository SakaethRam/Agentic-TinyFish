/* =============================
   CONFIG
============================= */

const BASE_API = "http://localhost:8000"; // change if deployed

/* =============================
   TYPES
============================= */

export type AgentResponse = {
  response: string;
};

export type UrlResponse = {
  url: string;
};

/* =============================
   GENERIC FETCH WRAPPER
============================= */

const safeFetch = async <T>(
  url: string,
  body: any
): Promise<T | null> => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("[TinyFish Connector] API Error:", await res.text());
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("[TinyFish Connector] Fetch Crash:", err);
    return null;
  }
};

/* =============================
   TINYFISH AGENT (MAIN)
============================= */

export const getTinyFishResponse = async (
  input: string
): Promise<string> => {
  const data = await safeFetch<AgentResponse>(
    `${BASE_API}/query`,
    { query: input }
  );

  if (!data) return "Agent failed.";

  return data.response;
};

/* =============================
   SERPER FULL RESPONSE
============================= */

export const getSerperResponse = async (
  query: string
): Promise<string> => {
  const data = await safeFetch<AgentResponse>(
    `${BASE_API}/serper/search`,
    { query }
  );

  if (!data) return "Search failed.";

  return data.response;
};

/* =============================
   SERPER URL PICKER (CRITICAL)
============================= */

export const getTopSerperUrl = async (
  query: string
): Promise<string> => {
  console.log("[TinyFish Connector] Fetching top URL...");

  const data = await safeFetch<UrlResponse>(
    `${BASE_API}/serper/url`,
    { query }
  );

  if (!data) return "https://www.google.com";

  return data.url;
};

/* =============================
   SMART ROUTER (OPTIONAL)
============================= */

export const getUnifiedResponse = async (
  input: string
): Promise<string> => {

  const lower = input.toLowerCase();

  // mimic your original "open" logic
  if (/^(open)\s+/i.test(input.trim())) {
    const cleanQuery = input.replace(/^open\s+/i, "").trim();

    const url = await getTopSerperUrl(cleanQuery);
    return url;
  }

  // default → TinyFish agent
  return await getTinyFishResponse(input);
};