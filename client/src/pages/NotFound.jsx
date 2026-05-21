import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center bg-[#0B0D19] overflow-hidden text-center p-6 select-none font-sans relative">
      
      {/* Background radial soft light blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-rose-950/10 blur-[100px] pointer-events-none animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm glass-panel-heavy p-8 rounded-2xl shadow-2xl relative z-10 flex flex-col items-center"
      >
        <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4 animate-bounce-slow">
          <i className="fa-solid fa-triangle-exclamation text-xl text-rose-400" />
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">404</h1>
        <h3 className="text-sm font-bold text-gray-300 mb-2">Workspace Route Not Found</h3>
        <p className="text-[10px] leading-relaxed mb-6" style={{ color: 'var(--muted-color)' }}>
          The system coordinate index point could not resolve this path location. Click below to return to the active editor.
        </p>

        <button
          onClick={() => navigate('/editor')}
          className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] transition shadow"
        >
          Return to Workspace
        </button>
      </motion.div>
    </div>
  );
}
