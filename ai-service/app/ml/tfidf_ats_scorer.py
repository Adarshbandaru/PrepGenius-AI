"""
ML Component 1: TF-IDF ATS Scorer
===================================
Uses scikit-learn TF-IDF vectorization + cosine similarity to score
a resume against a job role's required skill corpus.

This is a LOCAL ML model — no LLM/API call needed.
University AIML component: demonstrates NLP feature extraction and similarity scoring.
"""

import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ─── Role → Required Skills Corpus ────────────────────────────────────────────
# Each role has a "job description" text used as the TF-IDF reference document.
ROLE_CORPUS = {
    "frontend developer": """
        React Vue Angular JavaScript TypeScript HTML CSS responsive design
        webpack vite state management Redux Zustand REST API GraphQL
        performance optimization accessibility unit testing Jest component design
        UI UX figma cross-browser compatibility web vitals
    """,
    "backend developer": """
        Node.js Python Java Go REST API GraphQL microservices databases
        PostgreSQL MySQL MongoDB Redis authentication JWT OAuth Docker
        Kubernetes AWS GCP Azure CI/CD unit testing integration testing
        system design scalability caching message queues RabbitMQ Kafka
    """,
    "full stack developer": """
        React Node.js JavaScript TypeScript REST API databases MongoDB
        PostgreSQL Docker AWS authentication Git CI/CD responsive design
        system design microservices testing deployment HTML CSS
    """,
    "machine learning engineer": """
        Python TensorFlow PyTorch scikit-learn deep learning neural networks
        NLP computer vision data preprocessing feature engineering
        model training evaluation hyperparameter tuning MLOps deployment
        pandas numpy matplotlib statistics probability linear algebra
        transformers BERT GPT LangChain Hugging Face
    """,
    "data scientist": """
        Python R statistics machine learning pandas numpy matplotlib seaborn
        data visualization SQL data cleaning feature engineering
        regression classification clustering A/B testing hypothesis testing
        Jupyter notebooks scikit-learn XGBoost deep learning
    """,
    "devops engineer": """
        Docker Kubernetes Jenkins CI/CD AWS Azure GCP Terraform Ansible
        Linux shell scripting monitoring logging Prometheus Grafana
        networking security load balancing containers infrastructure as code
        Git version control deployment automation
    """,
    "data analyst": """
        SQL Python R Excel Power BI Tableau data visualization
        statistics data cleaning pivot tables reporting dashboards
        business intelligence ETL data warehousing KPIs metrics analysis
    """,
    "mobile developer": """
        React Native Flutter Swift Kotlin iOS Android mobile development
        UI components API integration state management SQLite push notifications
        app store deployment performance optimization testing
    """,
    "system design engineer": """
        distributed systems microservices load balancing caching databases
        CAP theorem consistency availability partition tolerance
        message queues API gateway service mesh Kubernetes Docker
        scalability reliability fault tolerance monitoring
    """,
}

DEFAULT_CORPUS = """
    programming algorithms data structures problem solving software development
    version control Git teamwork communication documentation testing debugging
"""

# ─── Skill sections weights ────────────────────────────────────────────────────
SECTION_WEIGHTS = {
    "skills":     0.40,
    "experience": 0.30,
    "education":  0.15,
    "projects":   0.15,
}


def _normalize_role(role: str) -> str:
    """Map user-entered role to our corpus key."""
    role_lower = role.lower().strip()
    for key in ROLE_CORPUS:
        if key in role_lower or role_lower in key:
            return key
    return "full stack developer"  # default


def _text_from_parsed(parsed: dict) -> dict:
    """Convert parsed resume dict → text per section."""
    skills_text = " ".join(parsed.get("skills", []))
    
    exp_parts = []
    for e in parsed.get("experience", []):
        exp_parts.append(f"{e.get('role', '')} {e.get('company', '')} {e.get('description', '')}")
    experience_text = " ".join(exp_parts)
    
    edu_parts = []
    for e in parsed.get("education", []):
        edu_parts.append(f"{e.get('degree', '')} {e.get('institute', '')}")
    education_text = " ".join(edu_parts)
    
    proj_parts = []
    for p in parsed.get("projects", []):
        proj_parts.append(f"{p.get('name', '')} {p.get('description', '')}")
    # Also use raw text preview for extra signal
    raw = parsed.get("raw_text_preview", "")
    projects_text = " ".join(proj_parts) + " " + raw
    
    return {
        "skills": skills_text,
        "experience": experience_text,
        "education": education_text,
        "projects": projects_text,
    }


def _tfidf_similarity(resume_text: str, job_text: str) -> float:
    """Core TF-IDF + cosine similarity between resume and job description."""
    if not resume_text.strip():
        return 0.0
    
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),   # unigrams + bigrams
        min_df=1,
        sublinear_tf=True,    # apply log normalization
    )
    
    corpus = [job_text, resume_text]
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(np.clip(sim, 0.0, 1.0))
    except Exception:
        return 0.0


def compute_ats_score(parsed_resume: dict, target_role: str) -> dict:
    """
    Main ML-powered ATS scoring function.
    
    Returns:
        {
            "ats_score": int (0-100),
            "section_scores": {...},
            "matched_skills": [...],
            "missing_skills": [...],
            "similarity_scores": {...},
            "method": "tfidf-cosine-similarity"
        }
    """
    role_key = _normalize_role(target_role)
    job_corpus = ROLE_CORPUS.get(role_key, DEFAULT_CORPUS)
    
    sections = _text_from_parsed(parsed_resume)
    
    # ── Per-section TF-IDF similarity ──────────────────────────────────────────
    section_similarities = {}
    for section, text in sections.items():
        sim = _tfidf_similarity(text, job_corpus)
        section_similarities[section] = round(sim * 100, 1)
    
    # ── Weighted overall score ──────────────────────────────────────────────────
    weighted_score = sum(
        section_similarities.get(sec, 0) * weight
        for sec, weight in SECTION_WEIGHTS.items()
    )
    
    # ── Skill matching ──────────────────────────────────────────────────────────
    resume_skills = set(s.lower() for s in parsed_resume.get("skills", []))
    
    # Extract key terms from job corpus
    job_terms = set(re.findall(r'\b[a-zA-Z][a-zA-Z.+#]{2,}\b', job_corpus.lower()))
    stop = {"the", "and", "for", "with", "are", "not", "this", "that", "have", "from", "they"}
    job_terms -= stop
    
    matched = [s for s in parsed_resume.get("skills", []) if s.lower() in job_terms]
    missing_terms = [t for t in list(job_terms)[:30] if t not in resume_skills and len(t) > 3]
    
    # ── Keyword density bonus ───────────────────────────────────────────────────
    full_resume_text = " ".join(sections.values()).lower()
    keyword_hits = sum(1 for term in job_terms if term in full_resume_text)
    keyword_density = min(20, keyword_hits / max(len(job_terms), 1) * 20)
    
    final_score = int(np.clip(weighted_score * 0.8 + keyword_density, 0, 100))
    
    return {
        "ats_score": final_score,
        "section_scores": {
            "skills_match":     section_similarities.get("skills", 0),
            "experience_match": section_similarities.get("experience", 0),
            "education_match":  section_similarities.get("education", 0),
            "projects_match":   section_similarities.get("projects", 0),
        },
        "matched_skills": matched[:15],
        "missing_skills": sorted(missing_terms, key=len, reverse=True)[:10],
        "keyword_density_score": round(keyword_density, 1),
        "role_matched": role_key.title(),
        "method": "TF-IDF Cosine Similarity (scikit-learn)",
        "model_info": "TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True) + cosine_similarity"
    }
