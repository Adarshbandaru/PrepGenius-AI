# PrepGenius AI 🧠

> **Intelligent Interview Preparation Platform** — AI-powered mock interviews with adaptive questioning, real-time scoring, and performance analytics.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb)](https://mongodb.com)

---

## 🏗️ Architecture

```
prepgenius-ai/
├── frontend/          # React 18 + Vite + Tailwind CSS
├── backend/           # Node.js + Express REST API
├── ai-service/        # Python FastAPI AI Microservice
└── docker-compose.yml
```

## 🚀 Quick Start (Manual)

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB (local or Atlas)
- OpenAI API Key

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
# Copy .env and fill in values
cp .env .env.local
npm install
npm run dev   # needs nodemon: npm i -g nodemon
# → http://localhost:5000
```

### 3. AI Service
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Add your OPENAI_API_KEY to .env
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000
```

## 🐳 Docker (All Services)

```bash
# Fill in .env files first (backend/.env and ai-service/.env)
docker-compose up --build
```

## 🔑 Environment Variables

### backend/.env
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `AI_SERVICE_URL` | FastAPI service URL (http://localhost:8000) |
| `CLIENT_URL` | Frontend URL for CORS |

### ai-service/.env
| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `MODEL_NAME` | LLM model (default: gpt-4o-mini) |

## 📡 API Reference

| Service | Base URL | Docs |
|---|---|---|
| Backend | `http://localhost:5000/api/v1` | — |
| AI Service | `http://localhost:8000` | `/docs` (Swagger) |

### Key Backend Endpoints
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/resume/upload
POST /api/v1/interview/start
POST /api/v1/interview/:id/answer
GET  /api/v1/analytics/dashboard
```

## 🎯 Features
- ✅ Resume upload & AI parsing
- ✅ Technical / HR / Coding interview modes
- ✅ GPT-4 powered question generation
- ✅ Real-time answer evaluation & scoring
- ✅ Adaptive difficulty based on performance
- ✅ Weak topic detection
- ✅ Performance analytics dashboard
- ✅ JWT auth with refresh token rotation
- ✅ Monaco code editor for coding rounds
- ✅ Responsive dark glassmorphism UI

## 🛠️ Tech Stack
| Layer | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, TanStack Query, Recharts |
| Backend | Node.js, Express, Mongoose, JWT, Multer, Bull |
| AI Service | Python, FastAPI, LangChain, OpenAI GPT-4, PyMuPDF |
| Database | MongoDB, Redis |
| DevOps | Docker, Docker Compose, GitHub Actions |
