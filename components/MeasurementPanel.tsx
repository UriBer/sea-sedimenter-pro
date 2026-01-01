import React, { useState, useEffect } from 'react';
import { SimpleMeasurementManager } from '../session/SimpleMeasurementManager';
import { SimpleMeasurement } from '../types';
import { Trash2, Plus, Play, Square, Scale } from 'lucide-react';

interface MeasurementPanelProps {
  lockedBias: number;
  lockedTareUnc95: number;
  onStop: (measurements: SimpleMeasurement[]) => void;
  onResetAll: () => void;
  isSensorEnabled: boolean;
  isSensorStable: boolean;
}

export const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ 
  lockedBias, 
  lockedTareUnc95, 
  onStop, 
  onResetAll,
  isSensorEnabled,
  isSensorStable
}) => {
  const [manager] = useState(() => new SimpleMeasurementManager());
  const [sessionActive, setSessionActive] = useState(false);
  const [measurements, setMeasurements] = useState<SimpleMeasurement[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  const startSession = () => {
    manager.startSession(lockedBias, lockedTareUnc95);
    setMeasurements([]);
    setSessionActive(true);
  };

  const addMeasurement = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      // If sensors are enabled, we would snapshot quality here.
      // For MVP, we pass dummy quality if unstable to show the intent
      const quality = isSensorEnabled ? { 
          qualityScore: isSensorStable ? 1.0 : 0.4 
      } : undefined;

      manager.addMeasurement(val, quality);
      setMeasurements(manager.getMeasurements());
      setInputValue('');
    }
  };

  const removeMeasurement = (id: string) => {
    manager.removeMeasurement(id);
    setMeasurements(manager.getMeasurements());
  };

  const handleStop = () => {
    setSessionActive(false);
    onStop(measurements);
  };

  if (!sessionActive) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-4 text-center">
        <div className="mb-4">
            <Scale size={48} className="mx-auto text-nautical-500 mb-2"/>
            <h2 className="text-xl font-bold text-gray-800">Ready to Measure</h2>
            <p className="text-gray-500 text-sm">Bias locked: {lockedBias.toFixed(1)}g</p>
        </div>
        
        <button 
          onClick={startSession}
          className="w-full bg-nautical-700 text-white py-4 rounded-lg font-bold text-xl hover:bg-nautical-900 shadow-lg active:transform active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Play size={24} fill="currentColor" />
          START SESSION
        </button>
        <button onClick={onResetAll} className="mt-4 text-gray-400 hover:text-gray-600 underline text-sm">
          Reset All (New Tare)
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border-l-4 border-nautical-500 overflow-hidden relative pb-20">
      <div className="p-4 bg-nautical-50 flex justify-between items-center border-b border-nautical-100">
         <h3 className="font-bold text-nautical-900">Measuring...</h3>
         <span className="bg-nautical-200 text-nautical-800 text-xs px-2 py-1 rounded-full font-mono">
            n={measurements.length}
         </span>
      </div>
      
      <div className="p-4">
        {/* Input */}
        <form onSubmit={addMeasurement} className="flex gap-2 mb-4">
            <input
                type="number"
                step="0.01"
                inputMode="decimal"
                autoFocus
                placeholder="Reading (g)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={`flex-1 border-2 rounded px-3 py-3 text-xl font-mono focus:outline-none ${
                    isSensorEnabled && !isSensorStable ? 'border-yellow-400 focus:border-yellow-500' : 'border-gray-300 focus:border-nautical-500'
                }`}
            />
            <button
                type="submit"
                disabled={!inputValue}
                className={`px-4 py-2 rounded font-semibold text-white flex items-center justify-center transition-colors ${
                     !inputValue ? 'bg-gray-300' :
                     isSensorEnabled && !isSensorStable ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-nautical-500 hover:bg-nautical-600'
                }`}
            >
                <Plus size={28} />
            </button>
        </form>

        {/* List */}
        <ul className="space-y-2 mb-4">
            {measurements.slice().reverse().map((m, idx) => (
                <li key={m.id} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                    <div>
                        <span className="text-gray-400 text-xs mr-2">#{measurements.length - idx}</span>
                        <span className="font-mono font-bold text-gray-800">{m.correctedValue.toFixed(1)}g</span>
                        <span className="text-xs text-gray-400 ml-2">(Raw: {m.scaleReading})</span>
                    </div>
                    <button onClick={() => removeMeasurement(m.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                    </button>
                </li>
            ))}
            {measurements.length === 0 && (
                <div className="text-center text-gray-400 py-4 italic text-sm">
                    No measurements yet.
                </div>
            )}
        </ul>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur border-t border-gray-200 flex gap-3">
         <button 
           onClick={() => { setSessionActive(false); setMeasurements([]); }}
           className="px-4 py-3 text-red-600 font-bold text-sm"
         >
           Cancel
         </button>
         <button 
           onClick={handleStop}
           disabled={measurements.length === 0}
           className="flex-1 bg-nautical-900 text-white py-3 rounded font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
         >
           <Square size={18} fill="currentColor" />
           STOP & CALCULATE
         </button>
      </div>
    </div>
  );
};
