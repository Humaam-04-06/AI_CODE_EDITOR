import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { streamChatCompletions } from '../../utils/ai';
import { motion, AnimatePresence } from 'framer-motion';

// --- GOOGLE ANTIGRAVITY STATUSES ---
const loaderStatuses = [
  "Synthesizing logical parameters...",
  "Calibrating neural attention...",
  "Defying computational gravity...",
  "Structuring intelligence matrices..."
];

// --- CUSTOM HIGH-FIDELITY RENDERER COMPONENTS ---

// A copy-friendly syntax-highlighted code block component with macOS styling
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-2xl border border-white/10 overflow-hidden bg-[#070913]/90 shadow-2xl shadow-black/45 backdrop-blur-md transition-all duration-300 hover:shadow-purple-500/5 group select-text">
      {/* Top Header Row representing premium macOS terminal pane */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1020]/95 border-b border-white/5 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 block" />
          <span className="text-[10px] font-mono text-gray-500 ml-2.5 uppercase font-bold tracking-wider">{language || 'code'}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-white transition duration-200 py-1 px-2.5 rounded bg-white/5 hover:bg-white/10"
        >
          {copied ? (
            <>
              <i className="fa-solid fa-check text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <i className="fa-regular fa-copy" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-gray-200 whitespace-pre scrollbar-thin leading-relaxed font-mono text-[11px] bg-black/20">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Inline formatting parser for bold (**bold**), italics (*italic*), and inline code (`code`)
function parseInlineFormatting(text) {
  if (!text) return '';
  
  // Rule 1: Inline code blocks: `code`
  let parts = text.split(/(`.*?`)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-mono text-[10px] text-indigo-300 mx-0.5 font-semibold">
          {part.slice(1, -1)}
        </code>
      );
    }
    
    // Rule 2: Bold blocks: **text**
    let subParts = part.split(/(\*\*.*?\*\*)/g);
    return subParts.map((subPart, subIdx) => {
      if (subPart.startsWith('**') && subPart.endsWith('**')) {
        return (
          <strong key={`${index}-${subIdx}`} className="font-bold text-white bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
            {subPart.slice(2, -2)}
          </strong>
        );
      }
      
      // Rule 3: Italic blocks: *text* or _text_
      let italicParts = subPart.split(/(\*.*?\*|__.*?__)/g);
      return italicParts.map((itPart, itIdx) => {
        if ((itPart.startsWith('*') && itPart.endsWith('*')) || (itPart.startsWith('__') && itPart.endsWith('__'))) {
          const content = itPart.startsWith('__') ? itPart.slice(2, -2) : itPart.slice(1, -1);
          return (
            <em key={`${index}-${subIdx}-${itIdx}`} className="italic text-gray-300">
              {content}
            </em>
          );
        }
        return itPart;
      });
    });
  });
}

