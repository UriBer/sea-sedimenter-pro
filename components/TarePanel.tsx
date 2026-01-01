import React, { useState, useEffect, useRef } from 'react';
import { TareManager } from '../session/TareManager';
import { TareSample, TareEstimate } from '../types';
import { Trash2, Plus, Target } from 'lucide-react';
import { useSettings } from '../src/contexts/SettingsContext';

interface TarePanelProps {
  onUseTare: (bias: number, uncertainty: number) => void;
  activeBias: number;
}

export const TarePanel: React.FC<TarePanelProps> = ({ onUseTare, activeBias }) => {
  const { t } = useSettings();
  const [manager] = useState(() => new TareManager());
  const [samples, setSamples] = useState<TareSample[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [estimate, setEstimate] = useState<TareEstimate>(manager.estimate());
  const [manualUncertainty, setManualUncertainty] = useState<string>('0');
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setEstimate(manager.estimate());
  }, [samples, manager]);

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      manager.addTareSample(val);
      setSamples(manager.getSamples());
      setInputValue('');
      // Keep focus for rapid entry
      inputRef.current?.focus();
    }
  };

  const handleDelete = (id: string) => {
    manager.removeTareSample(id);
    setSamples(manager.getSamples());
  };

  const handleClear = () => {
    manager.clear();
    setSamples([]);
    setManualUncertainty('0');
  };

  const handleUseTare = () => {
    let finalUnc = estimate.tareUncertainty95;
    if (samples.length < 3 && parseFloat(manualUncertainty) > 0) {
      finalUnc = parseFloat(manualUncertainty);
    }
    onUseTare(estimate.biasMedian, finalUnc);
  };

  const isActive = Math.abs(activeBias - estimate.biasMedian) < 0.0001 && samples.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 p-5 mb-8 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Target size={24} className="text-nautical-500" />
          {t('tareConfig')}
        </h2>
        {isActive && <span className="text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Active</span>}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
         <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-center">
             <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{t('biasEst')}</label>
             <div className="text-3xl font-extrabold text-gray-900 dark:text-white ltr:font-mono">{estimate.biasMedian.toFixed(1)} <span className="text-lg text-gray-500">g</span></div>
         </div>
         <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-lg text-center">
             <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1">{t('unc95')}</label>
             {samples.length >= 3 ? (
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white ltr:font-mono">±{estimate.tareUncertainty95.toFixed(1)} <span className="text-lg text-gray-500">g</span></div>
             ) : (
                <div className="flex items-center justify-center border-b-2 border-gray-300 dark:border-slate-600 px-2">
                    <span className="text-gray-400 mr-1 text-xl">±</span>
                    <input 
                        type="number" step="0.1" 
                        value={manualUncertainty} 
                        onChange={e => setManualUncertainty(e.target.value)}
                        className="w-20 font-bold text-3xl text-center text-gray-800 dark:text-gray-100 focus:outline-none bg-transparent ltr:font-mono"
                    />
                    <span className="text-gray-400 ml-1 text-xl">g</span>
                </div>
             )}
         </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-4">
          <input
            ref={inputRef}
            type="number" step="0.01" inputMode="decimal"
            placeholder={t('addTare')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-4 text-2xl focus:border-nautical-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-300"
          />
          <button type="submit" className="w-full bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 py-4 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 font-bold text-lg flex items-center justify-center gap-2">
            <Plus size={24} /> {t('addValue')}
          </button>
      </form>
      
      {samples.length > 0 && (
         <div className="mb-2">
            <div className="flex flex-wrap gap-3 mb-4 max-h-32 overflow-y-auto p-1">
               {samples.map(s => (
                  <div key={s.id} className="bg-white dark:bg-slate-800 px-3 py-2 rounded-md text-sm flex items-center gap-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-mono shadow-sm">
                     <span className="text-lg font-bold">{s.value.toFixed(1)}</span>
                     <button onClick={() => handleDelete(s.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                  </div>
               ))}
            </div>
            <button 
                onClick={handleUseTare}
                className="w-full py-4 bg-nautical-600 hover:bg-nautical-700 text-white rounded-lg font-bold text-xl shadow-lg transition-all active:scale-[0.98]"
            >
                {t('setActiveTare')}
            </button>
            <button onClick={handleClear} className="w-full mt-3 text-sm text-gray-400 hover:text-red-500 underline py-2">{t('clearSamples')}</button>
         </div>
      )}
    </div>
  );
};