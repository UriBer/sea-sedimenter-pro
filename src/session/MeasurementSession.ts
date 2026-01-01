import { Measurement, SessionResult, TareModel, IMUSnapshot } from '../types';
import { calculateMean, calculateMedian, calculateStdDev } from '../utils/math';
import { getKFactorFromN } from '../utils/kFactor';

export class MeasurementSession {
  private measurements: Measurement[] = [];
  
  addMeasurement(val: number, tareModel: TareModel, snapshot?: IMUSnapshot): Measurement[] {
    let biasUsed = tareModel.bias;
    let adjusted = val - biasUsed;

    if (tareModel.method === 'imu-regression' && snapshot && tareModel.slopeK !== undefined) {
      // Dynamic bias: b + k * az
      biasUsed = tareModel.bias + (tareModel.slopeK * snapshot.az);
      adjusted = val - biasUsed;
    }

    this.measurements.push({
      id: crypto.randomUUID(),
      rawReading: val,
      snapshot,
      modelBiasUsed: biasUsed,
      adjustedValue: adjusted
    });
    return [...this.measurements];
  }

  removeMeasurement(id: string): Measurement[] {
    this.measurements = this.measurements.filter(m => m.id !== id);
    return [...this.measurements];
  }

  calculateResult(tareModel: TareModel, trimFraction: number = 0.10): Omit<SessionResult, 'kind'> {
    const n = this.measurements.length;
    const values = this.measurements.map(m => m.adjustedValue).sort((a,b) => a-b);
    
    // Trimming
    let trimCount = Math.floor(trimFraction * n);
    // Ensure we have at least 1 sample
    if (n - 2 * trimCount < 1) trimCount = 0;
    
    const trimmedValues = values.slice(trimCount, n - trimCount);
    const nTrim = trimmedValues.length;

    // Central Value
    const mean = calculateMean(trimmedValues);
    const median = calculateMedian(trimmedValues);
    const fixedValue = nTrim >= 3 ? mean : median;

    // Uncertainty
    const stdDev = calculateStdDev(trimmedValues, mean);
    const stdError = nTrim > 0 ? stdDev / Math.sqrt(nTrim) : 0;
    
    // Tare Uncertainty (from model)
    const tareSigma = tareModel.tareUncertainty;

    // Total Sigma
    const sigmaTotal = Math.sqrt(Math.pow(stdError, 2) + Math.pow(tareSigma, 2));

    // K-Factor (interpolate based on effective n)
    const kFactor = getKFactorFromN(nTrim);
    
    const errorBand95 = kFactor * sigmaTotal;

    return {
      measurements: this.measurements,
      fixedValue,
      nTrim,
      stdDev,
      stdError,
      tareSigma,
      sigmaTotal,
      kFactor,
      errorBand95,
      bias: tareModel.bias
    };
  }

  clear() {
    this.measurements = [];
  }
}