"""
LLM Engine — 3-tier fallback chain:
  1. OpenRouter  (primary  — free models: Gemini, Llama, GPT-4, Grok)
  2. Groq        (secondary — ultra-fast Llama 3.3)
  3. Gemini      (tertiary  — Google direct)

No OpenAI API key required.
"""
from __future__ import annotations
import json
import re
import httpx
from langchain_core.messages import HumanMessage, SystemMessage
from app.core.config import settings

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# ─── OpenRouter (OpenAI-compatible) ──────────────────────────────────────────

def _call_openrouter_sync(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Direct HTTP call to OpenRouter — no extra SDK needed."""
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": settings.openrouter_site_url,
        "X-Title": settings.openrouter_site_name,
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.openrouter_model,
        "temperature": temperature,
        "max_tokens": 4096,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
    }
    resp = httpx.post(
        f"{OPENROUTER_BASE_URL}/chat/completions",
        headers=headers,
        json=body,
        timeout=60,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


async def _call_openrouter_async(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Async HTTP call to OpenRouter."""
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": settings.openrouter_site_url,
        "X-Title": settings.openrouter_site_name,
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.openrouter_model,
        "temperature": temperature,
        "max_tokens": 4096,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers=headers,
            json=body,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


# ─── Groq (LangChain) ────────────────────────────────────────────────────────

async def _call_groq_async(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    from langchain_groq import ChatGroq
    llm = ChatGroq(
        model=settings.groq_model,
        temperature=temperature,
        api_key=settings.groq_api_key,
    )
    messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
    resp = await llm.ainvoke(messages)
    return resp.content


# ─── Gemini (google-genai) ───────────────────────────────────────────────────

async def _call_gemini_async(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    from langchain_google_genai import ChatGoogleGenerativeAI
    llm = ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        temperature=temperature,
        google_api_key=settings.gemini_api_key,
    )
    messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
    resp = await llm.ainvoke(messages)
    return resp.content


# ─── Main entry point (3-tier fallback) ──────────────────────────────────────

async def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """
    Call LLM with automatic fallback:
      OpenRouter → Groq → Gemini
    """
    # 1️⃣ OpenRouter (primary)
    if settings.openrouter_api_key:
        try:
            result = await _call_openrouter_async(system_prompt, user_prompt, temperature)
            if result and result.strip():
                return result
        except Exception as e:
            print(f"[LLM] OpenRouter failed ({settings.openrouter_model}): {e}")

    # 2️⃣ Groq (secondary)
    if settings.groq_api_key:
        try:
            result = await _call_groq_async(system_prompt, user_prompt, temperature)
            if result and result.strip():
                return result
        except Exception as e:
            print(f"[LLM] Groq failed ({settings.groq_model}): {e}")

    # 3️⃣ Gemini (tertiary)
    if settings.gemini_api_key:
        try:
            result = await _call_gemini_async(system_prompt, user_prompt, temperature)
            if result and result.strip():
                return result
        except Exception as e:
            print(f"[LLM] Gemini failed ({settings.gemini_model}): {e}")

    raise RuntimeError("All LLM providers failed. Check your API keys and quotas.")


# ─── Direct callers (for use outside async context) ──────────────────────────

def call_llm_sync(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> str:
    """Synchronous LLM call — uses OpenRouter directly, falls back to Groq."""
    if settings.openrouter_api_key:
        try:
            return _call_openrouter_sync(system_prompt, user_prompt, temperature)
        except Exception as e:
            print(f"[LLM-SYNC] OpenRouter failed: {e}")

    if settings.groq_api_key:
        try:
            from groq import Groq
            client = Groq(api_key=settings.groq_api_key)
            resp = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=4096,
            )
            return resp.choices[0].message.content or ""
        except Exception as e:
            print(f"[LLM-SYNC] Groq failed: {e}")

    raise RuntimeError("No LLM available for sync call.")


# ─── Free model list (OpenRouter) ────────────────────────────────────────────

FREE_MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-chat-v3-0324:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen3-235b-a22b:free",
]


# ─── JSON extraction ──────────────────────────────────────────────────────────

def extract_json(text: str):
    """Extract JSON from LLM response — handles markdown code fences."""
    if not text:
        return None

    # Direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # Strip ```json ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Find first complete JSON object or array
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start = text.find(start_char)
        end = text.rfind(end_char)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass

    return None
