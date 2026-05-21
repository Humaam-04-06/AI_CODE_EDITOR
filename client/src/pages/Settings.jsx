import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/useEditorStore';
import { THEMES } from '../themes/themes';
import { validateApiKey } from '../utils/ai';
import { motion } from 'framer-motion';

export default function Settings() {
  const navigate = useNavigate();
  const provider = useEditorStore(state => state.provider);
  const setProvider = useEditorStore(state => state.setProvider);
  const apiKey = useEditorStore(state => state.apiKey);
  const setApiKey = useEditorStore(state => state.setApiKey);
  const setValidated = useEditorStore(state => state.setValidated);
  const theme = useEditorStore(state => state.theme);
  const setTheme = useEditorStore(state => state.setTheme);
  const tokensUsed = useEditorStore(state => state.tokensUsed);
  const resetTokens = useEditorStore(state => state.resetTokens);

  const [inputKey, setInputKey] = useState(apiKey);
  const [localProvider, setLocalProvider] = useState(provider);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const providers = [
    { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', model: 'gemini-2.5-flash' },
    { id: 'gemini-2.5-pro', name: 'Google Gemini 2.5 Pro', model: 'gemini-2.5-pro' },
    { id: 'gemini-2.5-flash-lite', name: 'Google Gemini 2.5 Flash-Lite', model: 'gemini-2.5-flash-lite' },
    { id: 'openai', name: 'OpenAI GPT-4o-mini', model: 'gpt-4o-mini' },
    { id: 'anthropic', name: 'Anthropic Claude 3.5', model: 'claude-3-5-sonnet' },
    { id: 'groq', name: 'Groq Llama 3', model: 'llama3-70b' }
  ];

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setErrorMsg('Please enter a valid API Key.');
      return;
    }

    setIsUpdating(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Validate the newly inputted credentials
      const result = await validateApiKey(localProvider, inputKey.trim());
      
      if (result.success) {
        setProvider(localProvider);
        setApiKey(inputKey.trim());
        setValidated(true);
        setSuccessMsg('Credentials verified & saved successfully!');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Verification failed. Please check key & internet connection.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to clear your local workspace cache? This will reset files, decisions memory, and chat history.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0D19] overflow-hidden text-xs select-text font-sans">
      
      {/* 1. Header Bar */}
      <div 
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0 bg-[#0E1120]"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <button 
          onClick={() => navigate('/editor')}
          className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition shrink-0 flex items-center justify-center h-7 w-7"
        >
          <i className="fa-solid fa-arrow-left text-sm" />
        </button>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-gear text-blue-500 text-sm" />
          <span className="font-bold text-sm text-white">Workspace Configuration Settings</span>
        </div>
      </div>

      {/* 2. Scrollable Settings sections */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6 select-text">
        
        {/* Section A: API Key Manager */}
        <div className="p-5 rounded-2xl glass-panel-heavy space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800/40 pb-2">
            <i className="fa-solid fa-key text-blue-400 text-sm shrink-0" />
            <h3 className="font-bold text-sm text-white">AI Service Provider & Credentials</h3>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">Select Provider</label>
                <select
                  value={localProvider}
                  onChange={(e) => setLocalProvider(e.target.value)}
                  className="w-full bg-[#161928] border border-gray-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 transition duration-200"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">API Authentication Key</label>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste new API key..."
                  className="w-full bg-[#161928] border border-gray-700/50 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono transition duration-200"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl leading-normal text-[11px]">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl leading-normal text-[11px]">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase tracking-wider text-white transition disabled:bg-gray-800"
            >
              {isUpdating ? 'Validating API ping...' : 'Update credentials'}
            </button>
          </form>
        </div>

        {/* Section B: Theme Picker Grid */}
        <div className="p-5 rounded-2xl glass-panel-heavy space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800/40 pb-2">
            <i className="fa-solid fa-palette text-purple-400 text-sm shrink-0" />
            <h3 className="font-bold text-sm text-white">Visual Themes Selection</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMES.map(t => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="flex flex-col p-3 rounded-xl border text-left transition duration-200 select-none relative group"
                  style={{
                    borderColor: isSelected ? t.accent : 'rgba(255,255,255,0.05)',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)'
                  }}
                >
                  <div className="h-6 w-full rounded border mb-2 flex items-center justify-between px-2" style={{ backgroundColor: t.bg, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-[10px] font-bold" style={{ color: t.accent }}>Aa</span>
                    {isSelected && <i className="fa-solid fa-check text-emerald-400 text-[10px] shrink-0" />}
                  </div>
                  <h4 className="font-bold text-[11px] text-white truncate w-full mb-0.5">{t.name}</h4>
                  <span className="text-[9px] text-gray-500 leading-none truncate block w-full">{t.basedOn} scheme</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section C: Shortcut Keys Reference */}
        <div className="p-5 rounded-2xl glass-panel-heavy space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-800/40 pb-2">
            <i className="fa-solid fa-circle-question text-amber-400 text-sm shrink-0" />
            <h3 className="font-bold text-sm text-white">Keyboard Shortcuts Cheat-Sheet</h3>
          </div>

          <div className="divide-y divide-gray-800/40 text-[11px]">
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Trigger Command Palette</span>
              <kbd className="font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white font-semibold">Ctrl + Shift + P</kbd>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Switch active file</span>
              <kbd className="font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white font-semibold">Click Explorer Tab</kbd>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Toggle Left Drawer</span>
              <kbd className="font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white font-semibold">Click menu icons</kbd>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Accept refactoring Changes</span>
              <kbd className="font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white font-semibold">Click comparative header</kbd>
            </div>
          </div>
        </div>

        {/* Section D: Danger Utilities */}
        <div className="p-5 rounded-2xl glass-panel-heavy space-y-4 border border-rose-500/10 bg-rose-500/5">
          <div className="flex items-center gap-2 border-b border-rose-500/10 pb-2">
            <i className="fa-solid fa-shield-halved text-rose-400 text-sm shrink-0" />
            <h3 className="font-bold text-sm text-white">Advanced / System Utilities</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-white">Reset Local Workspace</h4>
              <p className="text-[10px] text-gray-400">Deletes all cached sandbox files, conversations, and architectural principles.</p>
            </div>
            <button
              onClick={handleResetData}
              className="py-1.5 px-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 transition duration-150 font-bold uppercase tracking-wider text-[9px] shrink-0"
            >
              Clear Local Cache
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-rose-500/10 pt-3">
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-white">Reset Session Token Counter</h4>
              <p className="text-[10px] text-gray-400">Resets the active token count tracing back LLM request volumes. Current: {tokensUsed} tokens.</p>
            </div>
            <button
              onClick={resetTokens}
              disabled={tokensUsed === 0}
              className="py-1.5 px-3 rounded-lg border border-gray-800 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 font-bold uppercase tracking-wider text-[9px] shrink-0"
            >
              Reset Tokens
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
