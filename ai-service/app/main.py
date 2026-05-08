from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.ai import router as ai_router
from app.routers.ml_router import router as ml_router

app = FastAPI(
    title="PrepGenius AI Service",
    description=(
        "AI microservice for PrepGenius — includes 3 real ML components:\n"
        "1. TF-IDF ATS Scorer (scikit-learn)\n"
        "2. SBERT Semantic Answer Scorer (sentence-transformers)\n"
        "3. Adaptive Difficulty Engine (EMA + Linear Regression)\n"
        "Plus LLM-based question generation and evaluation (Groq/Gemini)."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(ml_router)



@app.get("/health")
async def health():
    return {"status": "ok", "service": "PrepGenius AI Service"}


@app.get("/")
async def root():
    return {"message": "PrepGenius AI Service is running 🚀"}
