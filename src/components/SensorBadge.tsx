import React from 'react';
import { Activity, AlertTriangle, Move3d } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface Props {
  state: any;
  onRequest: () => void;
  onToggle: () => void;
}

export const SensorBadge: React.FC<Props> = ({ state, onRequest, onToggle }) => {
  const { t } = useSettings();

  if (!state.isAvailable) {
    return null; // Don't show if device doesn't support it
  }

  if (!state.isGranted) {
    return (
      <div className="flex justify-center mb-4">
        <button 
            onClick={onRequest}
            className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-transform active:scale-95"
        >
            <Activity size={18} /> {t('enableSensors')}
        </button>
      </div>
    );
  }

  const isUnstable = state.azRms > 0.5;

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 p-3 rounded-lg mb-4 shadow border border-gray-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold uppercase ${
                !state.isActive ? 'bg-gray-100 text-gray-500' :
                isUnstable ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'
            }`}>
                <Activity size={14} />
                {!state.isActive ? "OFF" : isUnstable ? t('sensorUnstable') : t('sensorStable')}
            </div>
            
            {state.isActive && (
                <div className="text-xs font-mono text-gray-400 hidden sm:block">
                    {state.samplingRate}Hz
                </div>
            )}
        </div>

        <button 
            onClick={onToggle}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
            state.isActive ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-500 text-white hover:bg-green-600'
            }`}
        >
            {state.isActive ? t('stop') : t('start')}
        </button>
      </div>

      {state.isActive && (
         <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-slate-800 pt-2 mt-1">
            <div className="flex flex-col items-center bg-gray-50 dark:bg-slate-800 rounded p-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold">X</span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{state.ax.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 dark:bg-slate-800 rounded p-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Y</span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{state.ay.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-center bg-gray-50 dark:bg-slate-800 rounded p-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Z</span>
                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{state.azRaw.toFixed(2)}</span>
            </div>
         </div>
      )}
    </div>
  );
};