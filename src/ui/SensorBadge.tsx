import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

interface Props {
  state: any;
  onRequest: () => void;
  onToggle: () => void;
}

export const SensorBadge: React.FC<Props> = ({ state, onRequest, onToggle }) => {
  if (!state.isAvailable) {
    return <div className="text-xs text-gray-400">Sensors unavailable</div>;
  }

  if (!state.isGranted) {
    return (
      <button 
        onClick={onRequest}
        className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-bold shadow-sm"
      >
        <Activity size={16} /> Enable Sensors
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
      <button 
        onClick={onToggle}
        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
          state.isActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}
      >
        {state.isActive ? 'STOP' : 'START'}
      </button>
      
      <div className="flex flex-col text-xs font-mono">
        <div className="flex gap-2">
           <span className="text-gray-500">Rate:</span> {state.samplingRate}Hz
        </div>
        <div className="flex gap-2">
           <span className="text-gray-500">Az:</span> {state.az.toFixed(2)}
        </div>
      </div>
      
      {state.azRms > 0.5 && (
         <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
      )}
    </div>
  );
};