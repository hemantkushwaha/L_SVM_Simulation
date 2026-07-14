import { useState } from 'react';
import { LabTask, SVMParams, DatasetPreset, SVMResult, Point } from '../types';
import { BookOpen, CheckCircle, Download, Award, AlertCircle, FileText, Check } from 'lucide-react';

interface LabExercisesProps {
  params: SVMParams;
  points: Point[];
  result: SVMResult | null;
  onApplyExerciseSetup: (preset: DatasetPreset, kernelParams: Partial<SVMParams>) => void;
}

export default function LabExercises({
  params,
  points,
  result,
  onApplyExerciseSetup,
}: LabExercisesProps) {
  const [activeTab, setActiveTab] = useState<string>('task-1');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const labTasks: LabTask[] = [
    {
      id: 'task-1',
      title: 'Experiment 1: The Soft-Margin Regularization (C)',
      shortDescription: 'Discover how the C parameter controls the width of the SVM margin and tolerance for errors.',
      preset: 'linear-unsep',
      targetKernel: 'linear',
      targetC: 0.01,
      description: `In soft-margin SVM, the parameter **C** controls the trade-off between the width of the margin and the training error. 
      - A **small C** allows some training points to lie inside the margins or even be misclassified. This gives a **wider, more generalizable margin**.
      - A **large C** heavily penalizes any misclassification, forcing the margin to narrow to accommodate individual outliers, which can lead to **overfitting**.`,
      guidedQuestions: [
        {
          id: 'q1_1',
          question: 'Set the kernel to Linear. Load the experiment preset (Overlapping clusters) and test C = 0.01, C = 1.0, and C = 1000.0. What happens to the margin width as C increases?',
          placeholder: 'Write your observations about the margin line distance...',
        },
        {
          id: 'q1_2',
          question: 'Look at the Support Vectors (halo highlighted points) for C = 0.01 vs C = 1000.0. Why are there so many more support vectors when C is small?',
          placeholder: 'Explain the relation between margin violations and support vectors...',
        },
      ],
    },
    {
      id: 'task-2',
      title: 'Experiment 2: Radial Basis Function (RBF) & Gamma (γ)',
      shortDescription: 'Investigate how Gamma alters the local influence of individual points, causing overfitting or underfitting.',
      preset: 'moons',
      targetKernel: 'rbf',
      targetC: 1.0,
      targetGamma: 10.0,
      description: `The **RBF kernel** uses a Gaussian formula exp(-γ||x - y||²) to map points into infinite-dimensional space. The parameter **Gamma (γ)** defines how far the influence of a single training point reaches.
      - A **large γ** means the influence is highly localized. The boundary will wrap tightly around individual points (leading to **extreme overfitting**).
      - A **small γ** means the influence extends far, smoothing the boundary (leading to **underfitting** or simpler boundaries).`,
      guidedQuestions: [
        {
          id: 'q2_1',
          question: 'Apply the Moons preset. Test RBF with Gamma = 0.1, Gamma = 1.0, and Gamma = 50.0. Describe how the boundary shape shifts from a simple smooth curve to islands.',
          placeholder: 'Describe the shape of the rose and blue territories...',
        },
        {
          id: 'q2_2',
          question: 'Analyze the Accuracy and F1 scores across these Gamma values. Why is a Gamma that is too high (e.g. 50.0) problematic for general, unseen data, even if training accuracy is high?',
          placeholder: 'Explain generalization error vs training error...',
        },
      ],
    },
    {
      id: 'task-3',
      title: 'Experiment 3: Concentric Circles & Polynomial Degrees',
      shortDescription: 'Use non-linear kernels to separate concentric class shapes that are impossible for linear models.',
      preset: 'circles',
      targetKernel: 'poly',
      targetC: 1.0,
      targetDegree: 2,
      description: `Concentric ring datasets are **linearly inseparable in 2D space**. 
      - If you try a **Linear Kernel** here, the model will entirely fail, achieving near 50% accuracy.
      - By using a **Polynomial Kernel of degree 2**, the SVM maps the points using quadratic combinations (x², y², xy), transforming concentric circles into an easily separable elliptical paraboloid in 3D feature space.`,
      guidedQuestions: [
        {
          id: 'q3_1',
          question: 'First select Linear Kernel on the Concentric Circles preset. Note the accuracy. Then, load the Polynomial kernel of Degree 2. Explain how mapping the data to quadratic dimensions solves this problem.',
          placeholder: 'Explain why a straight line fails, but quadratic boundaries succeed...',
        },
        {
          id: 'q3_2',
          question: 'Increase the Polynomial Degree to 7. How does the shape of the boundary deform? What are the dangers of choosing an unnecessarily high degree?',
          placeholder: 'Describe the boundary distortions and the risk of overfitting...',
        },
      ],
    },
    {
      id: 'task-4',
      title: 'Experiment 4: Solving Imbalanced Class Engulfment',
      shortDescription: 'Solve imbalanced data bias by weighting cost functions inversely proportional to class sizes.',
      preset: 'imbalanced',
      targetKernel: 'rbf',
      targetC: 10.0,
      targetGamma: 'scale',
      description: `In highly imbalanced datasets, standard SVM minimizes overall error by shifting the decision boundary to engulf the minority class entirely inside the majority margin.
      - With Class Weight = **None**, the SVM may simply ignore the minority class because 3 misclassified points out of 40 are negligible.
      - Setting Class Weight = **Balanced** penalizes mistakes in the minority class inversely proportional to their representation, pushing the boundary back to separate them fairly.`,
      guidedQuestions: [
        {
          id: 'q4_1',
          question: 'Load the Imbalanced Class preset. Turn Class Weight to "None". Where is the decision boundary relative to the 3 minority points (rose squares)?',
          placeholder: 'Are the rose points correctly classified or ignored?',
        },
        {
          id: 'q4_2',
          question: 'Now toggle Class Weight to "Balanced" (keep RBF/Linear parameters same). How does the boundary adapt? What happens to the Precision and Recall metrics?',
          placeholder: 'Describe the movement of the boundary and shifts in recall...',
        },
      ],
    },
  ];

  const handleAnswerChange = (qId: string, text: string) => {
    setAnswers({
      ...answers,
      [qId]: text,
    });
  };

  const handleApplySetup = (task: LabTask) => {
    onApplyExerciseSetup(task.preset, {
      kernel: task.targetKernel,
      C: task.targetC,
      gamma: task.targetGamma ?? 'scale',
      degree: task.targetDegree ?? 3,
    });
    setSuccessMessage(`Loaded preset and hyperparameters for ${task.title}!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const currentTask = labTasks.find((t) => t.id === activeTab) || labTasks[0];

  // Beautiful HTML/PDF Report generation and print
  const handleExportReport = () => {
    // Generate a beautiful report in a new tab formatted for printing
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert("Please allow popups to export your lab report.");
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SVM Machine Learning Lab Report</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            line-height: 1.6;
            margin: 40px;
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 26px;
            font-weight: bold;
            color: #1e1b4b;
            margin: 0;
          }
          .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-top: 5px;
          }
          .meta-grid {
            display: grid;
            grid-template-cols: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .meta-item strong {
            color: #475569;
          }
          .section {
            margin-bottom: 35px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #4f46e5;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 15px;
          }
          .experiment-card {
            background: #fdfdfd;
            border: 1px solid #f1f5f9;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
          }
          .question {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .answer {
            background: #f8fafc;
            border-left: 3px solid #3b82f6;
            padding: 12px 15px;
            font-size: 13.5px;
            font-style: italic;
            color: #334155;
            margin-bottom: 20px;
            white-space: pre-wrap;
          }
          .empty-answer {
            color: #94a3b8;
            font-style: italic;
          }
          .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Support Vector Machine (SVM) Simulation Lab Report</div>
          <div class="subtitle">Completed via WebAssembly Interactive Scikit-learn Sandbox</div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><strong>Student:</strong> Academic Researcher</div>
          <div class="meta-item"><strong>Date:</strong> ${todayStr}</div>
          <div class="meta-item"><strong>Active SVM Kernel:</strong> ${params.kernel.toUpperCase()}</div>
          <div class="meta-item"><strong>Active Parameters:</strong> C = ${params.C.toFixed(3)}, γ = ${params.gamma}, Degree = ${params.degree}</div>
          <div class="meta-item"><strong>Dataset Coordinates Count:</strong> ${points.length} points</div>
          <div class="meta-item"><strong>Fitted Model Accuracy:</strong> ${result ? `${(result.accuracy * 100).toFixed(1)}%` : 'N/A'}</div>
        </div>

        <div class="section">
          <div class="section-title">Lab Experiments & Questionnaires</div>
          
          ${labTasks.map((task) => {
            return `
              <div class="experiment-card">
                <h4 style="margin: 0 0 10px 0; color: #1e1b4b; font-size: 15px;">${task.title}</h4>
                <p style="font-size: 12px; color: #64748b; margin-top: 0;">Preset: ${task.preset.toUpperCase()} | Target Kernel: ${task.targetKernel.toUpperCase()}</p>
                
                ${task.guidedQuestions.map((q) => {
                  const ans = answers[q.id]?.trim();
                  return `
                    <div class="question">${q.question}</div>
                    <div class="answer">${ans ? ans : '<span class="empty-answer">No answer submitted for this experiment task.</span>'}</div>
                  `;
                }).join('')}
              </div>
            `;
          }).join('')}
        </div>

        <div class="footer">
          SVM boundary visualizer designed for interactive Machine Learning Laboratories. Powered by Pyodide WebAssembly & Scikit-learn.
        </div>
        
        <script>
          window.onload = function() {
            // Uncomment to auto trigger print dialogue
            // window.print();
          }
        </script>
      </body>
      </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Tab bar header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center">
          <BookOpen className="w-4.5 h-4.5 mr-1.5 text-[#3b82f6]" />
          Interactive ML Lab Manual
        </h3>
        <button
          onClick={handleExportReport}
          className="flex items-center text-xs font-bold text-white bg-[#3b82f6] border border-[#3b82f6]/30 px-3 py-1.5 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/10 active:scale-95 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export Lab Report
        </button>
      </div>

      {/* Exercises Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-100 pb-1">
        {labTasks.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'border-[#3b82f6] text-[#3b82f6] font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
            }`}
          >
            Exp {t.id.split('-')[1]}
          </button>
        ))}
      </div>

      {/* active tab body */}
      <div className="space-y-4">
        <div className="bg-blue-50/30 border border-blue-100/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
              {currentTask.title}
            </h4>
            <button
              onClick={() => handleApplySetup(currentTask)}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white border border-blue-200/70 px-2.5 py-1 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Load Experiment Setup
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mt-2" dangerouslySetInnerHTML={{ __html: currentTask.description.replace(/\n/g, '<br />') }} />
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-xl flex items-center space-x-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Guided Questions Form */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center">
            <FileText className="w-4 h-4 mr-1 text-slate-500" />
            Student Notebook Questions
          </div>

          {currentTask.guidedQuestions.map((q) => (
            <div key={q.id} className="flex flex-col space-y-1.5 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
              <label className="text-xs font-medium text-slate-700 leading-relaxed">
                {q.question}
              </label>
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder={q.placeholder}
                rows={3}
                className="w-full text-xs bg-white rounded-lg border border-slate-200 p-3 text-slate-700 outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/20 transition-all shadow-inner"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
