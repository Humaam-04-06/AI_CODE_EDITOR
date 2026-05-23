import React from 'react';
import { useEditorStore } from '../store/useEditorStore';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import EditorWrapper from '../components/Editor/EditorWrapper';
import DiffViewer from '../components/DiffViewer/DiffViewer';
import ChatPanel from '../components/ChatPanel/ChatPanel';
import IntentMode from '../components/IntentMode/IntentMode';
import ExplainMyCode from '../components/ExplainMyCode/ExplainMyCode';
import DecisionMemory from '../components/DecisionMemory/DecisionMemory';
import CommandPalette from '../components/CommandPalette/CommandPalette';
import CodeReview from '../components/CodeReview/CodeReview';
import { motion, AnimatePresence } from 'framer-motion';

export default function Editor() {
  const rightPanelMode = useEditorStore(state => state.rightPanelMode);
  const intentResult = useEditorStore(state => state.intentResult);

  // Helper selector to mount appropriate right side drawer component
  const renderRightPanel = () => {
    switch (rightPanelMode) {
      case 'chat':
        return <ChatPanel />;
      case 'intent':
        return <IntentMode />;
      case 'explain':
        return <ExplainMyCode />;
      case 'memory':
        return <DecisionMemory />;
      case 'review':
        return <CodeReview />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans">
      {/* Global Hotkey HUD Search Overlay */}
      <CommandPalette />

      {/* Top Tabs & Tokens Bar */}
      <Navbar />

      {/* Primary Workspace Panels split */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Explorer Sidebar */}
        <Sidebar />

        {/* Center Code Editor view (renders standard Monaco editor or Diff Split) */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-[#1E1E1E]">
          {intentResult ? <DiffViewer /> : <EditorWrapper />}
        </div>

        {/* Right drawer sliding panel */}
        <AnimatePresence mode="wait">
          {rightPanelMode !== 'none' && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="h-full border-l shrink-0 flex flex-col overflow-hidden"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {renderRightPanel()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer shortcut hints indicator */}
      <div 
        className="flex items-center justify-between px-3 h-5 text-[10px] shrink-0 border-t"
        style={{ backgroundColor: 'var(--navbar-color)', borderColor: 'var(--border-color)', color: 'var(--muted-color)' }}
      >
        <div className="flex items-center gap-3">
          <span>✔ Ready</span>
          <span>Ln 1, Col 1</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono bg-white/5 px-1 rounded">Ctrl+Shift+P</span>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  );
}
