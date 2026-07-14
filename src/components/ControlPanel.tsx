import { SVMParams, DatasetPreset } from '../types';
import { Sliders, RefreshCw, Sparkles, Layers, BookOpen } from 'lucide-react';

interface ControlPanelProps {
  params: SVMParams;
  onChangeParams: (params: SVMParams) => void;
  onSelectPreset: (preset: DatasetPreset) => void;
  activePreset: DatasetPreset;
  selectedLabel: 1 | -1;
  onChangeSelectedLabel: (label: 1 | -1) => void;
  colorTheme: 'vibrant' | 'classic' | 'contour';
  onChangeColorTheme: (theme: 'vibrant' | 'classic' | 'contour') => void;
  pointsCount: number;
}

export default function ControlPanel({
  params,
  onChangeParams,
  onSelectPreset,
  activePreset,
  selectedLabel,
  onChangeSelectedLabel,
  colorTheme,
  onChangeColorTheme,
  pointsCount,
}: ControlPanelProps) {
  
  const handleParamChange = (key: keyof SVMParams, value: any) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  const kernelDescriptions = {
    linear: 'Separates classes with a straight line. Formula: K(x, y) = xᵀy. Ideal for linearly separable data.',
    rbf: 'Radial Basis Function (Gaussian). Formula: exp(-γ||x - y||²). Creates highly flexible, localized curves.',
    poly: 'Polynomial. Formula: (γxᵀy + c₀)ᵈ. Creates curved boundaries of degree d (ellipses, parabolas, etc.).',
    sigmoid: 'Sigmoid activation kernel. Formula: tanh(γxᵀy + c₀). Similar to neural networks behavior.',
  };

  return (
    <div className="flex flex-col space-y-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
      {/* 1. Dataset Selection Presets */}
      <div>
        <h3 className="flex items-center text-sm font-semibold text-slate-800 mb-3">
          <Layers className="w-4 h-4 mr-1.5 text-indigo-600" />
          Dataset Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'linear-sep', label: 'Linear Separable' },
            { id: 'linear-unsep', label: 'Linear Overlapping' },
            { id: 'circles', label: 'Concentric Circles' },
            { id: 'moons', label: 'Interleaved Moons' },
            { id: 'imbalanced', label: 'Imbalanced Classes' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id as DatasetPreset)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Click Brush Class */}
      <div>
        <h3 className="flex items-center text-sm font-semibold text-slate-800 mb-3">
          <BookOpen className="w-4 h-4 mr-1.5 text-indigo-600" />
          Click Placement Brush
        </h3>
        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
          Select which class is placed when you click on the visual boundary plot.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChangeSelectedLabel(-1)}
            className={`flex items-center justify-center space-x-2 py-2 rounded-xl border text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              selectedLabel === -1
                ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/15 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
            <span>Class -1 (Blue)</span>
          </button>

          <button
            onClick={() => onChangeSelectedLabel(1)}
            className={`flex items-center justify-center space-x-2 py-2 rounded-xl border text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              selectedLabel === 1
                ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/15 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="w-2.5 h-2.5 bg-rose-500 border border-white" />
            <span>Class +1 (Rose)</span>
          </button>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 3. SVM Hyperparameter Sliders */}
      <div>
        <h3 className="flex items-center text-sm font-semibold text-slate-800 mb-3">
          <Sliders className="w-4 h-4 mr-1.5 text-indigo-600" />
          SVM Hyperparameters
        </h3>

        <div className="space-y-4">
          {/* Kernel Type */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-600">Kernel Function</label>
            </div>
            <select
              value={params.kernel}
              onChange={(e) => handleParamChange('kernel', e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="linear">Linear Kernel</option>
              <option value="rbf">RBF Kernel (Radial Basis)</option>
              <option value="poly">Polynomial Kernel</option>
              <option value="sigmoid">Sigmoid Kernel</option>
            </select>
            <p className="text-[11px] text-slate-400 bg-slate-50/50 p-2 border border-slate-100 rounded-lg leading-normal">
              {kernelDescriptions[params.kernel]}
            </p>
          </div>

          {/* Regularization C */}
          <div className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600">Regularization (C)</span>
              <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {params.C.toFixed(params.C < 1 ? 3 : 1)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Controls trade-off between margin width and classification error. Large C tries to classify all training points correctly (danger of overfitting). Small C permits some margin violations for a wider margin (better generalizability).
            </p>
            <input
              type="range"
              min="-3"
              max="4"
              step="0.5"
              value={Math.log10(params.C)}
              onChange={(e) => handleParamChange('C', Math.pow(10, parseFloat(e.target.value)))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 px-1 font-mono">
              <span>0.001 (Soft)</span>
              <span>1.0 (Default)</span>
              <span>10000.0 (Hard)</span>
            </div>
          </div>

          {/* Gamma Coefficient (Only for non-linear kernels) */}
          {params.kernel !== 'linear' && (
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Kernel Coefficient (Gamma γ)</span>
                <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
                  {typeof params.gamma === 'number' ? params.gamma.toFixed(3) : params.gamma}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Defines how far the influence of a single training point reaches. Large Gamma means localized effects (high variance, tightly wraps around points). Small Gamma means wide reach (high bias, smooth boundary).
              </p>
              
              <div className="flex items-center space-x-2 mt-1">
                <button
                  onClick={() => handleParamChange('gamma', 'scale')}
                  className={`flex-1 text-[10px] font-medium py-1.5 rounded-lg border cursor-pointer ${
                    params.gamma === 'scale'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  scale (1 / (n_features * Var))
                </button>
                <button
                  onClick={() => handleParamChange('gamma', 'auto')}
                  className={`flex-1 text-[10px] font-medium py-1.5 rounded-lg border cursor-pointer ${
                    params.gamma === 'auto'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  auto (1 / n_features)
                </button>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <span className="text-[10px] text-slate-400 font-medium">Custom:</span>
                <input
                  type="range"
                  min="-3"
                  max="2"
                  step="0.5"
                  value={typeof params.gamma === 'number' ? Math.log10(params.gamma) : 0}
                  onChange={(e) => handleParamChange('gamma', Math.pow(10, parseFloat(e.target.value)))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>0.001 (Smooth)</span>
                <span>1.0</span>
                <span>100.0 (Local/Tight)</span>
              </div>
            </div>
          )}

          {/* Polynomial Degree d (Only for poly kernel) */}
          {params.kernel === 'poly' && (
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Polynomial Degree (d)</span>
                <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
                  {params.degree}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Degree of the polynomial kernel function. Higher degree allows more complex, twisting shapes but increases susceptibility to overfitting.
              </p>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={params.degree}
                onChange={(e) => handleParamChange('degree', parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>1 (Linear)</span>
                <span>4 (Curved)</span>
                <span>8 (Extremely Complex)</span>
              </div>
            </div>
          )}

          {/* Coef0 (Only for poly and sigmoid kernels) */}
          {(params.kernel === 'poly' || params.kernel === 'sigmoid') && (
            <div className="flex flex-col space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Independent Term (coef0 / c₀)</span>
                <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
                  {params.coef0.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Independent constant term c₀ in kernel formula. Shifts the polynomial/sigmoid scale.
              </p>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={params.coef0}
                onChange={(e) => handleParamChange('coef0', parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 px-1 font-mono">
                <span>-5.0</span>
                <span>0.0 (Neutral)</span>
                <span>5.0</span>
              </div>
            </div>
          )}

          {/* Class Weights */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Class Weight Balancing</label>
            <p className="text-[10px] text-slate-400 leading-normal">
              Useful for imbalanced datasets. 'Balanced' automatically adjusts weights inversely proportional to class frequencies to penalize mistakes in minority classes.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => handleParamChange('classWeight', 'none')}
                className={`py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                  params.classWeight === 'none'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                None (Default)
              </button>
              <button
                onClick={() => handleParamChange('classWeight', 'balanced')}
                className={`py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                  params.classWeight === 'balanced'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Balanced Weights
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 4. Display preferences */}
      <div>
        <h3 className="flex items-center text-sm font-semibold text-slate-800 mb-3">
          <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
          Visualization Theme
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'vibrant', label: 'Vibrant' },
            { id: 'contour', label: 'Scientific' },
            { id: 'classic', label: 'Flat' },
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => onChangeColorTheme(theme.id as 'vibrant' | 'classic' | 'contour')}
              className={`py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
                colorTheme === theme.id
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
