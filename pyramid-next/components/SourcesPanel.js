'use client';

import React from 'react';
import { FileCode, Clipboard, Check } from 'lucide-react';

/**
 * getRelevanceLabel — converts a raw cosine/similarity score to a
 * human-readable label + badge style.
 *
 * Score is kept internally for sorting; only the label is shown in the UI.
 * Very low scores (< 0.10) are filtered out upstream in uniqueSources.
 *
 * Thresholds (tune after real-world testing):
 *   ≥ 0.55  →  Strong match    (emerald)
 *   ≥ 0.30  →  Related         (indigo/violet)
 *   ≥ 0.10  →  Possibly relevant (slate, de-emphasised)
 *   < 0.10  →  hidden entirely
 */
function getRelevanceLabel(score) {
  if (score >= 0.55) {
    return {
      label: 'Best Match',
      className: 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400',
    };
  }
  if (score >= 0.30) {
    return {
      label: 'Related Code',
      className: 'bg-violet-950/40 border-violet-800/40 text-violet-400',
    };
  }
  // 0.10 – 0.29 → de-emphasised but still shown
  return {
    label: 'Possible Match',
    className: 'bg-slate-900/60 border-[#1e2030] text-slate-500',
  };
}

export default function SourcesPanel({ sources }) {
  const [copiedIndex, setCopiedIndex] = React.useState(null);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // 1. Deduplicate by location + line range
  const deduped = [];
  const seenKeys = new Set();
  (sources || []).forEach(src => {
    const key = `${src.location}:${src.start}-${src.end}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduped.push(src);
    }
  });

  // 2. Filter out very-low-confidence results (score < 0.10)
  //    Sort highest score first — ranking logic unchanged
  const uniqueSources = deduped
    .filter(src => src.score == null || src.score >= 0.10)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  /* ── Empty state ── */
  if (uniqueSources.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 p-6 text-center border-l border-[#1c1f2e]">
        <FileCode className="w-8 h-8 text-slate-700 mb-3" />
        <div className="font-medium text-slate-600">No context sources loaded.</div>
        <div className="text-slate-700 mt-1 text-[10px]">Run a query to see relevant code chunks here.</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l border-[#1c1f2e] bg-[#0d0e18]">

      {/* ── Panel header ── */}
      <div className="px-5 py-3.5 border-b border-[#1c1f2e] flex items-center justify-between bg-[#0d0e18] flex-shrink-0">
        <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-slate-400">
          Context Chunks
        </span>
        <span className="text-[10px] font-medium text-slate-400">
          {uniqueSources.length} {uniqueSources.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {/* ── Sources list ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {uniqueSources.map((src, idx) => {
          const filename = src.location.split(/[/\\]/).pop();
          const relevance = getRelevanceLabel(src.score ?? 0);
          const lineCount = src.end - src.start + 1;

          // Build line-numbered code rows
          const codeLines = (src.code || '').split('\n');
          const startLine = src.start ?? 1;

          return (
            <div
              key={idx}
              className="bg-[#0b0c16] border border-[#1a1c2a] rounded-xl overflow-hidden shadow-sm hover:border-[#252740] transition-all duration-200"
            >
              {/* Card header */}
              <div className="px-4 py-3 bg-[#0f1019] border-b border-[#1a1c2a] flex flex-col gap-2">
                {/* Filename row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span
                      className="font-semibold text-[14px] text-slate-200 truncate"
                      title={src.location}
                    >
                      {filename}
                    </span>
                    <span className="text-[11.5px] text-slate-500 font-mono flex-shrink-0">
                      lines {src.start}–{src.end}
                    </span>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => copyToClipboard(src.code, idx)}
                    className="p-1 rounded-md hover:bg-[#1a1c2a] text-slate-600 hover:text-slate-300 transition-colors duration-200 flex-shrink-0"
                    title="Copy code snippet"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Clipboard className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Badge row — relevance label + type tag */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Relevance label — qualitative, no number */}
                  <span
                    className={`text-[11.5px] font-semibold border px-2 py-0.5 rounded-md select-none ${relevance.className}`}
                  >
                    {relevance.label}
                  </span>

                  {/* Function type tag */}
                  {src.function && (
                    <span className="text-[11.5px] font-semibold bg-indigo-950/30 border border-indigo-800/30 text-indigo-400 px-2 py-0.5 rounded-md select-none font-mono">
                      Python Function
                    </span>
                  )}
                </div>
              </div>

              {/* Line-numbered code block */}
              <div className="overflow-x-auto bg-[#080910]">
                <table className="w-full border-collapse text-[13px] font-mono leading-[1.65]">
                  <tbody>
                    {codeLines.map((line, li) => {
                      const lineNum = startLine + li;
                      return (
                        <tr key={li} className="group hover:bg-[#0e1020]/60">
                          {/* Line number gutter */}
                          <td className="w-10 pr-3 pl-3 text-right text-slate-600 select-none border-r border-[#13152a] group-hover:text-slate-500 align-top pt-px">
                            {lineNum}
                          </td>
                          {/* Code content */}
                          <td className="pl-4 pr-4 text-slate-300 whitespace-pre align-top pt-px">
                            {line || ' '}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer summary */}
              <div className="px-4 py-2 border-t border-[#1a1c2a] bg-[#0b0c16] flex items-center gap-2 text-[11.5px] text-slate-600">
                <span>Showing lines {src.start}–{src.end}</span>
                <span className="text-slate-700">•</span>
                <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
                {idx === 0 && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span>{uniqueSources.length} match{uniqueSources.length !== 1 ? 'es' : ''} found</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
