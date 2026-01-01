import React, { useState, useRef } from 'react';
import { MeasurementSession } from '../session/MeasurementSession';
import { SessionResult, TareModel, IMUSnapshot, Measurement } from '../types';
import { Trash2, Plus, Play, Square, CheckCircle, Smartphone } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SessionPanelProps {
  title: string;
  tareModel: TareModel | null;
  sensorSnapshot: () => IMUSnapshot | undefined;
  existingResult: SessionResult | null;
  onComplete: (result: SessionResult) => void;
  onReset: () => void;
  colorClass?: string;
  kind: 'base' | 'final';
}

export const SessionPanel: React.FC<SessionPanelProps> = ({ 
  title, 
  tareModel, 
  sensorSnapshot, 
  existingResult, 
  onComplete,
  onReset,
  colorClass = "text-blue-600",
  kind
}) => {
  const { t } = useSettings();
  
  const [session] = useState(() => new MeasurementSession());
  const [isRecording, setIsRecording] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const startSession = () => {
    session.clear();
    setMeasurements([]);
    setIsRecording(true);
  };

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!tareModel) return;
      const val = parseFloat(inputValue);
      if (!isNaN(val)) {
          const snap = sensorSnapshot();
          const list = session.addMeasurement(val, tareModel, snap);
          setMeasurements(list);
          setInputValue('');
          inputRef.current?.focus();
      }
  }

  const handleRemove = (id: string) => {
    const list = session.removeMeasurement(id);
    setMeasurements(list);
  };

  const stopSession = () => {
    if (!tareModel) return;
    const res = session.calculateResult(tareModel);
    const uiResult: SessionResult = {
        ...res,
        kind,
        bias: tareModel.bias
    };
    setIsRecording(false);
    onComplete(uiResult);
  };

  const handleReset = () => {
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
              {tareModel && (
                  <span className="text-sm font-bold bg-white dark:bg-slate-700 dark:text-gray-300 border dark:border-slate-600 px-3 py-1 rounded-full">
                      {t('lockedBias')}: {tareModel.bias.toFixed(1)}g
                  </span>
              )}
           </div>
           
           <div className="p-5">
              <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-4">
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
                 {measurements.slice().reverse().map((m) => (
                    <div key={m.id} className="flex flex-col text-base bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-transparent dark:border-slate-700">
                       <div className="flex justify-between items-center">
                          <span className="font-mono text-gray-800 dark:text-gray-200 font-bold text-lg">
                              {m.rawReading.toFixed(1)} <span className="text-gray-400 text-sm font-normal">→ {m.adjustedValue.toFixed(1)}</span>
                          </span>
                          <button onClick={() => handleRemove(m.id)} className="text-red-400 p-2 hover:bg-red-50 rounded ml-auto"><Trash2 size={20}/></button>
                       </div>
                       
                       {/* Show Sensor Data if available */}
                       {m.snapshot && (
                         <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-gray-100 dark:border-slate-800 w-fit">
                            <Smartphone size={10} className="text-purple-400" />
                            <span>X:{m.snapshot.ax.toFixed(2)}</span>
                            <span>Y:{m.snapshot.ay.toFixed(2)}</span>
                            <span>Z:{m.snapshot.azRaw.toFixed(2)}</span>
                            {tareModel?.method === 'imu-regression' && (
                                <span className="text-purple-500 font-bold ml-1">
                                    (Adj: {(m.rawReading - m.adjustedValue).toFixed(2)})
                                </span>
                            )}
                         </div>
                       )}
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
  const isDisabled = !tareModel;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between transition-colors border border-gray-100 dark:border-slate-800 gap-4 ${isDisabled ? 'opacity-50 grayscale' : ''}`}>
       <div>
          <h3 className={`font-bold text-xl ${colorClass}`}>{title}</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
             {t('lockedBias')}: <strong className="text-gray-700 dark:text-gray-200">{tareModel ? tareModel.bias.toFixed(1) : '-'}g</strong>
          </div>
       </div>
       <button 
         onClick={startSession}
         disabled={isDisabled}
         className="w-full sm:w-auto bg-nautical-500 text-white px-6 py-4 rounded-lg font-bold text-lg shadow hover:bg-nautical-600 flex items-center justify-center gap-3 active:scale-[0.98] disabled:cursor-not-allowed"
       >
         <Play size={24} fill="currentColor"/> {t('start')}
       </button>
    </div>
  );
};