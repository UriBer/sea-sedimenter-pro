export interface TareSample {
  id: string;
  timestamp: number;
  value: number; // grams
}

export interface TareEstimate {
  count: number;
  biasMedian: number; // b
  tareUncertainty95: number; // T95
  tareSigma: number; // T = T95/2
  method: "halfRange" | "manual" | "none";
  warnings?: string[];
}

export type SessionKind = "base" | "final";

export interface ManualMeasurement {
  id: string;
  timestamp: number;
  kind: SessionKind;
  scaleReading: number; // grams raw
  bias: number; // grams b
  tareUncertainty95: number; // ±g (95%)
  correctedValue: number; // grams = scaleReading - bias
}

export interface SessionResult {
  kind: SessionKind;
  measurements: ManualMeasurement[];
  nTotal: number;
  nTrim: number;
  trimFraction: number;

  bias: number;
  tareUncertainty95: number; // T95 used
  tareSigma: number; // T = T95/2

  mean: number;
  median: number;
  trimmedMean: number;
  fixedValue: number; // choose trimmedMean if nTrim>=3 else median

  stdDev: number; // sample std dev of corrected values (after trimming)
  stdError: number; // SE = stdDev / sqrt(nTrim)
  totalUncertainty1Sigma: number; // sqrt(SE^2 + T^2)
  errorBand95: number; // k(nTrim) * totalUncertainty1Sigma
  confidence: number; // 0..1 based on nTrim
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
  notes?: string[];
}

export interface SimpleMeasurement {
  id: string;
  timestamp: number;
  scaleReading: number;
  bias: number;
  tareUncertainty95: number;
  correctedValue: number;
  qualityScore?: number;
  azRms?: number;
  rollRms?: number;
  pitchRms?: number;
}

export interface SimpleMeasurementResult {
  measurementCount: number;
  measurements: SimpleMeasurement[];
  bias: number;
  tareUncertainty95: number;
  tareSigma: number;
  mean: number;
  median: number;
  trimmedMean: number;
  fixedValue: number;
  stdDev: number;
  stdError: number;
  totalUncertainty1Sigma: number;
  errorBand95: number;
  relativeError95: number;
  nTotal: number;
  nTrim: number;
  trimFraction: number;
  confidence: number;
  notes?: string[];
}

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