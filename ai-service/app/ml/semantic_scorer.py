"""
ML Component 2: Semantic Answer Scorer
========================================
Uses sentence-transformers (SBERT) to compute semantic similarity
between a candidate's answer and the ideal reference answer.

This is a LOCAL ML model — runs on CPU, no API call needed.
University AIML component: demonstrates transformer-based NLP embeddings,
cosine similarity in high-dimensional vector space.

Model: all-MiniLM-L6-v2 (22MB, fast CPU inference)
"""

import numpy as np
from typing import Optional

# Lazy-load the model (only downloaded once, cached in ~/.cache/huggingface)
_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("[SemanticScorer] Loading SBERT model (all-MiniLM-L6-v2)...")
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            print("[SemanticScorer] Model loaded ✓")
        except ImportError:
            print("[SemanticScorer] sentence-transformers not installed, using fallback")
            _model = None
    return _model


# ─── Reference answer bank for common topics ──────────────────────────────────
# These are used when no explicit ideal answer is provided.
REFERENCE_ANSWERS = {
    "REST API": (
        "REST API (Representational State Transfer) is an architectural style for "
        "designing networked applications using HTTP methods: GET retrieves resources, "
        "POST creates, PUT updates, DELETE removes. It is stateless, meaning each "
        "request contains all necessary information. Resources are identified by URIs. "
        "REST APIs are scalable, cacheable, and support a client-server architecture."
    ),
    "binary search": (
        "Binary search is a divide-and-conquer algorithm that searches a sorted array "
        "by repeatedly halving the search space. It compares the middle element with "
        "the target — if equal, found; if target is smaller, search left half; if larger, "
        "search right half. Time complexity is O(log n), space complexity O(1) iteratively."
    ),
    "closure": (
        "A closure is a function that retains access to variables from its outer "
        "lexical scope even after the outer function has returned. In JavaScript, "
        "closures are created every time a function is created. They enable data "
        "encapsulation, factory functions, and callbacks with persistent state."
    ),
    "microservices": (
        "Microservices architecture structures an application as a collection of small, "
        "independently deployable services each running its own process and communicating "
        "via APIs. Benefits include independent scaling, technology diversity, fault isolation, "
        "and faster deployments. Challenges include distributed system complexity, "
        "network latency, and data consistency across services."
    ),
    "machine learning": (
        "Machine learning is a subset of AI where algorithms learn patterns from data "
        "without being explicitly programmed. Supervised learning uses labeled data, "
        "unsupervised learning finds patterns in unlabeled data, reinforcement learning "
        "uses rewards and penalties. Common algorithms include linear regression, "
        "decision trees, neural networks, SVM, and k-means clustering."
    ),
    "sql join": (
        "SQL JOINs combine rows from two or more tables based on a related column. "
        "INNER JOIN returns only matching rows. LEFT JOIN returns all left table rows "
        "and matched right rows. RIGHT JOIN is the opposite. FULL OUTER JOIN returns "
        "all rows from both tables. CROSS JOIN returns cartesian product."
    ),
    "docker": (
        "Docker is a containerization platform that packages applications with their "
        "dependencies into lightweight containers. Containers share the host OS kernel "
        "unlike VMs. Key concepts: Dockerfile defines the image, docker build creates it, "
        "docker run starts a container. Benefits: consistency across environments, "
        "fast startup, resource efficiency, easy deployment and scaling."
    ),
    "linked list": (
        "A linked list is a linear data structure where each element (node) contains "
        "data and a pointer to the next node. Singly linked lists have one pointer, "
        "doubly linked lists have two (next and previous). Advantages: dynamic size, "
        "O(1) insertion/deletion at head. Disadvantages: O(n) access, extra memory "
        "for pointers, no random access."
    ),
}


def _find_reference(question: str, topic: str) -> Optional[str]:
    """Find the best reference answer for a question by keyword matching."""
    q_lower = question.lower()
    topic_lower = topic.lower()
    
    for key, ref in REFERENCE_ANSWERS.items():
        if key.lower() in q_lower or key.lower() in topic_lower:
            return ref
    return None


def _cosine_similarity_np(v1: np.ndarray, v2: np.ndarray) -> float:
    """Manual cosine similarity using numpy."""
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (norm1 * norm2))


