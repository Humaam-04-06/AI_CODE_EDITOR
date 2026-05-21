import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { requestIntentRefactor } from '../../utils/ai';

export default function IntentMode() {
  const isProcessing = useEditorStore(state => state.isProcessing);
  const intentResult = useEditorStore(state => state.intentResult);
  const setProcessing = useEditorStore(state => state.setProcessing);
  const setIntentResult = useEditorStore(state => state.setIntentResult);

  const activeFileName = useEditorStore(state => {
    const file = state.files.find(f => f.id === state.activeFileId);
    return file ? file.name : '';
  });

  const [selectedIntent, setSelectedIntent] = useState('performance');

  const intents = [
    { id: 'performance', label: 'Performance', iconClass: 'fa-solid fa-fire text-amber-500', desc: 'Optimize code loops, execution speed, and compute lag.' },
    { id: 'scalability', label: 'Scalability', iconClass: 'fa-solid fa-network-wired text-sky-400', desc: 'Refactor code to be highly modular, asynchronous, and robust.' },
    { id: 'readability', label: 'Readability', iconClass: 'fa-solid fa-book-open-reader text-emerald-400', desc: 'Add verbose comments, adjust style schemas, and format code names.' },
    { id: 'optimization', label: 'Optimization', iconClass: 'fa-solid fa-compress text-indigo-400', desc: 'Reduce bundle size, clean unused variables, and compress lines.' }
  ];

  const handleApplyIntent = async () => {
    if (isProcessing) return;

    setProcessing(true);
    setIntentResult(null);

    const activeFile = useEditorStore.getState().getActiveFile();
    const { provider, apiKey, memoryCards } = useEditorStore.getState();

    try {
      const result = await requestIntentRefactor({
        provider,
        apiKey,
        code: activeFile.content,
        intent: selectedIntent,
        language: activeFile.language,
        memory: memoryCards
      });

      setIntentResult(result);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to complete refactoring run.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-text" style={{ backgroundColor: 'var(--sidebar-color)' }}>
      {/* 1. Header */}
      <div 
        className="flex items-center gap-2 p-3 border-b shrink-0" 
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--navbar-color)' }}
      >
        <i className="fa-solid fa-bolt text-blue-500 animate-pulse-slow" />
        <span className="font-bold text-xs">Intent Refactoring Engine</span>
      </div>

      {/* 2. Selection view */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted-color)' }}>
          Select an optimization objective for <b>{activeFileName}</b> and run the AI-assisted refactoring compiler:
        </p>

        {/* Intent selectors list */}
        <div className="space-y-2">
          {intents.map(item => {
            const isSelected = selectedIntent === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIntent(item.id)}
                className="flex items-start gap-3 w-full p-3 rounded-xl border text-left transition duration-200"
                style={{
                  borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                }}
              >
                <div 
                  className="p-1.5 rounded-lg border mt-0.5 flex items-center justify-center h-7 w-7"
                  style={{ 
                    borderColor: 'var(--border-color)', 
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent'
                  }}
                >
                  <i className={`${item.iconClass} text-xs`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white mb-0.5">{item.label}</h4>
                  <p className="text-[10px] leading-normal" style={{ color: 'var(--muted-color)' }}>
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Apply trigger button */}
        {!intentResult && (
          <button
            onClick={handleApplyIntent}
            disabled={isProcessing}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide text-white transition duration-200 flex items-center justify-center gap-2 ${
              isProcessing
                ? 'bg-blue-600/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/10'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Executing intent compiler...</span>
              </>
            ) : (
              <span>Optimize Active File</span>
            )}
          </button>
        )}

        {/* Short info success state if already optimized */}
        {intentResult && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] leading-relaxed flex gap-2">
            <i className="fa-solid fa-circle-check text-emerald-400 text-sm shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 text-white">Refactoring ready!</span>
              Compare modifications in the center workspace pane and accept changes when ready.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
