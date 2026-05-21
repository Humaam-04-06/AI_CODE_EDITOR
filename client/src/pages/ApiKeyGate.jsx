import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store/useEditorStore';
import { validateApiKey } from '../utils/ai';
import { motion } from 'framer-motion';

export default function ApiKeyGate() {
  const navigate = useNavigate();
  const provider = useEditorStore(state => state.provider);
  const setProvider = useEditorStore(state => state.setProvider);
  const setApiKey = useEditorStore(state => state.setApiKey);
  const setValidated = useEditorStore(state => state.setValidated);
  
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const providers = [
    { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash', model: 'gemini-2.5-flash', docUrl: 'https://aistudio.google.com' },
    { id: 'gemini-2.5-pro', name: 'Google Gemini 2.5 Pro', model: 'gemini-2.5-pro', docUrl: 'https://aistudio.google.com' },
    { id: 'gemini-2.5-flash-lite', name: 'Google Gemini 2.5 Flash-Lite', model: 'gemini-2.5-flash-lite', docUrl: 'https://aistudio.google.com' },
    { id: 'openai', name: 'OpenAI GPT', model: 'gpt-4o-mini', docUrl: 'https://platform.openai.com' },
    { id: 'anthropic', name: 'Anthropic Claude', model: 'claude-3-5-sonnet', docUrl: 'https://console.anthropic.com' },
    { id: 'groq', name: 'Groq API (Llama 3)', model: 'llama3-70b', docUrl: 'https://console.groq.com' }
  ];

  const currentProvider = providers.find(p => p.id === provider) || providers[0];

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setErrorMsg('Please input a valid API Key.');
      return;
    }

    setIsChecking(true);
    setErrorMsg('');
    
    try {
      // Validate key with a test API request through Express backend
      const result = await validateApiKey(provider, inputKey.trim());
      
      if (result.success) {
        setSuccess(true);
        // Save to Zustand and LocalStorage
        setApiKey(inputKey.trim());
        setValidated(true);
        
        // Wait briefly for the animation to look premium before navigating
        setTimeout(() => {
          navigate('/editor');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Validation failed. Please verify your internet connection and API key.');
      setValidated(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0B0D19] overflow-hidden px-4 select-text">
      {/* Sleek dynamic background glowing spheres */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-blue-900/10 blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-purple-900/10 blur-[100px] animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-panel-heavy p-8 rounded-2xl shadow-2xl relative z-10"
      >
        {/* Header Title with Glowing Icons */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-bounce-slow">
            <i className="fa-solid fa-microchip text-2xl text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Code Editor
          </h1>
          <p className="text-gray-400 text-sm text-center">
            The Professional Portfolio Workspace
          </p>
        </div>

        {success ? (
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center py-6 text-center"
          >
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
              <i className="fa-solid fa-shield-halved text-2xl text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Editor Unlocked Successfully</h3>
            <p className="text-gray-400 text-sm">Initializing custom workspace panels...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-6">
            
            {/* Provider Selector dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
                AI Service Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-[#161928] border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition duration-200"
              >
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* API Key Input fields */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
                  API Credentials Key
                </label>
                <a 
                  href={currentProvider.docUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Get Key
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <i className="fa-solid fa-key" />
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={`Paste your ${currentProvider.model} key...`}
                  className="w-full bg-[#161928] border border-gray-700/50 rounded-xl pl-10 pr-10 py-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500 transition duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showKey ? <i className="fa-solid fa-eye-slash" /> : <i className="fa-solid fa-eye" />}
                </button>
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-normal">
                <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0 text-sm" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Validator Trigger button */}
            <button
              type="submit"
              disabled={isChecking}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm tracking-wide text-white transition duration-200 flex items-center justify-center gap-2 ${
                isChecking
                  ? 'bg-blue-600/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/15'
              }`}
            >
              {isChecking ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Validating Key with Ping...</span>
                </>
              ) : (
                <span>Unlock Premium Editor</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-800/40 text-center">
          <p className="text-gray-500 text-[11px] leading-relaxed">
            🛡️ Local-only BYOK (Bring Your Own Key) model. Credentials are stored securely in local browser storage and never transmitted to third-party databases.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
