import os
import shutil
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Header, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer

from .models import SearchRequest, SearchResult, IndexRequest
from .codebase_indexer import find_python_files, index_codebase

MODEL_NAME = r".\model"  # Path to the local model directory
TOP_K = 3  # Fewer snippets = smaller prompt = faster model prefill


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    
    app.state.indexer = None
    app.state.embedder = None
    app.state.tokenizer = tokenizer
    app.state.codebase_path = None

    yield  

    # Shutdown

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/search", response_model=list[SearchResult])
async def search(request: SearchRequest, x_search_scope: str | None = Header(None)):
    if x_search_scope == "file":
        indexer = getattr(app.state, "uploaded_indexer", None)
        embedder = getattr(app.state, "uploaded_embedder", None)
        if not indexer or not embedder:
            return []
    else:
        embedder = getattr(app.state, "embedder", None)
        indexer = getattr(app.state, "indexer", None)
        if not indexer or not embedder:
            raise HTTPException(
                status_code=400,
                detail="No codebase has been indexed yet. Please select and index a codebase path first."
            )

    query_embedding = embedder.embed_query(request.query)
    results = indexer.search(query_embedding, k=TOP_K)

    return results

@app.post("/index")
async def index_path(request: IndexRequest):
    path_str = request.path
    path_obj = Path(path_str)
    
    if not path_obj.exists():
        return {"status": "error", "message": f"Path '{path_str}' does not exist."}
    if not path_obj.is_dir():
        return {"status": "error", "message": f"Path '{path_str}' is not a directory."}
        
    py_files = find_python_files(path_str)
    if not py_files:
        return {"status": "error", "message": f"No valid Python files found under '{path_str}'."}
        
    tokenizer = getattr(app.state, "tokenizer", None)
    if not tokenizer:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        app.state.tokenizer = tokenizer
        
    try:
        indexer, embedder = index_codebase(path_str, tokenizer)
        app.state.indexer = indexer
        app.state.embedder = embedder
        app.state.codebase_path = path_str
        
        return {
            "status": "success",
            "message": f"Successfully indexed codebase at '{path_str}'",
            "files": len(py_files),
            "chunks": len(indexer.metadata_store)
        }
    except Exception as e:
        return {"status": "error", "message": f"Indexing failed: {str(e)}"}

@app.get("/status")
async def get_status():
    indexed = getattr(app.state, "indexer", None) is not None
    path = getattr(app.state, "codebase_path", None)
    return {
        "indexed": indexed,
        "path": path
    }

@app.post("/index-files")
async def index_files(
    folder_name: str = Form(...),
    files: list[UploadFile] = File(...)
):
    """
    Accept .py file contents uploaded directly from the browser.
    Writes them to a temp directory preserving relative paths,
    runs index_codebase on it, then cleans up.
    """
    tmpdir = tempfile.mkdtemp()
    try:
        for upload in files:
            # filename field carries the relative path (e.g. "subdir/module.py")
            rel = Path(upload.filename.replace("\\", "/"))
            dest = (Path(tmpdir) / rel).resolve()
            # Ensure resolved path is strictly within temp directory to prevent directory traversal
            if not str(dest).startswith(os.path.abspath(tmpdir)):
                raise HTTPException(status_code=400, detail="Vulnerability detected: Invalid file path path-traversal sequence.")
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(await upload.read())

        tokenizer = getattr(app.state, "tokenizer", None)
        if not tokenizer:
            tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
            app.state.tokenizer = tokenizer

        indexer, embedder = index_codebase(tmpdir, tokenizer)
        app.state.indexer = indexer
        app.state.embedder = embedder
        # Store just the display name so GET /status reports it correctly
        app.state.codebase_path = folder_name

        return {
            "status": "success",
            "files": len(files),
            "chunks": len(indexer.metadata_store),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Retrieve tokenizer from app.state
    tokenizer = getattr(app.state, "tokenizer", None)
    if not tokenizer:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        app.state.tokenizer = tokenizer

    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        from .chunker import CodeChunker
        from .embedder import CodeEmbedder
        from .indexer import CodeIndexer

        chunker = CodeChunker(tokenizer)
        embedder = CodeEmbedder()
        indexer = CodeIndexer()

        chunks = chunker.chunk_file(tmp_path)
        if not chunks:
            raise ValueError("No code chunks could be extracted from the uploaded file.")

        embedder.embed_chunks(chunks)
        indexer.build_index(chunks)

        app.state.uploaded_indexer = indexer
        app.state.uploaded_embedder = embedder

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return {"status": "success", "message": f"Successfully indexed {file.filename}"}

