import { Measurement, SessionResult, TareModel, IMUSnapshot, SessionSensorStats } from '../types';
import { calculateMean, calculateMedian, calculateStdDev } from '../utils/math';
import { getKFactorFromN } from '../utils/kFactor';

export class MeasurementSession {
  private measurements: Measurement[] = [];
  
  getMeasurements(): Measurement[] {
    return [...this.measurements];
  }

  addMeasurement(val: number, tareModel: TareModel, snapshot?: IMUSnapshot): Measurement[] {
    let biasUsed = tareModel.bias;
    let adjusted = val - biasUsed;

    if (tareModel.method === 'imu-regression' && snapshot && tareModel.slopeK !== undefined) {
      // Dynamic bias: b + k * az
      // We want to store the "correction" separately conceptually, but modelBiasUsed captures total subtraction.
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

  calculateResult(tareModel: TareModel, sensorStats?: SessionSensorStats, trimFraction: number = 0.10): Omit<SessionResult, 'kind'> {
    const n = this.measurements.length;
    
    // Sort measurements by adjusted value to trim outliers
    // We trim based on the 'Net' value to remove statistical outliers in the final result
    const sortedMeasurements = [...this.measurements].sort((a,b) => a.adjustedValue - b.adjustedValue);
    
    // Trimming
    let trimCount = Math.floor(trimFraction * n);
    // Ensure we have at least 1 sample
    if (n - 2 * trimCount < 1) trimCount = 0;
    
    const trimmedMeasurements = sortedMeasurements.slice(trimCount, n - trimCount);
    const nTrim = trimmedMeasurements.length;
    const trimmedValues = trimmedMeasurements.map(m => m.adjustedValue);

    // Central Value (Net)
    const mean = calculateMean(trimmedValues);
    const median = calculateMedian(trimmedValues);
    const fixedValue = nTrim >= 3 ? mean : median;

    // --- Component Breakdown ---
    // 1. Raw Mean
    const rawValues = trimmedMeasurements.map(m => m.rawReading);
    const meanRaw = calculateMean(rawValues);

    // 2. IMU Adjustment Mean
    // Correction = modelBiasUsed - nominalBias
    // If no IMU, this is 0.
    const imuCorrections = trimmedMeasurements.map(m => m.modelBiasUsed - tareModel.bias);
    const meanImuAdj = calculateMean(imuCorrections);

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
      meanRaw,
      meanImuAdj,
      nTrim,
      stdDev,
      stdError,
      tareSigma,
      sigmaTotal,
      kFactor,
      errorBand95,
      bias: tareModel.bias,
      sensorStats,
      imuSlope: tareModel.slopeK
    };
  }

  clear() {
    this.measurements = [];
  }
}