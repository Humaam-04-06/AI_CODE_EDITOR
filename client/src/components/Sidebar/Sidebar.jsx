import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';

const filesEquality = (prev, next) => {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id || prev[i].name !== next[i].name || prev[i].language !== next[i].language) {
      return false;
    }
  }
  return true;
};

export default function Sidebar() {
  const files = useEditorStore(state => state.files, filesEquality);
  const activeFileId = useEditorStore(state => state.activeFileId);
  const setActiveFile = useEditorStore(state => state.setActiveFile);
  const addFile = useEditorStore(state => state.addFile);
  const deleteFile = useEditorStore(state => state.deleteFile);
  const setFiles = useEditorStore(state => state.setFiles);
  const rightPanelMode = useEditorStore(state => state.rightPanelMode);
  const setRightPanelMode = useEditorStore(state => state.setRightPanelMode);
  
  // Connect global top-menu triggers
  const openFolderTrigger = useEditorStore(state => state.openFolderTrigger);
  const showAddInput = useEditorStore(state => state.showAddInput);
  const setShowAddInput = useEditorStore(state => state.setShowAddInput);

  const [newFileName, setNewFileName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (openFolderTrigger > 0) {
      handleOpenFolder();
    }
  }, [openFolderTrigger]);

  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.pdf', '.zip', '.tar', '.gz', 
    '.7z', '.rar', '.exe', '.dll', '.so', '.dylib', '.class', '.pyc', '.db', '.sqlite', 
    '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.wav', '.avi', '.mov', '.dmg',
    '.iso', '.bin', '.dat', '.pkg', '.jar', '.war', '.pdb'
  ];

  const langMap = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', css: 'css', html: 'html', json: 'json', md: 'markdown',
    txt: 'plaintext', yaml: 'yaml', yml: 'yaml', ini: 'ini', env: 'plaintext',
    sh: 'shell', bat: 'bat', rs: 'rust', go: 'go', c: 'c', cpp: 'cpp', h: 'c',
    java: 'java', cs: 'csharp', php: 'php', rb: 'ruby', pl: 'perl', sql: 'sql',
    xml: 'xml', svg: 'xml', gitignore: 'plaintext', dockerignore: 'plaintext',
    dockerfile: 'dockerfile', makefile: 'makefile'
  };

  const handleDirectoryInputChange = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const filesList = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > 2 * 1024 * 1024) continue;
      
      const pathParts = file.webkitRelativePath.split('/');
      const isIgnored = pathParts.some(part => {
        if (part.startsWith('.')) {
          return part !== '.gitignore' && part !== '.env';
        }
        const ignoredDirs = [
          'node_modules', 'git', '.git', 'dist', 'build', '.next', '.nuxt',
          'target', 'out', 'venv', '.venv', 'env', '.env', 'obj', 'bin'
        ];
        return ignoredDirs.includes(part);
      });
      
      if (isIgnored) continue;

      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!binaryExtensions.includes(ext)) {
        try {
          const content = await file.text();
          const extName = file.name.split('.').pop().toLowerCase();
          const language = langMap[extName] || 'plaintext';
          
          filesList.push({
            id: 'web_input_' + Math.random().toString(36).substring(2, 9),
            name: file.webkitRelativePath,
            language,
            content
          });
        } catch (err) {
          console.warn('Failed to read file:', file.name, err);
        }
      }
    }

    if (filesList.length > 0) {
      setFiles(filesList);
    } else {
      alert('No supported text or programming files could be loaded from the selected folder.');
    }
  };

  const handleOpenFolder = async () => {
    // 1. Electron Native folder picking
    if (window.desktopAPI?.isDesktop) {
      try {
        const result = await window.desktopAPI.openDirectory();
        if (result && result.files && result.files.length > 0) {
          setFiles(result.files);
        } else if (result && result.files.length === 0) {
          alert('No supported programming text files found in the selected folder.');
        }
      } catch (err) {
        console.error('Failed to open directory natively:', err);
        alert('Could not access selected directory natively.');
      }
    } else {
      // 2. Web Directory Picker API fallback
      if (window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker();
          const filesList = [];
          
          async function traverse(handle, currentPath = '') {
            for await (const entry of handle.values()) {
              if (entry.name.startsWith('.')) {
                if (entry.name !== '.gitignore' && entry.name !== '.env') {
                  continue;
                }
              }
              
              const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
              
              if (entry.kind === 'directory') {
                const ignoredDirs = [
                  'node_modules', 'git', '.git', 'dist', 'build', '.next', '.nuxt',
                  'target', 'out', 'venv', '.venv', 'env', '.env', 'obj', 'bin'
                ];
                if (ignoredDirs.includes(entry.name)) {
                  continue;
                }
                await traverse(entry, entryPath);
              } else if (entry.kind === 'file') {
                const file = await entry.getFile();
                if (file.size > 2 * 1024 * 1024) {
                  continue;
                }

                const ext = '.' + entry.name.split('.').pop().toLowerCase();
                if (!binaryExtensions.includes(ext)) {
                  const content = await file.text();
                  const extName = entry.name.split('.').pop().toLowerCase();
                  const language = langMap[extName] || 'plaintext';
                  
                  filesList.push({
                    id: 'web_' + Math.random().toString(36).substring(2, 9),
                    name: entryPath,
                    language,
                    content
                  });
                }
              }
            }
          }
          
          await traverse(dirHandle);
          if (filesList.length > 0) {
            setFiles(filesList);
            return;
          }
        } catch (err) {
          console.warn('Web directory picking via showDirectoryPicker failed/cancelled, trying input fallback:', err);
        }
      }

      // Fallback: Trigger standard input folder selection
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        alert('Native folder opening is not supported by your browser.');
      }
    }
  };

  const handleCreateFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    // Auto detect language from file extension
    const ext = newFileName.split('.').pop() || 'js';
    const langMap = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', css: 'css', html: 'html', json: 'json', md: 'markdown'
    };
    const language = langMap[ext] || 'javascript';

    addFile(newFileName.trim(), `// Sandbox file: ${newFileName}\n`, language);
    setNewFileName('');
    setShowAddInput(false);
  };

  const menuItems = [
    { id: 'chat', label: 'AI Chat Agent', iconClass: 'fa-solid fa-robot' },
    { id: 'intent', label: 'Intent Refactoring', iconClass: 'fa-solid fa-bolt-lightning' },
    { id: 'explain', label: 'Explain Logic Flow', iconClass: 'fa-solid fa-diagram-project' },
    { id: 'memory', label: 'Decision Memory', iconClass: 'fa-solid fa-brain' }
  ];

  return (
    <div 
      className="flex w-64 h-full border-r text-xs font-sans shrink-0 select-none"
      style={{ backgroundColor: 'var(--sidebar-color)', borderColor: 'var(--border-color)' }}
    >
      {/* 1. Left Vertical Icon Sidebar */}
      <div 
        className="flex flex-col items-center justify-between w-12 h-full border-r"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--navbar-color)' }}
      >
        <div className="flex flex-col items-center gap-2 pt-3 w-full">
          {menuItems.map(item => {
            const isSelected = rightPanelMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setRightPanelMode(isSelected ? 'none' : item.id)}
                className={`relative group p-2.5 rounded-xl transition duration-200 flex items-center justify-center`}
                style={{ 
                 color: isSelected ? 'var(--accent-color)' : 'var(--muted-color)',
                 background: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent'
                }}
                title={item.label}
              >
                <i className={`${item.iconClass} text-base`} />
                {isSelected && (
                  <div 
                    className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="pb-4">
          <button 
            onClick={handleOpenFolder}
            className="p-2.5 rounded-xl transition duration-200 flex items-center justify-center hover:bg-white/5 text-[var(--muted-color)] hover:text-white"
            title="Open Directory Folder"
          >
            <i className="fa-solid fa-folder-open text-base" />
          </button>
        </div>
      </div>

      {/* 2. Right Directory Explorer Pane */}
      <div className="flex flex-col flex-1 p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-color)' }}>
          <span>Workspace Explorer</span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleOpenFolder}
              className="p-1 rounded hover:bg-white/5 transition flex items-center justify-center"
              title="Open Local Folder"
            >
              <i className="fa-solid fa-folder-open text-[10px]" />
            </button>
            <button 
              onClick={() => setShowAddInput(!showAddInput)}
              className="p-1 rounded hover:bg-white/5 transition flex items-center justify-center"
              title="Create Sandbox File"
            >
              <i className="fa-solid fa-plus text-[10px]" />
            </button>
          </div>
        </div>

        {/* Input to add files */}
        {showAddInput && (
          <form onSubmit={handleCreateFile} className="mb-3 animate-fade-in">
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. index.js, test.py..."
              className="w-full bg-[#161928] border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono transition duration-200"
            />
          </form>
        )}

        {/* Active Files list */}
        <div className="space-y-1">
          {files.map(file => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => setActiveFile(file.id)}
                className="group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition duration-150"
                style={{ 
                  backgroundColor: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                  color: isActive ? 'var(--text-color)' : 'var(--muted-color)'
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <i className="fa-regular fa-file-code text-sm shrink-0" style={{ color: isActive ? 'var(--accent-color)' : 'var(--muted-color)' }} />
                  <span className={`truncate ${isActive ? 'font-medium' : ''}`}>{file.name}</span>
                </div>
                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file.id);
                    }}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 hover:text-rose-400 transition flex items-center justify-center"
                  >
                    <i className="fa-regular fa-trash-can text-[10px]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={handleDirectoryInputChange}
      />
    </div>
  );
}
