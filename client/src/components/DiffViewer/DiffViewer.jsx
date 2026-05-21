import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useEditorStore } from '../../store/useEditorStore';
import { MONACO_THEMES } from '../../themes/themes';

export default function DiffViewer() {
  const theme = useEditorStore(state => state.theme);
  const intentResult = useEditorStore(state => state.intentResult);
  const setIntentResult = useEditorStore(state => state.setIntentResult);
  const updateActiveFileContent = useEditorStore(state => state.updateActiveFileContent);

  const activeFile = useEditorStore(state => {
    if (!state.intentResult) {
      return { content: '', language: '' };
    }
    const file = state.files.find(f => f.id === state.activeFileId);
    return file ? { content: file.content, language: file.language } : { content: '', language: '' };
  }, (prev, next) => prev.content === next.content && prev.language === next.language);

  if (!intentResult) return null;

  const handleAccept = () => {
    // Replace the original content with the refactored code
    updateActiveFileContent(intentResult.refactoredCode);
    // Clear out the refactored cache
    setIntentResult(null);
  };

  const handleReject = () => {
    // Cancel the diff view
    setIntentResult(null);
  };

  const handleEditorDidMount = (editor, monaco) => {
    // Register custom theme presets on mount
    Object.entries(MONACO_THEMES).forEach(([themeName, config]) => {
      monaco.editor.defineTheme(themeName, config);
    });
    monaco.editor.setTheme(theme);
  };

  const diffOptions = {
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 13,
    lineHeight: 20,
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    readOnly: true,
    renderSideBySide: true
  };

  const monacoThemeName = theme === 'dark-plus' ? 'vs-dark' : theme;

  return (
    <div className="flex flex-col h-full w-full select-none overflow-hidden relative">
      {/* 1. Header controls panel */}
      <div 
        className="flex items-center justify-between p-2.5 border-b shrink-0 text-xs"
        style={{ backgroundColor: 'var(--inactive-tab-color)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-code text-[11px]" style={{ color: 'var(--accent-color)' }} />
          <span className="font-bold text-[11px]" style={{ color: 'var(--text-color)' }}>
            Comparing Refactoring Changes
          </span>
        </div>
        
        {/* Floating buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold text-rose-400 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 transition duration-150"
          >
            <i className="fa-solid fa-xmark text-xs" />
            <span>Discard Changes</span>
          </button>
          
          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition duration-150"
          >
            <i className="fa-solid fa-check text-xs" />
            <span>Accept Changes</span>
          </button>
        </div>
      </div>

      {/* 2. Monaco Diff Editor Viewport */}
      <div className="flex-1 h-full w-full select-text">
        <DiffEditor
          original={activeFile.content}
          modified={intentResult.refactoredCode}
          language={activeFile.language}
          theme={monacoThemeName}
          options={diffOptions}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex flex-col items-center justify-center h-full w-full" style={{ backgroundColor: 'var(--bg-color)' }}>
              <div className="h-6 w-6 border-2 border-t-emerald-500 border-emerald-500/20 rounded-full animate-spin mb-2"></div>
              <span className="text-xs text-gray-500">Compiling Diff Viewer Layout...</span>
            </div>
          }
        />
      </div>

      {/* 3. Short explanation details box at bottom */}
      {intentResult.explanation && (
        <div 
          className="border-t p-3 max-h-[140px] overflow-y-auto shrink-0 select-text font-sans text-[11px] leading-relaxed"
          style={{ backgroundColor: 'var(--sidebar-color)', borderColor: 'var(--border-color)' }}
        >
          <span className="font-bold text-white block mb-1">Refactoring Explanations:</span>
          <div className="whitespace-pre-wrap" style={{ color: 'var(--text-color)' }}>
            {intentResult.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
