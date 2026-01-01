import { useState, useEffect, useRef, useCallback } from 'react';
import { IMUSnapshot, SessionSensorStats } from '../types';

interface SensorState {
  isAvailable: boolean;
  isGranted: boolean;
  isActive: boolean;
  error?: string;
  samplingRate: number; // Hz
  
  // Live values (smoothed)
  ax: number;
  ay: number;
  azRaw: number;
  az: number; // projected vertical (estimated)
  azRms: number;
}

const ALPHA = 0.92; // Gravity low-pass constant
const RMS_WINDOW_MS = 1500; // Window for snapshotting

interface RecordingState {
    active: boolean;
    startTime: number;
    count: number;
    sumAx: number;
    sumAy: number;
    sumAz: number;
    sumRms: number;
    maxAz: number;
    minAz: number;
    maxRms: number;
}

export function useSensors() {
  const [state, setState] = useState<SensorState>({
    isAvailable: typeof window !== 'undefined' && 'DeviceMotionEvent' in window,
    isGranted: false,
    isActive: false,
    samplingRate: 0,
    ax: 0, 
    ay: 0, 
    azRaw: 0,
    az: 0,
    azRms: 0,
  });

  const gravityRef = useRef<{x:number, y:number, z:number}>({x:0, y:0, z:0});
  // Buffer stores full vector for smoothing
  const bufferRef = useRef<{x:number, y:number, z:number, v: number, ts: number}[]>([]);
  const lastTsRef = useRef<number>(0);
  
  // Recording state refs
  const recordingRef = useRef<RecordingState>({
      active: false,
      startTime: 0,
      count: 0,
      sumAx: 0,
      sumAy: 0,
      sumAz: 0,
      sumRms: 0,
      maxAz: -Infinity,
      minAz: Infinity,
      maxRms: 0
  });

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    const { accelerationIncludingGravity, interval } = event;
    if (!accelerationIncludingGravity) return;

    const ax = accelerationIncludingGravity.x || 0;
    const ay = accelerationIncludingGravity.y || 0;
    const az = accelerationIncludingGravity.z || 0;
    
    // 1. Estimate Gravity (Low Pass)
    const g = gravityRef.current;
    g.x = ALPHA * g.x + (1 - ALPHA) * ax;
    g.y = ALPHA * g.y + (1 - ALPHA) * ay;
    g.z = ALPHA * g.z + (1 - ALPHA) * az;

    // 2. Linear Accel & Vertical Projection
    const linX = ax - g.x;
    const linY = ay - g.y;
    const linZ = az - g.z;

    const gMag = Math.sqrt(g.x*g.x + g.y*g.y + g.z*g.z);
    // If device is freefalling or error, gMag ~ 0
    let vertAccel = 0;
    if (gMag >= 1) {
       vertAccel = (linX * g.x + linY * g.y + linZ * g.z) / gMag;
    }

    // 3. Update Buffer
    const now = Date.now();
    bufferRef.current.push({ x: ax, y: ay, z: az, v: vertAccel, ts: now });
    
    // Prune old
    const cutoff = now - RMS_WINDOW_MS;
    while(bufferRef.current.length > 0 && bufferRef.current[0].ts < cutoff) {
      bufferRef.current.shift();
    }

    // 4. Calculate Smoothed Values & RMS from buffer
    let sumSq = 0;
    let sumX = 0, sumY = 0, sumZ = 0, sumV = 0;
    const count = bufferRef.current.length;

    for(const b of bufferRef.current) {
        sumSq += b.v * b.v;
        sumX += b.x;
        sumY += b.y;
        sumZ += b.z;
        sumV += b.v;
    }
    
    const rms = count > 0 ? Math.sqrt(sumSq / count) : 0;
    const smoothX = count > 0 ? sumX / count : ax;
    const smoothY = count > 0 ? sumY / count : ay;
    const smoothZ = count > 0 ? sumZ / count : az;
    const smoothV = count > 0 ? sumV / count : vertAccel;

    // 5. Update Recording Stats
    if (recordingRef.current.active) {
        const r = recordingRef.current;
        r.count++;
        r.sumAx += Math.abs(smoothX);
        r.sumAy += Math.abs(smoothY);
        r.sumAz += Math.abs(smoothZ); // Tracking magnitude avg
        r.sumRms += rms;
        
        // Track raw Z extremes (g-force)
        if (smoothZ > r.maxAz) r.maxAz = smoothZ;
        if (smoothZ < r.minAz) r.minAz = smoothZ;
        
        if (rms > r.maxRms) r.maxRms = rms;
    }

    // Rate estimation
    let rate = state.samplingRate;
    if (interval) {
       rate = 1000 / interval;
    }

    // Throttle React updates
    if (now - lastTsRef.current > 100) {
      lastTsRef.current = now;
      setState(prev => ({
        ...prev,
        isActive: true,
        ax: smoothX,
        ay: smoothY,
        azRaw: smoothZ,
        az: smoothV,
        azRms: rms,
        samplingRate: Math.round(rate)
      }));
    }
  }, [state.samplingRate]);

  const requestPermissions = async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setState(s => ({ ...s, isGranted: true }));
          return true;
        } else {
          setState(s => ({ ...s, error: 'Permission denied' }));
          return false;
        }
      } catch (e) {
        console.error(e);
        setState(s => ({ ...s, error: 'Permission error' }));
        return false;
      }
    } else {
      setState(s => ({ ...s, isGranted: true }));
      return true;
    }
  };

  const startSensors = () => {
    if (!state.isGranted) return;
    window.addEventListener('devicemotion', handleMotion);
    setState(s => ({ ...s, isActive: true }));
  };

  const stopSensors = () => {
    window.removeEventListener('devicemotion', handleMotion);
    setState(s => ({ ...s, isActive: false }));
  };

  const captureSnapshot = (): IMUSnapshot | undefined => {
    if (!state.isActive) return undefined;
    
    // We already computed smoothed values in buffer, but state is throttled.
    // Let's recompute strictly from buffer for maximum freshness
    let sumX = 0, sumY = 0, sumZ = 0, sumV = 0;
    const count = bufferRef.current.length;
    
    if (count === 0) {
        return { ax: state.ax, ay: state.ay, azRaw: state.azRaw, az: state.az, azRms: state.azRms, timestamp: Date.now() };
    }

    for(const b of bufferRef.current) {
        sumX += b.x; sumY += b.y; sumZ += b.z; sumV += b.v;
    }

    return {
      ax: sumX / count,
      ay: sumY / count,
      azRaw: sumZ / count,
      az: sumV / count,
      azRms: state.azRms,
      timestamp: Date.now()
    };
  };

  const startRecording = () => {
      recordingRef.current = {
          active: true,
          startTime: Date.now(),
          count: 0,
          sumAx: 0, sumAy: 0, sumAz: 0, sumRms: 0,
          maxAz: -Infinity, minAz: Infinity, maxRms: 0
      };
  };

  const stopRecording = (): SessionSensorStats | undefined => {
      const r = recordingRef.current;
      r.active = false;
      if (r.count === 0) return undefined;

      return {
          durationMs: Date.now() - r.startTime,
          avgAx: r.sumAx / r.count,
          avgAy: r.sumAy / r.count,
          avgAz: r.sumAz / r.count,
          maxAz: r.maxAz,
          minAz: r.minAz,
          avgRms: r.sumRms / r.count,
          maxRms: r.maxRms
      };
  };

  // Clean up
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  return {
    sensorState: state,
    requestPermissions,
    startSensors,
    stopSensors,
    captureSnapshot,
    startRecording,
    stopRecording
  };
}