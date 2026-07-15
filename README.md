# Pyramid AI — Private On-Device Codebase Assistant

Pyramid AI is a **100% private, offline, on-device codebase assistant** that allows you to semantically search and ask questions about your codebase. 

The application utilizes a local backend for directory loading/parsing and runs an LLM directly in the user's browser via **WebGPU**, guaranteeing that **no code or prompts ever leave your machine.**

---

## 🚀 Key Features

* **On-Device Browser LLM:** Executes local quantized models (`onnx-community/Qwen2.5-0.5B-Instruct` via WebGPU) inside your browser. No API keys, no network queries, completely offline-first.
* **Semantic Vector Search:** Integrates a local FastAPI indexer that splits python files into chunks using Tree-sitter, embeds them using a local `Semantic-CodeBERT` model, and runs fast similarity matching using FAISS.
* **Privacy-First:** Secure sandbox. Absolute code privacy since all processing happens directly on your local GPU/CPU.
* **Sleek UI:** Modern Next.js interface with high-fidelity dark mode, real-time local model status reporting (GPU active state, local model caching progress), and highlighted code context panels.

---

## 📁 Project Structure

* **`pyramid-next/` (Frontend):** Next.js single-page web app. Performs local WebGPU model loading and response streaming.
* **`app/` (Backend):** Python FastAPI server.
  * `app/main.py` - FastAPI app, endpoints, and file upload validation.
  * `app/codebase_indexer.py` - Manages directory scans and orchestrates embedding generation.
  * `app/chunker.py` - Tree-sitter syntax-aware parser (extracts classes/functions).
  * `app/embedder.py` - Evaluates embeddings locally via CodeBERT.
  * `app/indexer.py` - Handles local FAISS indexes.
* **`download_model.py`:** Pre-downloads the local embedding model files.
* **`LICENSE`:** MIT open-source license.

---

## 🛠️ Installation & Setup

### 1. Prerequisite: Download Local Embedding Model
From the repository root directory, run the helper script to cache the CodeBERT embedding weights locally:
```bash
python download_model.py
```

### 2. Run the Local Backend (FastAPI)
Create a Python virtual environment, install requirements, and boot up the server:
```bash
# 1. Create and active virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the FastAPI API server
python -m uvicorn app.main:app --reload
```
The local server will run on `http://localhost:8000`.

### 3. Run the Frontend (Next.js)
Open a new terminal session, navigate to the `pyramid-next` folder, install Node packages, and run the developer server:
```bash
cd pyramid-next
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your WebGPU-compatible browser (e.g. Google Chrome or Microsoft Edge version 113+).

---

## 🤝 Third-Party Attributions

We thank and attribute the following open-source projects that make Pyramid AI possible:
* **LLM Engine:** [@huggingface/transformers](https://github.com/huggingface/transformers.js) and ONNX Runtime Web for local WebGPU inference.
* **Chat Model:** [Qwen2.5-0.5B-Instruct-ONNX](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct) by the Qwen Team.
* **Embedding Model:** [Semantic-CodeBERT](https://huggingface.co/Aakash1001/Semantic-CodeBERT) by Aakash.
* **Code Parsing:** [Tree-sitter Python parser](https://github.com/tree-sitter/tree-sitter-python) by GitHub.
* **Vector Indexing:** [FAISS](https://github.com/facebookresearch/faiss) by Meta's Fundamental AI Research team.
* **Backend Web Framework:** [FastAPI](https://fastapi.tiangolo.com/) by Sebastián Ramírez.

---

## 📄 License

This project is open-source and licensed under the **OSI-Compliant MIT License**. See the `LICENSE` file for details.
