import { ManualMeasurement, SessionResult, SessionKind } from '../types';
import { getKFactor } from '../utils/kFactor';

export class SessionCalculator {
  static calculate(
    kind: SessionKind,
    measurements: ManualMeasurement[],
    lockedBias: number,
    lockedTareUnc95: number,
    trimFraction: number = 0.10
  ): SessionResult {
    const notes: string[] = [];
    const nTotal = measurements.length;

    // 1. Filter invalid values
    const validMeasurements = measurements.filter(m => !isNaN(m.correctedValue) && m.correctedValue > 0);
    
    // 2. Build corrected array X
    const sortedMeasurements = [...validMeasurements].sort((a, b) => a.correctedValue - b.correctedValue);
    const X = sortedMeasurements.map(m => m.correctedValue);
    const nValid = X.length;

    // 3. Trim
    let drop = 0;
    let Xtrim = X;
    
    if (nValid > 2) {
      drop = Math.floor(trimFraction * nValid);
      if (nValid - 2 * drop < 1) {
        drop = 0;
      } else {
        Xtrim = X.slice(drop, nValid - drop);
      }
    }
    
    const nTrim = Xtrim.length;

    // 4. Central Tendency
    const sum = Xtrim.reduce((acc, val) => acc + val, 0);
    const mean = nTrim > 0 ? sum / nTrim : 0;
    
    let median = 0;
    if (nTrim > 0) {
        const mid = Math.floor(nTrim / 2);
        if (nTrim % 2 === 0) {
            median = (Xtrim[mid - 1] + Xtrim[mid]) / 2;
        } else {
            median = Xtrim[mid];
        }
    }

    const trimmedMean = mean;
    // Rule: Use trimmed mean if nTrim >= 3, else median
    const fixedValue = nTrim >= 3 ? trimmedMean : median;

    // 5. Spread (Sample Std Dev)
    let stdDev = 0;
    if (nTrim >= 2) {
      const sumSqDiff = Xtrim.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
      stdDev = Math.sqrt(sumSqDiff / (nTrim - 1));
    }

    // 6. Standard Error (Random Uncertainty)
    const stdError = (nTrim >= 2) ? stdDev / Math.sqrt(nTrim) : 0;

    // 7. Tare Sigma
    const tareSigma = lockedTareUnc95 / 2;

    // 8. Total 1-Sigma
    const totalUncertainty1Sigma = Math.sqrt(Math.pow(stdError, 2) + Math.pow(tareSigma, 2));

    // 9. 95% Band using interpolated k
    const k95 = getKFactor(nTrim);
    const errorBand95 = k95 * totalUncertainty1Sigma;

    // 10. Confidence / Notes
    let confidence = 0.3;
    if (nTrim >= 2) confidence = 0.5;
    if (nTrim >= 3) confidence = 0.7;
    if (nTrim >= 6) confidence = 0.85;
    if (nTrim >= 10) confidence = 0.95;

    if (nTotal < 3) notes.push("Low sample count (n<3).");
    if (drop > 0) notes.push(`Trimmed ${drop * 2} outlier(s).`);
    if (nValid < nTotal) notes.push(`${nTotal - nValid} invalid value(s) ignored.`);

    return {
      kind,
      measurements,
      nTotal,
      nTrim,
      trimFraction,
      bias: lockedBias,
      tareUncertainty95: lockedTareUnc95,
      tareSigma,
      mean,
      median,
      trimmedMean,
      fixedValue,
      stdDev,
      stdError,
      totalUncertainty1Sigma,
      errorBand95,
      confidence,
      notes
    };
  }
}