def _keyword_overlap_score(answer: str, question: str) -> float:
    """
    Fallback: simple keyword overlap scoring when SBERT unavailable.
    Uses Jaccard similarity on word sets.
    """
    import re
    stopwords = {"the","a","an","is","are","was","were","be","been","being",
                 "have","has","had","do","does","did","will","would","could",
                 "should","may","might","must","can","i","you","we","they",
                 "it","this","that","these","those","in","on","at","to","for",
                 "of","with","by","from","and","or","but","not","as","if"}
    
    def clean(text):
        words = re.findall(r'\b\w+\b', text.lower())
        return set(w for w in words if w not in stopwords and len(w) > 2)
    
    a_words = clean(answer)
    q_words = clean(question)
    
    if not a_words:
        return 0.0
    
    # Reward: longer answers with relevant keywords
    overlap = len(a_words & q_words) / max(len(q_words), 1)
    length_bonus = min(1.0, len(answer.split()) / 50)  # bonus for 50+ word answers
    
    return min(1.0, overlap * 0.6 + length_bonus * 0.4)


def compute_semantic_score(
    question: str,
    answer: str,
    topic: str = "General",
    difficulty: str = "medium",
    ideal_answer: Optional[str] = None,
) -> dict:
    """
    Compute semantic similarity score between candidate answer and ideal answer.
    
    Pipeline:
    1. Encode both texts using SBERT → 384-dim embedding vectors
    2. Compute cosine similarity in embedding space
    3. Apply difficulty weighting
    4. Return score 0-10 with confidence metrics
    
    Returns:
        {
            "semantic_score": float (0-10),
            "similarity": float (0-1),
            "answer_length_words": int,
            "method": str,
            "confidence": str
        }
    """
    if not answer or len(answer.strip()) < 5:
        return {
            "semantic_score": 0.0,
            "similarity": 0.0,
            "answer_length_words": 0,
            "method": "no-answer",
            "confidence": "low"
        }
    
    # ── Find reference answer ──────────────────────────────────────────────────
    reference = ideal_answer or _find_reference(question, topic)
    
    model = _get_model()
    
    if model is not None and reference:
        # ── SBERT Semantic Similarity ──────────────────────────────────────────
        try:
            embeddings = model.encode([answer, reference])
            similarity = _cosine_similarity_np(embeddings[0], embeddings[1])
            method = "SBERT (all-MiniLM-L6-v2) cosine similarity"
            confidence = "high"
        except Exception as e:
            print(f"[SemanticScorer] SBERT error: {e}")
            similarity = _keyword_overlap_score(answer, question)
            method = "keyword-overlap (SBERT fallback)"
            confidence = "medium"
    
    elif model is not None and not reference:
        # ── Self-similarity: encode answer vs question (still shows relevance) ──
        try:
            embeddings = model.encode([answer, question])
            similarity = _cosine_similarity_np(embeddings[0], embeddings[1])
            # Scale up slightly since answer→question similarity is naturally lower
            similarity = min(1.0, similarity * 1.4)
            method = "SBERT answer-question relevance"
            confidence = "medium"
        except Exception as e:
            similarity = _keyword_overlap_score(answer, question)
            method = "keyword-overlap (SBERT error)"
            confidence = "low"
    else:
        # ── Pure keyword fallback ──────────────────────────────────────────────
        similarity = _keyword_overlap_score(answer, question)
        if reference:
            ref_overlap = _keyword_overlap_score(answer, reference)
            similarity = (similarity + ref_overlap) / 2
        method = "keyword-overlap (sentence-transformers not installed)"
        confidence = "low"
    
    # ── Length quality adjustment ──────────────────────────────────────────────
    word_count = len(answer.split())
    length_factor = 1.0
    if word_count < 10:
        length_factor = 0.6   # too short
    elif word_count < 25:
        length_factor = 0.85
    elif word_count > 200:
        length_factor = 0.95  # slight penalty for verbosity
    
    # ── Difficulty scaling ─────────────────────────────────────────────────────
    diff_multiplier = {"easy": 10.0, "medium": 9.5, "hard": 9.0}.get(difficulty, 9.5)
    
    # ── Final score ────────────────────────────────────────────────────────────
    raw_score = similarity * diff_multiplier * length_factor
    final_score = round(float(np.clip(raw_score, 0.0, 10.0)), 2)
    
    return {
        "semantic_score": final_score,
        "similarity": round(float(similarity), 4),
        "answer_length_words": word_count,
        "method": method,
        "confidence": confidence,
        "has_reference": reference is not None,
        "model_info": "SentenceTransformer('all-MiniLM-L6-v2') — 384-dim embeddings"
    }
