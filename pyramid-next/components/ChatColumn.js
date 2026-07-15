'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ── Inline SVG icons for feature cards ── */
function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CodeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 6L3 10L7 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6L17 10L13 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LightbulbIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3a5 5 0 00-3 9v1h6v-1a5 5 0 00-3-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TerminalIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 9L9 12L6 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2L4 5v5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5L10 2z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/* Feature cards data */
const featureCards = [
  {
    icon: SearchIcon,
    title: 'Search Codebase',
    description: 'Find anything instantly',
    prompt: 'Search for a function in my codebase',
  },
  {
    icon: CodeIcon,
    title: 'Explain Code',
    description: 'Understand complex code easily',
    prompt: 'Explain how this code works',
  },
  {
    icon: LightbulbIcon,
    title: 'Best Practices',
    description: 'Get suggestions to improve your code',
    prompt: 'What are best practices for this pattern?',
  },
  {
    icon: TerminalIcon,
    title: 'Debug Help',
    description: 'Solve issues and errors faster',
    prompt: 'Help me debug this error',
  },
];

export default function ChatColumn({ messages, streamingAnswer, onSuggestedPromptClick, isGenerating }) {
  const hasMessages = messages.length > 0 || streamingAnswer;

  /* Markdown renderer */
  const markdownComponents = {
    h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-slate-100 mt-5 mb-2.5 tracking-tight" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-base font-semibold text-slate-100 mt-4 mb-2 tracking-tight" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-sm font-semibold text-slate-200 mt-3 mb-1.5" {...props} />,
    p: ({ node, ...props }) => <p className="mb-3.5 last:mb-0 text-slate-300 text-[15px] leading-relaxed" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-3.5 text-slate-300 text-[14.5px] space-y-2" {...props} />,
    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-3.5 text-slate-300 text-[14.5px] space-y-2" {...props} />,
    li: ({ node, ...props }) => <li className="text-slate-300 text-[14.5px] leading-relaxed" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-semibold text-slate-150" {...props} />,
    em: ({ node, ...props }) => <em className="italic text-slate-200" {...props} />,
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      return !inline && match ? (
        <div className="my-3 rounded-lg overflow-hidden border border-[#1c1f2e] bg-[#0b0f17]">
          <div className="bg-[#10121a] px-3.5 py-1.5 border-b border-[#1c1f2e] text-[10px] font-bold text-slate-400 font-mono flex justify-between items-center select-none">
            <span>{match[1].toUpperCase()}</span>
          </div>
          <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
            customStyle={{ margin: 0, padding: '14px', background: '#0b0f17', fontSize: '13px', fontFamily: "'Fira Code','JetBrains Mono',monospace", lineHeight: '1.65' }}
            {...props}>{codeString}</SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-[#171a26] text-indigo-300 px-1.5 py-0.5 rounded text-[12.5px] font-mono border border-[#1c1f2e]" {...props}>
          {children}
        </code>
      );
    }
  };

  /* ── EMPTY / LANDING STATE ── */
  if (!hasMessages) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 gap-10">

        {/* Hero section */}
        <div className="flex flex-col items-center text-center gap-4">

          {/* Privacy badge pill */}
          <div className="flex items-center gap-2 border border-[#2a2d40] bg-[#13141f] rounded-full px-4 py-1.5">
            <ShieldIcon className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
              100% Private&nbsp;•&nbsp;No data leaves your machine
            </span>
          </div>

          {/* Main heading */}
          <div className="relative">
            {/* Sparkle star floating top-right of heading */}
            <span className="absolute -top-4 -right-7 text-violet-400 text-3xl leading-none select-none pointer-events-none">✦</span>
            <h1 
              className="text-[64px] font-black leading-none tracking-tighter uppercase"
              style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
            >
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Pyramid{' '}
              </span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-[15px] text-slate-400 font-medium">
            Your private AI assistant for code and more.{' '}
            <span className="text-violet-400 font-semibold block mt-1.5 text-[12px] uppercase tracking-wider">
              (Currently supporting Python .py files)
            </span>
          </p>
        </div>

        {/* Feature cards row — 4 equal cards */}
        <div className="grid grid-cols-4 gap-4 w-full max-w-3xl">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={idx}
                type="button"
                disabled={isGenerating}
                onClick={() => onSuggestedPromptClick(card.prompt)}
                className="group relative flex flex-col items-start p-5 bg-[#0f1018] border border-[#1e2030] rounded-2xl text-left hover:border-violet-800/50 hover:bg-[#12131e] transition-all duration-250 cursor-pointer"
              >
                {/* Icon badge */}
                <div className="w-9 h-9 rounded-xl bg-violet-950/40 border border-violet-800/30 flex items-center justify-center mb-4 group-hover:bg-violet-900/40 transition-colors duration-200">
                  <Icon className="w-4.5 h-4.5 text-violet-400" />
                </div>

                {/* Title */}
                <span className="text-[13px] font-bold text-white mb-1 tracking-tight leading-snug">
                  {card.title}
                </span>

                {/* Description */}
                <span className="text-[11px] text-slate-500 leading-relaxed">
                  {card.description}
                </span>

                {/* Arrow icon bottom-right */}
                <div className="absolute bottom-4 right-4 text-violet-500 group-hover:text-violet-400 transition-colors duration-200">
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
          <ShieldIcon className="w-3.5 h-3.5 text-slate-600" />
          <span>100% Private</span>
          <span className="text-slate-700">•</span>
          <span>No data leaves your machine</span>
        </div>

      </div>
    );
  }

  /* ── CHAT STATE (messages exist) ── */

  // Format current time for timestamp display
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">

      {/* Timestamp — centered at top */}
      <div className="flex justify-center">
        <span className="text-[10px] text-slate-600 font-medium tracking-wide">{timeStr}</span>
      </div>

      {messages.map((msg, idx) => (
        <div key={idx} className="w-full">
          {msg.role === 'user' ? (

            /* ── User message ── */
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] text-violet-400 uppercase tracking-widest font-bold">
                <CircleDotIcon className="w-3 h-3 text-violet-400" />
                <span>YOU</span>
              </div>
              <div className="max-w-[82%] text-[15px] text-slate-200 text-left bg-[#111320] border border-[#1e2135] px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed shadow-sm">
                {msg.content}
              </div>
            </div>

          ) : (

            /* ── AI response ── */
            <div className="flex flex-col gap-2">
              {/* Label */}
              <div className="flex items-center gap-2 text-[10px] text-violet-400 uppercase tracking-widest font-bold">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
                <span>Pyramid AI</span>
              </div>
              {/* Response text — left blue border */}
              <div className="pl-4 border-l-2 border-[#1e2135] text-slate-300 leading-relaxed text-[15px]">
                <ReactMarkdown components={markdownComponents}>{msg.content}</ReactMarkdown>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2 pl-4 mt-1">
                <CopyButton text={msg.content} />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Streaming response */}
      {streamingAnswer && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] text-violet-400 uppercase tracking-widest font-bold">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
            <span>Pyramid AI</span>
          </div>
          <div className="pl-4 border-l-2 border-violet-700/40 text-slate-300 leading-relaxed text-[15px]">
            <ReactMarkdown components={markdownComponents}>{streamingAnswer}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper: Copy button with transient "Copied!" state ── */
function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 bg-[#12131e] border border-[#1e2030] hover:bg-[#181b2a] hover:border-[#2b2d46] transition-all duration-200 px-3 py-1.5 rounded-lg shadow-sm"
    >
      <ClipboardIcon className="w-3.5 h-3.5 text-slate-400" />
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

/* ── Tiny inline SVG icons for action bar ── */
function ClipboardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="2" width="8" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M3 4h1M3 7h1M3 10h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 4.5h6M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function ThumbUpIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 7l2.5-5c.8 0 1.5.7 1.5 1.5V6h3.5a1 1 0 011 1.1l-.7 4.4A1 1 0 0111.8 12H5V7z"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 7H3v5h2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function CircleDotIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}


