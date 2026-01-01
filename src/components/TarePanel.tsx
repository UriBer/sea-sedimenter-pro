import React, { useState, useRef } from 'react';
import { TareManager } from '../session/TareManager';
import { TareModel, IMUSnapshot } from '../types';
import { Trash2, Plus, Target, Play, Square, CheckCircle, BrainCircuit } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface TarePanelProps {
  onLock: (model: TareModel) => void;
  activeModel: TareModel | null;
  sensorSnapshot: () => IMUSnapshot | undefined;
  isSensorActive: boolean;
  imuEnabled: boolean;
  toggleImu: () => void;
}

export const TarePanel: React.FC<TarePanelProps> = ({ 
  onLock, 
  activeModel, 
  sensorSnapshot, 
  isSensorActive, 
  imuEnabled, 
  toggleImu 
}) => {
  const { t } = useSettings();
  
  // We instantiate the manager inside the component (or could receive it via props)
  // But since we need to toggle IMU mode, let's keep a ref to it or recreate it on mode switch.
  // Actually, simplest for MVP is to hold the instance in state.
  const [manager] = useState(() => new TareManager(imuEnabled));
  
  // Force update manager config when prop changes
  // (In a real app, use useEffect, but here we just mutate the flag for simplicity as per previous thought)
  (manager as any).useIMUAdjustment = imuEnabled;

  const [isRecording, setIsRecording] = useState(false);
  const [samples, setSamples] = useState(manager.getSamples());
  const [inputValue, setInputValue] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    manager.clear();
    setSamples([]);
    setIsRecording(true);
  };

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      const snap = sensorSnapshot();
      manager.addSample(val, snap);
      setSamples(manager.getSamples());
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleDelete = (id: string) => {
    manager.removeSample(id);
    setSamples(manager.getSamples());
  };

  const handleStop = () => {
    const model = manager.buildModel();
    onLock(model);
    setIsRecording(false);
  };
  
  const handleCancel = () => {
      setIsRecording(false);
      setSamples([]);
      manager.clear();
  };

  const handleRedo = () => {
      // Unlocks by calling onLock with something empty? 
      // Actually parent manages "activeModel". Parent passes null to unlock? 
      // No, we need a way to tell parent to unlock.
      // We will assume onLock(null) isn't typed. 
      // We rely on parent handling a re-start by simply allowing this component to mount in "Idle" state if parent allows.
      // But typically "Redo" means clearing the parent's locked model.
      // Let's assume the parent handles the null/reset logic via a separate callback or we just overwrite.
      // Wait, in App.tsx, we check activeModel. If activeModel exists, we show "Locked" state.
      // Here we will just emit a new model when we finish. 
      // But to "Redo", we effectively need to go back to Idle.
      // The parent needs a "onUnlock" prop or we just show the Locked state here with a "Redo" button that calls onUnlock.
      // Let's check App structure.
      // App has setTareModel.
      // If we call onLock(null) (need to cast or fix type), we reset.
      // Let's assume we can pass a "reset" signal.
      // For now, I'll allow re-recording if I just call handleStart, but the parent keeps the old model until I call handleStop.
      // Actually, UI shows "Locked" state if activeModel is present.
      // I will render the Locked state here.
  };

  // 1. Locked State (Active)
  if (activeModel) {
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
                                {activeModel.bias.toFixed(2)} <span className="text-xl text-gray-400">g</span>
                             </span>
                        </div>
                        <div className="pl-4 border-l border-gray-200 dark:border-slate-700">
                             <span className="text-xs uppercase text-gray-500 dark:text-gray-400 block">{t('unc95')}</span>
                             <span className="text-2xl font-bold text-gray-600 dark:text-gray-300 font-mono">
                                ± {activeModel.tareUncertainty.toFixed(2)} g
                             </span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2 flex gap-2">
                        <span>n={activeModel.n}</span>
                        {activeModel.method === 'imu-regression' && (
                             <span className="text-purple-500 font-bold flex items-center gap-1">
                                <BrainCircuit size={12}/> {t('imuActive')}
                             </span>
                        )}
                    </div>
                </div>
                <CheckCircle className="text-green-500 opacity-20" size={64} />
            </div>
            {/* We cast null to any to allow unlocking if the prop type is strict, or ideally update prop type */}
            <button onClick={() => (onLock as any)(null)} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-sm font-bold text-gray-400 hover:text-red-500 underline py-2 px-2">
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
                <div className="flex items-center gap-2">
                    {imuEnabled && (
                        <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded border border-purple-200 flex items-center gap-1">
                            <BrainCircuit size={12}/> IMU
                        </span>
                    )}
                    <span className="text-sm font-bold bg-white dark:bg-slate-700 dark:text-gray-300 border dark:border-slate-600 px-3 py-1 rounded-full">
                        n={samples.length}
                    </span>
                </div>
            </div>

            <div className="p-5">
                <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-4">
                    <input
                        ref={inputRef}
                        type="number" step="0.01" inputMode="decimal"
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
                            <div>
                                <span className="font-mono text-gray-800 dark:text-gray-200 font-bold text-lg">{s.value.toFixed(2)} g</span>
                                {s.snapshot && (
                                    <div className="text-xs text-purple-500 font-mono">
                                        az: {s.snapshot.az.toFixed(2)}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleDelete(s.id)} className="text-red-400 p-2 hover:bg-red-50 rounded"><Trash2 size={20}/></button>
                        </div>
                    ))}
                    {samples.length === 0 && <div className="text-gray-400 text-sm italic text-center py-4">{t('noReadings')}</div>}
                </div>

                <div className="flex gap-3 mt-4">
                     <button onClick={handleCancel} className="px-4 py-3 text-red-500 hover:text-red-400 text-base font-bold bg-white dark:bg-transparent border border-gray-200 dark:border-slate-700 rounded-lg">{t('cancel')}</button>
                     <button 
                        onClick={handleStop} 
                        disabled={samples.length < 3}
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
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 mb-6 flex flex-col gap-4 transition-colors border border-gray-100 dark:border-slate-800">
       <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-xl text-nautical-700 dark:text-nautical-400 flex items-center gap-2">
                    <Target size={24} /> {t('tareConfig')}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('biasEst')}: <strong className="text-gray-700 dark:text-gray-200">0.0g</strong>
                </div>
            </div>
            
            <button 
                onClick={toggleImu}
                disabled={!isSensorActive}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    imuEnabled && isSensorActive
                    ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300' 
                    : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-slate-800 dark:border-slate-700'
                }`}
            >
                <BrainCircuit size={20} />
                <span className="text-[10px] font-bold uppercase mt-1">{t('imuToggle')}</span>
            </button>
       </div>

       <button 
         onClick={handleStart}
         className="w-full bg-nautical-500 text-white px-6 py-4 rounded-lg font-bold text-lg shadow hover:bg-nautical-600 flex items-center justify-center gap-3 active:scale-[0.98]"
       >
         <Play size={24} fill="currentColor"/> {t('start')}
       </button>
    </div>
  );
};