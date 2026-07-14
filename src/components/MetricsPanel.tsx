import { SVMResult } from '../types';
import { Award, Zap, Percent, Activity } from 'lucide-react';

interface MetricsPanelProps {
  result: SVMResult | null;
  pointsCount: number;
}

export default function MetricsPanel({ result, pointsCount }: MetricsPanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-2xl p-6 text-center h-full min-h-[180px]">
        <Activity className="w-8 h-8 text-slate-300 animate-pulse mb-2" />
        <span className="text-sm font-semibold text-slate-400">Waiting for data...</span>
        <p className="text-xs text-slate-300 max-w-xs mt-1">
          Place at least 1 point of each class to fit the SVM model.
        </p>
      </div>
    );
  }

  const {
    accuracy,
    precision,
    recall,
    f1,
    confusionMatrix,
    executionTime,
    coef,
    intercept,
  } = result;

  // Format linear formula
  let formula = '';
  if (coef && coef.length >= 2 && intercept !== undefined) {
    const w1 = coef[0];
    const w2 = coef[1];
    const b = intercept;
    
    // w1 * x + w2 * y + b = 0
    const w1_str = w1 >= 0 ? `${w1.toFixed(3)}x` : `- ${Math.abs(w1).toFixed(3)}x`;
    const w2_str = w2 >= 0 ? `+ ${w2.toFixed(3)}y` : `- ${Math.abs(w2).toFixed(3)}y`;
    const b_str = b >= 0 ? `+ ${b.toFixed(3)}` : `- ${Math.abs(b).toFixed(3)}`;
    
    formula = `wᵀx + b = 0  ⇒  ${w1_str} ${w2_str} ${b_str} = 0`;
  }

  // Helper to color confusion matrix cells
  const getMatrixCellColor = (value: number, total: number, isCorrect: boolean) => {
    if (total === 0) return 'bg-slate-50 text-slate-400';
    const intensity = Math.min(100, Math.round((value / total) * 100));
    
    if (isCorrect) {
      if (intensity === 0) return 'bg-emerald-50/20 text-slate-400';
      if (intensity < 30) return 'bg-emerald-50 text-emerald-700';
      if (intensity < 70) return 'bg-emerald-100 text-emerald-800 font-semibold';
      return 'bg-emerald-200 text-emerald-950 font-bold';
    } else {
      if (intensity === 0) return 'bg-rose-50/25 text-slate-400';
      if (intensity < 30) return 'bg-rose-50 text-rose-700';
      if (intensity < 70) return 'bg-rose-100 text-rose-800 font-semibold';
      return 'bg-rose-200 text-rose-950 font-bold';
    }
  };

  const totalPoints = confusionMatrix.tn + confusionMatrix.fp + confusionMatrix.fn + confusionMatrix.tp;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
      {/* 1. Metrics Grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3.5 flex items-center">
          <Award className="w-4 h-4 mr-1.5 text-indigo-600" />
          Model Performance Metrics
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Accuracy', val: accuracy, desc: 'Overall accuracy of predictions' },
            { label: 'Precision', val: precision, desc: 'TP / (TP + FP)' },
            { label: 'Recall', val: recall, desc: 'TP / (TP + FN)' },
            { label: 'F1 Score', val: f1, desc: 'Harmonic mean of precision and recall' },
          ].map((m) => (
            <div key={m.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center" title={m.desc}>
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">
                {m.label}
              </div>
              <div className="text-xl font-bold font-mono text-indigo-600">
                {(m.val * 100).toFixed(1)}%
              </div>
              {/* Progress visual bar */}
              <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${m.val * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Confusion Matrix & Linear Formula */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Confusion Matrix */}
        <div className="flex flex-col">
          <div className="text-xs font-semibold text-slate-700 mb-2.5">
            Confusion Matrix (Class -1 / Class +1)
          </div>
          
          <div className="grid grid-cols-3 gap-1 text-[11px]">
            {/* Headers */}
            <div />
            <div className="text-center font-semibold text-slate-500 pb-1">Predicted -1</div>
            <div className="text-center font-semibold text-slate-500 pb-1">Predicted +1</div>

            {/* Actual -1 row */}
            <div className="font-semibold text-slate-500 flex items-center pr-2 justify-end">
              Actual -1
            </div>
            <div className={`p-3 rounded-lg text-center border border-slate-100 ${getMatrixCellColor(confusionMatrix.tn, totalPoints, true)}`}>
              <div className="text-sm font-bold font-mono">{confusionMatrix.tn}</div>
              <div className="text-[9px] opacity-75 uppercase">True Neg (TN)</div>
            </div>
            <div className={`p-3 rounded-lg text-center border border-slate-100 ${getMatrixCellColor(confusionMatrix.fp, totalPoints, false)}`}>
              <div className="text-sm font-bold font-mono">{confusionMatrix.fp}</div>
              <div className="text-[9px] opacity-75 uppercase">False Pos (FP)</div>
            </div>

            {/* Actual +1 row */}
            <div className="font-semibold text-slate-500 flex items-center pr-2 justify-end">
              Actual +1
            </div>
            <div className={`p-3 rounded-lg text-center border border-slate-100 ${getMatrixCellColor(confusionMatrix.fn, totalPoints, false)}`}>
              <div className="text-sm font-bold font-mono">{confusionMatrix.fn}</div>
              <div className="text-[9px] opacity-75 uppercase">False Neg (FN)</div>
            </div>
            <div className={`p-3 rounded-lg text-center border border-slate-100 ${getMatrixCellColor(confusionMatrix.tp, totalPoints, true)}`}>
              <div className="text-sm font-bold font-mono">{confusionMatrix.tp}</div>
              <div className="text-[9px] opacity-75 uppercase">True Pos (TP)</div>
            </div>
          </div>
        </div>

        {/* Support Vectors & Decision Line weights */}
        <div className="flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Run speed metrics */}
            <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 border border-slate-100 rounded-xl">
              <span className="flex items-center text-slate-500 font-medium">
                <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                Solver Time
              </span>
              <span className="font-mono text-slate-700 font-bold">
                {executionTime.toFixed(1)} ms
              </span>
            </div>

            {/* Linear Equation Details */}
            {formula ? (
              <div className="bg-indigo-50/40 p-3 border border-indigo-100 rounded-xl space-y-1">
                <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">
                  Separating Hyperplane Line Equation
                </div>
                <div className="font-mono text-[11px] text-slate-700 font-bold select-all">
                  {formula}
                </div>
                <div className="text-[9px] text-slate-400 mt-1">
                  Slope: <span className="font-mono font-semibold text-slate-600">{(-(coef[0]/coef[1])).toFixed(3)}</span>, 
                  Y-Intercept: <span className="font-mono font-semibold text-slate-600">{(-(intercept/coef[1])).toFixed(3)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 border border-slate-100 rounded-xl text-[10px] text-slate-400 leading-normal">
                <span className="font-semibold text-slate-600 block mb-0.5">Non-linear Separation</span>
                The active kernel maps the 2D input space into a high-dimensional Hilbert feature space where separation is linear. The resulting boundary in our 2D viewport is non-linear.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
