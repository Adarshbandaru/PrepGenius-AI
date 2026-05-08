"""
Answer evaluator — scores candidate answers using Groq or Gemini.
No OpenAI required.
"""
from app.core.llm import call_llm, extract_json
from app.core.prompts import EVALUATION_SYSTEM, EVALUATION_USER

_DEFAULT_FEEDBACK = {
    "strengths": ["Answer provided"],
    "improvements": ["Could provide more depth and examples"],
    "suggestion": "Use the STAR method for behavioral questions and explain your reasoning clearly.",
    "topicAccuracy": "Medium",
    "confidenceLevel": "Medium",
    "keyMissingPoints": [],
}


async def evaluate_answer(
    question: str,
    answer: str,
    mode: str,
    topic: str = "General",
    difficulty: str = "medium",
) -> dict:
    user_prompt = EVALUATION_USER.format(
        question=question,
        topic=topic,
        difficulty=difficulty,
        mode=mode,
        answer=answer,
    )

    try:
        response = await call_llm(EVALUATION_SYSTEM, user_prompt, temperature=0.2)
        result = extract_json(response)

        if result and "score" in result:
            score = float(result.get("score", 5))
            return {
                "aiScore": round(min(10.0, max(0.0, score)), 2),
                "grade": result.get("grade", "Fair"),
                "aiFeedback": result.get("aiFeedback", _DEFAULT_FEEDBACK),
            }

    except Exception as e:
        print(f"[Evaluator] LLM failed: {e}")

    # Graceful fallback — never crash the interview
    return {
        "aiScore": 6.0,
        "grade": "Good",
        "aiFeedback": _DEFAULT_FEEDBACK,
    }
