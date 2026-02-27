from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    supabase_db_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # Gemini
    gemini_api_key: str = ""

    # App
    cors_origins: str = "http://localhost:3000"
    upload_max_size_mb: int = 50

    # RAG
    chunk_size: int = 512
    chunk_overlap: int = 100
    top_k: int = 5
    similarity_threshold: float = 0.3

    # Embedding
    embedding_model: str = "BAAI/bge-m3"
    embedding_dim: int = 1024

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
