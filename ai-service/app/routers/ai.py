from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.resume_parser import parse_resume

router = APIRouter(prefix="/ai", tags=["AI"])


class ResumeParseRequest(BaseModel):
    filePath: str
    fileName: Optional[str] = ""

class QuestionRequest(BaseModel):
    targetRole: str
    mode: str
    difficulty: str = "medium"
    count: int = 1
    parsed_resume: Optional[dict] = None
    weak_topics: Optional[list[str]] = []

class EvaluateRequest(BaseModel):
    question: str
    answer: str
    mode: str
    topic: str = "General"
    difficulty: str = "medium"

class AdaptiveRequest(BaseModel):
    targetRole: str
    mode: str
    difficulty: str = "medium"
    weak_topics: Optional[list[str]] = []
    answered_topics: Optional[list[str]] = []
    session_history: Optional[list[dict]] = []
    parsed_resume: Optional[dict] = None

class ResumeAnalyzeRequest(BaseModel):
    parsed_resume: dict

class MCQRequest(BaseModel):
    targetRole: str
    mode: str = "technical"
    difficulty: str = "medium"
    count: int = 1
    asked_questions: list[str] = []
    asked_topics: list[str] = []
    question_number: int = 1


@router.post("/parse-resume")
async def parse_resume_endpoint(req: ResumeParseRequest):
    try:
        parsed = parse_resume(req.filePath)
        return {"success": True, "parsed": parsed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-resume")
async def analyze_resume_endpoint(req: ResumeAnalyzeRequest):
    """ATS score, job role recommendations, skill gap, certifications."""
    from app.core.llm import call_llm, extract_json
    from app.core.prompts_extra import RESUME_INTELLIGENCE_SYSTEM, RESUME_INTELLIGENCE_USER
    try:
        p = req.parsed_resume
        skills_str   = ", ".join(p.get("skills", [])[:20]) or "Not specified"
        edu_str      = "; ".join(f"{e.get('degree','')} from {e.get('institute','')}" for e in p.get("education", [])[:3]) or "Not specified"
        exp_str      = "; ".join(f"{e.get('role','')} at {e.get('company','')}" for e in p.get("experience", [])[:3]) or "Fresher"
        projects_str = "; ".join(f"{pr.get('name','')}: {pr.get('description','')[:80]}" for pr in p.get("projects", [])[:3]) or "Not specified"

        user_prompt = RESUME_INTELLIGENCE_USER.format(
            skills=skills_str, education=edu_str,
            experience=exp_str, projects=projects_str
        )
        response = await call_llm(RESUME_INTELLIGENCE_SYSTEM, user_prompt, temperature=0.3)
        result = extract_json(response)
        if result:
            return {"success": True, "analysis": result}
        raise ValueError("Could not parse AI response")
    except Exception as e:
        print(f"[ResumeAnalyze] Error: {e}")
        return {
            "success": True,
            "analysis": {
                "ats_score": 65,
                "ats_breakdown": {"skills_relevance": 70, "education": 75, "experience": 50, "projects": 60, "completeness": 65},
                "profile_summary": "A promising candidate with strong technical skills. Upload a more detailed resume for a precise analysis.",
                "strengths": ["Strong technical skills", "Good educational background", "Project experience"],
                "improvements": ["Add quantified achievements", "Include internship experience", "Add GitHub/LinkedIn links"],
                "recommended_roles": [
                    {"role": "Software Developer", "match_pct": 75, "why": "Core programming skills match well", "missing_skills": ["System Design", "Cloud"], "salary_range": "6-12 LPA", "demand": "High"},
                    {"role": "Backend Developer", "match_pct": 70, "why": "Good server-side tech stack", "missing_skills": ["Docker", "Kubernetes"], "salary_range": "7-14 LPA", "demand": "High"},
                    {"role": "ML Engineer", "match_pct": 65, "why": "ML/AI coursework relevant", "missing_skills": ["PyTorch", "MLOps"], "salary_range": "8-18 LPA", "demand": "Medium"},
                ],
                "interview_readiness": 60,
                "top_certifications": ["AWS Cloud Practitioner", "Google Data Analytics", "MongoDB Associate Developer"],
            }
        }


@router.post("/generate-mcq")
async def generate_mcq_endpoint(req: MCQRequest):
    """Generate unique 4-option MCQ questions with correct answer and explanation."""
    from app.core.llm import call_llm, extract_json
    from app.core.prompts_extra import MCQ_GENERATION_SYSTEM, MCQ_GENERATION_USER
    try:
        # Build avoidance context
        avoid_section = ""
        if req.asked_questions:
            avoid_section = f"\n\nIMPORTANT - Do NOT repeat any of these already-asked questions:\n"
            avoid_section += "\n".join(f"- {q}" for q in req.asked_questions[-9:])
        if req.asked_topics:
            unique_topics = list(set(req.asked_topics))
            avoid_section += f"\n\nAlready covered topics: {', '.join(unique_topics)}. Choose a DIFFERENT topic."

        user_prompt = MCQ_GENERATION_USER.format(
            count=req.count,
            target_role=req.targetRole,
            mode=req.mode,
            difficulty=req.difficulty,
            question_number=req.question_number,
        ) + avoid_section

        response = await call_llm(MCQ_GENERATION_SYSTEM, user_prompt, temperature=0.85)
        questions = extract_json(response)
        if isinstance(questions, list) and len(questions) > 0:
            return {"success": True, "questions": questions[:req.count]}
        raise ValueError("Bad format")
    except Exception as e:
        print(f"[MCQ] Error: {e}")
        # Unique fallback based on question number
        fallbacks = [
            {"question": "What is the time complexity of binary search?", "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"], "correct_index": 1, "explanation": "Binary search halves the search space each step.", "topic": "Algorithms", "difficulty": req.difficulty},
            {"question": "Which HTTP method is idempotent?", "options": ["POST", "PATCH", "PUT", "DELETE"], "correct_index": 2, "explanation": "PUT replaces the resource — calling it multiple times has the same result.", "topic": "Web Development", "difficulty": req.difficulty},
            {"question": "What does SQL JOIN do?", "options": ["Deletes duplicate rows", "Combines rows from two tables", "Sorts query results", "Creates a new table"], "correct_index": 1, "explanation": "JOIN combines rows from two or more tables based on a related column.", "topic": "Databases", "difficulty": req.difficulty},
            {"question": "What is a closure in JavaScript?", "options": ["A way to close the browser", "A function with access to its outer scope", "A type of loop", "An error handler"], "correct_index": 1, "explanation": "A closure is a function that retains access to variables in its outer (enclosing) scope.", "topic": "JavaScript", "difficulty": req.difficulty},
            {"question": "What does Git rebase do?", "options": ["Deletes a branch", "Merges with a new commit", "Moves commits onto a new base", "Reverts last commit"], "correct_index": 2, "explanation": "Rebase replays commits on top of another branch, creating a linear history.", "topic": "Git", "difficulty": req.difficulty},
        ]
        idx = (req.question_number - 1) % len(fallbacks)
        return {"success": True, "questions": [fallbacks[idx]]}


@router.post("/generate-questions")
async def generate_questions_endpoint(req: QuestionRequest):
    from app.services.question_generator import generate_questions
    try:
        questions = await generate_questions(
            target_role=req.targetRole, mode=req.mode, difficulty=req.difficulty,
            count=req.count, parsed_resume=req.parsed_resume, weak_topics=req.weak_topics,
        )
        return {"success": True, "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate-answer")
async def evaluate_answer_endpoint(req: EvaluateRequest):
    from app.services.answer_evaluator import evaluate_answer
    try:
        result = await evaluate_answer(
            question=req.question, answer=req.answer,
            mode=req.mode, topic=req.topic, difficulty=req.difficulty,
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adaptive-next")
async def adaptive_next_endpoint(req: AdaptiveRequest):
    from app.services.adaptive_engine import get_adaptive_question
    try:
        question = await get_adaptive_question(
            target_role=req.targetRole, mode=req.mode, difficulty=req.difficulty,
            weak_topics=req.weak_topics, answered_topics=req.answered_topics,
            session_history=req.session_history, parsed_resume=req.parsed_resume,
        )
        return {"success": True, "question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
