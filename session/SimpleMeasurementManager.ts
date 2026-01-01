import { SimpleMeasurement } from '../types';

export class SimpleMeasurementManager {
  private measurements: SimpleMeasurement[] = [];
  private lockedBias: number = 0;
  private lockedTareUnc95: number = 0;

  constructor(initialMeasurements: SimpleMeasurement[] = []) {
    this.measurements = [...initialMeasurements];
  }

  startSession(lockedBias_b: number, lockedTareUnc95_T95: number) {
    this.measurements = [];
    this.lockedBias = lockedBias_b;
    this.lockedTareUnc95 = lockedTareUnc95_T95;
  }

  addMeasurement(scaleReading_g: number, qualitySnapshot?: { qualityScore?: number, azRms?: number, rollRms?: number, pitchRms?: number }): SimpleMeasurement {
    const measurement: SimpleMeasurement = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      scaleReading: scaleReading_g,
      bias: this.lockedBias,
      tareUncertainty95: this.lockedTareUnc95,
      correctedValue: scaleReading_g - this.lockedBias,
      ...qualitySnapshot
    };
    this.measurements.push(measurement);
    return measurement;
  }

  removeMeasurement(id: string): void {
    this.measurements = this.measurements.filter(m => m.id !== id);
  }

  clear(): void {
    this.measurements = [];
  }

  getMeasurements(): SimpleMeasurement[] {
    return [...this.measurements];
  }
  
  // Helpers to get locked values without storing them purely in class state if needed externally
  getLockedValues() {
    return { bias: this.lockedBias, tareUnc95: this.lockedTareUnc95 };
  }
}
