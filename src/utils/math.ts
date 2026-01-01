import { TareSample } from '../types';

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const sumSq = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

// Perform simple linear regression: t = b + k*az
export function fitTareRegression(samples: TareSample[]): { b: number, k: number, sigmaEps: number, r2: number } | null {
  const n = samples.length;
  if (n < 3) return null; // Need at least 3 points for a rudimentary line + error

  const validSamples = samples.filter(s => s.snapshot !== undefined);
  if (validSamples.length < 3) return null;

  const t = validSamples.map(s => s.value);
  const z = validSamples.map(s => s.snapshot!.az);

  const meanT = calculateMean(t);
  const meanZ = calculateMean(z);

  let num = 0;
  let den = 0;
  
  for (let i = 0; i < validSamples.length; i++) {
    const diffZ = z[i] - meanZ;
    num += diffZ * (t[i] - meanT);
    den += diffZ * diffZ;
  }

  if (den === 0) return null; // Variance in Z is zero (perfectly stable phone?)

  const k = num / den;
  const b = meanT - k * meanZ;

  // Residuals
  let sumSqRes = 0;
  let sumSqTot = 0;
  for (let i = 0; i < validSamples.length; i++) {
    const pred = b + k * z[i];
    const res = t[i] - pred;
    sumSqRes += res * res;
    sumSqTot += Math.pow(t[i] - meanT, 2);
  }

  const sigmaEps = Math.sqrt(sumSqRes / (validSamples.length - 2)); // df = n - 2 parameters
  const r2 = 1 - (sumSqRes / sumSqTot);

  return { b, k, sigmaEps, r2 };
}