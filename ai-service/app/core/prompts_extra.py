"""
Resume Intelligence: ATS Score + Job Recommendations + MCQ Questions
"""

RESUME_INTELLIGENCE_SYSTEM = """You are an expert career counselor, ATS systems analyst, and technical recruiter with 15+ years experience.
Analyze the provided resume data and return ONLY a valid JSON object."""

RESUME_INTELLIGENCE_USER = """Analyze this candidate's resume and return a JSON object with this EXACT structure:

Resume Data:
Skills: {skills}
Education: {education}
Experience: {experience}
Projects: {projects}

Return ONLY this JSON (no explanation, no markdown):
{{
  "ats_score": <integer 0-100>,
  "ats_breakdown": {{
    "skills_relevance": <integer 0-100>,
    "education": <integer 0-100>,
    "experience": <integer 0-100>,
    "projects": <integer 0-100>,
    "completeness": <integer 0-100>
  }},
  "profile_summary": "<2-3 sentence professional summary of this candidate>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "recommended_roles": [
    {{
      "role": "<job title>",
      "match_pct": <integer 60-99>,
      "why": "<one sentence why this role suits them>",
      "missing_skills": ["<skill>", "<skill>"],
      "salary_range": "<X-Y LPA>",
      "demand": "High|Medium|Low"
    }},
    {{
      "role": "<job title>",
      "match_pct": <integer 60-99>,
      "why": "<one sentence why>",
      "missing_skills": ["<skill>", "<skill>"],
      "salary_range": "<X-Y LPA>",
      "demand": "High|Medium|Low"
    }},
    {{
      "role": "<job title>",
      "match_pct": <integer 60-99>,
      "why": "<one sentence why>",
      "missing_skills": ["<skill>", "<skill>"],
      "salary_range": "<X-Y LPA>",
      "demand": "High|Medium|Low"
    }}
  ],
  "interview_readiness": <integer 0-100>,
  "top_certifications": ["<cert 1>", "<cert 2>", "<cert 3>"]
}}"""

MCQ_GENERATION_SYSTEM = """You are a senior technical interviewer. Generate multiple-choice questions with exactly 4 options.
Always return valid JSON only."""

MCQ_GENERATION_USER = """Generate question #{question_number} (must be UNIQUE and DIFFERENT from any previous questions) for a {target_role} candidate.
Mode: {mode} | Difficulty: {difficulty}

Rules:
- Pick a DIFFERENT topic than any previously covered
- Make sure all 4 options are plausible (no obviously wrong options)
- The question must test real practical knowledge
- Vary topics across: algorithms, databases, networking, frameworks, OS, security, design patterns, etc.

Return ONLY this JSON array (no markdown, no explanation):
[
  {{
    "question": "<clear, specific, unique question>",
    "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
    "correct_index": <0-3>,
    "explanation": "<why the correct answer is right, 1-2 sentences>",
    "topic": "<specific topic name>",
    "difficulty": "{difficulty}"
  }}
]"""
