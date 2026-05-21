import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function DecisionMemory() {
  const memoryCards = useEditorStore(state => state.memoryCards);
  const addMemoryCard = useEditorStore(state => state.addMemoryCard);
  const editMemoryCard = useEditorStore(state => state.editMemoryCard);
  const deleteMemoryCard = useEditorStore(state => state.deleteMemoryCard);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;
    
    addMemoryCard(title.trim(), desc.trim());
    setTitle('');
    setDesc('');
    setIsAdding(false);
  };

  const handleStartEdit = (card) => {
    setEditingId(card.id);
    setEditTitle(card.title);
    setEditDesc(card.description);
  };

  const handleSaveEdit = (id) => {
    if (!editTitle.trim() || !editDesc.trim()) return;
    editMemoryCard(id, editTitle.trim(), editDesc.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full w-full select-text" style={{ backgroundColor: 'var(--sidebar-color)' }}>
      {/* 1. Header */}
      <div 
        className="flex items-center justify-between p-3 border-b shrink-0" 
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--navbar-color)' }}
      >
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-brain text-purple-400 text-sm" />
          <span className="font-bold text-xs">Architectural Decision Memory</span>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 rounded hover:bg-white/5 text-purple-400 transition flex items-center justify-center"
          title="Add Architectural Constraint"
        >
          {isAdding ? <i className="fa-solid fa-xmark text-xs" /> : <i className="fa-solid fa-plus text-xs" />}
        </button>
      </div>

      {/* 2. Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Form to add a new card */}
        {isAdding && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddSubmit} 
            className="p-3.5 rounded-xl border space-y-3 animate-fade-in"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}
          >
            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">New Decision Guideline</h4>
            <div className="space-y-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Guideline Title (e.g. Favor Async/Await)"
                className="w-full bg-[#161928] border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 transition duration-200"
              />
            </div>
            <div className="space-y-1">
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description details injected to AI prompt..."
                rows={2}
                className="w-full bg-[#161928] border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 transition duration-200 resize-none font-sans"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition"
            >
              Commit Guideline
            </button>
          </motion.form>
        )}

        <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--muted-color)' }}>
          Write programming principles, dependency rules, or stylistic behaviors. These are injected automatically into prompt contexts to align the AI models with your project's custom requirements.
        </p>

        {/* Existing memory cards lists */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {memoryCards.map(card => {
              const isEditing = editingId === card.id;
              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3.5 rounded-xl border transition-all duration-200 group relative"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'rgba(255,255,255,0.015)'
                  }}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-[#161928] border border-gray-700/50 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500 font-medium"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-[#161928] border border-gray-700/50 rounded-lg px-2 py-1 text-white text-[11px] focus:outline-none focus:border-blue-500 resize-none font-sans"
                      />
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded hover:bg-white/5 text-gray-400 flex items-center justify-center"
                        >
                          <i className="fa-solid fa-xmark text-xs" />
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(card.id)}
                          className="p-1 rounded hover:bg-white/5 text-emerald-400 flex items-center justify-center"
                        >
                          <i className="fa-solid fa-check text-xs" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-bold text-xs text-white truncate max-w-[130px]">{card.title}</h5>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                          <button
                            onClick={() => handleStartEdit(card)}
                            className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white flex items-center justify-center"
                          >
                            <i className="fa-regular fa-pen-to-square text-[10px]" />
                          </button>
                          <button
                            onClick={() => deleteMemoryCard(card.id)}
                            className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-rose-400 flex items-center justify-center"
                          >
                            <i className="fa-regular fa-trash-can text-[10px]" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed font-sans" style={{ color: 'var(--text-color)' }}>
                        {card.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
