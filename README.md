# PrepGenius AI 🧠

> **AI-Powered Interview Preparation Platform** — An intelligent mock interview system with adaptive questioning, NLP-based resume analysis, real-time AI scoring, and performance analytics.  
> *University AIML Project Submission*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb)](https://mongodb.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://python.org)
[![LangChain](https://img.shields.io/badge/LangChain-0.2-1C3C3C?logo=langchain)](https://langchain.com)

---

## 🤖 AI/ML Components

This project is built around multiple AI/ML techniques:

| Component | Technique | Description |
|---|---|---|
| **Resume Parser** | NLP + text extraction | PyMuPDF extracts structured data (skills, education, experience) from PDF/DOCX |
| **ATS Scorer** | LLM-based evaluation | Scores resume against industry standards, outputs skill gap analysis |
| **Question Generator** | LLM + role-aware prompting | Generates adaptive interview questions tailored to resume and target role |
| **Answer Evaluator** | LLM semantic scoring | Evaluates open-ended answers on correctness, depth, and clarity (0–10 score) |
| **Adaptive Engine** | History-aware selection | Analyzes weak topics from past answers to generate targeted follow-up questions |
| **MCQ Engine** | LLM + pre-generation | Pre-generates all 10 MCQs at session start for instant delivery; auto-scores responses |
| **Weak Topic Detector** | Score analytics | Tracks per-topic performance across sessions to identify knowledge gaps |
| **Job Role Recommender** | Skill-match scoring | Matches resume skills to role requirements with % match and salary range |

### AI Stack
- **LLM**: Groq (Llama 3, primary) + Google Gemini (fallback) via LangChain
- **Orchestration**: LangChain prompt chaining
- **NLP**: PyMuPDF for document understanding
- **API**: FastAPI async microservice

---

## 🏗️ Architecture

```
PrepGenius-AI/
├── frontend/          # React 18 + Vite (User Interface)
├── backend/           # Node.js + Express (REST API + Auth + DB)
├── ai-service/        # Python FastAPI (AI/ML Microservice)
└── docker-compose.yml
```

### System Flow
```
User → React Frontend
         ↓
    Node.js Backend (Auth, Session Management, MongoDB)
         ↓
    Python AI Service (LLM Calls, Resume Parsing, Scoring)
         ↓
    Groq / Gemini LLM APIs
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB (local or Atlas)
- Groq API Key (free at console.groq.com) OR Google Gemini API Key

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 2. Backend
```bash
cd backend
# Create backend/.env (see Environment Variables section)
npm install
node server.js
# → http://localhost:5000
```

### 3. AI Service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
# Create ai-service/.env (see Environment Variables section)
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
# Swagger docs → http://localhost:8000/docs
```

---

## 🔑 Environment Variables

### `backend/.env`
```env
MONGODB_URI=mongodb://localhost:27017/prepgenius
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
PORT=5000
```

### `ai-service/.env`
```env
# Primary LLM (Groq — free tier available)
GROQ_API_KEY=your_groq_api_key_here

# Fallback LLM (Google Gemini)
GOOGLE_API_KEY=your_gemini_api_key_here

# Model selection
GROQ_MODEL=llama3-8b-8192
```

---

## 📡 API Reference

| Service | Base URL | Docs |
|---|---|---|
| Backend | `http://localhost:5000/api/v1` | — |
| AI Service | `http://localhost:8000` | `/docs` (Swagger UI) |

### AI Service Endpoints
```
POST /ai/parse-resume          # Extract structured data from PDF/DOCX
POST /ai/analyze-resume        # ATS score + job role recommendations
POST /ai/generate-questions    # Role-aware question generation
POST /ai/generate-mcq          # MCQ batch generation (10 at once)
POST /ai/evaluate-answer       # Score open-ended answer (0-10)
POST /ai/adaptive-next         # Get next question based on weak topics
```

---

## 🎯 Features

### Core Interview Modes
- ✅ **Technical Round** — DSA, System Design, Framework questions
- ✅ **HR Round** — Behavioral questions using STAR methodology
- ✅ **MCQ Challenge** — 10 pre-generated MCQs with instant scoring
- ✅ **Live Coding** — Monaco editor with AI code review

### AI/ML Features
- ✅ Resume upload → NLP parsing → structured profile extraction
- ✅ ATS scoring with skill gap analysis
- ✅ Job role recommendation with % match
- ✅ Adaptive questioning based on user's weak topics
- ✅ Per-answer AI scoring with strengths/improvements feedback
- ✅ Weak topic detection across sessions
- ✅ Performance analytics with trend visualization

### Platform Features
- ✅ JWT authentication with refresh token rotation
- ✅ Session history and result breakdown
- ✅ Responsive dark UI with performance charts

---

## 🛠️ Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, Zustand, TanStack Query, Recharts |
| Backend | Node.js, Express, Mongoose, JWT, Multer |
| AI Service | Python 3.11, FastAPI, LangChain, Groq, Gemini, PyMuPDF |
| Database | MongoDB |
| DevOps | Docker, Docker Compose |

---

## 👨‍💻 Author

**Bandaru Adarsh**  
B.Tech — Lovely Professional University  
AIML Project | 2026
