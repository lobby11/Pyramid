'use client';

import React from 'react';

/* Inline SVG icons to match the design exactly without extra icon lib deps */

function ServerRackIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="12" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="15" cy="6" r="0.8" fill="currentColor" />
      <circle cx="15" cy="14" r="0.8" fill="currentColor" />
    </svg>
  );
}

function PulseLineIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points="0,7 4,7 6,2 8,12 10,5 12,9 14,7 24,7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StatusBar({ backendOnline, gpuActive }) {
  return (
    <div className="flex items-center gap-0 select-none">

      {/* ── Backend Status Block ── */}
      <div className="flex items-center gap-2.5 px-4 py-2">
        {/* Server icon */}
        <ServerRackIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />

        {/* Text block */}
        <div className="flex flex-col leading-none">
          <span className="text-[12px] font-bold text-white tracking-tight">
            {backendOnline ? 'Backend Online' : 'Backend Offline'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 font-medium">
            {backendOnline ? 'Connected' : 'Local data only'}
          </span>
        </div>

        {/* Amber/Green dot */}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300 ${
            backendOnline
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
              : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]'
          }`}
        />
      </div>

      {/* Thin vertical divider */}
      <div className="w-px h-8 bg-[#1c1f2e] flex-shrink-0" />

      {/* ── GPU Status Block ── */}
      <div className="flex items-center gap-2.5 px-4 py-2">
        {/* Circle with green dot inside */}
        <div className="relative w-4 h-4 flex-shrink-0">
          <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                gpuActive
                  ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.9)]'
                  : 'bg-slate-600'
              }`}
            />
          </div>
        </div>

        {/* Text block */}
        <div className="flex flex-col leading-none">
          <span className="text-[12px] font-bold text-white tracking-tight">
            {gpuActive ? 'GPU Active' : 'GPU Inactive'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 font-medium">
            {gpuActive ? 'Running on your machine' : 'WebGPU unavailable'}
          </span>
        </div>

        {/* Pulse line icon — green when active */}
        <PulseLineIcon
          className={`w-6 h-3.5 flex-shrink-0 transition-colors duration-300 ${
            gpuActive ? 'text-emerald-400' : 'text-slate-600'
          }`}
        />
      </div>
    </div>
  );
}
