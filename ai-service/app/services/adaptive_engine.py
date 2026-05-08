"""
Adaptive question selector — determines next question based on session performance.
"""
from statistics import mean
from app.core.llm import call_llm, extract_json
from app.core.prompts import ADAPTIVE_SYSTEM, ADAPTIVE_USER
import json


def format_history(session_history: list) -> str:
    if not session_history:
        return "No history yet."
    lines = []
    for item in session_history[-3:]:
        lines.append(f"Q: {item.get('question', '')[:80]}... | Topic: {item.get('topic', '')} | Score: {item.get('aiScore', 0)}/10")
    return "\n".join(lines)


async def get_adaptive_question(
    target_role: str,
    mode: str,
    difficulty: str = "medium",
    weak_topics: list[str] | None = None,
    answered_topics: list[str] | None = None,
    session_history: list | None = None,
    parsed_resume: dict | None = None,
) -> dict:
    weak = weak_topics or []
    covered = answered_topics or []
    history = session_history or []

    # Determine adjusted difficulty based on recent scores
    if history:
        recent_scores = [h.get("aiScore", 5) for h in history[-3:]]
        avg = mean(recent_scores)
        if avg < 4:
            difficulty = "easy"
        elif avg > 8:
            difficulty = "hard"

    history_str = format_history(history)

    user_prompt = ADAPTIVE_USER.format(
        target_role=target_role,
        mode=mode,
        difficulty=difficulty,
        weak_topics=", ".join(weak) if weak else "None",
        answered_topics=", ".join(covered) if covered else "None",
        session_history=history_str,
    )

    try:
        response = await call_llm(ADAPTIVE_SYSTEM, user_prompt, temperature=0.7)
        result = extract_json(response)

        if result and "question" in result:
            return {
                "question": result["question"],
                "topic": result.get("topic", "General"),
                "difficulty": result.get("difficulty", difficulty),
            }
    except Exception as e:
        print(f"Adaptive question error: {e}")

    # Fallback
    focus = weak[0] if weak else "problem-solving"
    return {
        "question": f"Describe a complex {focus} problem you encountered and how you resolved it.",
        "topic": focus,
        "difficulty": difficulty,
    }
