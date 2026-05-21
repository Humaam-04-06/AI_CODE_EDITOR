import { create } from 'zustand';

// Preloaded mock files to give the user a beautiful interactive sandbox
const DEFAULT_FILES = [
  {
    id: 'f1',
    name: 'App.jsx',
    language: 'javascript',
    content: `import React, { useState, useMemo } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([1, 2, 3, 4, 5]);

  // Heavy computation that could be optimized
  const heavyComputation = () => {
    console.log("Running heavy compute...");
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += Math.sin(i);
    }
    return result + count;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-4">React Premium Editor Sandbox</h1>
      <p className="text-gray-400 mb-6">Edit this file, try Intent Mode to optimize, or click Explain!</p>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setCount(count + 1)}
          className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Count: {count}
        </button>
      </div>

      <div className="border border-slate-700 p-4 rounded-xl max-w-md w-full">
        <h2 className="text-xl mb-2 font-semibold">Expensive Result:</h2>
        <div className="text-yellow-400 font-mono text-lg">
          {heavyComputation()}
        </div>
      </div>
    </div>
  );
}`
  },
  {
    id: 'f2',
    name: 'fibonacci.py',
    language: 'python',
    content: `def fibonacci_recursive(n):
    # Recursive fibonacci - highly inefficient for Intent Mode optimizations!
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci_recursive(n - 1) + fibonacci_recursive(n - 2)

if __name__ == "__main__":
    n_terms = 10
    print(f"Fibonacci sequence for {n_terms} terms:")
    for i in range(n_terms):
        print(fibonacci_recursive(i))
`
  },
  {
    id: 'f3',
    name: 'styles.css',
    language: 'css',
    content: `/* Ultra modern floating glass card design */
.premium-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.premium-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4);
}
`
  }
];

