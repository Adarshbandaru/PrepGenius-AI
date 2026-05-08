"""
Resume parser — extracts structured data from PDF/DOCX files.
Uses PyMuPDF for PDF and python-docx for DOCX.
Falls back gracefully if files/libraries are unavailable.
"""
import re
from pathlib import Path
from typing import Optional


def extract_text_from_pdf(file_path: str) -> str:
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        return "\n".join(page.get_text() for page in doc)
    except Exception as e:
        print(f"PDF extraction failed: {e}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    try:
        from docx import Document
        doc = Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        print(f"DOCX extraction failed: {e}")
        return ""


def extract_text(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    return ""


# ─── Rule-based Extractors ───────────────────────────────

SKILL_KEYWORDS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
    "React", "Next.js", "Vue", "Angular", "Node.js", "Express", "FastAPI", "Django", "Flask",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "scikit-learn",
    "REST API", "GraphQL", "gRPC", "Microservices", "Git", "CI/CD", "Linux",
    "HTML", "CSS", "Tailwind", "Bootstrap", "SQL", "NoSQL",
]

def extract_skills(text: str) -> list[str]:
    found = []
    text_lower = text.lower()
    for skill in SKILL_KEYWORDS:
        if skill.lower() in text_lower:
            found.append(skill)
    return list(set(found))


def extract_experience(text: str) -> list[dict]:
    """Very basic experience extraction — production would use NLP."""
    experience = []
    lines = text.split("\n")
    duration_pattern = re.compile(r"(\d{4})\s*[-–—]\s*(\d{4}|present|current)", re.IGNORECASE)

    for i, line in enumerate(lines):
        if duration_pattern.search(line):
            entry = {
                "company": lines[i - 1].strip() if i > 0 else "",
                "role": lines[i + 1].strip() if i + 1 < len(lines) else "",
                "duration": duration_pattern.search(line).group(0) if duration_pattern.search(line) else "",
                "description": "",
            }
            if entry["company"] or entry["role"]:
                experience.append(entry)

    return experience[:5]  # Limit to 5


def extract_education(text: str) -> list[dict]:
    education = []
    degree_keywords = ["bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "m.e", "b.sc", "m.sc"]
    lines = text.split("\n")

    for i, line in enumerate(lines):
        if any(kw in line.lower() for kw in degree_keywords):
            year_match = re.search(r"\b(19|20)\d{2}\b", line)
            education.append({
                "degree": line.strip(),
                "institute": lines[i + 1].strip() if i + 1 < len(lines) else "",
                "year": year_match.group(0) if year_match else "",
            })

    return education[:3]


def parse_resume(file_path: str) -> dict:
    """Main entry point — extracts structured data from resume file."""
    text = extract_text(file_path)
    if not text:
        return {"skills": [], "experience": [], "education": [], "projects": []}

    return {
        "skills": extract_skills(text),
        "experience": extract_experience(text),
        "education": extract_education(text),
        "projects": [],  # Would use NLP in production
        "raw_text_preview": text[:500],
    }
