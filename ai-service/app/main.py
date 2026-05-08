from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.ai import router as ai_router

app = FastAPI(
    title="PrepGenius AI Service",
    description="AI microservice for interview question generation, evaluation, and adaptive questioning",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "PrepGenius AI Service"}


@app.get("/")
async def root():
    return {"message": "PrepGenius AI Service is running 🚀"}
