# -*- coding: utf-8 -*-
"""
Quick test to verify all LLM providers.
Run: python test_llm.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings


def test_openrouter():
    print("\n[OPENROUTER] Testing OpenRouter (primary)...")
    try:
        import httpx
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "HTTP-Referer": settings.openrouter_site_url,
            "X-Title": settings.openrouter_site_name,
            "Content-Type": "application/json",
        }
        body = {
            "model": settings.openrouter_model,
            "max_tokens": 30,
            "messages": [{"role": "user", "content": "Say only: OpenRouter works!"}],
        }
        resp = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=body,
            timeout=30,
        )
        resp.raise_for_status()
        reply = resp.json()["choices"][0]["message"]["content"]
        print(f"[PASS] OpenRouter ({settings.openrouter_model}): {reply.strip()}")
        return True
    except Exception as e:
        print(f"[FAIL] OpenRouter: {e}")
        return False


def test_groq():
    print("\n[GROQ] Testing Groq (secondary)...")
    try:
        from groq import Groq
        client = Groq(api_key=settings.groq_api_key)
        resp = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": "Say only: Groq works!"}],
            max_tokens=20,
        )
        reply = resp.choices[0].message.content
        print(f"[PASS] Groq ({settings.groq_model}): {reply.strip()}")
        return True
    except Exception as e:
        print(f"[FAIL] Groq: {e}")
        return False


async def test_full_pipeline():
    print("\n[PIPELINE] Testing full LLM pipeline (question generation)...")
    try:
        from app.services.question_generator import generate_questions
        qs = await generate_questions(
            target_role="Backend Developer",
            mode="technical",
            difficulty="medium",
            count=1,
        )
        print(f"[PASS] Question: {qs[0]['question'][:90]}...")
        print(f"       Topic: {qs[0].get('topic', 'N/A')} | Difficulty: {qs[0].get('difficulty', 'N/A')}")
        return True
    except Exception as e:
        print(f"[FAIL] Pipeline: {e}")
        return False


async def test_evaluation():
    print("\n[EVAL] Testing answer evaluation...")
    try:
        from app.services.answer_evaluator import evaluate_answer
        result = await evaluate_answer(
            question="What is a REST API?",
            answer="REST API is a way to communicate between client and server using HTTP methods like GET, POST, PUT, DELETE. It follows stateless principles.",
            mode="technical",
            topic="API Design",
            difficulty="easy",
        )
        print(f"[PASS] Score: {result['aiScore']}/10 | Grade: {result['grade']}")
        return True
    except Exception as e:
        print(f"[FAIL] Evaluation: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("  PrepGenius AI -- LLM Provider Test")
    print("=" * 60)
    print(f"OpenRouter model : {settings.openrouter_model}")
    print(f"Groq model       : {settings.groq_model}")
    print(f"Gemini model     : {settings.gemini_model}")
    print(f"OpenRouter key   : {'SET' if settings.openrouter_api_key else 'MISSING'}")
    print(f"Groq key         : {'SET' if settings.groq_api_key else 'MISSING'}")
    print(f"Gemini key       : {'SET' if settings.gemini_api_key else 'MISSING'}")
    print()

    or_ok   = test_openrouter()
    groq_ok = test_groq()

    asyncio.run(test_full_pipeline())
    asyncio.run(test_evaluation())

    print("\n" + "=" * 60)
    print(f"OpenRouter : {'PASS' if or_ok else 'FAIL'}")
    print(f"Groq       : {'PASS' if groq_ok else 'FAIL'}")
    print("=" * 60)
