import React, { useState, useEffect, useRef } from 'react';
import { TareManager } from '../session/TareManager';
import { TareSample, TareEstimate } from '../types';
import { Trash2, Plus, Target, Play, Square, CheckCircle } from 'lucide-react';
import { useSettings } from '../src/contexts/SettingsContext';

interface TarePanelProps {
  onUseTare: (bias: number, uncertainty: number) => void;
  activeBias: number;
}

export const TarePanel: React.FC<TarePanelProps> = ({ onUseTare, activeBias }) => {
  const { t } = useSettings();
  const [manager] = useState(() => new TareManager());
  
  // State for flow
  const [isRecording, setIsRecording] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [samples, setSamples] = useState<TareSample[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [estimate, setEstimate] = useState<TareEstimate>(manager.estimate());
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Update estimate when samples change
  useEffect(() => {
    setEstimate(manager.estimate());
  }, [samples, manager]);

  const handleStart = () => {
    manager.clear();
    setSamples([]);
    setIsRecording(true);
    setIsCompleted(false);
  };

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      manager.addTareSample(val);
      setSamples(manager.getSamples());
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleDelete = (id: string) => {
    manager.removeTareSample(id);
    setSamples(manager.getSamples());
  };

  const handleStop = () => {
    // Calculate final
    const finalEst = manager.estimate();
    setEstimate(finalEst);
    
    // Apply
    onUseTare(finalEst.biasMedian, finalEst.tareUncertainty95);
    
    setIsRecording(false);
    setIsCompleted(true);
  };
  
  const handleCancel = () => {
      setIsRecording(false);
      setSamples([]);
      // We do not revert global bias here, assuming user wants to keep previous if they cancel new
  };

  const handleRedo = () => {
      setIsCompleted(false);
      // We keep the current global bias active until they actually Start->Stop a new one
  };

  // 1. Completed State (Active)
  if (isCompleted) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-gray-200 dark:border-slate-800 p-5 mb-6 relative overflow-hidden transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold uppercase text-sm mb-1 text-nautical-700 dark:text-nautical-400 flex items-center gap-2">
                        <Target size={16} /> {t('tareConfig')}
                    </h3>
                    <div className="flex items-baseline gap-4 mt-2">
                        <div>
                             <span className="text-xs uppercase text-gray-500 dark:text-gray-400 block">{t('biasEst')}</span>
                             <span className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 font-mono">
                                {estimate.biasMedian.toFixed(1)} <span className="text-xl text-gray-400">g</span>
                             </span>
                        </div>
                        <div className="pl-4 border-l border-gray-200 dark:border-slate-700">
                             <span className="text-xs uppercase text-gray-500 dark:text-gray-400 block">{t('unc95')}</span>
                             <span className="text-2xl font-bold text-gray-600 dark:text-gray-300 font-mono">
                                ± {estimate.tareUncertainty95.toFixed(1)} g
                             </span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2">
                        n={estimate.count} samples
                    </div>
                </div>
                <CheckCircle className="text-green-500 opacity-20" size={64} />
            </div>
            <button onClick={handleRedo} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-sm font-bold text-gray-400 hover:text-red-500 underline py-2 px-2">
                {t('redo')}
            </button>
        </div>
      );
  }

  // 2. Recording State
  if (isRecording) {
      return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border-l-8 rtl:border-l-0 rtl:border-r-8 border-nautical-500 mb-6 overflow-hidden transition-colors">
            <div className="bg-gray-50 dark:bg-slate-800 p-4 flex justify-between items-center border-b border-gray-100 dark:border-slate-700">
                <span className="font-bold text-lg text-nautical-700 dark:text-nautical-400 flex items-center gap-2">
                    <Target size={20} /> {t('tareConfig')} <span className="text-sm font-normal text-gray-500">({t('recording')})</span>
                </span>
                <span className="text-sm font-bold bg-white dark:bg-slate-700 dark:text-gray-300 border dark:border-slate-600 px-3 py-1 rounded-full">
                    n={samples.length}
                </span>
            </div>

            <div className="p-5">
                <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-4">
                    <input
                        ref={inputRef}
                        type="number" step="0.1" inputMode="decimal"
                        autoFocus
                        placeholder={t('addTare')}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-4 text-3xl font-mono focus:border-nautical-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-300"
                    />
                    <button type="submit" disabled={!inputValue} className="w-full bg-nautical-500 text-white py-4 rounded-lg hover:bg-nautical-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 shadow-md font-bold text-lg flex justify-center items-center gap-2">
                        <Plus size={28} /> {t('addValue')}
                    </button>
                </form>

                <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
                    {samples.slice().reverse().map((s) => (
                        <div key={s.id} className="flex justify-between items-center text-base bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-transparent dark:border-slate-700">
                            <span className="font-mono text-gray-800 dark:text-gray-200 font-bold text-lg">{s.value.toFixed(1)} g</span>
                            <button onClick={() => handleDelete(s.id)} className="text-red-400 p-2 hover:bg-red-50 rounded"><Trash2 size={20}/></button>
                        </div>
                    ))}
                    {samples.length === 0 && <div className="text-gray-400 text-sm italic text-center py-4">{t('noReadings')}</div>}
                </div>

                <div className="flex gap-3 mt-4">
                     <button onClick={handleCancel} className="px-4 py-3 text-red-500 hover:text-red-400 text-base font-bold bg-white dark:bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg">{t('cancel')}</button>
                     <button 
                        onClick={handleStop} 
                        disabled={samples.length === 0}
                        className="flex-1 bg-gray-900 dark:bg-slate-700 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 hover:bg-black dark:hover:bg-slate-600 disabled:opacity-50 shadow-lg"
                     >
                        <Square size={20} fill="currentColor"/> {t('stop')}
                     </button>
                </div>
            </div>
        </div>
      );
  }

  // 3. Idle State
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between transition-colors border border-gray-100 dark:border-slate-800 gap-4">
       <div>
          <h3 className="font-bold text-xl text-nautical-700 dark:text-nautical-400 flex items-center gap-2">
              <Target size={24} /> {t('tareConfig')}
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
             {t('biasEst')}: <strong className="text-gray-700 dark:text-gray-200">{activeBias.toFixed(1)}g</strong>
          </div>
       </div>
       <button 
         onClick={handleStart}
         className="w-full sm:w-auto bg-nautical-500 text-white px-6 py-4 rounded-lg font-bold text-lg shadow hover:bg-nautical-600 flex items-center justify-center gap-3 active:scale-[0.98]"
       >
         <Play size={24} fill="currentColor"/> {t('start')}
       </button>
    </div>
  );
};