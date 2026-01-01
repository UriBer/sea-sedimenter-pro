import React from 'react';
import { RatioResult } from '../types';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import { useSettings } from '../src/contexts/SettingsContext';

interface ResultCardProps {
  result: RatioResult;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const { t } = useSettings();
  const isLoss = result.percent > 0;
  const minRange = result.percent - result.errorBand95Percent;
  const maxRange = result.percent + result.errorBand95Percent;
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-blue-100 dark:border-slate-700 overflow-hidden mb-8 animate-fade-in transition-colors">
      <div className="bg-nautical-900 dark:bg-nautical-800 text-white p-4 flex items-center gap-2">
        <ClipboardCheck size={24} className="text-green-400" />
        <h2 className="text-lg font-bold">{isLoss ? t('weightLoss') : t('weightChange')}</h2>
      </div>

      <div className="p-6 text-center">
        
        <div className="text-5xl font-extrabold text-nautical-900 dark:text-nautical-100 mb-2 ltr:font-mono">
          {result.percent.toFixed(2)} <span className="text-3xl text-gray-600 dark:text-gray-400">%</span>
        </div>

        <div className="flex flex-col items-center gap-2 mb-6">
            <div className="inline-block bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
            <span className="text-blue-800 dark:text-blue-200 font-bold ltr:font-mono">± {result.errorBand95Percent.toFixed(2)} %</span>
            <span className="text-blue-600 dark:text-blue-400 text-xs ms-2 uppercase">({t('conf')})</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {t('range')}: <span className="font-bold text-nautical-700 dark:text-nautical-300 ltr:font-mono">{minRange.toFixed(2)}%</span> — <span className="font-bold text-nautical-700 dark:text-nautical-300 ltr:font-mono">{maxRange.toFixed(2)}%</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-start text-sm border-t border-gray-100 dark:border-slate-700 pt-4 bg-gray-50/50 dark:bg-slate-800/50 -mx-6 px-6 pb-2">
           <div className="py-2">
             <div className="text-xs text-gray-400 uppercase">{t('base')} (Wb)</div>
             <div className="font-bold text-gray-800 dark:text-gray-200 ltr:font-mono">{result.Wbase.fixedValue.toFixed(1)} g</div>
             <div className="text-xs text-gray-500 dark:text-gray-400 ltr:font-mono">±{result.Wbase.errorBand95.toFixed(2)}</div>
           </div>
           <div className="py-2">
             <div className="text-xs text-gray-400 uppercase">{t('final')} (Wf)</div>
             <div className="font-bold text-gray-800 dark:text-gray-200 ltr:font-mono">{result.Wfinal.fixedValue.toFixed(1)} g</div>
             <div className="text-xs text-gray-500 dark:text-gray-400 ltr:font-mono">±{result.Wfinal.errorBand95.toFixed(2)}</div>
           </div>
           <div className="py-2">
             <div className="text-xs text-gray-400 uppercase">{t('ratio')}</div>
             <div className="font-mono text-gray-600 dark:text-gray-300">{result.ratio.toFixed(4)}</div>
           </div>
           <div className="py-2">
             <div className="text-xs text-gray-400 uppercase">k-factor (n={result.nEff})</div>
             <div className="font-mono text-gray-600 dark:text-gray-300">{result.k95.toFixed(2)}</div>
           </div>
        </div>

        {result.notes && result.notes.length > 0 && (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-start border-l-2 rtl:border-l-0 rtl:border-r-2 border-yellow-400">
             {result.notes.map((note, i) => (
               <div key={i} className="flex gap-2 text-xs text-yellow-800 dark:text-yellow-200 mb-1 last:mb-0">
                 <AlertTriangle size={12} className="mt-0.5" />
                 {note}
               </div>
             ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
        <button 
          onClick={onReset}
          className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-100 font-bold py-3 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
        >
          {t('startNew')}
        </button>
      </div>
    </div>
  );
};