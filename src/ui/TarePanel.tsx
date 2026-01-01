import React, { useState } from 'react';
import { TareManager } from '../session/TareManager';
import { TareModel } from '../types';
import { Trash2, Scale, BrainCircuit } from 'lucide-react';

interface Props {
  manager: TareManager;
  sensorSnapshot: () => any;
  onLock: (model: TareModel) => void;
  isSensorActive: boolean;
  imuEnabled: boolean;
  toggleImu: () => void;
}

export const TarePanel: React.FC<Props> = ({ manager, sensorSnapshot, onLock, isSensorActive, imuEnabled, toggleImu }) => {
  const [input, setInput] = useState('');
  const [samples, setSamples] = useState(manager.getSamples());
  const [lockedModel, setLockedModel] = useState<TareModel | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(input);
    if (isNaN(val)) return;

    const snap = sensorSnapshot();
    const newSamples = manager.addSample(val, snap);
    setSamples(newSamples);
    setInput('');
  };

  const handleRemove = (id: string) => {
    const newSamples = manager.removeSample(id);
    setSamples(newSamples);
  };

  const handleLock = () => {
    const model = manager.buildModel();
    setLockedModel(model);
    onLock(model);
  };

  const handleClear = () => {
    manager.clear();
    setSamples([]);
    setLockedModel(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-4 mb-4 border border-gray-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-nautical-900 dark:text-nautical-100">
           <Scale size={20} /> Tare Config
        </h2>
        
        <button 
           onClick={toggleImu}
           disabled={lockedModel !== null || !isSensorActive}
           className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${
             imuEnabled && isSensorActive 
               ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-200' 
               : 'bg-gray-100 border-gray-300 text-gray-500 dark:bg-slate-800 dark:border-slate-700'
           }`}
        >
           <BrainCircuit size={14} /> IMU Adjust {imuEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Input */}
      {!lockedModel && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input 
            type="number" step="0.01" 
            value={input} onChange={e => setInput(e.target.value)}
            className="flex-1 border rounded p-3 text-lg dark:bg-slate-800 dark:border-slate-700"
            placeholder="Tare Reading (g)"
          />
          <button type="submit" className="bg-nautical-500 text-white px-4 rounded font-bold">+</button>
        </form>
      )}

      {/* Info Box */}
      {lockedModel ? (
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800 mb-4">
          <div className="font-bold text-green-800 dark:text-green-300">Model Locked</div>
          <div className="text-sm">Bias: {lockedModel.bias.toFixed(2)}g</div>
          <div className="text-sm">Uncertainty: ±{lockedModel.tareUncertainty.toFixed(2)}g</div>
          {lockedModel.method === 'imu-regression' && (
            <div className="text-xs mt-1 text-purple-600 dark:text-purple-400">
               IMU Active (k={lockedModel.slopeK?.toFixed(3)}, R²={lockedModel.rSquared?.toFixed(2)})
            </div>
          )}
          <button onClick={handleClear} className="mt-2 text-xs text-red-500 underline">Clear & Unlock</button>
        </div>
      ) : (
        <div className="mb-4">
            <button 
              onClick={handleLock} 
              disabled={samples.length < 3}
              className="w-full bg-slate-800 text-white py-2 rounded disabled:opacity-50"
            >
              Lock Tare Model ({samples.length})
            </button>
        </div>
      )}

      {/* List */}
      <div className="max-h-40 overflow-y-auto space-y-2">
         {samples.slice().reverse().map((s, i) => (
           <div key={s.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded">
              <div>
                 <span className="font-mono font-bold">{s.value.toFixed(2)}</span>
                 {lockedModel?.method === 'imu-regression' && s.snapshot && (
                   <span className="ml-2 text-xs text-gray-500">
                      (az: {s.snapshot.az.toFixed(2)} → adj: {s.adjustedValue?.toFixed(2)})
                   </span>
                 )}
              </div>
              {!lockedModel && (
                <button onClick={() => handleRemove(s.id)} className="text-red-400"><Trash2 size={16} /></button>
              )}
           </div>
         ))}
      </div>
    </div>
  );
};