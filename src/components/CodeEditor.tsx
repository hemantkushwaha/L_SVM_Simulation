import { useState } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, ExternalLink, HelpCircle } from 'lucide-react';
import { DEFAULT_PYTHON_CODE } from '../utils/pyodideRunner';

interface CodeEditorProps {
  customCode: string;
  onChangeCustomCode: (code: string) => void;
  onRunCustomCode: () => void;
  isCalculating: boolean;
}

export default function CodeEditor({
  customCode,
  onChangeCustomCode,
  onRunCustomCode,
  isCalculating,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(customCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    onChangeCustomCode(DEFAULT_PYTHON_CODE);
    setIsEditable(false);
  };

  return (
    <div className="flex flex-col bg-[#1e1e2e] border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-100 font-mono text-xs h-full">
      {/* Code Editor Header */}
      <div className="flex items-center justify-between bg-[#181825] px-4 py-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">svm_simulator.py</span>
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
            Pyodide WASM
          </span>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Copy script"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Reset default script"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code Editor Explanation banner */}
      <div className="bg-[#252538] px-4 py-2.5 border-b border-slate-800 text-[10px] leading-relaxed text-slate-300">
        <div className="flex items-start space-x-2">
          <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-white font-semibold">Educational Sandboxed Python:</span> This code executes inside your browser using WebAssembly. Feel free to toggle <button onClick={() => setIsEditable(!isEditable)} className="text-emerald-400 underline font-bold hover:text-emerald-300">Edit Mode</button> to modify SVM parameters or preprocessing, and click <span className="text-emerald-400 font-semibold">"Execute Script"</span>.
          </div>
        </div>
      </div>

      {/* Code Body */}
      <div className="relative flex-1 min-h-[300px] flex flex-col">
        <textarea
          value={customCode}
          onChange={(e) => onChangeCustomCode(e.target.value)}
          readOnly={!isEditable}
          className={`w-full flex-1 p-4 bg-[#1e1e2e] text-slate-200 outline-none resize-none font-mono text-[11px] leading-relaxed select-text ${
            isEditable ? 'ring-2 ring-emerald-500/20 focus:bg-[#1b1b2a]' : 'opacity-85'
          }`}
          style={{ whiteSpace: 'pre', overflowX: 'auto' }}
        />
        
        {!isEditable && (
          <div className="absolute inset-0 bg-[#1e1e2e]/25 backdrop-blur-[0.5px] pointer-events-none flex items-center justify-center">
            <button
              onClick={() => setIsEditable(true)}
              className="px-4 py-2 bg-[#2d2d3d]/90 hover:bg-[#3d3d4d] border border-slate-700/60 text-slate-200 rounded-xl font-bold shadow-lg text-xs pointer-events-auto transition-all transform hover:scale-[1.03] cursor-pointer"
            >
              Enable Edit Mode to Hack the Code
            </button>
          </div>
        )}
      </div>

      {/* Editor Controls Footer */}
      <div className="bg-[#181825] px-4 py-3.5 border-t border-slate-800 flex justify-between items-center">
        <a 
          href="https://scikit-learn.org/stable/modules/generated/sklearn.svm.SVC.html" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>Scikit-learn SVC Documentation</span>
          <ExternalLink className="w-3 h-3 ml-1" />
        </a>

        {isEditable && (
          <button
            onClick={onRunCustomCode}
            disabled={isCalculating}
            className="flex items-center bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/10 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
            {isCalculating ? 'Computing...' : 'Execute Script'}
          </button>
        )}
      </div>
    </div>
  );
}
