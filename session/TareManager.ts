import { TareSample, TareEstimate } from '../types';

export class TareManager {
  private samples: TareSample[] = [];

  constructor(initialSamples: TareSample[] = []) {
    this.samples = [...initialSamples];
  }

  addTareSample(value_g: number): TareSample {
    const sample: TareSample = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      value: value_g,
    };
    this.samples.push(sample);
    return sample;
  }

  removeTareSample(id: string): void {
    this.samples = this.samples.filter(s => s.id !== id);
  }

  clear(): void {
    this.samples = [];
  }

  getSamples(): TareSample[] {
    return [...this.samples];
  }

  estimate(): TareEstimate {
    const count = this.samples.length;
    
    if (count === 0) {
      return {
        count: 0,
        biasMedian: 0,
        tareUncertainty95: 0,
        tareSigma: 0,
        method: 'none'
      };
    }

    const values = this.samples.map(s => s.value).sort((a, b) => a - b);
    
    // Median Calculation
    let median = 0;
    const mid = Math.floor(count / 2);
    if (count % 2 === 0) {
      median = (values[mid - 1] + values[mid]) / 2;
    } else {
      median = values[mid];
    }

    // Uncertainty Calculation (Half-Range)
    // T95 = (max - min) / 2
    const min = values[0];
    const max = values[count - 1];
    const t95 = (max - min) / 2;
    const tSigma = t95 / 2;

    return {
      count,
      biasMedian: median,
      tareUncertainty95: t95,
      tareSigma: tSigma,
      method: 'halfRange'
    };
  }
}
