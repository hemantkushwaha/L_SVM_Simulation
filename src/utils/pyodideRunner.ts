import { Point, SVMParams, SVMResult } from '../types';

let pyodideInstance: any = null;
let isLoading = false;

export async function initPyodide(onProgress: (status: string) => void): Promise<any> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (isLoading) {
    // Wait until loading completes
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (pyodideInstance) return pyodideInstance;
  }

  isLoading = true;
  try {
    onProgress("Loading Python WebAssembly runtime...");
    
    if (!(window as any).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide script from CDN"));
        document.head.appendChild(script);
      });
    }

    onProgress("Initializing Python kernel...");
    pyodideInstance = await (window as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/",
    });

    onProgress("Installing numpy and scikit-learn (this may take a moment)...");
    await pyodideInstance.loadPackage(["numpy", "scikit-learn"]);

    // Warm up the python environment with basic imports
    await pyodideInstance.runPythonAsync(`
import numpy as np
from sklearn import svm
import time
print("Python machine learning packages loaded successfully!")
`);

    onProgress("Python environment ready!");
  } catch (error) {
    onProgress("Error initializing Python: " + (error as Error).message);
    isLoading = false;
    throw error;
  } finally {
    isLoading = false;
  }

  return pyodideInstance;
}

export function isPyodideReady(): boolean {
  return !!pyodideInstance;
}

// Default Python template code that handles SVM
export const DEFAULT_PYTHON_CODE = `import numpy as np
from sklearn import svm
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import time

def execute_simulation(points_list, params_dict):
    """
    Fits an SVM model and generates grid predictions for boundary visualization.
    
    points_list: list of dicts with keys 'x', 'y', 'label' (-1 or 1)
    params_dict: dict containing SVM hyperparameters
    """
    t_start = time.time()
    
    # 1. Parse and structure the training data
    X = np.array([[p['x'], p['y']] for p in points_list])
    y = np.array([p['label'] for p in points_list])
    
    if len(X) == 0:
        raise ValueError("Dataset is empty. Click on the plot to add points first!")

    # 2. Extract SVM parameters
    kernel = params_dict['kernel']
    C = float(params_dict['C'])
    gamma = params_dict['gamma']
    
    # Handle auto/scale/numeric gamma
    if gamma != 'scale' and gamma != 'auto':
        gamma = float(gamma)
        
    degree = int(params_dict['degree'])
    coef0 = float(params_dict['coef0'])
    
    class_weight = params_dict['class_weight']
    cw = 'balanced' if class_weight == 'balanced' else None
    
    # 3. Initialize and fit the Scikit-learn Support Vector Classifier (SVC)
    clf = svm.SVC(
        kernel=kernel,
        C=C,
        gamma=gamma,
        degree=degree,
        coef0=coef0,
        class_weight=cw
    )
    
    clf.fit(X, y)
    t_fit_end = time.time()
    
    # 4. Model Evaluation & Performance Metrics
    y_pred = clf.predict(X)
    accuracy = float(accuracy_score(y, y_pred))
    
    try:
        precision = float(precision_score(y, y_pred, zero_division=0))
        recall = float(recall_score(y, y_pred, zero_division=0))
        f1 = float(f1_score(y, y_pred, zero_division=0))
    except Exception:
        precision, recall, f1 = 0.0, 0.0, 0.0
        
    tn, fp, fn, tp = 0, 0, 0, 0
    try:
        cm = confusion_matrix(y, y_pred, labels=[-1, 1])
        tn, fp, fn, tp = map(int, cm.ravel())
    except Exception:
        # Fallback metric calculation if confusion matrix fails
        for true_val, pred_val in zip(y, y_pred):
            if true_val == -1 and pred_val == -1: tn += 1
            elif true_val == -1 and pred_val == 1: fp += 1
            elif true_val == 1 and pred_val == -1: fn += 1
            elif true_val == 1 and pred_val == 1: tp += 1
            
    # 5. Extract support vector indices
    support_vectors_idx = clf.support_.tolist()
    
    # 6. Generate the evaluation grid for the decision boundaries
    # We create an 80x80 mesh grid inside the viewport range [-4, 4]
    grid_res = 80
    grid_x = np.linspace(-4.0, 4.0, grid_res)
    grid_y = np.linspace(-4.0, 4.0, grid_res)
    xx, yy = np.meshgrid(grid_x, grid_y)
    grid_points = np.c_[xx.ravel(), yy.ravel()]
    
    # Compute decision boundary confidence score (signed distance to separation hyperplane)
    if hasattr(clf, "decision_function"):
        zz = clf.decision_function(grid_points)
    else:
        zz = clf.predict(grid_points).astype(float)
        
    grid_z = zz.reshape(xx.shape).tolist()
    
    # 7. Assemble the result payload
    payload = {
        'gridZ': grid_z,
        'gridX': grid_x.tolist(),
        'gridY': grid_y.tolist(),
        'supportVectorIndices': support_vectors_idx,
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
        'confusionMatrix': {
            'tn': tn,
            'fp': fp,
            'fn': fn,
            'tp': tp
        },
        'executionTime': (t_fit_end - t_start) * 1000
    }
    
    # Extract linear weights if using a linear kernel (useful for visual analysis)
    if kernel == 'linear' and hasattr(clf, 'coef_'):
        payload['coef'] = clf.coef_[0].tolist()
        payload['intercept'] = float(clf.intercept_[0])
        
    return payload
`;

export async function runSVMSimulation(
  points: Point[],
  params: SVMParams,
  customCode?: string
): Promise<SVMResult> {
  if (!pyodideInstance) {
    throw new Error("Python runtime not initialized. Please wait for load.");
  }

  // Map params to python representation
  const pyParams = {
    kernel: params.kernel,
    C: params.C,
    gamma: params.gamma,
    degree: params.degree,
    coef0: params.coef0,
    class_weight: params.classWeight,
  };

  // Convert JS points array to a format Pyodide can read
  const pyPoints = points.map((p) => ({
    x: p.x,
    y: p.y,
    label: p.label,
  }));

  // Bind parameters to python namespace
  (window as any).pyodide_points = pyPoints;
  (window as any).pyodide_params = pyParams;

  // Set them in Python global space
  pyodideInstance.globals.set("points_js", pyPoints);
  pyodideInstance.globals.set("params_js", pyParams);

  // Execute
  const codeToRun = customCode || DEFAULT_PYTHON_CODE;

  try {
    // We execute the function definition, then we invoke it and retrieve the result as JS
    await pyodideInstance.runPythonAsync(codeToRun);
    const pyResult = await pyodideInstance.runPythonAsync(`
# Convert JS proxies to native python dicts/lists
pts = points_js.to_py()
pms = params_js.to_py()

# Execute the simulation
res = execute_simulation(pts, pms)
import json
json.dumps(res)
`);

    // Parse the JSON representation of python dictionary
    const result: SVMResult = JSON.parse(pyResult);
    return result;
  } catch (err) {
    console.error("Python Execution Error: ", err);
    throw new Error((err as Error).message || "Python script crashed during SVM fitting.");
  }
}
