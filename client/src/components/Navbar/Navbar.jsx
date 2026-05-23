import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../store/useEditorStore';
import { THEMES } from '../../themes/themes';

const filesEquality = (prev, next) => {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id || prev[i].name !== next[i].name || prev[i].language !== next[i].language) {
      return false;
    }
  }
  return true;
};

export default function Navbar() {
  const navigate = useNavigate();
  
  const files = useEditorStore(state => state.files, filesEquality);
  const activeFileId = useEditorStore(state => state.activeFileId);
  const setActiveFile = useEditorStore(state => state.setActiveFile);
  const deleteFile = useEditorStore(state => state.deleteFile);
  const theme = useEditorStore(state => state.theme);
  const setTheme = useEditorStore(state => state.setTheme);
  const tokensUsed = useEditorStore(state => state.tokensUsed);

  // New store integrations for programmatic menu control
  const triggerOpenFolder = useEditorStore(state => state.triggerOpenFolder);
  const setShowAddInput = useEditorStore(state => state.setShowAddInput);
  const saveStatus = useEditorStore(state => state.saveStatus);
  const setSaveStatus = useEditorStore(state => state.setSaveStatus);
  const closeFolder = useEditorStore(state => state.closeFolder);
  const rightPanelMode = useEditorStore(state => state.rightPanelMode);
  const setRightPanelMode = useEditorStore(state => state.setRightPanelMode);
  const setValidated = useEditorStore(state => state.setValidated);

  // Time Travel Snapshots
  const historySnapshots = useEditorStore(state => state.historySnapshots);
  const createSnapshot = useEditorStore(state => state.createSnapshot);
  const restoreSnapshot = useEditorStore(state => state.restoreSnapshot);

  // Dropdown toggles
  const [activeMenu, setActiveMenu] = useState(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [activeSnapIndex, setActiveSnapIndex] = useState(0);

  // Sync slider index when new snapshots are pushed
  useEffect(() => {
    if (historySnapshots.length > 0) {
      setActiveSnapIndex(0);
    }
  }, [historySnapshots.length]);

  const handleSliderChange = (idx) => {
    setActiveSnapIndex(idx);
    const snap = historySnapshots[idx];
    if (snap) {
      restoreSnapshot(snap.id);
      setSaveStatus({ 
        show: true, 
        message: `Time-Traveled to: ${snap.timestamp} (${snap.description})`, 
        type: 'success' 
      });
      setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 2000);
    }
  };

  const fileMenuRef = useRef(null);
  const editMenuRef = useRef(null);
  const viewMenuRef = useRef(null);
  const helpMenuRef = useRef(null);
  const themeRef = useRef(null);

  const activeTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  // Close menus on clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (themeRef.current && themeRef.current.contains(e.target)) return;
      if (
        (fileMenuRef.current && fileMenuRef.current.contains(e.target)) ||
        (editMenuRef.current && editMenuRef.current.contains(e.target)) ||
        (viewMenuRef.current && viewMenuRef.current.contains(e.target)) ||
        (helpMenuRef.current && helpMenuRef.current.contains(e.target))
      ) {
        return;
      }
      setActiveMenu(null);
      setShowThemePicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Save File executor (Native Electron write-to-disk or clean Web browser fallback blob download)
  const triggerSaveActiveFile = async () => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile) return;

    if (window.desktopAPI?.isDesktop && activeFile.absolutePath) {
      setSaveStatus({ show: true, message: `Saving ${activeFile.name} to disk...`, type: 'info' });
      try {
        const res = await window.desktopAPI.saveFile(activeFile.absolutePath, activeFile.content);
        if (res && res.success) {
          setSaveStatus({ show: true, message: `Successfully saved ${activeFile.name} natively!`, type: 'success' });
        } else {
          setSaveStatus({ show: true, message: `Failed to save: ${res?.error || 'Unknown error'}`, type: 'error' });
        }
      } catch (err) {
        setSaveStatus({ show: true, message: `Failed to save natively: ${err.message}`, type: 'error' });
      }
    } else {
      setSaveStatus({ show: true, message: `Downloading ${activeFile.name} sandbox copy...`, type: 'info' });
      try {
        const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = activeFile.name.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setSaveStatus({ show: true, message: `Downloaded ${activeFile.name} copy successfully!`, type: 'success' });
      } catch (err) {
        setSaveStatus({ show: true, message: `Download failed: ${err.message}`, type: 'error' });
      }
    }

    // Hide save notification toast
    setTimeout(() => {
      setSaveStatus({ show: false, message: '', type: 'success' });
    }, 2800);
  };

  // Keyboard shortcut listeners (hotkeys) mapping standard developer keystrokes
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Save Active File: Ctrl + S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerSaveActiveFile();
      }
      // 2. Open Directory: Ctrl + O
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        triggerOpenFolder();
      }
      // 3. New Sandbox File: Ctrl + N
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowAddInput(true);
      }
      // 4. Close Directory: Ctrl + Shift + W
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        closeFolder();
        setSaveStatus({ show: true, message: 'Closed active folder workspace.', type: 'info' });
        setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 2000);
      }
      // 5. Lock Editor (Logout): Ctrl + Shift + L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setValidated(false);
        navigate('/setup');
        setSaveStatus({ show: true, message: 'Editor locked. API key cleared from browser cache.', type: 'info' });
        setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 2500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, activeFileId, navigate, setValidated]);

  // Detect language icon
  const getFileIcon = (name) => {
    const ext = name.split('.').pop();
    switch (ext) {
      case 'jsx':
      case 'tsx':
        return <i className="fa-brands fa-react text-sky-400 text-sm shrink-0" />;
      case 'js':
        return <i className="fa-brands fa-js text-yellow-500 text-sm shrink-0" />;
      case 'ts':
        return <i className="fa-solid fa-code text-blue-400 text-xs shrink-0" />;
      case 'py':
        return <i className="fa-brands fa-python text-blue-500 text-sm shrink-0" />;
      case 'css':
        return <i className="fa-brands fa-css3-alt text-teal-400 text-sm shrink-0" />;
      case 'html':
        return <i className="fa-brands fa-html5 text-orange-500 text-sm shrink-0" />;
      case 'json':
        return <i className="fa-regular fa-file-lines text-amber-500 text-xs shrink-0" />;
      case 'md':
        return <i className="fa-solid fa-circle-info text-indigo-400 text-xs shrink-0" />;
      default:
        return <i className="fa-regular fa-file text-gray-400 text-xs shrink-0" />;
    }
  };

  const formattedTokens = tokensUsed > 1000
    ? `${(tokensUsed / 1000).toFixed(1)}k`
    : tokensUsed.toString();

  return (
    <div
      className="flex items-center h-10 text-xs select-none shrink-0"
      style={{ backgroundColor: 'var(--navbar-color)', borderBottom: '1px solid var(--border-color)' }}
    >
      {/* App Logo */}
      <div className="flex items-center gap-1.5 px-3 h-full border-r shrink-0" style={{ borderColor: 'var(--border-color)', minWidth: '42px' }}>
        <div className="h-5 w-5 rounded bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <i className="fa-solid fa-bolt text-[11px] text-white" />
        </div>
      </div>

      {/* Sleek Glassmorphic Menu Bar */}
      <div className="flex items-center gap-1.5 px-2.5 h-full border-r shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        {/* FILE MENU */}
        <div className="relative h-full flex items-center" ref={fileMenuRef}>
          <button
            onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
            onMouseEnter={() => activeMenu && setActiveMenu('file')}
            className="px-2.5 py-1 rounded-md transition duration-150 hover:bg-white/5 font-medium flex items-center gap-1 text-[var(--muted-color)] hover:text-white"
            style={{ color: activeMenu === 'file' ? 'var(--accent-color)' : '' }}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div
              className="absolute left-0 top-[90%] mt-1.5 w-60 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md"
              style={{ 
                backgroundColor: 'rgba(26, 27, 38, 0.95)', 
                border: '1px solid var(--border-color)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { setShowAddInput(true); setActiveMenu(null); }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-file-circle-plus text-sky-400 w-4 text-center shrink-0" />
                    <span>New File...</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">Ctrl+N</span>
                </button>
                
                <button
                  onClick={() => { triggerOpenFolder(); setActiveMenu(null); }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-folder-open text-amber-400 w-4 text-center shrink-0" />
                    <span>Open Folder...</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">Ctrl+O</span>
                </button>

                <button
                  onClick={() => { triggerSaveActiveFile(); setActiveMenu(null); }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-floppy-disk text-emerald-400 w-4 text-center shrink-0" />
                    <span>Save Active File</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">Ctrl+S</span>
                </button>

                <button
                  onClick={() => { closeFolder(); setActiveMenu(null); }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-folder-closed text-rose-400 w-4 text-center shrink-0" />
                    <span>Close Folder</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">Ctrl+Shift+W</span>
                </button>

                <div className="h-[1px] my-1.5 bg-white/5" />

                <button
                  onClick={() => { 
                    setValidated(false);
                    navigate('/setup');
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-rose-400 hover:text-rose-300"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-lock text-rose-500 w-4 text-center shrink-0" />
                    <span>Lock Editor (Logout)</span>
                  </div>
                  <span className="text-[9px] text-rose-500/70 font-mono">Ctrl+Shift+L</span>
                </button>

                <button
                  onClick={() => { 
                    if (window.desktopAPI?.isDesktop) {
                      window.close();
                    } else {
                      navigate('/setup');
                    }
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-right-from-bracket text-gray-400 w-4 text-center shrink-0" />
                    <span>Exit</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">Alt+F4</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative h-full flex items-center" ref={editMenuRef}>
          <button
            onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
            onMouseEnter={() => activeMenu && setActiveMenu('edit')}
            className="px-2.5 py-1 rounded-md transition duration-150 hover:bg-white/5 font-medium flex items-center gap-1 text-[var(--muted-color)] hover:text-white"
            style={{ color: activeMenu === 'edit' ? 'var(--accent-color)' : '' }}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div
              className="absolute left-0 top-[90%] mt-1.5 w-52 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md"
              style={{ 
                backgroundColor: 'rgba(26, 27, 38, 0.95)', 
                border: '1px solid var(--border-color)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { 
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-rotate-left text-indigo-400 w-4 text-center shrink-0" />
                    <span>Undo</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">Ctrl+Z</span>
                </button>
                
                <button
                  onClick={() => { 
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-rotate-right text-indigo-400 w-4 text-center shrink-0" />
                    <span>Redo</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">Ctrl+Y</span>
                </button>

                <div className="h-[1px] my-1.5 bg-white/5" />

                <button
                  onClick={() => { 
                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, shiftKey: true }));
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-keyboard text-gray-400 w-4 text-center shrink-0" />
                    <span>Command Palette</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">Ctrl+Shift+P</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="relative h-full flex items-center" ref={viewMenuRef}>
          <button
            onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
            onMouseEnter={() => activeMenu && setActiveMenu('view')}
            className="px-2.5 py-1 rounded-md transition duration-150 hover:bg-white/5 font-medium flex items-center gap-1 text-[var(--muted-color)] hover:text-white"
            style={{ color: activeMenu === 'view' ? 'var(--accent-color)' : '' }}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div
              className="absolute left-0 top-[90%] mt-1.5 w-60 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md"
              style={{ 
                backgroundColor: 'rgba(26, 27, 38, 0.95)', 
                border: '1px solid var(--border-color)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              <div className="p-1.5 space-y-0.5">
                {[
                  { id: 'chat', label: 'AI Chat Panel', icon: 'fa-robot text-teal-400' },
                  { id: 'intent', label: 'Intent Refactoring', icon: 'fa-bolt-lightning text-amber-400' },
                  { id: 'explain', label: 'Explain Logic Flow', icon: 'fa-diagram-project text-cyan-400' },
                  { id: 'memory', label: 'Decision Memory', icon: 'fa-brain text-purple-400' },
                  { id: 'review', label: 'AI Diagnostics Review', icon: 'fa-square-check text-rose-400' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setRightPanelMode(rightPanelMode === p.id ? 'none' : p.id); setActiveMenu(null); }}
                    className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid ${p.icon} w-4 text-center shrink-0`} />
                      <span>{p.label}</span>
                    </div>
                    {rightPanelMode === p.id && <i className="fa-solid fa-check text-[10px] text-emerald-400" />}
                  </button>
                ))}

                <div className="h-[1px] my-1.5 bg-white/5" />

                <button
                  onClick={() => { 
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      document.documentElement.requestFullscreen();
                    }
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-expand text-gray-400 w-4 text-center shrink-0" />
                    <span>Toggle Full Screen</span>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono">F11</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HELP MENU */}
        <div className="relative h-full flex items-center" ref={helpMenuRef}>
          <button
            onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
            onMouseEnter={() => activeMenu && setActiveMenu('help')}
            className="px-2.5 py-1 rounded-md transition duration-150 hover:bg-white/5 font-medium flex items-center gap-1 text-[var(--muted-color)] hover:text-white"
            style={{ color: activeMenu === 'help' ? 'var(--accent-color)' : '' }}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div
              className="absolute left-0 top-[90%] mt-1.5 w-56 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md"
              style={{ 
                backgroundColor: 'rgba(26, 27, 38, 0.95)', 
                border: '1px solid var(--border-color)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { 
                    if (window.confirm('Are you sure you want to clear your local workspace cache? This will reset all files, decisions memory, and chat history.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                    setActiveMenu(null);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-rose-400 hover:text-rose-300"
                >
                  <i className="fa-solid fa-trash-can text-rose-500 w-4 text-center shrink-0" />
                  <span>Reset Workspace Cache</span>
                </button>

                <button
                  onClick={() => { setShowAboutModal(true); setActiveMenu(null); }}
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left text-xs transition duration-150 hover:bg-white/5 text-gray-200 hover:text-white"
                >
                  <i className="fa-solid fa-circle-info text-blue-400 w-4 text-center shrink-0" />
                  <span>About AI Code Editor</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs scrollable area */}
      <div className="flex items-end h-full overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <button
              key={file.id}
              onClick={() => setActiveFile(file.id)}
              className="group flex items-center gap-2 px-3 h-full border-r text-xs whitespace-nowrap transition-colors duration-150 relative shrink-0"
              style={{
                backgroundColor: isActive ? 'var(--active-tab-color)' : 'var(--inactive-tab-color)',
                color: isActive ? 'var(--text-color)' : 'var(--muted-color)',
                borderColor: 'var(--border-color)',
                borderTop: isActive ? '1px solid var(--accent-color)' : '1px solid transparent'
              }}
            >
              <span className="flex items-center justify-center shrink-0">{getFileIcon(file.name)}</span>
              <span className={isActive ? 'font-medium' : ''}>{file.name.split('/').pop()}</span>
              {files.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}
                  className="ml-1 rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 transition flex items-center justify-center"
                >
                  <i className="fa-solid fa-xmark text-[9px]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 px-2 h-full shrink-0">
        {/* Token Counter */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px]" style={{ color: 'var(--muted-color)' }}>
          <i className="fa-solid fa-circle text-[6px] text-emerald-400 animate-pulse" />
          <span className="font-mono">{formattedTokens} tokens</span>
        </div>

        {/* Theme Picker Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] hover:bg-white/5 transition"
            style={{ color: 'var(--muted-color)' }}
            title="Switch Theme"
          >
            <span
              className="h-3 w-3 rounded-full border border-white/20"
              style={{ backgroundColor: activeTheme.accent }}
            />
            <span className="hidden sm:inline">{activeTheme.name}</span>
            <i className="fa-solid fa-chevron-down text-[9px]" />
          </button>

          {showThemePicker && (
            <div
              className="absolute right-0 top-full mt-1 w-52 rounded-xl shadow-2xl z-50 overflow-hidden"
              style={{ backgroundColor: 'var(--sidebar-color)', border: '1px solid var(--border-color)' }}
            >
              <div className="p-2">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                    className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-xs transition hover:bg-white/5"
                    style={{ color: theme === t.id ? 'var(--accent-color)' : 'var(--text-color)' }}
                  >
                    <span className="h-4 w-4 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: t.bg }} />
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.accent }}
                    />
                    <span className="truncate font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <button 
          onClick={() => setShowTimeline(!showTimeline)} 
          className="p-2 rounded-md hover:bg-white/5 transition flex items-center justify-center relative" 
          style={{ color: showTimeline ? 'var(--accent-color)' : 'var(--muted-color)' }} 
          title="Time-Travel Timeline"
        >
          <i className="fa-solid fa-clock-rotate-left text-xs" />
          {historySnapshots.length > 0 && (
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
          )}
        </button>
        <button onClick={() => navigate('/settings')} className="p-2 rounded-md hover:bg-white/5 transition flex items-center justify-center" style={{ color: 'var(--muted-color)' }} title="Settings">
          <i className="fa-solid fa-gear text-xs" />
        </button>
      </div>

      {/* Floating Micro-Notification Toast for Saves & Folder Closing feedback */}
      {saveStatus.show && (
        <div 
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md animate-fade-in font-sans"
          style={{ 
            backgroundColor: 'rgba(26, 27, 38, 0.95)', 
            borderColor: saveStatus.type === 'error' ? '#EF4444' : saveStatus.type === 'info' ? '#3B82F6' : 'var(--accent-color)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="flex items-center justify-center shrink-0">
            {saveStatus.type === 'error' ? (
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm" />
            ) : saveStatus.type === 'info' ? (
              <i className="fa-solid fa-circle-info text-blue-400 text-sm animate-pulse" />
            ) : (
              <i className="fa-solid fa-circle-check text-emerald-400 text-sm" />
            )}
          </div>
          <span className="font-semibold text-xs text-white tracking-wide">{saveStatus.message}</span>
        </div>
      )}

      {/* Premium Glassmorphic About Modal overlay */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm transition duration-300">
          <div 
            className="w-[450px] p-6 rounded-2xl border shadow-2xl relative font-sans animate-fade-in"
            style={{ 
              backgroundColor: 'rgba(23, 23, 33, 0.96)', 
              borderColor: 'var(--border-color)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
            }}
          >
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-white/5"
            >
              <i className="fa-solid fa-xmark text-sm" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/25 mb-4">
                <i className="fa-solid fa-bolt text-2xl text-white animate-pulse" />
              </div>
              
              <h2 className="text-xl font-bold text-white tracking-tight">AI Code Editor</h2>
              <p className="text-[10px] text-emerald-400 font-mono mt-1 font-semibold uppercase tracking-wider">Antigravity Core Edition v1.5.0</p>
              
              <div className="h-[1px] w-full bg-white/5 my-4.5" />
              
              <p className="text-xs leading-relaxed text-gray-400 text-left px-2">
                Defy algorithmic complexity, refactor instantly, and explore code logic flowcharts with a state-of-the-art developer intelligence engine. Fully integrated with advanced Gemini 2.5 models for maximum coding leverage.
              </p>

              <div className="w-full grid grid-cols-2 gap-3 mt-5 px-2">
                <div className="bg-white/5 p-2.5 rounded-xl text-left border border-white/5">
                  <div className="text-[9px] text-gray-500 font-mono">LLM Core Provider</div>
                  <div className="text-xs text-white font-medium mt-0.5 truncate">Gemini 2.5 Pro & Flash</div>
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl text-left border border-white/5">
                  <div className="text-[9px] text-gray-500 font-mono">Execution Host</div>
                  <div className="text-xs text-white font-medium mt-0.5 truncate">
                    {window.desktopAPI?.isDesktop ? 'Electron Desktop' : 'Web Browser Sandbox'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAboutModal(false)}
                className="mt-6 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition duration-150 rounded-xl text-xs font-semibold text-white shadow-lg shadow-blue-600/20"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Visual Time-Travel Slider Sub-Bar */}
      {showTimeline && (
        <div 
          className="absolute left-0 right-0 top-10 h-9 z-20 flex items-center justify-between px-4 border-b animate-fade-in font-sans"
          style={{ 
            backgroundColor: 'rgba(26, 27, 38, 0.96)', 
            borderColor: 'var(--border-color)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(16px)',
            color: 'var(--text-color)'
          }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-history text-indigo-400 text-xs" />
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Time Travel Timeline</span>
          </div>

          {historySnapshots.length === 0 ? (
            <span className="text-[10px] text-gray-500 italic">No snapshots captured yet. AI optimizations auto-create snapshots!</span>
          ) : (
            <div className="flex items-center gap-4 flex-1 max-w-xl mx-8">
              <input
                type="range"
                min="0"
                max={historySnapshots.length - 1}
                value={activeSnapIndex}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex items-center gap-2 shrink-0 text-[10px]">
                <span className="text-indigo-400 font-mono font-bold">[{historySnapshots[activeSnapIndex]?.timestamp}]</span>
                <span className="text-gray-300 truncate max-w-[200px]" title={historySnapshots[activeSnapIndex]?.description}>
                  {historySnapshots[activeSnapIndex]?.description}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                createSnapshot(`Backup: ${files.length} file(s)`);
                setSaveStatus({ show: true, message: 'Snapshot captured successfully!', type: 'success' });
                setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 2000);
              }}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] text-gray-300 hover:text-white transition flex items-center gap-1 border border-white/5"
              title="Save current state as snapshot"
            >
              <i className="fa-solid fa-camera text-[9px]" />
              <span>Snapshot</span>
            </button>
            <button
              onClick={() => setShowTimeline(false)}
              className="p-1 text-gray-500 hover:text-gray-300 transition"
            >
              <i className="fa-solid fa-xmark text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
