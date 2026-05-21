import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEditorStore } from './store/useEditorStore';
import ApiKeyGate from './pages/ApiKeyGate';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import History from './pages/History';
import NotFound from './pages/NotFound';

// Route guarding helper
const ProtectedRoute = ({ children }) => {
  const isValidated = useEditorStore(state => state.isValidated);
  if (!isValidated) {
    return <Navigate to="/setup" replace />;
  }
  return children;
};

export default function App() {
  const theme = useEditorStore(state => state.theme);
  const isValidated = useEditorStore(state => state.isValidated);

  // Dynamically propagate theme classes to document root for variable bindings
  useEffect(() => {
    const root = document.documentElement;
    // Remove any previous theme classes
    root.className = '';
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-editor-bg text-editor-text">
        <Routes>
          {/* Setup / API Key Gate */}
          <Route path="/setup" element={
            isValidated ? <Navigate to="/editor" replace /> : <ApiKeyGate />
          } />

          {/* Main workspace */}
          <Route path="/editor" element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          } />

          {/* Additional pages */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/editor" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
