# Pyramid

Pyramid is an offline Python codebase analyzer that indexes source files, embeds code chunks, and serves a semantic search endpoint.

## Overview

Pyramid walks a Python repository, extracts functions, classes, and method definitions using Tree-sitter, splits large code blocks into manageable chunks, computes embeddings with a local transformer model, and stores those embeddings in a FAISS index. It provides a FastAPI search endpoint for retrieving relevant code snippets given a natural language query.

## Features

- Recursive scanning of Python files while excluding common virtual environment and metadata directories
- Syntax-aware chunking of functions, classes, decorated definitions, and methods
- Automatic splitting of large code blocks into smaller chunks with overlap
- Local model embedding using `transformers`
- Nearest-neighbor search via FAISS
- FastAPI endpoint for query search results

## Project Structure

- `app/main.py` - FastAPI app and startup lifecycle that indexes the codebase
- `app/codebase_indexer.py` - Finds Python files and orchestrates chunking, embedding and indexing
- `app/chunker.py` - Uses Tree-sitter to parse Python source and produce indexed code chunks
- `app/embedder.py` - Wraps a local transformer model for code and query embeddings
- `app/indexer.py` - Builds and queries a FAISS index
- `app/models.py` - Pydantic request/response models

## Installation

1. Create a Python virtual environment.
2. Install the dependencies required by the app. Example:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Make sure a local transformer model exists at `./model` or update `MODEL_NAME` in `app/main.py` and `app/embedder.py`.

## Usage

Set the codebase path and run the FastAPI app with Uvicorn:

```bash
CODEBASE_PATH=/path/to/repo uvicorn app.main:app --reload
```

Then send a POST request to `/search` with a JSON body:

```json
{
  "query": "find the function that parses config files"
}
```

The endpoint returns a list of matching code chunks with metadata and similarity scores.

## Configuration

- `CODEBASE_PATH` - required environment variable pointing to the repository root to index
- `MODEL_NAME` - local model directory path referenced in `app/main.py` and `app/embedder.py`
- `TOP_K` - number of search results returned by the API

## Notes

- The repository expects a Python codebase and will skip files inside excluded directories such as `.git`, `venv`, `__pycache__`, and others.
- Large code blocks are split by token count to keep embeddings within a manageable length.
- This project is designed for offline, local analysis and search rather than remote model APIs.
