import { SimpleMeasurement, SimpleMeasurementResult } from '../types';

export class SimpleMeasurementCalculator {
  static calculate(
    measurements: SimpleMeasurement[],
    lockedBias: number,
    lockedTareUnc95: number,
    trimFraction: number = 0.10,
    k95: number = 2
  ): SimpleMeasurementResult {
    const notes: string[] = [];
    const nTotal = measurements.length;

    // 1. Filter invalid values
    const validMeasurements = measurements.filter(m => !isNaN(m.correctedValue));
    
    // 2. Build corrected array X
    // Sort by corrected value for trimming
    const sortedMeasurements = [...validMeasurements].sort((a, b) => a.correctedValue - b.correctedValue);
    const X = sortedMeasurements.map(m => m.correctedValue);
    const nValid = X.length;

    // 3. Trim
    let drop = 0;
    let Xtrim = X;
    
    if (nValid > 2) {
      drop = Math.floor(trimFraction * nValid);
      // Ensure we don't trim everything away
      if (nValid - 2 * drop < 1) {
        drop = 0; // Fallback if trim is too aggressive
      } else {
        Xtrim = X.slice(drop, nValid - drop);
      }
    }
    
    const nTrim = Xtrim.length;

    // 4. Compute Central Tendency
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
    // SE = s / sqrt(n)
    const stdError = (nTrim >= 2) ? stdDev / Math.sqrt(nTrim) : 0;

    // 7. Tare Sigma
    // T = T95 / 2
    const tareSigma = lockedTareUnc95 / 2;

    // 8. Total 1-Sigma
    const totalUncertainty1Sigma = Math.sqrt(Math.pow(stdError, 2) + Math.pow(tareSigma, 2));

    // 9. 95% Band
    const errorBand95 = k95 * totalUncertainty1Sigma;

    // 10. Relative Error
    const relativeError95 = fixedValue !== 0 ? (errorBand95 / Math.abs(fixedValue)) * 100 : 0;

    // 11. Confidence / Notes
    let confidence = 0.3;
    if (nTrim >= 2) confidence = 0.5;
    if (nTrim >= 3) confidence = 0.7;
    if (nTrim >= 6) confidence = 0.85;
    if (nTrim >= 10) confidence = 0.95;

    if (nTotal < 3) {
      notes.push("Low sample count (n<3). Result may be unstable.");
    }
    if (drop > 0) {
      notes.push(`Trimmed ${drop * 2} outlier(s).`);
    }

    return {
      measurementCount: nTotal,
      measurements,
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
      relativeError95,
      nTotal,
      nTrim,
      trimFraction,
      confidence,
      notes
    };
  }
}
