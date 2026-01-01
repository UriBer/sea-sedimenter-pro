import { SessionResult, RatioResult } from '../types';
import { getKFactor } from '../utils/kFactor';

export class RatioCalculator {
  static calculate(base: SessionResult, final: SessionResult): RatioResult {
    const Wb = base.fixedValue;
    const Wf = final.fixedValue;
    const notes: string[] = [];

    if (Wb <= 0) {
        notes.push("Base weight <= 0. Cannot compute ratio.");
        // Return mostly empty result with NaN
        return {
            Wbase: base,
            Wfinal: final,
            ratio: 0,
            percent: 0,
            sigmaRatio1Sigma: 0,
            errorBand95Ratio: 0,
            errorBand95Percent: 0,
            relativeErrorPercent95: 0,
            k95: 2,
            nEff: 0,
            notes
        };
    }

    // Ratio = (Wb - Wf) / Wb = 1 - Wf/Wb
    const ratio = (Wb - Wf) / Wb;
    const percent = 100 * ratio;

    // Uncertainty Propagation
    // Partial dR/dWb = Wf / Wb^2
    // Partial dR/dWf = -1 / Wb
    
    const sigmaWb = base.totalUncertainty1Sigma;
    const sigmaWf = final.totalUncertainty1Sigma;

    const term1 = (Wf / (Wb * Wb)) * sigmaWb;
    const term2 = (1 / Wb) * sigmaWf;
    
    const sigmaRatio1Sigma = Math.sqrt(Math.pow(term1, 2) + Math.pow(term2, 2));

    // Effective n for k-factor
    const nEff = Math.min(base.nTrim, final.nTrim);
    const k95 = getKFactor(nEff);

    const errorBand95Ratio = k95 * sigmaRatio1Sigma;
    const errorBand95Percent = 100 * errorBand95Ratio;
    
    const relativeErrorPercent95 = (errorBand95Percent / Math.abs(percent)) * 100;

    if (nEff < 3) {
        notes.push("Low effective sample size. Uncertainty band is wide.");
    }

    return {
        Wbase: base,
        Wfinal: final,
        ratio,
        percent,
        sigmaRatio1Sigma,
        errorBand95Ratio,
        errorBand95Percent,
        relativeErrorPercent95,
        k95,
        nEff,
        notes
    };
  }
}
