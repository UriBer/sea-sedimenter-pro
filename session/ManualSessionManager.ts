import { ManualMeasurement, SessionKind } from '../types';

export class ManualSessionManager {
  private measurements: ManualMeasurement[] = [];
  private kind: SessionKind;
  private lockedBias: number = 0;
  private lockedTareUnc95: number = 0;

  constructor(kind: SessionKind) {
    this.kind = kind;
  }

  startSession(lockedBias_b: number, lockedTareUnc95_T95: number) {
    this.measurements = [];
    this.lockedBias = lockedBias_b;
    this.lockedTareUnc95 = lockedTareUnc95_T95;
  }

  addMeasurement(scaleReading_g: number): ManualMeasurement {
    const measurement: ManualMeasurement = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      kind: this.kind,
      scaleReading: scaleReading_g,
      bias: this.lockedBias,
      tareUncertainty95: this.lockedTareUnc95,
      correctedValue: scaleReading_g - this.lockedBias,
    };
    this.measurements.push(measurement);
    return measurement;
  }

  removeMeasurement(id: string): void {
    this.measurements = this.measurements.filter(m => m.id !== id);
  }

  getMeasurements(): ManualMeasurement[] {
    return [...this.measurements];
  }
  
  getLockedValues() {
    return { bias: this.lockedBias, tareUnc95: this.lockedTareUnc95 };
  }
}
