// t-distribution table (two-sided 95%)
// df -> t (degrees of freedom -> t-value)
// Source: standard t-distribution tables
const T_TABLE: [number, number][] = [
  [1, 12.706], [2, 4.303], [3, 3.182], [4, 2.776], [5, 2.571],
  [6, 2.447], [7, 2.365], [8, 2.306], [9, 2.262], [10, 2.228],
  [12, 2.179], [15, 2.131], [20, 2.086], [25, 2.060], [30, 2.042],
  [Infinity, 1.960]
];

export function getKFactor(n: number): number {
  if (n <= 1) return 2.0; // Fallback for single sample (technically undefined, but 2.0 is conservative MVP placeholder)
  const df = n - 1;
  
  // Find brackets
  for (let i = 0; i < T_TABLE.length - 1; i++) {
    const [dfLow, tLow] = T_TABLE[i];
    const [dfHigh, tHigh] = T_TABLE[i+1];
    
    if (df >= dfLow && df <= dfHigh) {
        if (dfHigh === Infinity) {
            // For df >= 30, we gently approach 1.96. 
            // At df=30, t=2.042. 
            // For MVP, if n > 60, use 1.96, else use the value for 30 (conservative).
            return n > 60 ? 1.96 : tLow; 
        }
        
        // Linear interpolation
        const ratio = (df - dfLow) / (dfHigh - dfLow);
        return tLow + ratio * (tHigh - tLow);
    }
  }
  
  return 1.96; // Should not reach here given Infinity in table
}
