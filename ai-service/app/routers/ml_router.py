"""
ML API Router — PrepGenius AI
================================
Exposes the 3 real ML/statistical models as REST endpoints.
These run entirely locally with no LLM API calls.

Endpoints:
  POST /ml/ats-score         → TF-IDF cosine similarity ATS scorer
  POST /ml/semantic-score    → SBERT semantic answer scorer
  POST /ml/adaptive-next     → EMA adaptive difficulty engine
  GET  /ml/health            → ML component status check
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/ml", tags=["ML Components"])


# ─── Request Models ────────────────────────────────────────────────────────────

class ATSScoreRequest(BaseModel):
    parsed_resume: dict           # Parsed resume from resume_parser
    target_role: str = "Software Developer"


class SemanticScoreRequest(BaseModel):
    question: str
    answer: str
    topic: str = "General"
    difficulty: str = "medium"
    ideal_answer: Optional[str] = None


class AdaptiveRequest(BaseModel):
    current_difficulty: str = "medium"
    session_history: list[dict] = []  # [{topic, aiScore}, ...]
    window: int = 4


class TopicPriorityRequest(BaseModel):
    weak_topics: list[str] = []
    answered_topics: list[str] = []
    session_history: list[dict] = []
    available_topics: Optional[list[str]] = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/health")
def ml_health():
    """Check which ML components are available."""
    status = {}

    # Check scikit-learn
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        status["scikit_learn"] = "available"
        status["tfidf_ats_scorer"] = "ready"
    except ImportError:
        status["scikit_learn"] = "not installed"
        status["tfidf_ats_scorer"] = "unavailable"

    # Check sentence-transformers
    try:
        import sentence_transformers
        status["sentence_transformers"] = f"v{sentence_transformers.__version__}"
        status["semantic_scorer"] = "ready (model loads on first call)"
    except ImportError:
        status["sentence_transformers"] = "not installed"
        status["semantic_scorer"] = "will use keyword fallback"

    # Check numpy
    try:
        import numpy as np
        status["numpy"] = f"v{np.__version__}"
    except ImportError:
        status["numpy"] = "not installed"

    status["adaptive_difficulty_engine"] = "ready (pure Python, no deps)"

    return {
        "status": "ok",
        "ml_components": status,
        "model_1": "TF-IDF ATS Scorer (scikit-learn)",
        "model_2": "SBERT Semantic Scorer (sentence-transformers/all-MiniLM-L6-v2)",
        "model_3": "Adaptive Difficulty Engine (EMA + Linear Regression)"
    }


@router.post("/ats-score")
def ats_score(req: ATSScoreRequest):
    """
    ML Component 1: TF-IDF ATS Resume Scorer

    Uses scikit-learn TfidfVectorizer + cosine similarity to compute
    how well a resume matches a target job role.

    Returns:
    - ats_score (0-100): Overall ATS match score
    - section_scores: Per-section breakdown (skills/experience/education/projects)
    - matched_skills: Skills found in the resume that match the role
    - missing_skills: Key skills missing from the resume
    - method: "TF-IDF Cosine Similarity (scikit-learn)"
    """
    try:
        from app.ml.tfidf_ats_scorer import compute_ats_score
        result = compute_ats_score(req.parsed_resume, req.target_role)
        return {"success": True, "data": result}
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": {
                "ats_score": 50,
                "section_scores": {},
                "matched_skills": [],
                "missing_skills": [],
                "method": "fallback (ML error)",
                "model_info": "scikit-learn TF-IDF"
            }
        }


@router.post("/semantic-score")
def semantic_score(req: SemanticScoreRequest):
    """
    ML Component 2: SBERT Semantic Answer Scorer

    Uses sentence-transformers (all-MiniLM-L6-v2) to encode both the
    candidate's answer and an ideal reference answer into 384-dimensional
    embedding vectors, then computes cosine similarity.

    Returns:
    - semantic_score (0-10): Semantic quality score
    - similarity (0-1): Raw cosine similarity
    - method: SBERT model or fallback
    - confidence: high/medium/low
    """
    try:
        from app.ml.semantic_scorer import compute_semantic_score
        result = compute_semantic_score(
            question=req.question,
            answer=req.answer,
            topic=req.topic,
            difficulty=req.difficulty,
            ideal_answer=req.ideal_answer
        )
        return {"success": True, "data": result}
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": {
                "semantic_score": 5.0,
                "similarity": 0.5,
                "method": "fallback (error)",
                "confidence": "low"
            }
        }


@router.post("/adaptive-next")
def adaptive_next(req: AdaptiveRequest):
    """
    ML Component 3: Adaptive Difficulty Engine

    Uses Exponential Moving Average (EMA) of recent scores + linear
    regression trend detection to determine:
    - Whether to increase/decrease/maintain difficulty
    - Which topics the candidate is weak in
    - 95% confidence interval for performance estimate

    Returns:
    - recommended_difficulty: easy/medium/hard
    - direction: upgrade/downgrade/maintain
    - ema_score: EMA of recent answers
    - trend: improving/stable/declining
    - weak_topics: list of topic names where candidate struggles
    - topic_weakness_map: {topic: weakness_score}
    """
    try:
        from app.ml.adaptive_difficulty import compute_adaptive_difficulty
        result = compute_adaptive_difficulty(
            current_difficulty=req.current_difficulty,
            session_history=req.session_history,
            window=req.window
        )
        return {"success": True, "data": result}
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": {
                "recommended_difficulty": req.current_difficulty,
                "direction": "maintain",
                "ema_score": 5.0,
                "trend": "unknown",
                "weak_topics": [],
                "method": "fallback (error)"
            }
        }


@router.post("/topic-priority")
def topic_priority(req: TopicPriorityRequest):
    """
    ML Component 3b: Topic Priority Queue

    Computes a priority queue for the next question's topic selection
    using score-weighted frequency analysis of session history.

    Returns:
    - priority_queue: ranked list of [{topic, priority_score}]
    - top_priority: the highest-priority topic to ask next
    """
    try:
        from app.ml.adaptive_difficulty import get_next_topic_priority
        result = get_next_topic_priority(
            weak_topics=req.weak_topics,
            answered_topics=req.answered_topics,
            session_history=req.session_history,
            all_available_topics=req.available_topics
        )
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}
