import { useState, useEffect, useRef, useCallback } from 'react';
import { IMUSnapshot } from '../types';

interface SensorState {
  isAvailable: boolean;
  isGranted: boolean;
  isActive: boolean;
  error?: string;
  samplingRate: number; // Hz
  
  // Live values
  az: number;
  azRms: number;
}

const ALPHA = 0.92; // Gravity low-pass constant
const RMS_WINDOW_MS = 1500; // Window for snapshotting

export function useSensors() {
  const [state, setState] = useState<SensorState>({
    isAvailable: typeof window !== 'undefined' && 'DeviceMotionEvent' in window,
    isGranted: false,
    isActive: false,
    samplingRate: 0,
    az: 0,
    azRms: 0,
  });

  const gravityRef = useRef<{x:number, y:number, z:number}>({x:0, y:0, z:0});
  const bufferRef = useRef<{val: number, ts: number}[]>([]);
  const lastTsRef = useRef<number>(0);

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

    // 2. Linear Accel
    const linX = ax - g.x;
    const linY = ay - g.y;
    const linZ = az - g.z;

    // 3. Project Linear Accel onto Gravity Vector (Vertical Accel)
    const gMag = Math.sqrt(g.x*g.x + g.y*g.y + g.z*g.z);
    // If device is freefalling or error, gMag ~ 0
    if (gMag < 1) return; 

    // Dot product
    const vertAccel = (linX * g.x + linY * g.y + linZ * g.z) / gMag;

    // 4. Update Buffer for RMS
    const now = Date.now();
    bufferRef.current.push({ val: vertAccel, ts: now });
    
    // Prune old
    const cutoff = now - RMS_WINDOW_MS;
    while(bufferRef.current.length > 0 && bufferRef.current[0].ts < cutoff) {
      bufferRef.current.shift();
    }

    // Calc RMS
    let sumSq = 0;
    for(const b of bufferRef.current) sumSq += b.val * b.val;
    const rms = bufferRef.current.length > 0 ? Math.sqrt(sumSq / bufferRef.current.length) : 0;

    // Rate estimation
    let rate = state.samplingRate;
    if (interval) {
       rate = 1000 / interval;
    }

    // Throttle React updates to ~10Hz to save render cycles
    if (now - lastTsRef.current > 100) {
      lastTsRef.current = now;
      setState(prev => ({
        ...prev,
        isActive: true,
        az: vertAccel,
        azRms: rms,
        samplingRate: Math.round(rate)
      }));
    }
  }, []);

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
      // Non-iOS 13+ devices usually don't need permission or prompt automatically
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
    setState(s => ({ ...s, isActive: false, az: 0, azRms: 0 }));
  };

  // Auto-start if granted (optional, but better to be explicit)
  // Clean up
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  const captureSnapshot = (): IMUSnapshot | undefined => {
    if (!state.isActive) return undefined;
    
    // Calculate mean of window for the 'az' feature
    let sum = 0;
    for(const b of bufferRef.current) sum += b.val;
    const meanAz = bufferRef.current.length > 0 ? sum / bufferRef.current.length : 0;

    return {
      az: meanAz,
      azRms: state.azRms,
      timestamp: Date.now()
    };
  };

  return {
    sensorState: state,
    requestPermissions,
    startSensors,
    stopSensors,
    captureSnapshot
  };
}