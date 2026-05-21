import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../store/useEditorStore';
import { THEMES } from '../../themes/themes';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommandPalette() {
  const navigate = useNavigate();
  const setTheme = useEditorStore(state => state.setTheme);
  const clearChatHistory = useEditorStore(state => state.clearChatHistory);
  const setRightPanelMode = useEditorStore(state => state.setRightPanelMode);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const paletteRef = useRef(null);

  // Setup list of available commands
  const commands = [
    // Theme options
    ...THEMES.map(t => ({
      id: `theme-${t.id}`,
      category: 'Themes',
      name: `Switch to ${t.name}`,
      action: () => setTheme(t.id)
    })),
    // Navigations
    { id: 'nav-editor', category: 'Navigation', name: 'Open Workspace Editor', action: () => navigate('/editor') },
    { id: 'nav-settings', category: 'Navigation', name: 'Open Settings Page', action: () => navigate('/settings') },
    { id: 'nav-history', category: 'Navigation', name: 'Open History Dashboard', action: () => navigate('/history') },
    // Sidebar drawers control
    { id: 'drawer-chat', category: 'Workspace', name: 'Open AI Chat Sidebar', action: () => setRightPanelMode('chat') },
    { id: 'drawer-intent', category: 'Workspace', name: 'Open Intent Refactor Mode', action: () => setRightPanelMode('intent') },
    { id: 'drawer-explain', category: 'Workspace', name: 'Open Visual Logic Flowchart', action: () => setRightPanelMode('explain') },
    { id: 'drawer-memory', category: 'Workspace', name: 'Open Decision Memory cards', action: () => setRightPanelMode('memory') },
    // Actions
    { id: 'act-clear', category: 'Utilities', name: 'Clear Active Chat Logs', action: () => clearChatHistory() }
  ];

  // Filter commands by search string
  const filtered = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard shortcut listener for Ctrl+Shift+P / Cmd+Shift+P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsOpen(!isOpen);
        setSearch('');
        setSelectedIndex(0);
      }
      
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  // Click outside to close handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            ref={paletteRef}
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden glass-panel-heavy"
          >
            {/* Search Input bar */}
            <div className="flex items-center px-4 py-3.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <i className="fa-solid fa-magnifying-glass mr-3 shrink-0" style={{ color: 'var(--muted-color)' }} />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
                placeholder="Search commands (e.g. theme, settings)..."
                className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-500 font-sans"
              />
              <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded border text-[10px] uppercase font-mono tracking-wider" style={{ borderColor: 'var(--border-color)', color: 'var(--muted-color)' }}>
                ESC
              </div>
            </div>

            {/* Commands search result lists */}
            <div className="max-h-[300px] overflow-y-auto p-2 space-y-0.5">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs" style={{ color: 'var(--muted-color)' }}>
                  No matching command functions found.
                </div>
              ) : (
                filtered.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => { cmd.action(); setIsOpen(false); }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-xs transition duration-150 animate-fade-in"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        color: isSelected ? 'var(--accent-color)' : 'var(--text-color)'
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <i className="fa-solid fa-terminal shrink-0" style={{ color: isSelected ? 'var(--accent-color)' : 'var(--muted-color)' }} />
                        <span className="truncate">{cmd.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold opacity-60 bg-white/5 shrink-0" style={{ color: 'var(--muted-color)' }}>
                        {cmd.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard usage helper */}
            <div 
              className="flex items-center justify-between px-4 py-2 text-[10px] border-t"
              style={{ backgroundColor: 'var(--navbar-color)', borderColor: 'var(--border-color)', color: 'var(--muted-color)' }}
            >
              <div className="flex items-center gap-1.5">
                <span>↑↓ navigate</span>
                <span>•</span>
                <span>enter select</span>
              </div>
              <div className="flex items-center gap-1">
                <i className="fa-solid fa-fire text-amber-500" />
                <span>Command HUD Panel</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
