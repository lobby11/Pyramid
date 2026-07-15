'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, X, FileCheck, ChevronDown } from 'lucide-react';
import StatusBar from '@/components/StatusBar';
import ChatColumn from '@/components/ChatColumn';
import SourcesPanel from '@/components/SourcesPanel';
import ChatInput from '@/components/ChatInput';
import { searchCodebase, uploadFile, checkBackend, indexCodebasePath, getIndexingStatus, indexFiles } from '@/lib/api';
import { loadModel, generateResponse } from '@/lib/model';

export default function Home() {
  // Connection and GPU states
  const [gpuActive, setGpuActive] = useState(false);
  const [gpuChecked, setGpuChecked] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Model loading states
  const [modelLoading, setModelLoading] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelProgress, setModelProgress] = useState({});
  const [isCached, setIsCached] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Chat conversation states
  const [messages, setMessages] = useState([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Upload index states
  const [activeScope, setActiveScope] = useState('repo'); // 'repo' or 'file'
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Codebase path indexing states
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedPath, setIndexedPath] = useState('');
  const [indexedRepoName, setIndexedRepoName] = useState('');

  // 1. Check WebGPU compatibility on mount
  useEffect(() => {
    async function checkGpu() {
      if (typeof window !== 'undefined' && navigator.gpu) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            setGpuActive(true);
            triggerModelLoad();
          } else {
            setGpuActive(false);
            setModelLoading(false);
          }
        } catch (e) {
          console.error('WebGPU adapter failed:', e);
          setGpuActive(false);
          setModelLoading(false);
        }
      } else {
        setGpuActive(false);
        setModelLoading(false);
      }
      setGpuChecked(true);
    }
    checkGpu();
  }, []);

  // 1b. Check if model is cached in browser Cache API on mount
  useEffect(() => {
    async function checkCache() {
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheName = 'transformers-cache';
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          const cached = keys.some(req => 
            req.url.includes('onnx-community/Qwen2.5-0.5B-Instruct') && 
            req.url.includes('model_q4.onnx')
          );
          setIsCached(cached);
        } catch (e) {
          console.warn('[Cache Check] Failed to read browser cache:', e);
        }
      }
    }
    checkCache();
  }, []);

  // 2. Poll backend connectivity + indexing status every 5 seconds
  useEffect(() => {
    async function ping() {
      const active = await checkBackend();
      setBackendOnline(active);
      if (active) {
        try {
          const status = await getIndexingStatus();
          if (status.indexed && status.path) {
            setIndexedPath(status.path);
            setIndexedRepoName(status.path.split(/[\\/]/).filter(Boolean).pop() || status.path);
          } else {
            // Backend restarted or no index — reset to neutral
            setIndexedPath('');
            setIndexedRepoName('');
          }
        } catch {
          setIndexedPath('');
          setIndexedRepoName('');
        }
      } else {
        setIndexedPath('');
        setIndexedRepoName('');
      }
    }
    ping();
    const interval = setInterval(ping, 5000);
    return () => clearInterval(interval);
  }, []);

  // 3. Load model using progress callback
  const triggerModelLoad = async () => {
    try {
      setModelLoading(true);
      await loadModel((data) => {
        if (data.status === 'initiate') {
          setModelProgress(prev => ({
            ...prev,
            [data.file]: { progress: 0, loaded: 0, total: 0, status: 'Initiating...' }
          }));
        } else if (data.status === 'progress') {
          setModelProgress(prev => ({
            ...prev,
            [data.file]: { progress: data.progress, loaded: data.loaded, total: data.total, status: `Downloading... ${data.progress.toFixed(0)}%` }
          }));
        } else if (data.status === 'done') {
          setModelProgress(prev => ({
            ...prev,
            [data.file]: { ...prev[data.file], progress: 100, status: 'Compiling...' }
          }));
        } else if (data.status === 'ready') {
          setModelProgress(prev => ({
            ...prev,
            [data.file]: { ...prev[data.file], progress: 100, status: 'Ready' }
          }));
        }
      });
      setModelLoaded(true);
      setModelLoading(false);
    } catch (err) {
      console.error('Failed to load local model:', err);
      setGpuActive(false);
      setModelLoading(false);
    }
  };

  // 4. File upload trigger
  const handleFileUpload = async (file) => {
    try {
      setIsUploading(true);
      setUploadStatus('Loading file...');
      const response = await uploadFile(file);
      if (response.status === 'success') {
        setUploadedFileName(file.name);
        setActiveScope('file'); // Auto target uploaded file
        setUploadStatus(`Successfully loaded ${file.name}`);
      } else {
        setUploadStatus(`Failed to load: ${response.message}`);
      }
    } catch (err) {
      console.error(err);
      setUploadStatus(`Failed to load: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 4b. Index by browser-collected file contents
  const handleIndexFiles = async (folderName, pyFiles) => {
    try {
      setIsIndexing(true);
      setUploadStatus(`Loading Python files...`);
      const result = await indexFiles(folderName, pyFiles);
      setIndexedPath(folderName);      // just a display key
      setIndexedRepoName(folderName);
      setUploadStatus(`Successfully loaded "${folderName}"`);
    } catch (err) {
      console.error(err);
      setUploadStatus(`Failed to load: ${err.message}`);
    } finally {
      setIsIndexing(false);
    }
  };

  // 5. Submit Query handler
  const submitQuery = async (queryOverride) => {
    const query = (queryOverride || inputValue).trim();
    if (!query) return;

    // Guard: no folder loaded yet
    if (!indexedPath && activeScope !== 'file') {
      setUploadStatus('No Python file/folder attached — click the attach button below to select a Python file/folder first.');
      return;
    }

    setIsGenerating(true);
    setStreamingAnswer('');
    setSources([]);

    // Add user question to state
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInputValue('');

    try {
      // Step A: Search context snippets from FastAPI
      const searchResults = await searchCodebase(query, activeScope);

      if (!searchResults || searchResults.length === 0) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'No relevant code snippets were found in the index for this query.' }
        ]);
        setIsGenerating(false);
        return;
      }

      setSources(searchResults);

      // Step B: Build LLM Prompt — cap each snippet at 60 lines to reduce prefill cost
      const MAX_LINES = 60;
      const contextString = searchResults.map((res, idx) => {
        const codeLines = res.code.split('\n');
        const code = codeLines.length > MAX_LINES
          ? codeLines.slice(0, MAX_LINES).join('\n') + `\n... (${codeLines.length - MAX_LINES} more lines)`
          : res.code;
        return `[${idx + 1}] ${res.location} L${res.start}-${res.end}\n${code}`;
      }).join('\n\n');

      const systemPrompt = `Answer based ONLY on the code snippets below. Be concise and direct.
If the answer isn't in the snippets, say so.

${contextString}`;

      const prompt = `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${query}<|im_end|>\n<|im_start|>assistant\n`;

      // Step C: Run local model and stream token output
      let accumulatedText = '';
      await generateResponse(prompt, (text) => {
        accumulatedText += text;
        setStreamingAnswer(accumulatedText);
      });

      // Save complete assistant message to list
      setMessages(prev => [...prev, { role: 'assistant', content: accumulatedText }]);
      setStreamingAnswer('');

    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Inference failed: ${err.message}` }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestedPromptClick = (promptText) => {
    submitQuery(promptText);
  };

  const keys = Object.keys(modelProgress);
  let totalBytes = 0;
  let loadedBytes = 0;
  keys.forEach(file => {
    const item = modelProgress[file];
    if (item.total) {
      totalBytes += item.total;
      loadedBytes += item.loaded;
    }
  });
  const overallProgress = totalBytes > 0 ? (loadedBytes / totalBytes) * 100 : 0;

  const hasMessages = messages.length > 0 || streamingAnswer;

  return (
    /* Outer layout - Layered Dark Gradient Background */
    <div className="flex flex-col h-screen overflow-hidden bg-[#09090f] text-slate-100 selection:bg-indigo-500/20 selection:text-indigo-200">
      
      {/* Top Header — inset full-width dark container */}
      <div className="px-4 pt-3">
        <header className="flex items-center justify-between px-4 py-2.5 bg-[#0d0e18] border border-[#1e2030] rounded-2xl shadow-sm z-10 select-none">

          {/* Left: triangular logo + name */}
          <div className="flex items-center gap-2.5">
            {/* Triangle logo icon */}
            <div
              className="w-7 h-7 flex-shrink-0 flex items-center justify-center animate-pulse"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                borderRadius: '3px',
                animationDuration: '4s',
              }}
            />
            <span 
              className="text-[14px] font-black tracking-widest uppercase bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
              style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
            >
              Pyramid AI
            </span>
          </div>

          {/* Center: Task tab with purple underline dot */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[13px] font-semibold text-white tracking-tight">Task</span>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          </div>

          {/* Right: status blocks */}
          <StatusBar backendOnline={backendOnline} gpuActive={gpuActive} />
        </header>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {gpuChecked && !gpuActive ? (
          /* WebGPU Error Modal overlay */
          <div className="absolute inset-0 bg-[#090a0f]/90 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="max-w-md w-full bg-[#10121a] border border-red-950/40 p-8 rounded-xl shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-red-950/20 border border-red-900/30 flex items-center justify-center rounded-2xl mx-auto">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <div className="space-y-1">
                <h2 className="text-slate-200 font-semibold text-sm tracking-tight">WebGPU Acceleration Required</h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                  This application compiles and executes large language models entirely in your browser using WebGPU hardware acceleration. Your browser or GPU does not support WebGPU.
                </p>
              </div>
              <div className="text-left text-xs text-slate-500 space-y-1.5 bg-slate-950 p-4 rounded-xl border border-[#1c1f2e] font-sans">
                <div>• Use **Google Chrome** or **Microsoft Edge** (version 113+).</div>
                <div>• Ensure Hardware Acceleration is enabled in your browser settings.</div>
                <div>• Verify your GPU drivers are updated to their latest versions.</div>
              </div>
              <p className="text-[10px] text-slate-600">Local computation guarantees complete privacy of your codebase.</p>
            </div>
          </div>
        ) : modelLoading && !modelLoaded ? (
          /* Model Loading/Warming Screen */
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#10121a]/60 border border-[#1c1f2e]/60 p-8 rounded-2xl shadow-2xl space-y-6 backdrop-blur-md">
              
              {/* Pulsing Loading Core */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-center rounded-2xl shadow-inner animate-pulse">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-200 tracking-tight">
                    {isCached ? 'Warming up local model...' : 'Loading local weights'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Qwen 2.5 0.5B Instruct • WebGPU
                  </p>
                </div>
              </div>

              {/* Progress Detail Area */}
              {!isCached ? (
                <div className="space-y-4">
                  {/* Single Clean Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono font-medium text-slate-400">
                      <span>Downloading Model</span>
                      <span className="text-indigo-400">{overallProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-[#1c1f2e]/60">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-350 ease-out" 
                        style={{ width: `${overallProgress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  {keys.length > 0 && (
                    <div className="space-y-2 border-t border-[#1c1f2e]/40 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center justify-between w-full text-[10px] text-slate-500 hover:text-slate-350 font-medium transition-colors"
                      >
                        <span>{showDetails ? 'Hide file details' : 'Show file details'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                      </button>

                      {showDetails && (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 mt-2 transition-all">
                          {keys.map((file, idx) => (
                            <div key={idx} className="bg-slate-950/40 border border-[#1c1f2e]/40 p-2 rounded-lg text-[10px]">
                              <div className="flex justify-between text-slate-400 font-medium mb-1 gap-4">
                                <span className="truncate max-w-[70%]" title={file}>{file}</span>
                                <span className="text-indigo-400 font-mono flex-shrink-0">{modelProgress[file].status}</span>
                              </div>
                              <div className="w-full bg-[#171a26] h-1 rounded overflow-hidden">
                                <div className="bg-indigo-600/80 h-full transition-all duration-200" style={{ width: `${modelProgress[file].progress}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Cached Warming state */
                <div className="py-2 flex flex-col items-center">
                  <span className="text-xs text-slate-400 animate-pulse font-medium">
                    Initializing graphics engine and model buffers...
                  </span>
                </div>
              )}

              {/* Explanatory Caption */}
              <p className="text-[10px] text-slate-550 text-center leading-relaxed max-w-xs mx-auto border-t border-[#1c1f2e]/20 pt-4">
                Large language models are cached directly in your browser's secure sandbox. Subsequent visits load instantly.
              </p>
            </div>
          </div>
        ) : (
          /* Workspace Core App Interface */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Upper half layout: single or two columns */}
            {hasMessages ? (
              <div className="flex-1 grid grid-cols-10 overflow-hidden">
                {/* Chat Column (Left 50%): transparent to reveal background radial gradient */}
                <div className="col-span-5 flex flex-col overflow-hidden h-full bg-transparent">
                  <ChatColumn
                    messages={messages}
                    streamingAnswer={streamingAnswer}
                    onSuggestedPromptClick={handleSuggestedPromptClick}
                    isGenerating={isGenerating}
                  />
                </div>
                {/* Sources Panel (Right 50%): solid panel bg to create layered columns depth */}
                <div className="col-span-5 flex flex-col overflow-hidden h-full bg-[#10121a] shadow-lg">
                  <SourcesPanel sources={sources} />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden h-full justify-center bg-transparent w-full">
                <ChatColumn
                  messages={messages}
                  streamingAnswer={streamingAnswer}
                  onSuggestedPromptClick={handleSuggestedPromptClick}
                  isGenerating={isGenerating}
                />
              </div>
            )}

            {/* Status / hint banner */}
            {!indexedPath && !uploadStatus && (
              <div className="w-full max-w-4xl mx-auto px-6">
                <div className="bg-[#10121a] border border-[#1c1f2e]/40 px-4 py-2.5 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                  <span className="text-slate-600">◈</span>
                  <span>No Python file/folder attached — click the attach button below to select and attach a Python file/folder.</span>
                </div>
              </div>
            )}
            {uploadStatus && (
              <div className="w-full max-w-4xl mx-auto px-6">
                <div className={`border px-4 py-2.5 rounded-xl text-xs flex justify-between items-center shadow-lg ${
                  uploadStatus.includes('failed') || uploadStatus.includes('No folder')
                    ? 'bg-rose-950/20 border-rose-900/30 text-rose-300'
                    : uploadStatus.includes('Loading') || uploadStatus.includes('Scanning')
                    ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-300'
                    : 'bg-[#10121a] border-[#1c1f2e]/60 text-slate-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadStatus}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadStatus('')}
                    className="text-slate-500 hover:text-slate-300 p-0.5 rounded hover:bg-slate-800 transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom input area */}
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={() => submitQuery()}
              onFileUpload={handleFileUpload}
              onIndexFiles={handleIndexFiles}
              activeScope={activeScope}
              setActiveScope={setActiveScope}
              uploadedFileName={uploadedFileName}
              indexedRepoName={indexedRepoName}
              isIndexing={isIndexing}
              isGenerating={isGenerating}
              modelLoading={modelLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
