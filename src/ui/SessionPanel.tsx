import React, { useState } from 'react';
import { MeasurementSession } from '../session/MeasurementSession';
import { TareModel, SessionResult } from '../types';
import { Trash2, Calculator, CheckCircle2 } from 'lucide-react';

interface Props {
  title: string;
  session: MeasurementSession;
  tareModel: TareModel | null;
  sensorSnapshot: () => any;
  onResult: (res: SessionResult | null) => void;
}

export const SessionPanel: React.FC<Props> = ({ title, session, tareModel, sensorSnapshot, onResult }) => {
  const [input, setInput] = useState('');
  // We keep a local copy of measurements to force re-render
  const [measurements, setMeasurements] = useState(session['measurements']); 
  const [result, setResult] = useState<SessionResult | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tareModel) return;
    const val = parseFloat(input);
    if (isNaN(val)) return;

    const snap = sensorSnapshot();
    const list = session.addMeasurement(val, tareModel, snap);
    setMeasurements(list);
    setInput('');
    setResult(null); 
    onResult(null);
  };

  const handleRemove = (id: string) => {
    const list = session.removeMeasurement(id);
    setMeasurements(list);
    setResult(null);
    onResult(null);
  };

  const handleCompute = () => {
    if (!tareModel) return;
    const res = session.calculateResult(tareModel);
    setResult(res);
    onResult(res);
  };

  if (!tareModel) return <div className="opacity-50 p-4 border rounded mb-4">{title} (Lock Tare First)</div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-4 mb-4 border border-gray-200 dark:border-slate-800">
      <h2 className="text-lg font-bold text-nautical-900 dark:text-nautical-100 mb-2">{title}</h2>
      
      {result ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded mb-4 border border-blue-100 dark:border-blue-800">
           <div className="flex items-center gap-2 font-bold text-xl text-blue-800 dark:text-blue-200">
             <CheckCircle2 /> {result.fixedValue.toFixed(1)}g
           </div>
           <div className="text-sm text-blue-600 dark:text-blue-300">
             ± {result.errorBand95.toFixed(2)}g (95%)
           </div>
           <div className="text-xs text-gray-500 mt-1">
             nTrim: {result.nTrim}, σ_total: {result.sigmaTotal.toFixed(2)}
           </div>
           <button onClick={() => { setResult(null); onResult(null); }} className="mt-2 text-xs underline">Edit Samples</button>
        </div>
      ) : (
        <>
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input 
              type="number" step="0.1" 
              value={input} onChange={e => setInput(e.target.value)}
              className="flex-1 border rounded p-3 text-lg dark:bg-slate-800 dark:border-slate-700"
              placeholder="Reading (g)"
              autoFocus
            />
            <button type="submit" className="bg-nautical-500 text-white px-4 rounded font-bold">+</button>
          </form>
          
          <button 
             onClick={handleCompute} 
             disabled={measurements.length === 0}
             className="w-full bg-slate-800 text-white py-3 rounded mb-4 disabled:opacity-50 flex justify-center items-center gap-2"
          >
             <Calculator size={16} /> Compute Result
          </button>
        </>
      )}

      <div className="max-h-40 overflow-y-auto space-y-2">
         {measurements.slice().reverse().map(m => (
           <div key={m.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded">
             <div>
               <span className="font-mono text-gray-500">{m.rawReading}</span>
               <span className="mx-2">→</span>
               <span className="font-mono font-bold">{m.adjustedValue.toFixed(1)}</span>
               {tareModel.method === 'imu-regression' && m.snapshot && (
                 <span className="text-xs text-purple-500 ml-1">
                   (adj by {(m.rawReading - m.adjustedValue).toFixed(1)})
                 </span>
               )}
             </div>
             {!result && (
               <button onClick={() => handleRemove(m.id)} className="text-red-400"><Trash2 size={16} /></button>
             )}
           </div>
         ))}
      </div>
    </div>
  );
};