// Render markdown tables beautifully
function renderMarkdownTable(lines) {
  const rows = lines.map(line => {
    return line.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
  });
  
  if (rows.length < 2) return null;
  
  const headers = rows[0];
  const bodyRows = rows.slice(2); // Skip header and separator row
  
  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-white/5 bg-black/10 backdrop-blur-md shadow-lg select-text">
      <table className="min-w-full divide-y divide-white/5 text-[11px]">
        <thead className="bg-white/[0.02]">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-bold text-gray-300 uppercase tracking-wider">
                {parseInlineFormatting(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-gray-300">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.01] transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap">
                  {parseInlineFormatting(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Section parser rendering blocks of paragraphs, lists, tables and headers
function TextSection({ text }) {
  if (!text.trim()) return null;
  const lines = text.split('\n');

  const renderedElements = [];
  let tableLines = [];
  let isInsideTable = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // Table parsing state machine
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      isInsideTable = true;
      tableLines.push(line);
      continue;
    } else if (isInsideTable) {
      const tableElement = renderMarkdownTable(tableLines);
      if (tableElement) {
        renderedElements.push(tableElement);
      }
      tableLines = [];
      isInsideTable = false;
    }

    // 1. Headers
    if (trimmed.startsWith('### ')) {
      renderedElements.push(
        <h4 key={idx} className="text-xs font-bold text-white mt-4 mb-1 uppercase tracking-wider text-purple-400/90 flex items-center gap-1.5 select-text">
          <i className="fa-solid fa-terminal text-[9px]" />
          {parseInlineFormatting(trimmed.substring(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      renderedElements.push(
        <h3 key={idx} className="text-[12.5px] font-extrabold text-white mt-5 mb-1.5 bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-400 bg-clip-text text-transparent select-text">
          {parseInlineFormatting(trimmed.substring(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      renderedElements.push(
        <h2 key={idx} className="text-sm font-black text-white mt-6 mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent border-b border-white/5 pb-1 select-text">
          {parseInlineFormatting(trimmed.substring(2))}
        </h2>
      );
      continue;
    }

    // 2. Blockquote
    if (trimmed.startsWith('> ')) {
      renderedElements.push(
        <div key={idx} className="my-2.5 p-3.5 rounded-xl border-l-4 border-indigo-500/80 bg-[#12162a]/65 text-gray-300 italic text-[11px] leading-relaxed backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.05)] border border-white/5 select-text">
          {parseInlineFormatting(trimmed.substring(2))}
        </div>
      );
      continue;
    }

    // 3. Unordered lists with gravity diamond bullets
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      renderedElements.push(
        <div key={idx} className="flex items-start my-1.5 pl-2 select-text">
          <i className="fa-solid fa-diamond text-[5px] text-purple-400 mt-2 shrink-0 mr-2.5 animate-pulse" />
          <div className="text-[11.5px] leading-relaxed text-gray-300">
            {parseInlineFormatting(trimmed.substring(2))}
          </div>
        </div>
      );
      continue;
    }

    // 4. Ordered lists with technical count indicators
    const matchOrdered = trimmed.match(/^(\d+)\.\s(.*)/);
    if (matchOrdered) {
      renderedElements.push(
        <div key={idx} className="flex items-start my-1.5 pl-2 select-text">
          <span className="text-[9px] font-mono font-black text-indigo-400 mr-2.5 bg-indigo-500/10 px-1.5 py-0.5 rounded leading-none">
            {matchOrdered[1]}
          </span>
          <div className="text-[11.5px] leading-relaxed text-gray-300">
            {parseInlineFormatting(matchOrdered[2])}
          </div>
        </div>
      );
      continue;
    }

    // 5. Default paragraphs
    if (line.trim() !== '') {
      renderedElements.push(
        <p key={idx} className="text-[11.5px] leading-relaxed text-gray-300/90 my-1 font-sans select-text">
          {parseInlineFormatting(line)}
        </p>
      );
    }
  }

  // Handle trailing table lines
  if (isInsideTable && tableLines.length > 0) {
    const tableElement = renderMarkdownTable(tableLines);
    if (tableElement) {
      renderedElements.push(tableElement);
    }
  }

  return <div className="space-y-1.5">{renderedElements}</div>;
}

// Primary Markdown Parser
function MarkdownMessage({ content }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-3 font-sans select-text">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2].trim() : part.replace(/```/g, '').trim();
          return <CodeBlock key={index} code={code} language={lang} />;
        } else {
          return <TextSection key={index} text={part} />;
        }
      })}
    </div>
  );
}

// Mesmerizing Antigravity Quantum Loader
function QuantumLoader() {
  const [statusIdx, setStatusIdx] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx(prev => (prev + 1) % loaderStatuses.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-3.5 w-full py-3 bg-[#0d1020]/40 border border-indigo-500/10 rounded-2xl p-4 backdrop-blur-md shadow-lg shadow-black/25 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Gravitational floating dot indicator */}
          <div className="relative flex h-3.5 w-3.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]"></span>
          </div>
          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider animate-pulse">
            {loaderStatuses[statusIdx]}
          </span>
        </div>
        <span className="text-[9px] font-mono text-gray-500">Antigravity V2.5</span>
      </div>
      
      {/* Gradient Wave Shimmer loading track */}
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative shadow-inner">
        <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-shimmer-loading"></div>
      </div>
    </div>
  );
}

// --- MAIN CHAT PANEL COMPONENT ---

export default function ChatPanel() {
  const provider = useEditorStore(state => state.provider);
  const apiKey = useEditorStore(state => state.apiKey);
  const chatHistory = useEditorStore(state => state.chatHistory);
  const memoryCards = useEditorStore(state => state.memoryCards);
  
  const addChatMessage = useEditorStore(state => state.addChatMessage);
  const updateLastChatMessage = useEditorStore(state => state.updateLastChatMessage);
  const clearChatHistory = useEditorStore(state => state.clearChatHistory);
  const addTokens = useEditorStore(state => state.addTokens);

  // Arena selectors
  const isArenaMode = useEditorStore(state => state.isArenaMode);
  const setArenaMode = useEditorStore(state => state.setArenaMode);
  const arenaResponses = useEditorStore(state => state.arenaResponses);
  const setArenaResponses = useEditorStore(state => state.setArenaResponses);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);

  // Web Speech API Voice Transcription
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please try Google Chrome or Microsoft Edge!");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Scroll to bottom on history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async (messageText = input) => {
    const text = messageText.trim();
    if (!text || isStreaming) return;

    setInput('');
    addChatMessage('user', text);
    setIsStreaming(true);

    const history = [...chatHistory, { role: 'user', content: text }];

    if (isArenaMode) {
      // 1. Initialize split response states
      setArenaResponses({
        pro: '',
        flash: '',
        proStats: { loading: true, latency: 0, speed: 0, tokens: 0 },
        flashStats: { loading: true, latency: 0, speed: 0, tokens: 0 }
      });

      // Place a placeholder assistant message in standard chat logs
      addChatMessage('assistant', '🤖 Arena responses active. Side-by-side details shown below.');

      const startTime = Date.now();
      let proTokens = 0;
      let flashTokens = 0;

      try {
        // Stream Flash (Speed model)
        const flashPromise = streamChatCompletions({
          provider: 'gemini-2.5-flash',
          apiKey,
          messages: history,
          memory: memoryCards,
          onToken: (token) => {
            flashTokens++;
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? (flashTokens / elapsed).toFixed(1) : 0;
            setArenaResponses(prev => ({
              ...prev,
              flash: prev.flash + token,
              flashStats: { loading: true, latency: Math.round(Date.now() - startTime), speed, tokens: flashTokens }
            }));
          },
          onDone: () => {
            setArenaResponses(prev => ({
              ...prev,
              flashStats: { ...prev.flashStats, loading: false }
            }));
          },
          onError: (err) => {
            setArenaResponses(prev => ({
              ...prev,
              flash: prev.flash + `\n⚠️ Error: ${err.message}`,
              flashStats: { ...prev.flashStats, loading: false }
            }));
          }
        });

        // Stream Pro (Precision model)
        const proPromise = streamChatCompletions({
          provider: 'gemini-2.5-pro',
          apiKey,
          messages: history,
          memory: memoryCards,
          onToken: (token) => {
            proTokens++;
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = elapsed > 0 ? (proTokens / elapsed).toFixed(1) : 0;
            setArenaResponses(prev => ({
              ...prev,
              pro: prev.pro + token,
              proStats: { loading: true, latency: Math.round(Date.now() - startTime), speed, tokens: proTokens }
            }));
          },
          onDone: () => {
            setArenaResponses(prev => ({
              ...prev,
              proStats: { ...prev.proStats, loading: false }
            }));
          },
          onError: (err) => {
            setArenaResponses(prev => ({
              ...prev,
              pro: prev.pro + `\n⚠️ Error: ${err.message}`,
              proStats: { ...prev.proStats, loading: false }
            }));
          }
        });

        Promise.all([flashPromise, proPromise]).finally(() => {
          setIsStreaming(false);
          addTokens(proTokens + flashTokens);
        });

      } catch (err) {
        console.error("Arena Launch Error:", err);
        setIsStreaming(false);
      }
    } else {
      // Standard Single Chat Stream
      addChatMessage('assistant', '');
      try {
        let tokenCounter = 0;
        await streamChatCompletions({
          provider,
          apiKey,
          messages: history,
          memory: memoryCards,
          onToken: (token) => {
            tokenCounter++;
            updateLastChatMessage(getLatestAssistantContent() + token);
          },
          onDone: () => {
            setIsStreaming(false);
            addTokens(tokenCounter);
          },
          onError: (err) => {
            console.error(err);
            updateLastChatMessage("⚠️ [Error]: " + (err.message || "Failed to communicate with LLM API."));
            setIsStreaming(false);
          }
        });
      } catch (e) {
        console.error(e);
        setIsStreaming(false);
      }
    }
  };

  const getLatestAssistantContent = () => {
    const history = useEditorStore.getState().chatHistory;
    if (history.length === 0) return '';
    return history[history.length - 1].content;
  };

  const handleTemplateClick = (type) => {
    if (isStreaming) return;
    
    const activeFile = useEditorStore.getState().getActiveFile();
    const promptMap = {
      explain: `Explain the following code block, highlight potential bugs, and outline its logical execution:\n\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``,
      optimize: `Optimize the following code block for computational speed and efficiency. Outline which sections were optimized:\n\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``,
      tests: `Write comprehensive unit tests for the following code block in its corresponding language framework:\n\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``,
      errors: `Add strong robust error handling, safety bounds, and validation checks to the following code:\n\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``
    };

    handleSend(promptMap[type]);
  };

  const templates = [
    { type: 'explain', label: 'Explain Code', desc: 'Logic flowchart & bug diagnostics', iconClass: 'fa-solid fa-code text-blue-400' },
    { type: 'optimize', label: 'Optimize File', desc: 'Boost execution & space complexity', iconClass: 'fa-solid fa-rocket text-emerald-400' },
    { type: 'tests', label: 'Write Tests', desc: 'Establish robust unit diagnostics', iconClass: 'fa-solid fa-flask text-amber-400' },
    { type: 'errors', label: 'Handle Errors', desc: 'Inject validation & crash guards', iconClass: 'fa-solid fa-shield-halved text-rose-400' }
  ];

  // Helper mapping database provider labels to premium human-readable chips
  const getModelDisplayName = (providerName) => {
    if (!providerName) return 'Gemini 2.5 Flash';
    const name = providerName.toLowerCase();
    if (name.includes('flash-lite')) return 'Gemini 2.5 Flash-Lite';
    if (name.includes('flash')) return 'Gemini 2.5 Flash';
    if (name.includes('pro')) return 'Gemini 2.5 Pro';
    return providerName;
  };

  return (
    <div className="flex flex-col h-full w-full select-text bg-[#0a0d16]" style={{ backgroundColor: 'var(--sidebar-color)' }}>
      {/* 1. Chat Header */}
      <div 
        className="flex items-center justify-between p-3.5 border-b shrink-0 select-none shadow-md shadow-black/15 z-10 backdrop-blur-md" 
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--navbar-color)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <i className="fa-solid fa-wand-magic-sparkles text-[11px] text-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">Antigravity AI</span>
            
            {/* Pulsating status model badge */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold tracking-wide lowercase">{getModelDisplayName(provider)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setArenaMode(!isArenaMode)}
            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-[10px] ${
              isArenaMode 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'hover:bg-white/5 text-gray-400 hover:text-white'
            }`}
            title="Toggle split Arena Mode (Gemini Pro vs Flash)"
          >
            <i className="fa-solid fa-square-poll-horizontal text-xs" />
            <span className="hidden xs:inline font-bold">Arena</span>
          </button>

          {chatHistory.length > 0 && (
            <button 
              onClick={clearChatHistory}
              className="p-1.5 rounded-lg hover:bg-white/5 hover:text-rose-400 transition-all duration-200 flex items-center justify-center text-gray-400"
              title="Clear Chat Logs"
            >
              <i className="fa-regular fa-trash-can text-[11px]" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin select-text">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col h-full justify-center items-center text-center p-4">
            {/* Custom Spinning Gravitational Well Ornament */}
            <div className="relative mb-6 flex items-center justify-center select-none">
              <div className="absolute w-16 h-16 rounded-full border border-dashed border-indigo-500/20 animate-spin-slow" />
              <div className="absolute w-12 h-12 rounded-full border border-purple-500/30 animate-pulse-slow" />
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20">
                <i className="fa-solid fa-wand-magic-sparkles text-sm animate-pulse" />
              </div>
            </div>
            
            <h4 className="text-[12px] font-extrabold text-white mb-1.5 tracking-wider uppercase bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
              Antigravity Code Companion
            </h4>
            <p className="text-[11px] max-w-[240px] leading-relaxed mb-6 text-gray-400/90">
              A state-of-the-art developer intelligence engine. Defy algorithmic complexity, optimize instantly, and resolve bugs with Gemini:
            </p>
            
            {/* Quick Prompt Templates list */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-[300px]">
              {templates.map(t => (
                <button
                  key={t.type}
                  onClick={() => handleTemplateClick(t.type)}
                  className="flex flex-col items-start p-3 rounded-2xl border border-white/5 bg-white/[0.01] text-left transition-all duration-200 hover:border-purple-500/30 hover:bg-white/[0.03] hover:shadow-lg hover:shadow-purple-500/5 group"
                >
                  <div className="flex items-center gap-1.5">
                    <i className={`${t.iconClass} text-[10px]`} />
                    <span className="font-extrabold text-[10px] text-white group-hover:text-purple-300 transition">{t.label}</span>
                  </div>
                  <span className="text-[8.5px] leading-normal mt-1 text-gray-500 group-hover:text-gray-400 transition">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {chatHistory.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLatestAssistant = !isUser && index === chatHistory.length - 1;

                if (isArenaMode && isLatestAssistant) {
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col w-full gap-4 mt-2"
                    >
                      <div className="flex gap-2.5 items-center select-none pl-1">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
                          <i className="fa-solid fa-square-poll-horizontal text-[10px] text-white animate-pulse" />
                        </div>
                        <span className="font-extrabold text-[9px] text-purple-300 uppercase tracking-wider">Antigravity Dual AI Arena</span>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full select-text font-sans">
                        {/* Gemini 2.5 Flash column */}
                        <div className="rounded-2xl border border-emerald-500/20 bg-[#0a0d16]/95 p-4 shadow-xl relative overflow-hidden flex flex-col min-h-[300px]">
                          <div className="absolute top-0 bottom-0 left-0 w-[2.5px] bg-[#10b981]" />
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 select-none">
                            <div className="flex items-center gap-1.5">
                              <i className="fa-solid fa-rocket text-[#10b981] text-xs" />
                              <span className="font-extrabold text-[10px] text-white">Gemini 2.5 Flash</span>
                              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase">Speed</span>
                            </div>
                            {arenaResponses.flashStats?.loading && <i className="fa-solid fa-spinner animate-spin text-[10px] text-[#10b981]" />}
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 mb-3 bg-white/[0.02] p-1.5 rounded-xl border border-white/5 font-mono text-[8.5px] text-gray-500 text-center select-none">
                            <div>
                              <div>Latency</div>
                              <div className="text-[9.5px] text-white font-bold mt-0.5">{arenaResponses.flashStats?.latency || 0}ms</div>
                            </div>
                            <div>
                              <div>Speed</div>
                              <div className="text-[9.5px] text-emerald-400 font-bold mt-0.5">{arenaResponses.flashStats?.speed || 0} t/s</div>
                            </div>
                            <div>
                              <div>Generated</div>
                              <div className="text-[9.5px] text-white font-bold mt-0.5">{arenaResponses.flashStats?.tokens || 0} tok</div>
                            </div>
                          </div>

                          <div className="flex-1 text-[11px] leading-relaxed text-gray-300">
                            {arenaResponses.flashStats?.loading && !arenaResponses.flash ? (
                              <QuantumLoader />
                            ) : (
                              <MarkdownMessage content={arenaResponses.flash || 'Initializing stream...'} />
                            )}
                          </div>
                        </div>

                        {/* Gemini 2.5 Pro column */}
                        <div className="rounded-2xl border border-blue-500/20 bg-[#0a0d16]/95 p-4 shadow-xl relative overflow-hidden flex flex-col min-h-[300px]">
                          <div className="absolute top-0 bottom-0 left-0 w-[2.5px] bg-[#3b82f6]" />
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 select-none">
                            <div className="flex items-center gap-1.5">
                              <i className="fa-solid fa-brain text-[#3b82f6] text-xs" />
                              <span className="font-extrabold text-[10px] text-white">Gemini 2.5 Pro</span>
                              <span className="text-[8px] bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase">Precision</span>
                            </div>
                            {arenaResponses.proStats?.loading && <i className="fa-solid fa-spinner animate-spin text-[10px] text-[#3b82f6]" />}
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 mb-3 bg-white/[0.02] p-1.5 rounded-xl border border-white/5 font-mono text-[8.5px] text-gray-500 text-center select-none">
                            <div>
                              <div>Latency</div>
                              <div className="text-[9.5px] text-white font-bold mt-0.5">{arenaResponses.proStats?.latency || 0}ms</div>
                            </div>
                            <div>
                              <div>Speed</div>
                              <div className="text-[9.5px] text-blue-400 font-bold mt-0.5">{arenaResponses.proStats?.speed || 0} t/s</div>
                            </div>
                            <div>
                              <div>Generated</div>
                              <div className="text-[9.5px] text-white font-bold mt-0.5">{arenaResponses.proStats?.tokens || 0} tok</div>
                            </div>
                          </div>

                          <div className="flex-1 text-[11px] leading-relaxed text-gray-300">
                            {arenaResponses.proStats?.loading && !arenaResponses.pro ? (
                              <QuantumLoader />
                            ) : (
                              <MarkdownMessage content={arenaResponses.pro || 'Initializing stream...'} />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {isUser ? (
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 bg-[#1e233d]/60 border border-indigo-500/20 text-gray-100 text-[11.5px] leading-relaxed shadow-lg shadow-black/15 backdrop-blur-sm select-text">
                        <div className="flex items-center gap-1.5 mb-1.5 select-none">
                          <i className="fa-solid fa-circle-user text-[10px] text-sky-400" />
                          <div className="font-extrabold text-[9px] tracking-wider uppercase text-sky-400">Developer</div>
                        </div>
                        <div className="whitespace-pre-wrap font-sans font-medium">{msg.content}</div>
                      </div>
                    ) : (
                      <div className="flex gap-3 items-start w-full max-w-[95%]">
                        {/* Premium Glowing AI avatar container */}
                        <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-500/10 select-none">
                          <i className="fa-solid fa-wand-magic-sparkles text-[10px] animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0 rounded-2xl px-4 py-3.5 bg-white/[0.02] border border-white/[0.04] backdrop-blur-md text-gray-200 shadow-xl shadow-black/20 select-text relative overflow-hidden group">
                          {/* Accent Gradient Border Effect */}
                          <div className="absolute top-0 bottom-0 left-0 w-[2.5px] bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500" />
                          
                          <div className="flex items-center justify-between mb-2 select-none">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[9px] tracking-wider uppercase text-purple-300">Antigravity AI</span>
                            </div>
                            <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded uppercase">Response</span>
                          </div>
                          
                          {msg.content === '' && isStreaming && index === chatHistory.length - 1 ? (
                            <QuantumLoader />
                          ) : (
                            <div className="select-text">
                              <MarkdownMessage content={msg.content} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* 3. Message Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3.5 border-t bg-[#080a12]/95 backdrop-blur-lg flex gap-2.5 shrink-0 select-none z-10"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder={isListening ? "🎙️ Listening natively (speak now)..." : "Ask a coding question..."}
            className="w-full bg-[#101322] border border-white/5 rounded-2xl pl-4 pr-11 py-3 text-white text-[11.5px] placeholder-gray-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/10 transition-all duration-300 shadow-inner font-sans"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`absolute right-3.5 p-1.5 rounded-xl transition duration-350 flex items-center justify-center ${
              isListening 
                ? 'text-rose-400 bg-rose-500/15 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' 
                : 'text-gray-500 hover:text-purple-400 hover:bg-white/5'
            }`}
            title="Voice Command Input (Vocal Refactor)"
          >
            {isListening ? (
              <i className="fa-solid fa-microphone-lines text-xs text-rose-400" />
            ) : (
              <i className="fa-solid fa-microphone text-xs" />
            )}
          </button>
        </div>
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="p-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:from-gray-800/40 disabled:to-gray-800/20 disabled:text-gray-600 transition-all duration-300 flex items-center justify-center shadow-lg shadow-purple-500/10"
        >
          <i className="fa-regular fa-paper-plane text-xs" />
        </button>
      </form>
    </div>
  );
}
