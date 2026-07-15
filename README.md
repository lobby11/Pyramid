# Pyramid AI — Private On-Device Codebase Assistant

Pyramid AI is a **100% private, offline, on-device codebase assistant** that allows you to semantically search and ask questions about your codebase.

The application uses a local FastAPI backend for directory scanning, chunking, and semantic search, and runs an LLM **directly in your browser via WebGPU** — guaranteeing that no code or prompts ever leave your machine.

---

## 🚀 Key Features

* **On-Device Browser LLM:** Runs a local quantized model (`onnx-community/Qwen2.5-0.5B-Instruct`, 4-bit quantized) entirely inside your browser using [Transformers.js](https://github.com/huggingface/transformers.js) and WebGPU. No API keys, no network calls for inference, completely offline-first once the model is cached.
* **Native Folder Picker:** Load any local repository directly from the browser using the native File System Access API (`window.showDirectoryPicker`) — no typing file paths. The app recursively scans the selected folder for `.py` files, automatically skipping `.git`, `.venv`, `node_modules`, `__pycache__`, and other excluded directories.
* **Semantic Vector Search:** A local FastAPI indexer splits Python files into functions/classes using Tree-sitter, embeds each chunk with a local CodeBERT-based model, and performs fast similarity search using FAISS.
* **Streaming Chat Interface:** Questions and answers appear as a live conversation, with the AI's response streamed token-by-token and rendered as proper formatted markdown (headings, code blocks, lists) via `react-markdown`.
* **Readable Source Relevance:** Retrieved code snippets are labeled with plain-language relevance tags (e.g. "Best Match", "Related Code", "Possible Match") based on similarity score, instead of raw percentages — shown alongside file name, line range, and function name.
* **Live Status Indicators:** The interface polls backend reachability and indexing status every few seconds, showing whether the backend is online and whether WebGPU acceleration is active.
* **Privacy-First:** All indexing, embedding, and inference happens on your own machine. Nothing is uploaded anywhere outside your local backend.
* **Modern UI:** Next.js interface with a dark, high-fidelity design, real-time model loading progress, and a two-part layout — conversation on one side, retrieved code context on the other.

---

## 📁 Project Structure

```
Pyramid/
├── app/                        # Backend — FastAPI server
│   ├── main.py                 # FastAPI app, endpoints (/search, /index-files, /status), CORS setup
│   ├── codebase_indexer.py     # Coordinates directory scanning, chunking, and embedding
│   ├── chunker.py              # Tree-sitter syntax-aware parser (extracts functions/classes/methods)
│   ├── embedder.py             # Local transformer-based embedding computation
│   ├── indexer.py              # Builds and queries the FAISS vector index
│   └── models.py               # Pydantic request/response schemas
├── model/                      # Local embedding model files
├── download_model.py           # Helper script to pre-download the local embedding model
├── requirements.txt            # Python dependencies
├── start.bat                   # Optional one-click script to launch backend + frontend together
│
├── pyramid-next/                # Frontend — Next.js app (App Router, JavaScript, Tailwind CSS)
│   ├── app/
│   │   ├── globals.css         # Global styles and Tailwind directives
│   │   ├── layout.js           # Root layout wrapper
│   │   └── page.js             # Main workspace: state coordination, status polling, prompt building
│   ├── components/
│   │   ├── ChatColumn.js       # Conversation view — messages, markdown/code rendering, empty state
│   │   ├── ChatInput.js        # Input bar, native folder picker, upload trigger
│   │   ├── SourcesPanel.js     # Scrollable panel of retrieved code snippets with relevance labels
│   │   └── StatusBar.js        # Backend/GPU status pill indicators
│   ├── lib/
│   │   ├── api.js              # Fetch calls to the FastAPI backend
│   │   └── model.js            # Transformers.js model loading + WebGPU inference logic
│   ├── next.config.mjs         # Next.js config (Webpack overrides for WebGPU-related packages)
│   ├── tailwind.config.js      # Styling configuration
│   └── package.json            # Node dependencies
│
└── LICENSE
```

---

## 🛠️ Installation & Setup

### 1. Prerequisite: Download the local embedding model

From the repository root, run:

```bash
python download_model.py
```

This caches the embedding model used for indexing your codebase.

### 2. Run the backend (FastAPI)

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python -m uvicorn app.main:app --reload
```

The backend runs on `http://localhost:8000`. No environment variable or startup path is required — the codebase to index is selected later from the browser.

### 3. Run the frontend (Next.js)

In a separate terminal:

```bash
cd pyramid-next
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in a WebGPU-capable browser (Chrome or Edge, version 113+).

### Optional: start both at once

On Windows, `start.bat` in the project root launches the backend and frontend together in separate terminal windows:

```bash
start.bat
```

---

## ▶️ How to Use

1. Open the app in a WebGPU-capable browser and wait for the local model to load (cached after the first run, so later loads are near-instant).
2. Click the **"+"** button in the input bar and select a local repository folder using the native folder picker.
3. Wait for indexing to complete — the active repo name will appear in the interface.
4. Ask a question about the codebase, or click one of the suggested prompts.
5. The AI's answer streams in as formatted text, while the sources panel shows the exact files, line ranges, and relevance of the code used to generate that answer.

---

## 🤝 Third-Party Attributions

* **LLM Engine:** [@huggingface/transformers](https://github.com/huggingface/transformers.js) and ONNX Runtime Web, for local WebGPU inference in the browser.
* **Chat Model:** [Qwen2.5-0.5B-Instruct-ONNX](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct) by the Qwen Team.
* **Embedding Model:** [Semantic-CodeBERT](https://huggingface.co/Aakash1001/Semantic-CodeBERT) by Aakash.
* **Code Parsing:** [Tree-sitter Python parser](https://github.com/tree-sitter/tree-sitter-python) by GitHub.
* **Vector Indexing:** [FAISS](https://github.com/facebookresearch/faiss) by Meta's Fundamental AI Research team.
* **Backend Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) by Sebastián Ramírez.
* **Frontend Framework:** [Next.js](https://nextjs.org/) by Vercel.
* **Markdown Rendering:** [react-markdown](https://github.com/remarkjs/react-markdown).
* **Icons:** [lucide-react](https://lucide.dev/).

---

