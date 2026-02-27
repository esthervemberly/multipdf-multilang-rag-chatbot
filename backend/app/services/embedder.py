import numpy as np
import torch

# Monkey-patch: torch.mps.device_count doesn't exist in PyTorch 2.2.x
# but FlagEmbedding 1.3.3 calls it on macOS. Return 0 to force CPU fallback.
if not hasattr(torch.mps, "device_count"):
    torch.mps.device_count = lambda: 0

from FlagEmbedding import BGEM3FlagModel
from app.config import get_settings

settings = get_settings()

_model = None


def get_model() -> BGEM3FlagModel:
    """Lazy-load the BGE-M3 model (singleton)."""
    global _model
    if _model is None:
        _model = BGEM3FlagModel(settings.embedding_model, use_fp16=False, devices=["cpu"])
    return _model


def embed_texts(texts: list[str], batch_size: int = 32) -> list[list[float]]:
    """
    Generate dense embeddings for a list of texts using BGE-M3.
    Returns a list of embedding vectors (each 1024-dim).
    """
    model = get_model()
    result = model.encode(texts, batch_size=batch_size, max_length=512)
    dense_vecs = result["dense_vecs"]

    # Convert numpy arrays to lists for database storage
    if isinstance(dense_vecs, np.ndarray):
        return dense_vecs.tolist()
    return [vec.tolist() if isinstance(vec, np.ndarray) else vec for vec in dense_vecs]


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    embeddings = embed_texts([query])
    return embeddings[0]
