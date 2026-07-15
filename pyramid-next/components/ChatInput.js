'use client';

import React, { useRef, useState } from 'react';
import { Loader2, FolderOpen } from 'lucide-react';

// Folders to skip during recursive traversal — mirrors backend EXCLUDED_DIRS
const EXCLUDED_DIRS = new Set([
  '.git', 'venv', '.venv', 'env', '.env', '__pycache__',
  'node_modules', '.mypy_cache', '.pytest_cache', '.tox',
  'build', 'dist',
]);

/**
 * Recursively walk a FileSystemDirectoryHandle and collect every .py file.
 * Returns [{ relativePath, file }]
 */
async function collectPyFiles(dirHandle, basePath = '') {
  const results = [];
  for await (const [name, handle] of dirHandle) {
    if (handle.kind === 'directory') {
      if (!EXCLUDED_DIRS.has(name)) {
        const sub = await collectPyFiles(handle, basePath ? `${basePath}/${name}` : name);
        results.push(...sub);
      }
    } else if (handle.kind === 'file' && name.endsWith('.py')) {
      const file = await handle.getFile();
      results.push({ relativePath: basePath ? `${basePath}/${name}` : name, file });
    }
  }
  return results;
}

/* ── Inline SVG icons ── */
function CodeBracketsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 6L3 10L7 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6L17 10L13 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaperclipIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.5 9L9.5 16a4.5 4.5 0 01-6.364-6.364l7-7a3 3 0 014.243 4.243l-7.07 7.072a1.5 1.5 0 01-2.122-2.122L12 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUpIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 16V4M10 4L5 9M10 4L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  onFileUpload,
  onIndexFiles,
  activeScope,
  setActiveScope,
  uploadedFileName,
  indexedRepoName,
  isIndexing,
  isGenerating,
  modelLoading,
}) {
  const fileInputRef = useRef(null);
  const dirInputRef = useRef(null);
  const [collecting, setCollecting] = useState(false);
  const [collectProgress, setCollectProgress] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileUpload(file);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handlePickerClick = async () => {
    if (typeof window !== 'undefined' && window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker({ mode: 'read' });
        await processDirectoryHandle(dirHandle, dirHandle.name);
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Picker error:', err);
      }
    } else {
      dirInputRef.current?.click();
    }
  };

  const handleDirInputChange = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    const folderName = fileList[0].webkitRelativePath.split('/')[0] || 'unknown';
    setCollecting(true);
    setCollectProgress('Reading Python files...');
    try {
      const pyFiles = [];
      for (const f of fileList) {
        if (!f.name.endsWith('.py')) continue;
        const parts = f.webkitRelativePath.split('/');
        if (parts.some(p => EXCLUDED_DIRS.has(p))) continue;
        const relativePath = parts.slice(1).join('/');
        const content = await f.text();
        pyFiles.push({ relativePath, content });
      }
      if (!pyFiles.length) { setCollectProgress('No Python files found.'); return; }
      setCollectProgress(`Loading ${pyFiles.length} Python files...`);
      await onIndexFiles(folderName, pyFiles);
    } finally {
      setCollecting(false);
      setCollectProgress('');
      e.target.value = '';
    }
  };

  const processDirectoryHandle = async (dirHandle, folderName) => {
    setCollecting(true);
    setCollectProgress('Opening folder...');
    try {
      const entries = await collectPyFiles(dirHandle);
      if (!entries.length) { setCollectProgress('No Python files found.'); setTimeout(() => setCollectProgress(''), 3000); return; }
      setCollectProgress(`Reading Python files...`);
      const pyFiles = await Promise.all(
        entries.map(async ({ relativePath, file }) => ({ relativePath, content: await file.text() }))
      );
      setCollectProgress(`Loading files...`);
      await onIndexFiles(folderName, pyFiles);
    } finally {
      setCollecting(false);
      setCollectProgress('');
    }
  };

  const busy = isGenerating || modelLoading || isIndexing || collecting;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 py-5">
      {/* Hidden inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"
        accept=".py,.txt,.js,.json,.md,.html,.css" />
      <input type="file" ref={dirInputRef} onChange={handleDirInputChange} className="hidden"
        /* @ts-ignore */ webkitdirectory="true" directory="true" multiple />

      {/* Collecting progress strip */}
      {(collecting || collectProgress) && (
        <div className="flex items-center gap-2.5 bg-indigo-950/30 border border-indigo-900/40 rounded-xl px-4 py-2.5 text-[11px] text-indigo-300 mb-3">
          {collecting ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />}
          <span>{collectProgress}</span>
        </div>
      )}

      {/* ── Main glowing input container ── */}
      <div className="input-glow-container flex flex-col gap-3 bg-[#10121a] border border-violet-700/50 rounded-2xl px-4 pt-4 pb-3 shadow-[0_0_32px_rgba(124,58,237,0.18),0_0_8px_rgba(124,58,237,0.10)] transition-all duration-300 focus-within:shadow-[0_0_40px_rgba(139,92,246,0.28),0_0_12px_rgba(139,92,246,0.18)] focus-within:border-violet-600/70">

        {/* Placeholder / textarea */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isGenerating || modelLoading}
          placeholder="Ask anything about your codebase (Python .py supported)..."
          className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 text-[14px] w-full"
        />

        {/* Bottom row: icon buttons + model selector + send */}
        <div className="flex items-center justify-between">

          {/* Left: single index codebase button */}
          <div className="flex items-center gap-2">
             {/* Code icon button */}
            <button
              type="button"
              onClick={handlePickerClick}
              disabled={busy}
              title="Attach Python file/folder"
              className="w-8 h-8 bg-[#1a1d2e] border border-[#2a2d40] rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-400 hover:border-violet-700/50 hover:bg-violet-950/20 transition-all duration-200"
            >
              <CodeBracketsIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Right: model selector + send button */}
          <div className="flex items-center gap-3">
            {/* Local Model dropdown label */}
            <button
              type="button"
              className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-200 transition-colors duration-200 font-medium"
            >
              <span>Local Model</span>
              <ChevronDownIcon className="w-3.5 h-3.5" />
            </button>

            {/* Send button — circular purple gradient */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={isGenerating || modelLoading || !value.trim()}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white disabled:opacity-30 hover:from-violet-500 hover:to-purple-600 transition-all duration-200 shadow-[0_4px_14px_rgba(124,58,237,0.4)] hover:shadow-[0_4px_18px_rgba(124,58,237,0.55)] flex-shrink-0"
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
