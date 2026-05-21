import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/useEditorStore';

export default function History() {
  const navigate = useNavigate();
  const chatHistory = useEditorStore(state => state.chatHistory);
  const clearChatHistory = useEditorStore(state => state.clearChatHistory);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all historical session conversation logs?')) {
      clearChatHistory();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0D19] overflow-hidden text-xs select-text font-sans">
      
      {/* 1. Header Bar */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-[#0E1120]"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/editor')}
            className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition shrink-0 flex items-center justify-center h-7 w-7"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-amber-500 text-sm" />
            <span className="font-bold text-sm text-white">Historical Conversations Timeline</span>
          </div>
        </div>

        {chatHistory.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold text-rose-400 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition duration-150"
          >
            <i className="fa-regular fa-trash-can text-xs" />
            <span>Clear Timeline</span>
          </button>
        )}
      </div>

      {/* 2. Timeline display block */}
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full select-text">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col h-full justify-center items-center text-center p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-1 animate-pulse-slow">
              <i className="fa-solid fa-clock-rotate-left text-base" />
            </div>
            <div className="space-y-1 max-w-[200px]">
              <h4 className="text-xs font-bold text-white">Timeline is Empty</h4>
              <p className="text-[10px] leading-normal" style={{ color: 'var(--muted-color)' }}>
                Conversations you hold in the workspace chat drawer will be indexed here.
              </p>
            </div>
            <button
              onClick={() => navigate('/editor')}
              className="py-1.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider transition"
            >
              Go to Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-[10.5px] leading-relaxed mb-4" style={{ color: 'var(--muted-color)' }}>
              Below is a record of current active conversational steps. You can review instructions and restore code blocks when necessary:
            </p>

            <div className="relative border-l border-gray-800 ml-3 pl-6 space-y-6">
              {chatHistory.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={index} className="relative group">
                    
                    {/* Glowing timeline dot indicator */}
                    <div 
                      className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center bg-[#0B0D19]"
                      style={{ 
                        borderColor: isUser ? 'var(--accent-color)' : 'var(--border-color)',
                        boxShadow: isUser ? '0 0 8px var(--accent-color)' : 'none'
                      }}
                    />

                    {/* Timeline Item Content Box */}
                    <div 
                      className="p-4 rounded-xl border space-y-2 relative"
                      style={{ 
                        borderColor: 'var(--border-color)',
                        backgroundColor: 'rgba(255,255,255,0.01)'
                      }}
                    >
                      <div className="flex justify-between items-center text-[10px]" style={{ color: 'var(--muted-color)' }}>
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                          {isUser ? (
                            <>
                              <i className="fa-regular fa-file-lines text-blue-400 text-xs animate-pulse-slow" />
                              <span className="text-blue-400">User Query Input</span>
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-robot text-amber-500 text-xs animate-pulse-slow" />
                              <span className="text-amber-500">AI Response</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="fa-regular fa-calendar text-xs" />
                          <span>Active Session</span>
                        </div>
                      </div>

                      <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-gray-200">
                        {msg.content || '[Empty message value or pending streaming response]'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