export const useEditorStore = create((set, get) => ({
  // 1. API Keys Credentials
  provider: localStorage.getItem('ai_provider') || 'gemini-2.5-flash',
  apiKey: localStorage.getItem('ai_api_key') || '',
  isValidated: !!localStorage.getItem('ai_api_key'),

  // 2. Visual Theme Class Names
  theme: localStorage.getItem('editor_theme') || 'dark-plus',

  // 3. Sandbox Files States
  files: JSON.parse(localStorage.getItem('sandbox_files')) || DEFAULT_FILES,
  activeFileId: localStorage.getItem('active_file_id') || 'f1',
  openFolderTrigger: 0,
  showAddInput: false,
  saveStatus: { show: false, message: '', type: 'success' },

  // 4. Decision Memory Sidebar List
  memoryCards: JSON.parse(localStorage.getItem('decision_memory')) || [
    { id: 'm1', title: 'Prefer Clean Memoization', description: 'Favor React.useMemo and useCallback hooks for computed states.' }
  ],

  // 5. AI Persistent Chat list
  chatHistory: JSON.parse(localStorage.getItem('chat_history')) || [],

  // 6. Token Counters
  tokensUsed: parseInt(localStorage.getItem('tokens_used') || '0', 10),

  // 7. Dynamic Drawers View Mode Control
  rightPanelMode: 'chat', // 'none' | 'chat' | 'intent' | 'explain' | 'memory'
  isProcessing: false,

  // 8. Intent Mode & React Flow caches
  intentResult: null, // { refactoredCode, explanation }
  flowData: null, // { nodes, edges }

  // --- ACTIONS ---

  triggerOpenFolder: () => set(state => ({ openFolderTrigger: state.openFolderTrigger + 1 })),
  setShowAddInput: (showAddInput) => set({ showAddInput }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  // Set credentials
  setProvider: (provider) => {
    localStorage.setItem('ai_provider', provider);
    set({ provider });
  },
  setApiKey: (apiKey) => {
    localStorage.setItem('ai_api_key', apiKey);
    set({ apiKey });
  },
  setValidated: (isValidated) => {
    if (!isValidated) {
      localStorage.removeItem('ai_api_key');
      set({ apiKey: '', isValidated: false });
    } else {
      set({ isValidated: true });
    }
  },

  // Set theme
  setTheme: (theme) => {
    localStorage.setItem('editor_theme', theme);
    set({ theme });
  },

  // File system modifiers
  setActiveFile: (activeFileId) => {
    localStorage.setItem('active_file_id', activeFileId);
    set({ activeFileId, intentResult: null });
  },
  setFiles: (files) => {
    if (files && files.length > 0) {
      localStorage.setItem('sandbox_files', JSON.stringify(files));
      localStorage.setItem('active_file_id', files[0].id);
      set({ files, activeFileId: files[0].id, intentResult: null });
    }
  },
  updateActiveFileContent: (content) => {
    const { files, activeFileId } = get();
    const updatedFiles = files.map(file => 
      file.id === activeFileId ? { ...file, content } : file
    );
    localStorage.setItem('sandbox_files', JSON.stringify(updatedFiles));
    set({ files: updatedFiles });
  },
  addFile: (name, content = '', language = 'javascript') => {
    const { files } = get();
    const newFile = {
      id: 'f_' + Date.now(),
      name,
      language,
      content
    };
    const updatedFiles = [...files, newFile];
    localStorage.setItem('sandbox_files', JSON.stringify(updatedFiles));
    set({ files: updatedFiles, activeFileId: newFile.id, intentResult: null });
  },
  deleteFile: (id) => {
    const { files, activeFileId } = get();
    if (files.length <= 1) return; // Prevent deleting all files
    const updatedFiles = files.filter(f => f.id !== id);
    localStorage.setItem('sandbox_files', JSON.stringify(updatedFiles));
    
    let nextActiveId = activeFileId;
    if (activeFileId === id) {
      nextActiveId = updatedFiles[0].id;
    }
    set({ files: updatedFiles, activeFileId: nextActiveId, intentResult: null });
  },
  closeFolder: () => {
    localStorage.removeItem('sandbox_files');
    localStorage.removeItem('active_file_id');
    set({ files: DEFAULT_FILES, activeFileId: 'f1', intentResult: null });
  },

  // Decision Memory handlers
  addMemoryCard: (title, description) => {
    const { memoryCards } = get();
    const newCard = { id: 'm_' + Date.now(), title, description };
    const updated = [...memoryCards, newCard];
    localStorage.setItem('decision_memory', JSON.stringify(updated));
    set({ memoryCards: updated });
  },
  editMemoryCard: (id, title, description) => {
    const { memoryCards } = get();
    const updated = memoryCards.map(c => 
      c.id === id ? { ...c, title, description } : c
    );
    localStorage.setItem('decision_memory', JSON.stringify(updated));
    set({ memoryCards: updated });
  },
  deleteMemoryCard: (id) => {
    const { memoryCards } = get();
    const updated = memoryCards.filter(c => c.id !== id);
    localStorage.setItem('decision_memory', JSON.stringify(updated));
    set({ memoryCards: updated });
  },

  // AI Chat History logs
  addChatMessage: (role, content) => {
    const { chatHistory } = get();
    const updated = [...chatHistory, { role, content }];
    localStorage.setItem('chat_history', JSON.stringify(updated));
    set({ chatHistory: updated });
  },
  updateLastChatMessage: (content) => {
    const { chatHistory } = get();
    if (chatHistory.length === 0) return;
    const updated = [...chatHistory];
    updated[updated.length - 1] = { ...updated[updated.length - 1], content };
    localStorage.setItem('chat_history', JSON.stringify(updated));
    set({ chatHistory: updated });
  },
  clearChatHistory: () => {
    localStorage.removeItem('chat_history');
    set({ chatHistory: [] });
  },

  // Token tracker actions
  addTokens: (count) => {
    const newCount = get().tokensUsed + count;
    localStorage.setItem('tokens_used', newCount.toString());
    set({ tokensUsed: newCount });
  },
  resetTokens: () => {
    localStorage.setItem('tokens_used', '0');
    set({ tokensUsed: 0 });
  },

  // Drawers and status triggers
  setRightPanelMode: (rightPanelMode) => set({ rightPanelMode }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setIntentResult: (intentResult) => set({ intentResult }),
  setFlowData: (flowData) => set({ flowData }),

  // Helper selectors
  getActiveFile: () => {
    const { files, activeFileId } = get();
    return files.find(f => f.id === activeFileId) || DEFAULT_FILES[0];
  }
}));
