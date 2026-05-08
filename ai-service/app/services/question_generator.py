"""
Question generator using Groq (Llama 3) or Gemini.
No OpenAI required.
"""
from app.core.llm import call_llm, extract_json
from app.core.prompts import QUESTION_GENERATION_SYSTEM, QUESTION_GENERATION_USER
from app.core.config import settings


def build_resume_summary(parsed_resume: dict | None) -> str:
    if not parsed_resume:
        return "No resume provided. Generate general questions for the role."
    skills = ", ".join(parsed_resume.get("skills", [])[:15]) or "Not specified"
    exp = parsed_resume.get("experience", [])
    exp_str = "; ".join(
        f"{e.get('role', '')} at {e.get('company', '')}"
        for e in exp[:3]
    ) if exp else "Not specified"
    edu = parsed_resume.get("education", [])
    edu_str = "; ".join(
        f"{e.get('degree', '')} from {e.get('institute', '')}"
        for e in edu[:2]
    ) if edu else "Not specified"
    return f"Skills: {skills}\nExperience: {exp_str}\nEducation: {edu_str}"


async def generate_questions(
    target_role: str,
    mode: str,
    difficulty: str = "medium",
    count: int = 1,
    parsed_resume: dict | None = None,
    weak_topics: list[str] | None = None,
) -> list[dict]:
    weak_str = ", ".join(weak_topics) if weak_topics else "None"
    resume_summary = build_resume_summary(parsed_resume)

    user_prompt = QUESTION_GENERATION_USER.format(
        count=count,
        target_role=target_role,
        mode=mode,
        difficulty=difficulty,
        weak_topics=weak_str,
        resume_summary=resume_summary,
    )

    try:
        response = await call_llm(
            QUESTION_GENERATION_SYSTEM,
            user_prompt,
            temperature=0.8,
        )
        questions = extract_json(response)

        if isinstance(questions, list):
            return questions[:count]
        elif isinstance(questions, dict) and "questions" in questions:
            return questions["questions"][:count]

    except Exception as e:
        print(f"[QuestionGen] LLM failed: {e}")

    # Fallback question
    return [{
        "question": f"Tell me about your most impactful project as a {target_role} and what you learned from it.",
        "topic": "General Experience",
        "subtopic": "",
        "difficulty": difficulty,
    }]
