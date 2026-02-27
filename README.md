# PDF RAG Chatbot

Multi-PDF Multi-language Retrieval-Augmented Generation chatbot powered by **BGE-M3** embeddings, **pgvector** (Supabase), and **Ollama** for local LLM inference.
<img width="1710" height="910" alt="Snipaste_2026-02-27_16-35-23" src="https://github.com/user-attachments/assets/a02d32ce-a061-4655-a40b-8a45f8366846" />
<img width="1710" height="908" alt="Snipaste_2026-02-27_16-38-05" src="https://github.com/user-attachments/assets/06c4aa50-7c82-41a6-8435-291fba7602c3" />

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend    | FastAPI, async SQLAlchemy                   |
| Database   | Supabase (PostgreSQL + pgvector)            |
| Embeddings | BGE-M3 via FlagEmbedding (1024-dim dense)   |
| LLM        | Ollama (llama3.2:3b — runs locally, no API key needed) |
| PDF Parser | PyMuPDF                                     |

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.com/) installed and running
- Supabase project (or local PostgreSQL with pgvector)

### 2. Ollama Setup

```bash
# Install Ollama (macOS)
brew install ollama

# Start the Ollama server
ollama serve

# Pull the LLM model
ollama pull llama3.2:3b
```

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file:

```env
# Supabase (use your pooler connection string with asyncpg driver)
SUPABASE_DB_URL=postgresql+asyncpg://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# App
CORS_ORIGINS=http://localhost:3000
UPLOAD_MAX_SIZE_MB=50
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Docker Compose (alternative)

```bash
docker compose up --build
```

> **Note:** Docker Compose uses a local PostgreSQL container with pgvector. Ollama must still be running on the host machine.

## Usage

1. **Upload PDFs** — drag & drop or click the upload zone (max 50MB per file)
2. **Select documents** — use the sidebar checkboxes to filter which docs to search
3. **Ask questions** — the AI responds with streaming text and source citations

## API Endpoints

| Method   | Endpoint              | Description                |
|----------|-----------------------|----------------------------|
| `POST`   | `/api/upload`         | Upload one or more PDF files |
| `POST`   | `/api/chat`           | Chat with streaming SSE    |
| `GET`    | `/api/documents`      | List documents (paginated) |
| `DELETE` | `/api/documents/{id}` | Delete a document          |
| `GET`    | `/health`             | Health check               |

## Project Structure

```
pdf-rag-chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app + lifespan
│   │   ├── config.py               # Pydantic settings
│   │   ├── api/
│   │   │   ├── deps.py             # DB engine + session factory
│   │   │   └── routes/
│   │   │       ├── upload.py       # PDF upload + background processing
│   │   │       ├── chat.py         # RAG chat with streaming SSE
│   │   │       └── documents.py    # Document CRUD
│   │   ├── services/
│   │   │   ├── pdf_parser.py       # PyMuPDF text extraction
│   │   │   ├── chunker.py          # Text chunking with overlap
│   │   │   ├── embedder.py         # BGE-M3 embedding (CPU)
│   │   │   ├── retriever.py        # pgvector cosine similarity search
│   │   │   └── generator.py        # Ollama LLM streaming
│   │   ├── models/
│   │   │   ├── database.py         # SQLAlchemy models (Document, Chunk)
│   │   │   └── schemas.py          # Pydantic request/response schemas
│   │   └── core/
│   │       ├── prompts.py          # System + RAG prompt templates
│   │       └── streaming.py        # SSE event helpers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main chat page
│   ├── components/
│   │   ├── chat/                   # ChatContainer, MessageBubble, Citation
│   │   ├── sidebar/                # Document list + selection
│   │   └── upload/                 # PDF upload dropzone
│   ├── lib/
│   │   ├── api.ts                  # Backend API client
│   │   ├── types.ts                # TypeScript interfaces
│   │   └── hooks/                  # useDocuments, useChat, etc.
│   └── Dockerfile
└── docker-compose.yml
```

## Configuration

Key settings in `backend/.env`:

| Variable            | Description                          | Default          |
|---------------------|--------------------------------------|------------------|
| `SUPABASE_DB_URL`   | PostgreSQL connection string (asyncpg) | localhost        |
| `CORS_ORIGINS`      | Allowed CORS origins                 | `http://localhost:3000` |
| `UPLOAD_MAX_SIZE_MB` | Max upload file size                | `50`             |

RAG parameters in `backend/app/config.py`:

| Parameter             | Description                     | Default |
|-----------------------|---------------------------------|---------|
| `chunk_size`          | Characters per text chunk       | `512`   |
| `chunk_overlap`       | Overlap between chunks          | `100`   |
| `top_k`               | Number of chunks to retrieve    | `5`     |
| `similarity_threshold`| Min cosine similarity score     | `0.3`   |
| `embedding_model`     | HuggingFace embedding model     | `BAAI/bge-m3` |
| `embedding_dim`       | Embedding vector dimension      | `1024`  |

## Switching the LLM Model

To use a different Ollama model, edit `OLLAMA_MODEL` in `backend/app/services/generator.py`:

```python
OLLAMA_MODEL = "llama3.2:3b"  # Change to any Ollama-supported model
```

Then pull the model: `ollama pull <model-name>`

Popular options: `llama3.2:3b`, `deepseek-r1:8b`, `gemma3:4b`, `qwen2.5:7b`
