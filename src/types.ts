// --- SENSOR TYPES ---
export interface IMUSnapshot {
  ax: number;       // Smoothed X acceleration
  ay: number;       // Smoothed Y acceleration
  azRaw: number;    // Smoothed Z acceleration (device Z)
  az: number;       // Projected Vertical acceleration (m/s^2)
  azRms: number;    // RMS of az over window
  timestamp: number;
}

export interface SessionSensorStats {
  durationMs: number;
  avgAx: number;
  avgAy: number;
  avgAz: number;
  maxAz: number;
  minAz: number;
  avgRms: number;
  maxRms: number;
}

// --- TARE TYPES ---
export interface TareSample {
  id: string;
  value: number; // raw grams
  snapshot?: IMUSnapshot; // undefined if sensors OFF
  adjustedValue?: number; // calculated after fit
}

export interface TareModel {
  isReady: boolean;
  method: 'basic' | 'imu-regression' | 'single-shot';
  // Basic parameters
  bias: number;
  tareUncertainty: number; // 1-sigma (T)
  
  // Regression parameters (if method === 'imu-regression')
  slopeK?: number;  // grams per (m/s^2)
  residualsSigma?: number; // 1-sigma of residuals
  
  // Diagnostics
  n: number;
  rSquared?: number;
}

// --- MEASUREMENT TYPES ---
export interface Measurement {
  id: string;
  rawReading: number;
  snapshot?: IMUSnapshot;
  
  // Computed
  modelBiasUsed: number; // The specific bias subtracted (constant b OR b + k*az)
  adjustedValue: number; // raw - modelBiasUsed
}

export interface SessionResult {
  kind: 'base' | 'final';
  measurements: Measurement[];
  fixedValue: number;    // The final mass estimate (grams)
  
  // Breakdown
  meanRaw: number;       // Mean of raw readings (trimmed set)
  meanImuAdj: number;    // Mean of IMU corrections (trimmed set)

  // Sensor Stats for this session
  sensorStats?: SessionSensorStats;

  // Statistics
  nTrim: number;
  stdDev: number;        // Sample std dev
  stdError: number;      // SE = s / sqrt(n)
  tareSigma: number;     // T
  sigmaTotal: number;    // sqrt(SE^2 + T^2)
  
  kFactor: number;       // interpolated t-value
  errorBand95: number;   // k * sigmaTotal
  
  bias: number;          // Nominal bias (for display)
  imuSlope?: number;     // If IMU was used, store slope k
  notes?: string[];
}

export interface RatioResult {
  Wbase: SessionResult;
  Wfinal: SessionResult;

  ratio: number; // (Wb - Wf)/Wb
  percent: number; // 100*ratio
  grossPercent: number; // 100 * (RawBase - RawFinal)/RawBase

  // uncertainty propagation
  sigmaRatio1Sigma: number;
  errorBand95Ratio: number;
  errorBand95Percent: number;
  relativeErrorPercent95: number; 
  k95: number; // interpolated factor used
  nEff: number; // effective n used for k interpolation
  
  isSingleShot: boolean; // Flag for Gross Only mode
  notes?: string[];
}

// --- REPORT TYPES ---
export interface ReportMetadata {
  operatorName: string;
  date: string;
  vesselName: string;
  loadDate: string;
  loadNumber: string;
  dredgeArea: string;
}

export interface SavedReport extends ReportMetadata {
  id: string;
  createdAt: number;
  result: RatioResult;
}