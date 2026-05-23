import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { streamChatCompletions } from '../../utils/ai';

// Sleek Circular Progress SVG Gauge Indicator
function CircularGauge({ value, label, color }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative h-12 w-12 flex items-center justify-center select-none">
        <svg className="h-full w-full transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-white/5 fill-transparent"
            strokeWidth="3"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="fill-transparent transition-all duration-1000 ease-out"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ stroke: color }}
          />
        </svg>
        <span className="absolute text-[10px] font-mono font-bold text-white">{value}%</span>
      </div>
      <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

export default function CodeReview() {
  const provider = useEditorStore(state => state.provider);
  const apiKey = useEditorStore(state => state.apiKey);
  const activeFile = useEditorStore(state => state.getActiveFile());
  const setRightPanelMode = useEditorStore(state => state.setRightPanelMode);
  
  const scorecard = useEditorStore(state => state.scorecard);
  const setScorecard = useEditorStore(state => state.setScorecard);
  const setDiagnostics = useEditorStore(state => state.setDiagnostics);
  const setHighlightedLine = useEditorStore(state => state.setHighlightedLine);
  
  const updateActiveFileContent = useEditorStore(state => state.updateActiveFileContent);
  const createSnapshot = useEditorStore(state => state.createSnapshot);
  const setSaveStatus = useEditorStore(state => state.setSaveStatus);

  const [loading, setLoading] = useState(false);
  const [activeItemIdx, setActiveItemIdx] = useState(null);

  const triggerReviewAudit = async () => {
    if (loading) return;
    setLoading(true);

    const prompt = `Perform an expert static code analysis on the following code file.
Analyze for:
1. Readability & clarity.
2. Computational performance, space complexity, and redundant computations.
3. Security practices, bounds, validation, and vulnerability leaks.

Provide your output strictly in the following JSON schema inside a markdown json block:
{
  "readability": 85,
  "performance": 65,
  "security": 90,
  "recommendations": [
    {
      "type": "performance",
      "line": 4,
      "title": "Recursive overhead in calculations",
      "desc": "This function makes multiple recursive calls. Convert to memoized iteration.",
      "patchCode": "optimized code replacements here..."
    }
  ]
}

Ensure to analyze line numbers correctly and supply the full corrected file content in "patchCode" so it can be quickly auto-patched. Do not return any other text besides the JSON block.

Active File name: ${activeFile.name}
Active File content:
${activeFile.content}`;

    let accumulatedText = '';
    try {
      await streamChatCompletions({
        provider: 'gemini-2.5-flash',
        apiKey,
        messages: [{ role: 'user', content: prompt }],
        memory: [],
        onToken: (token) => {
          accumulatedText += token;
        },
        onDone: () => {
          setLoading(false);
          // Parse JSON block
          try {
            const jsonMatch = accumulatedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const result = JSON.parse(jsonMatch[0]);
              setScorecard(result);

              // Map diagnostics to Monaco squiggles
              const markers = result.recommendations.map((rec, index) => ({
                id: 'diag_' + index,
                line: rec.line,
                message: `${rec.title}: ${rec.desc}`,
                severity: rec.type === 'security' ? 'error' : 'warning'
              }));
              setDiagnostics(markers);

              setSaveStatus({ show: true, message: 'Code review completed successfully!', type: 'success' });
              setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 2000);
            }
          } catch (err) {
            console.error("Failed to parse static audit output:", err, accumulatedText);
            alert("Static analysis response parsing error. Please trigger again!");
          }
        },
        onError: (err) => {
          console.error(err);
          setLoading(false);
          alert(`Analysis query failed: ${err.message || 'Unknown network error'}`);
        }
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleRecommendationClick = (rec, idx) => {
    setActiveItemIdx(idx);
    setHighlightedLine(rec.line);
  };

  const applyQuickFixPatch = (rec, e) => {
    e.stopPropagation(); // Avoid triggering line scroll highlight again
    if (!rec.patchCode) return;

    // 1. Create a Time Travel Snapshot so they can revert this!
    createSnapshot(`Before auto-fix: ${rec.title}`);

    // 2. Patch file
    updateActiveFileContent(rec.patchCode);

    // 3. Clear linter squiggles
    setDiagnostics([]);
    setHighlightedLine(null);

    setSaveStatus({ show: true, message: `Successfully applied quick patch: ${rec.title}!`, type: 'success' });
    setTimeout(() => setSaveStatus({ show: false, message: '', type: 'success' }), 2500);
  };

  const getMetricColor = (val) => {
    if (val >= 80) return '#10b981'; // Emerald
    if (val >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Rose
  };

  return (
    <div className="flex flex-col h-full w-full select-text bg-[#0a0d16]" style={{ backgroundColor: 'var(--sidebar-color)' }}>
      {/* 1. Header */}
      <div 
        className="flex items-center justify-between p-3.5 border-b shrink-0 select-none shadow-md z-10" 
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--navbar-color)' }}
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-square-check text-[11px] text-white animate-pulse" />
          </div>
          <span className="font-bold text-xs bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">AI Diagnostics Auditor</span>
        </div>
        <button 
          onClick={() => setRightPanelMode('none')}
          className="p-1.5 rounded-lg hover:bg-white/5 hover:text-rose-400 transition"
        >
          <i className="fa-solid fa-xmark text-xs" />
        </button>
      </div>

      {/* 2. Content View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Analyze Control Button */}
        <button
          onClick={triggerReviewAudit}
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition duration-300 rounded-xl text-[11px] font-bold text-white shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 disabled:opacity-50 select-none"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch animate-spin text-xs" />
              <span>Analyzing File Structure...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-magnifying-glass text-[10px]" />
              <span>Analyze Workspace File</span>
            </>
          )}
        </button>

        {/* Dynamic Telemetry Metric Dashboard */}
        {scorecard.readability > 0 && !loading && (
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-around py-4 shadow-inner">
            <CircularGauge value={scorecard.readability} label="Readability" color={getMetricColor(scorecard.readability)} />
            <CircularGauge value={scorecard.performance} label="Performance" color={getMetricColor(scorecard.performance)} />
            <CircularGauge value={scorecard.security} label="Security" color={getMetricColor(scorecard.security)} />
          </div>
        )}

        {/* Recommendation Cards */}
        <div className="space-y-2.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold select-none mb-1 pl-1">
            Static Audit Issues
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 bg-[#0d1020]/45 border border-indigo-500/10 rounded-2xl select-none">
              <i className="fa-solid fa-spinner animate-spin text-2xl text-purple-400" />
              <span className="text-[10.5px] text-purple-400 font-bold uppercase tracking-wider animate-pulse">Running Code Audit...</span>
            </div>
          ) : scorecard.recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl select-none">
              <i className="fa-solid fa-magnifying-glass text-2xl text-gray-600 mb-3" />
              <span className="text-xs text-gray-300 font-semibold mb-1">Audit Workspace Clean</span>
              <p className="text-[10px] text-gray-500 leading-normal max-w-[200px]">Click the button above to run static static-code analysis and detect logical optimizations.</p>
            </div>
          ) : (
            scorecard.recommendations.map((rec, idx) => {
              const isActive = activeItemIdx === idx;
              const isSecurity = rec.type === 'security';
              const isPerformance = rec.type === 'performance';
              return (
                <div
                  key={idx}
                  onClick={() => handleRecommendationClick(rec, idx)}
                  className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer relative overflow-hidden group select-text ${
                    isActive 
                      ? 'bg-[#1e233d]/65 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`absolute top-0 bottom-0 left-0 w-[2.5px] ${
                    isSecurity ? 'bg-rose-500' : isPerformance ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />

                  <div className="flex items-center justify-between mb-1.5 select-none">
                    <span className={`text-[8.5px] font-bold uppercase tracking-wider font-mono ${
                      isSecurity ? 'text-rose-400' : isPerformance ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      Line {rec.line} — {rec.type}
                    </span>
                    {rec.patchCode && (
                      <button
                        onClick={(e) => applyQuickFixPatch(rec, e)}
                        className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-[9px] text-indigo-300 hover:text-white font-bold transition flex items-center gap-1"
                        title="Auto-apply patch in Monaco editor"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles text-[8px]" />
                        <span>Quick Fix</span>
                      </button>
                    )}
                  </div>

                  <h5 className="text-[11px] font-bold text-white leading-snug group-hover:text-purple-300 transition mb-1">
                    {rec.title}
                  </h5>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    {rec.desc}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
