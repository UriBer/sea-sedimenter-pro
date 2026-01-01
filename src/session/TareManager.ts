import { TareSample, TareModel, IMUSnapshot } from '../types';
import { calculateMedian, fitTareRegression } from '../utils/math';
import { getKFactorFromN } from '../utils/kFactor';

export class TareManager {
  private samples: TareSample[] = [];
  
  // Config
  private useIMUAdjustment: boolean = false;

  constructor(useIMU: boolean) {
    this.useIMUAdjustment = useIMU;
  }

  addSample(val: number, snapshot?: IMUSnapshot): TareSample[] {
    this.samples.push({
      id: crypto.randomUUID(),
      value: val,
      snapshot
    });
    return [...this.samples];
  }

  removeSample(id: string): TareSample[] {
    this.samples = this.samples.filter(s => s.id !== id);
    return [...this.samples];
  }

  getSamples(): TareSample[] {
    return this.samples;
  }

  buildModel(): TareModel {
    const n = this.samples.length;
    
    // Fallback model
    const fallbackModel: TareModel = {
      isReady: n >= 1,
      method: 'basic',
      bias: 0,
      tareUncertainty: 0,
      n
    };

    if (n === 0) return fallbackModel;

    // 1. Try IMU Regression if enabled
    if (this.useIMUAdjustment) {
      const fit = fitTareRegression(this.samples);
      
      if (fit) {
        // Calculate t-factor for uncertainty band (df = n - 2)
        const tVal = getKFactorFromN(n - 1); // Approximation using n-1 for robust coverage
        const tareSigma = fit.sigmaEps; // This is our 1-sigma uncertainty
        
        // Calculate adjusted values for display
        this.samples = this.samples.map(s => {
          if (!s.snapshot) return s;
          const correction = fit.b + fit.k * s.snapshot.az;
          // Ideally adjusted tare should be close to bias (fit.b)
          // adjusted = raw - (k*z) -> should equal b + err
          return {
            ...s,
            adjustedValue: s.value - (fit.k * s.snapshot.az) 
          };
        });

        return {
          isReady: true,
          method: 'imu-regression',
          bias: fit.b,
          slopeK: fit.k,
          residualsSigma: fit.sigmaEps,
          tareUncertainty: tareSigma, 
          n,
          rSquared: fit.r2
        };
      }
    }

    // 2. Basic Method (Median + Half-Range)
    const values = this.samples.map(s => s.value);
    const bias = calculateMedian(values);
    
    let halfRange = 0;
    if (n > 1) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      halfRange = (max - min) / 2;
    }

    // If using basic, adjusted value is just raw value (no motion correction)
    this.samples = this.samples.map(s => ({ ...s, adjustedValue: s.value }));

    return {
      isReady: true,
      method: 'basic',
      bias: bias,
      tareUncertainty: halfRange / 2, // Approximate 1-sigma from half-range (assuming T95 ~ 2*sigma)
      n
    };
  }
  
  clear() {
    this.samples = [];
  }
}