import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useEditorStore } from '../../store/useEditorStore';
import { MONACO_THEMES } from '../../themes/themes';

const EDITOR_OPTIONS = {
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: 13,
  lineHeight: 20,
  padding: { top: 12, bottom: 12 },
  minimap: { enabled: false },
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  fontLigatures: true,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  tabSize: 2,
  wordWrap: 'on'
};


export default function EditorWrapper() {
  const theme = useEditorStore(state => state.theme);
  const activeFileId = useEditorStore(state => state.activeFileId);
  const updateActiveFileContent = useEditorStore(state => state.updateActiveFileContent);
  const getActiveFile = useEditorStore(state => state.getActiveFile);

  const editorRef = useRef(null);

  const activeFile = useMemo(() => {
    return getActiveFile();
  }, [activeFileId, getActiveFile]);

  // Keep editor content in sync with external changes (e.g. AI refactoring / accepts)
  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const currentValue = editor.getValue();
      if (currentValue !== activeFile.content) {
        editor.setValue(activeFile.content || '');
      }
    }
  }, [activeFile.content]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Dynamically define all our custom premium Monaco themes
    Object.entries(MONACO_THEMES).forEach(([themeName, config]) => {
      monaco.editor.defineTheme(themeName, config);
    });

    // Explicitly set the active theme on launch
    monaco.editor.setTheme(theme === 'dark-plus' ? 'vs-dark' : theme);
  }, [theme]);

  const handleEditorChange = useCallback((value) => {
    updateActiveFileContent(value || '');
  }, [updateActiveFileContent]);

  // Map our UI themes to Monaco theme strings
  const monacoThemeName = theme === 'dark-plus' ? 'vs-dark' : theme;

  return (
    <div className="flex-1 h-full w-full overflow-hidden select-text">
      <MonacoEditor
        key={activeFileId}
        height="100%"
        width="100%"
        language={activeFile.language}
        theme={monacoThemeName}
        defaultValue={activeFile.content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={EDITOR_OPTIONS}
        loading={
          <div className="flex flex-col items-center justify-center h-full w-full" style={{ backgroundColor: 'var(--bg-color)' }}>
            <div className="h-6 w-6 border-2 border-t-blue-500 border-blue-500/20 rounded-full animate-spin mb-2"></div>
            <span className="text-xs text-gray-500">Compiling Monaco Syntax Engine...</span>
          </div>
        }
      />
    </div>
  );
}
