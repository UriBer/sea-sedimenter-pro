import React, { useState } from 'react';
import { ManualSessionManager } from '../session/ManualSessionManager';
import { ManualMeasurement, SessionResult, SessionKind } from '../types';
import { SessionCalculator } from '../measurement/SessionCalculator';
import { Trash2, Plus, Play, Square, CheckCircle } from 'lucide-react';
import { useSettings } from '../src/contexts/SettingsContext';

interface SessionPanelProps {
  kind: SessionKind;
  title: string;
  globalBias: number;
  globalUnc: number;
  existingResult: SessionResult | null;
  onComplete: (result: SessionResult) => void;
  onReset: () => void;
  colorClass?: string;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({ 
  kind, 
  title, 
  globalBias, 
  globalUnc, 
  existingResult, 
  onComplete,
  onReset,
  colorClass = "text-blue-600"
}) => {
  const { t } = useSettings();
  const [manager] = useState(() => new ManualSessionManager(kind));
  const [isRecording, setIsRecording] = useState(false);
  const [measurements, setMeasurements] = useState<ManualMeasurement[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  const startSession = () => {
    manager.startSession(globalBias, globalUnc);
    setMeasurements([]);
    setIsRecording(true);
  };

  const addMeasurement = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseFloat(inputValue);
    if (!isNaN(val) && val > 0) {
      manager.addMeasurement(val);
      setMeasurements(manager.getMeasurements());
      setInputValue('');
    }
  };

  const removeMeasurement = (id: string) => {
    manager.removeMeasurement(id);
    setMeasurements(manager.getMeasurements());
  };

  const stopSession = () => {
    const res = SessionCalculator.calculate(kind, measurements, manager.getLockedValues().bias, manager.getLockedValues().tareUnc95);
    setIsRecording(false);
    onComplete(res);
  };

  const handleReset = () => {
    // Resets this session in parent
    onReset();
    setMeasurements([]);
    setIsRecording(false);
  };

  // State 1: Result exists (Finished)
  if (existingResult) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-gray-200 dark:border-slate-800 p-4 mb-4 relative overflow-hidden transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`font-bold uppercase text-xs ${colorClass}`}>{title} {t('value')}</h3>
            <div className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 font-mono">
               {existingResult.fixedValue.toFixed(1)} <span className="text-lg text-gray-400">g</span>
            </div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">
               ± {existingResult.errorBand95.toFixed(2)} g <span className="text-xs font-normal">(95%)</span>
            </div>
             <div className="text-xs text-gray-400 mt-1">
               n={existingResult.nTrim} ({t('lockedBias')}: {existingResult.bias.toFixed(1)}g)
            </div>
          </div>
          <CheckCircle className="text-green-500 opacity-20" size={48} />
        </div>
        <button onClick={handleReset} className="absolute top-2 right-2 rtl:right-auto rtl:left-2 text-xs text-gray-400 hover:text-red-500 underline">
          {t('redo')}
        </button>
      </div>
    );
  }

  // State 2: Recording Active
  if (isRecording) {
     return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow border-l-4 rtl:border-l-0 rtl:border-r-4 border-nautical-500 mb-4 overflow-hidden transition-colors">
           <div className="bg-gray-50 dark:bg-slate-800 p-3 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
              <span className={`font-bold ${colorClass}`}>{t('recording')}</span>
              <span className="text-xs bg-white dark:bg-slate-700 dark:text-gray-300 border dark:border-slate-600 px-2 py-1 rounded">{t('lockedBias')}: {manager.getLockedValues().bias.toFixed(1)}g</span>
           </div>
           
           <div className="p-4">
              <form onSubmit={addMeasurement} className="flex gap-2 mb-3">
                 <input 
                    type="number" step="0.1" inputMode="decimal"
                    autoFocus
                    placeholder={t('reading')}
                    className="flex-1 border-2 border-gray-300 dark:border-slate-600 rounded px-3 py-2 text-xl font-mono focus:border-nautical-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                 />
                 <button type="submit" disabled={!inputValue} className="bg-nautical-500 text-white px-4 rounded hover:bg-nautical-600 disabled:bg-gray-300 dark:disabled:bg-slate-700">
                    <Plus size={24} />
                 </button>
              </form>
              
              <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
                 {measurements.slice().reverse().map((m, idx) => (
                    <div key={m.id} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-slate-800 p-2 rounded border border-transparent dark:border-slate-700">
                       <span className="font-mono text-gray-800 dark:text-gray-200">{m.scaleReading.toFixed(1)} <span className="text-gray-400">→ {m.correctedValue.toFixed(1)}</span></span>
                       <button onClick={() => removeMeasurement(m.id)} className="text-red-400"><Trash2 size={14}/></button>
                    </div>
                 ))}
                 {measurements.length === 0 && <div className="text-gray-400 text-xs italic">{t('noReadings')}</div>}
              </div>

              <div className="flex gap-2">
                 <button onClick={() => setIsRecording(false)} className="px-3 py-2 text-red-500 hover:text-red-400 text-sm font-semibold">{t('cancel')}</button>
                 <button 
                    onClick={stopSession} 
                    disabled={measurements.length === 0}
                    className="flex-1 bg-gray-900 dark:bg-slate-700 text-white py-2 rounded font-bold flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-slate-600 disabled:opacity-50"
                 >
                    <Square size={16} fill="currentColor"/> {t('stop')}
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // State 3: Idle
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4 mb-4 flex items-center justify-between transition-colors border border-gray-100 dark:border-slate-800">
       <div>
          <h3 className={`font-bold text-lg ${colorClass}`}>{title}</h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
             {t('lockedBias')}: <strong>{globalBias.toFixed(1)}g</strong>
          </div>
       </div>
       <button 
         onClick={startSession}
         className="bg-nautical-500 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-nautical-600 flex items-center gap-2"
       >
         <Play size={18} fill="currentColor"/> {t('start')}
       </button>
    </div>
  );
};