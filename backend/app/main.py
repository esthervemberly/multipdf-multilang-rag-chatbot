import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text as sql_text
from app.config import get_settings
from app.api.deps import engine
from app.models.database import Base
from app.api.routes import upload, chat, documents

logger = logging.getLogger(__name__)
settings = get_settings()

# Configure logging
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup/shutdown lifecycle."""
    logger.info("Starting PDF RAG Chatbot API...")

    # Create tables if they don't exist
    async with engine.begin() as conn:
        # Enable pgvector extension
        await conn.execute(sql_text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create tables
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables ready.")
    yield

    # Shutdown
    await engine.dispose()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="PDF RAG Chatbot API",
    description="Multi-PDF RAG chatbot with BGE-M3 embeddings and Gemini LLM",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(documents.router, prefix="/api", tags=["Documents"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
