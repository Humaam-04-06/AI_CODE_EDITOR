import React, { useEffect } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useEditorStore } from '../../store/useEditorStore';
import { requestExplainFlowchart } from '../../utils/ai';

export default function ExplainMyCode() {
  const isProcessing = useEditorStore(state => state.isProcessing);
  const flowData = useEditorStore(state => state.flowData);
  const setProcessing = useEditorStore(state => state.setProcessing);
  const setFlowData = useEditorStore(state => state.setFlowData);
  const setHighlightedLine = useEditorStore(state => state.setHighlightedLine);

  const handleFetchFlowchart = async () => {
    if (isProcessing) return;
    
    setProcessing(true);
    setFlowData(null);

    const { provider, apiKey, getActiveFile } = useEditorStore.getState();
    const activeFile = getActiveFile();

    try {
      const data = await requestExplainFlowchart({
        provider,
        apiKey,
        code: activeFile.content,
        language: activeFile.language
      });

      // Confirm schema validity and enforce standard rendering positions
      if (data && data.nodes && data.edges) {
        setFlowData(data);
      } else {
        throw new Error('Flowchart structure corrupted or empty.');
      }
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to analyze code outline flowchart.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-text" style={{ backgroundColor: 'var(--sidebar-color)' }}>
      {/* 1. Header */}
      <div 
        className="flex items-center gap-2 p-3 border-b shrink-0" 
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--navbar-color)' }}
      >
        <i className="fa-solid fa-diagram-project text-emerald-400 text-sm" />
        <span className="font-bold text-xs">Visual Flow Outline</span>
      </div>

      {/* 2. ReactFlow Visual Area */}
      <div className="flex-1 min-h-0 relative select-none">
        {isProcessing && (
          <div className="absolute inset-0 bg-[#0B0D19]/40 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 text-center">
            <div className="h-7 w-7 border-2 border-t-emerald-500 border-emerald-500/20 rounded-full animate-spin mb-3"></div>
            <h5 className="text-xs font-bold text-white mb-0.5">Generating outline graph...</h5>
            <p className="text-[10px]" style={{ color: 'var(--muted-color)' }}>Analyzing functions and logical branches...</p>
          </div>
        )}

        {!flowData ? (
          <div className="flex flex-col h-full items-center justify-center text-center p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-1 animate-pulse-slow">
              <i className="fa-solid fa-network-wired text-base" />
            </div>
            <div className="space-y-1 max-w-[200px]">
              <h4 className="text-xs font-bold text-white">Visual Outline Generator</h4>
              <p className="text-[10px] leading-normal" style={{ color: 'var(--muted-color)' }}>
                Renders a functional program diagram tracing variables, conditions, and return paths:
              </p>
            </div>
            <button
              onClick={handleFetchFlowchart}
              disabled={isProcessing}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-md shadow-emerald-600/10 transition"
            >
              Analyze Logic Map
            </button>
          </div>
        ) : (
          <div className="h-full w-full relative select-text">
            <ReactFlow
              nodes={flowData.nodes}
              edges={flowData.edges}
              onNodeClick={(event, node) => {
                const line = node.line || node.data?.line;
                if (line) {
                  setHighlightedLine(line);
                }
              }}
              fitView
              className="font-mono text-xs"
            >
              <Background color="var(--border-color)" gap={16} size={1} />
              <Controls className="!bg-slate-900 !border-slate-800 !text-slate-400 fill-slate-400 [&>button]:!border-slate-800 hover:[&>button]:!bg-slate-800" />
            </ReactFlow>

            {/* Re-analyze floating controller button */}
            <div className="absolute bottom-3 right-3 z-20">
              <button
                onClick={handleFetchFlowchart}
                className="py-1.5 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase tracking-wider backdrop-blur-md transition shadow"
              >
                Re-Analyze
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
