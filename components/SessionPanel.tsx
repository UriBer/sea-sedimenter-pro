import React, { useState, useRef } from 'react';
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
  
  const inputRef = useRef<HTMLInputElement>(null);

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
      // Keep focus for rapid entry
      inputRef.current?.focus();
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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-gray-200 dark:border-slate-800 p-5 mb-6 relative overflow-hidden transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`font-bold uppercase text-sm mb-1 ${colorClass}`}>{title} {t('value')}</h3>
            <div className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 font-mono">
               {existingResult.fixedValue.toFixed(1)} <span className="text-xl text-gray-400">g</span>
            </div>
            <div className="text-base font-semibold text-gray-500 dark:text-gray-400 mt-1">
               ± {existingResult.errorBand95.toFixed(2)} g <span className="text-sm font-normal">(95%)</span>
            </div>
             <div className="text-sm text-gray-400 mt-2">
               n={existingResult.nTrim} ({t('lockedBias')}: {existingResult.bias.toFixed(1)}g)
            </div>
          </div>
          <CheckCircle className="text-green-500 opacity-20" size={64} />
        </div>
        <button onClick={handleReset} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-sm font-bold text-gray-400 hover:text-red-500 underline py-2 px-2">
          {t('redo')}
        </button>
      </div>
    );
  }

  // State 2: Recording Active
  if (isRecording) {
     return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border-l-8 rtl:border-l-0 rtl:border-r-8 border-nautical-500 mb-6 overflow-hidden transition-colors">
           <div className="bg-gray-50 dark:bg-slate-800 p-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
              <span className={`font-bold text-lg ${colorClass}`}>{t('recording')}</span>
              <span className="text-sm font-bold bg-white dark:bg-slate-700 dark:text-gray-300 border dark:border-slate-600 px-3 py-1 rounded-full">{t('lockedBias')}: {manager.getLockedValues().bias.toFixed(1)}g</span>
           </div>
           
           <div className="p-5">
              {/* Stacked Layout for better mobile accessibility */}
              <form onSubmit={addMeasurement} className="flex flex-col gap-3 mb-4">
                 <input 
                    ref={inputRef}
                    type="number" step="0.1" inputMode="decimal"
                    autoFocus
                    placeholder={t('reading')}
                    className="w-full border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-4 text-3xl font-mono focus:border-nautical-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-300"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                 />
                 <button type="submit" disabled={!inputValue} className="w-full bg-nautical-500 text-white py-4 rounded-lg hover:bg-nautical-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 shadow-md font-bold text-lg flex justify-center items-center gap-2">
                    <Plus size={28} /> {t('addValue')}
                 </button>
              </form>
              
              <div className="max-h-56 overflow-y-auto mb-4 space-y-2">
                 {measurements.slice().reverse().map((m, idx) => (
                    <div key={m.id} className="flex justify-between items-center text-base bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-transparent dark:border-slate-700">
                       <span className="font-mono text-gray-800 dark:text-gray-200 font-bold text-lg">{m.scaleReading.toFixed(1)} <span className="text-gray-400 text-sm font-normal">→ {m.correctedValue.toFixed(1)}</span></span>
                       <button onClick={() => removeMeasurement(m.id)} className="text-red-400 p-2 hover:bg-red-50 rounded"><Trash2 size={20}/></button>
                    </div>
                 ))}
                 {measurements.length === 0 && <div className="text-gray-400 text-sm italic text-center py-4">{t('noReadings')}</div>}
              </div>

              <div className="flex gap-3 mt-4">
                 <button onClick={() => setIsRecording(false)} className="px-4 py-3 text-red-500 hover:text-red-400 text-base font-bold bg-white dark:bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg">{t('cancel')}</button>
                 <button 
                    onClick={stopSession} 
                    disabled={measurements.length === 0}
                    className="flex-1 bg-gray-900 dark:bg-slate-700 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-black dark:hover:bg-slate-600 disabled:opacity-50 shadow-lg"
                 >
                    <Square size={20} fill="currentColor"/> {t('stop')}
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // State 3: Idle
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between transition-colors border border-gray-100 dark:border-slate-800 gap-4">
       <div>
          <h3 className={`font-bold text-xl ${colorClass}`}>{title}</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
             {t('lockedBias')}: <strong className="text-gray-700 dark:text-gray-200">{globalBias.toFixed(1)}g</strong>
          </div>
       </div>
       <button 
         onClick={startSession}
         className="w-full sm:w-auto bg-nautical-500 text-white px-6 py-4 rounded-lg font-bold text-lg shadow hover:bg-nautical-600 flex items-center justify-center gap-3 active:scale-[0.98]"
       >
         <Play size={24} fill="currentColor"/> {t('start')}
       </button>
    </div>
  );
};