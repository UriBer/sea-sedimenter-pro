import React, { useState, useEffect } from 'react';
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
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-4 mb-6 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-md font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <Target size={18} className="text-nautical-500" />
          {t('tareConfig')}
        </h2>
        {isActive && <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full font-bold">Active</span>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
         <div>
             <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('biasEst')}</label>
             <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 ltr:font-mono">{estimate.biasMedian.toFixed(1)} g</div>
         </div>
         <div>
             <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{t('unc95')}</label>
             {samples.length >= 3 ? (
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 ltr:font-mono">±{estimate.tareUncertainty95.toFixed(1)} g</div>
             ) : (
                <div className="flex items-center border-b border-gray-300 dark:border-slate-600">
                    <span className="text-gray-400 mr-1">±</span>
                    <input 
                        type="number" step="0.1" 
                        value={manualUncertainty} 
                        onChange={e => setManualUncertainty(e.target.value)}
                        className="w-16 font-bold text-xl text-gray-800 dark:text-gray-100 focus:outline-none bg-transparent ltr:font-mono"
                    />
                    <span className="text-gray-400 ml-1">g</span>
                </div>
             )}
         </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
          <input
            type="number" step="0.01" inputMode="decimal"
            placeholder={t('addTare')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-slate-600 rounded px-3 py-2 focus:ring-1 focus:ring-nautical-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          />
          <button type="submit" className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 rounded hover:bg-gray-200 dark:hover:bg-slate-600 font-bold">
            <Plus size={20} />
          </button>
      </form>
      
      {samples.length > 0 && (
         <div className="mb-4">
            <div className="flex flex-wrap gap-2 mb-2 max-h-24 overflow-y-auto">
               {samples.map(s => (
                  <div key={s.id} className="bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded text-xs flex items-center gap-2 border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-mono">
                     <span>{s.value.toFixed(1)}</span>
                     <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12}/></button>
                  </div>
               ))}
            </div>
            <button 
                onClick={handleUseTare}
                className="w-full py-2 bg-nautical-500 hover:bg-nautical-600 text-white rounded font-bold shadow transition-colors"
            >
                {t('setActiveTare')}
            </button>
            <button onClick={handleClear} className="w-full mt-2 text-xs text-gray-400 hover:text-red-500">{t('clearSamples')}</button>
         </div>
      )}
    </div>
  );
};