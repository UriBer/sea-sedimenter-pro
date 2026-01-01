// Two-sided 95% t-distribution table
// [degrees_of_freedom, t_value]
const T_TABLE: [number, number][] = [
  [1, 12.706], [2, 4.303], [3, 3.182], [4, 2.776], [5, 2.571],
  [6, 2.447], [7, 2.365], [8, 2.306], [9, 2.262], [10, 2.228],
  [12, 2.179], [15, 2.131], [20, 2.086], [25, 2.060], [30, 2.042],
  [Infinity, 1.960]
];

/**
 * Interpolates the t-value for 95% confidence based on degrees of freedom (df).
 * For measuring n samples, df = n - 1.
 */
export function getTFactor95(df: number): number {
  if (df < 1) return 12.706; // Fallback for n=1 (technically undefined, use n=2 conservative)
  
  // Exact match or brackets
  for (let i = 0; i < T_TABLE.length - 1; i++) {
    const [dfLow, tLow] = T_TABLE[i];
    const [dfHigh, tHigh] = T_TABLE[i+1];
    
    if (df === dfLow) return tLow;
    if (df === dfHigh) return tHigh;
    
    if (df > dfLow && df < dfHigh) {
      if (dfHigh === Infinity) {
        // If we are above 30 but finite, assuming 1.96 is acceptable for MVP
        // or we could interpolate between 2.042 and 1.96 based on 1/df, but linear to 60 is fine.
        return df > 60 ? 1.96 : tLow; 
      }
      
      // Linear interpolation
      const ratio = (df - dfLow) / (dfHigh - dfLow);
      return tLow + ratio * (tHigh - tLow);
    }
  }
  
  return 1.96; // Fallback
}

export function getKFactorFromN(n: number): number {
  return getTFactor95(Math.max(1, n - 1));
}