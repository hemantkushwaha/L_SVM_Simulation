import { useState, useEffect } from 'react';
import { Point, SVMParams, SVMResult, DatasetPreset } from './types';
import { generatePreset } from './utils/presets';
import { initPyodide, runSVMSimulation, DEFAULT_PYTHON_CODE, isPyodideReady } from './utils/pyodideRunner';
import SVMPlot from './components/SVMPlot';
import ControlPanel from './components/ControlPanel';
import CodeEditor from './components/CodeEditor';
import MetricsPanel from './components/MetricsPanel';
import LabExercises from './components/LabExercises';
import AICoach from './components/AICoach';
import { Cpu, GraduationCap, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  // 1. Pyodide Initialization States
  const [pyodideReady, setPyodideReady] = useState<boolean>(false);
  const [pyodideStatus, setPyodideStatus] = useState<string>('Initializing WebAssembly compiler...');
  const [pyodideError, setPyodideError] = useState<string | null>(null);

  // 2. SVM Points & Coordinates States
  const [points, setPoints] = useState<Point[]>([]);
  const [activePreset, setActivePreset] = useState<DatasetPreset>('linear-sep');
  const [selectedLabel, setSelectedLabel] = useState<1 | -1>(-1);

  // 3. SVM Parameters State
  const [params, setParams] = useState<SVMParams>({
    kernel: 'linear',
    C: 1.0,
    gamma: 'scale',
    degree: 3,
    coef0: 0.0,
    classWeight: 'none',
  });

  // 4. Custom Python Code States
  const [customCode, setCustomCode] = useState<string>(DEFAULT_PYTHON_CODE);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // 5. Simulation Outputs
  const [result, setResult] = useState<SVMResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // 6. Theme settings
  const [colorTheme, setColorTheme] = useState<'vibrant' | 'classic' | 'contour'>('vibrant');
  const [activeTab, setActiveTab] = useState<'visuals' | 'code'>('visuals');

  // Trigger Pyodide WebAssembly startup
  useEffect(() => {
    initPyodide(setPyodideStatus)
      .then(() => {
        setPyodideReady(true);
        // Load initial preset
        setPoints(generatePreset('linear-sep'));
      })
      .catch((err) => {
        console.error("Pyodide loading failed:", err);
        setPyodideError((err as Error).message || "Failed to download WebAssembly modules.");
      });
  }, []);

  // Recalculate SVM automatically on parameters/points changes (only when in standard mode)
  useEffect(() => {
    if (!pyodideReady || points.length === 0) {
      setResult(null);
      return;
    }

    // If custom code is edited, we do NOT trigger automatic fits unless they switch back or restore
    if (isCustomMode) {
      return;
    }

    let isSubscribed = true;
    setIsCalculating(true);
    setSimulationError(null);

    const runSimulationAsync = async () => {
      try {
        const res = await runSVMSimulation(points, params, DEFAULT_PYTHON_CODE);
        if (isSubscribed) {
          setResult(res);
        }
      } catch (err) {
        console.error(err);
        if (isSubscribed) {
          setSimulationError((err as Error).message || "Fitting failed.");
        }
      } finally {
        if (isSubscribed) {
          setIsCalculating(false);
        }
      }
    };

    // Debounce recalculations to feel highly responsive during slider drag
    const timer = setTimeout(() => {
      runSimulationAsync();
    }, 60);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [points, params, pyodideReady, isCustomMode]);

  // Handle Point actions
  const handleAddPoint = (x: number, y: number) => {
    const newPoint: Point = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      x,
      y,
      label: selectedLabel,
    };
    setPoints([...points, newPoint]);
    setActivePreset('empty'); // now custom dataset
  };

  const handleUpdatePoint = (id: string, x: number, y: number) => {
    setPoints(points.map((p) => (p.id === id ? { ...p, x, y } : p)));
  };

  const handleDeletePoint = (id: string) => {
    setPoints(points.filter((p) => p.id !== id));
  };

  const handleClearPoints = () => {
    setPoints([]);
    setResult(null);
    setActivePreset('empty');
  };

  const handleSelectPreset = (preset: DatasetPreset) => {
    setActivePreset(preset);
    setPoints(generatePreset(preset));
  };

  // Run Custom Code
  const handleRunCustomCode = async () => {
    if (!pyodideReady) return;
    
    setIsCalculating(true);
    setSimulationError(null);

    try {
      const res = await runSVMSimulation(points, params, customCode);
      setResult(res);
    } catch (err) {
      console.error(err);
      setSimulationError((err as Error).message || "Your custom Python script crashed.");
    } finally {
      setIsCalculating(false);
    }
  };

  // Apply Predefined Laboratory Exercise setups
  const handleApplyExerciseSetup = (preset: DatasetPreset, exerciseParams: Partial<SVMParams>) => {
    // 1. Load data
    setActivePreset(preset);
    setPoints(generatePreset(preset));

    // 2. Set params
    const updatedParams = { ...params, ...exerciseParams };
    setParams(updatedParams);

    // 3. Reset to default python script
    setCustomCode(DEFAULT_PYTHON_CODE);
    setIsCustomMode(false);
    setActiveTab('visuals');
  };

  // Render initialization loading page
  if (!pyodideReady && !pyodideError) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Animated pulsing icon */}
          <div className="relative inline-flex items-center justify-center p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl mb-2 animate-pulse">
            <Cpu className="w-12 h-12 text-indigo-400" />
            <div className="absolute inset-0 rounded-3xl border border-indigo-400/20 animate-ping" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">SVM Simulation Analysis Lab</h1>
            <p className="text-sm text-slate-400">Loading interactive WebAssembly environment...</p>
          </div>

          {/* Loader bar */}
          <div className="relative w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
            <div className="absolute top-0 left-0 bg-indigo-500 h-full w-2/3 rounded-full animate-progress" />
          </div>

          {/* Current action log */}
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl px-4 py-3 text-xs font-mono text-slate-300 inline-block">
            {pyodideStatus}
          </div>

          <p className="text-[11px] text-slate-500 leading-normal max-w-sm mx-auto">
            This ML sandbox runs actual Python and Scikit-learn algorithms entirely client-side using Pyodide WebAssembly. First startup downloads libraries, subsequent interactions are immediate!
          </p>
        </div>
      </div>
    );
  }

  // Render initialization error page
  if (pyodideError) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="max-w-md w-full text-center bg-slate-950 border border-red-500/20 rounded-3xl p-8 space-y-5 shadow-2xl">
          <div className="inline-flex p-3 bg-red-500/10 border border-red-500/25 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Environment Failed to Boot</h2>
            <p className="text-xs text-slate-400">We could not download or initialize the python packages.</p>
          </div>

          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-left font-mono text-xs text-red-400 overflow-x-auto">
            {pyodideError}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-600/15"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Reload & Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Upper Navigation / Header matching Geometric Balance exactly */}
      <header className="sticky top-0 z-10 bg-[#0f172a] text-white border-b-4 border-[#3b82f6] px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-[#3b82f6] p-2 rounded-lg text-white shadow-md shadow-[#3b82f6]/25">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight flex items-center space-x-1">
              <span>SVM</span>
              <span className="text-[#3b82f6] font-light">KernelLab v2.4</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Interactive Support Vector Machine Decision Boundary Visualizer</p>
          </div>
        </div>

        {/* Runtime Status matching design */}
        <div className="flex items-center gap-6">
          <div className="text-xs font-medium text-slate-400">
            STATUS: <span className="text-green-400 font-bold">STABLE</span>
          </div>
          <div className="text-xs font-medium text-slate-400">
            ENGINE: <span className="text-white font-semibold">Scikit-Learn (WASM)</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: SVM Parameters & Preset configurations (cols 4) */}
        <div className="lg:col-span-4 space-y-6">
          <ControlPanel
            params={params}
            onChangeParams={(newParams) => {
              setParams(newParams);
              setIsCustomMode(false); // return to normal mode on slider edit
            }}
            onSelectPreset={handleSelectPreset}
            activePreset={activePreset}
            selectedLabel={selectedLabel}
            onChangeSelectedLabel={setSelectedLabel}
            colorTheme={colorTheme}
            onChangeColorTheme={setColorTheme}
            pointsCount={points.length}
          />
        </div>

        {/* Right Column: Interactive Plot, Metrics, Lab Exercises, AICoach (cols 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Visual/Code View Tab bar */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('visuals')}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'visuals'
                  ? 'border-[#3b82f6] text-[#3b82f6]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Interactive Visualization & Metrics
            </button>
            <button
              onClick={() => {
                setActiveTab('code');
                setIsCustomMode(true);
              }}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'border-[#3b82f6] text-[#3b82f6]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Python Scikit-learn Sandbox
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'visuals' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Plot canvas takes 6 columns */}
              <div className="md:col-span-6">
                <SVMPlot
                  points={points}
                  result={result}
                  onAddPoint={handleAddPoint}
                  onUpdatePoint={handleUpdatePoint}
                  onDeletePoint={handleDeletePoint}
                  onClearPoints={handleClearPoints}
                  selectedLabel={selectedLabel}
                  isCalculating={isCalculating}
                  colorTheme={colorTheme}
                />
              </div>

              {/* Metrics takes 6 columns */}
              <div className="md:col-span-6">
                <MetricsPanel result={result} pointsCount={points.length} />
                
                {simulationError && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-800 text-xs p-4 rounded-2xl flex items-start space-x-2">
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Fitting Error:</span>
                      <span className="font-mono text-[11px] leading-relaxed block">{simulationError}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full">
              <CodeEditor
                customCode={customCode}
                onChangeCustomCode={(code) => {
                  setCustomCode(code);
                  setIsCustomMode(true);
                }}
                onRunCustomCode={handleRunCustomCode}
                isCalculating={isCalculating}
              />
              {simulationError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-800 text-xs p-4 rounded-2xl flex items-start space-x-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Execution Failed:</span>
                    <span className="font-mono text-[11px] leading-relaxed block">{simulationError}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lab Exercises Guide */}
          <LabExercises
            params={params}
            points={points}
            result={result}
            onApplyExerciseSetup={handleApplyExerciseSetup}
          />

          {/* AI Coach assistant for custom explanation */}
          <AICoach points={points} params={params} result={result} />
        </div>
      </main>

      {/* Footer credits */}
      <footer className="bg-white border-t border-slate-200/80 px-6 py-4 mt-12 text-center text-[11px] text-slate-400">
        Designed for academic instruction in machine learning and data science. Powered by Pyodide WebAssembly, Scikit-learn, Express, and Gemini.
      </footer>
    </div>
  );
}
