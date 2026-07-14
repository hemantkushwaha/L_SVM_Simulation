export interface Point {
  id: string;
  x: number; // usually normalized in [-4, 4]
  y: number; // usually normalized in [-4, 4]
  label: 1 | -1;
}

export interface SVMParams {
  kernel: 'linear' | 'rbf' | 'poly' | 'sigmoid';
  C: number;
  gamma: 'scale' | 'auto' | number;
  degree: number;
  coef0: number;
  classWeight: 'none' | 'balanced';
}

export type DatasetPreset = 'linear-sep' | 'linear-unsep' | 'circles' | 'moons' | 'imbalanced' | 'empty';

export interface SVMResult {
  gridZ: number[][]; // 2D array of decision values of size gridResolution x gridResolution
  gridX: number[];   // 1D array of x coordinates of grid columns
  gridY: number[];   // 1D array of y coordinates of grid rows
  supportVectorIndices: number[];
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  executionTime: number;
  coef?: number[]; // coefficients for linear SVM
  intercept?: number; // intercept for SVM
}

export interface LabTask {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  targetKernel: 'linear' | 'rbf' | 'poly' | 'sigmoid';
  targetC: number;
  targetGamma?: 'scale' | 'auto' | number;
  targetDegree?: number;
  preset: DatasetPreset;
  guidedQuestions: {
    id: string;
    question: string;
    placeholder: string;
  }[];
}
