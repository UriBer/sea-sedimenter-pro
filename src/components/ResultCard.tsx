import React from 'react';
import { RatioResult, SessionResult } from '../types';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface ResultCardProps {
  result: RatioResult;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  const { t } = useSettings();
  const isLoss = result.percent > 0;
  const minRange = result.percent - result.errorBand95Percent;
  const maxRange = result.percent + result.errorBand95Percent;

  // --- CALCULATIONS ---
  // 1. Raw Means (from stats)
  const baseRawMean = result.Wbase.meanRaw;
  const finalRawMean = result.Wfinal.meanRaw;

  // 2. IMU Corrections
  const baseImuAdj = result.Wbase.meanImuAdj;
  const finalImuAdj = result.Wfinal.meanImuAdj;
  const hasImu = Math.abs(baseImuAdj) > 0.01 || Math.abs(finalImuAdj) > 0.01;

  // 3. Gross (Stabilized) = Raw - IMU_Correction
  // Note: meanImuAdj is (biasUsed - nominalBias). Positive means we subtracted MORE.
  // We want the "Effective Gross" that resulted in the net.
  // Net = Gross_Stab - Bias
  // So Gross_Stab = Net + Bias
  const baseGrossStab = result.Wbase.fixedValue + result.Wbase.bias;
  const finalGrossStab = result.Wfinal.fixedValue + result.Wfinal.bias;
  
  // 4. Net (Standard/Unadjusted) = Raw - Bias (ignoring IMU)
  const baseNetStd = baseRawMean - result.Wbase.bias;
  const finalNetStd = finalRawMean - result.Wfinal.bias;

  // Gross Percent (based on Stabilized Gross)
  const grossPercent = result.grossPercent;
  
  // Standard Net Percent
  const stdNetPercent = baseNetStd > 0 ? (100 * (baseNetStd - finalNetStd) / baseNetStd) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-blue-100 dark:border-slate-700 overflow-hidden mb-10 animate-fade-in transition-colors">
      <div className="bg-nautical-900 dark:bg-nautical-800 text-white p-5 flex items-center gap-3">
        <ClipboardCheck size={28} className="text-green-400" />
        <h2 className="text-2xl font-bold">{isLoss ? t('weightLoss') : t('weightChange')}</h2>
      </div>

      <div className="p-6 text-center">
        
        {/* Gross Change Display */}
        <div className="mb-8 flex flex-col items-center justify-center opacity-80">
           <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
             {t('grossVal')} {t('change')}
           </span>
           <span className="text-5xl font-bold text-gray-700 dark:text-gray-200 font-mono">
             {grossPercent.toFixed(2)}<span className="text-3xl text-gray-400">%</span>
           </span>
        </div>

        {/* Net Change Display (Primary) */}
        <div className="mb-4">
            <span className="text-base font-bold text-nautical-600 dark:text-nautical-400 uppercase tracking-widest mb-2 block">
                {t('netVal')} ({t('corrected')}) {t('change')}
            </span>
            <div className="text-8xl font-extrabold text-nautical-900 dark:text-nautical-100 mb-2 ltr:font-mono tracking-tighter leading-none">
              {result.percent.toFixed(2)}<span className="text-5xl text-gray-400 dark:text-gray-500 align-baseline">%</span>
            </div>
        </div>

        <div className="flex flex-col items-center gap-4 mb-10">
            <div className="inline-block bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-full border border-blue-100 dark:border-blue-800">
            <span className="text-blue-900 dark:text-blue-100 font-bold ltr:font-mono text-xl">± {result.errorBand95Percent.toFixed(2)} %</span>
            <span className="text-blue-700 dark:text-blue-300 text-base ms-2 uppercase tracking-wide">({t('conf')})</span>
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                {t('range')}: <span className="font-bold text-nautical-700 dark:text-nautical-300 ltr:font-mono text-xl">{minRange.toFixed(2)}%</span> — <span className="font-bold text-nautical-700 dark:text-nautical-300 ltr:font-mono text-xl">{maxRange.toFixed(2)}%</span>
            </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 sm:p-5 mb-6 text-left border border-gray-100 dark:border-slate-800 overflow-x-auto">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase mb-4 tracking-widest text-center">{t('math')}</h3>
            
            <div className="grid grid-cols-4 gap-3 text-sm pb-2 border-b border-gray-200 dark:border-slate-700 mb-3 min-w-[320px]">
                <div className="font-bold text-gray-400 dark:text-gray-500">{t('calcType')}</div>
                <div className="font-bold text-center text-gray-600 dark:text-gray-300">{t('base')}</div>
                <div className="font-bold text-center text-gray-600 dark:text-gray-300">{t('final')}</div>
                <div className="font-bold text-center text-gray-600 dark:text-gray-300">{t('change')}</div>
            </div>

            {/* Row 1: Gross (Stabilized) */}
            <div className="grid grid-cols-4 gap-3 items-center mb-3 min-w-[320px]">
                <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {t('grossVal')} <span className="text-[10px] block font-normal opacity-70">({hasImu ? t('imuActive') : t('raw')})</span>
                </div>
                <div className="text-center font-mono text-xl text-gray-800 dark:text-gray-200">{baseGrossStab.toFixed(1)}g</div>
                <div className="text-center font-mono text-xl text-gray-800 dark:text-gray-200">{finalGrossStab.toFixed(1)}g</div>
                <div className="text-center font-mono text-xl text-gray-500 dark:text-gray-400">{grossPercent.toFixed(2)}%</div>
            </div>

             {/* Row 2: Tare */}
             <div className="grid grid-cols-4 gap-3 items-center mb-3 min-w-[320px]">
                <div className="text-sm font-bold text-gray-500 dark:text-gray-400">{t('tareVal')}</div>
                <div className="text-center font-mono text-lg text-red-400">-{result.Wbase.bias.toFixed(1)}g</div>
                <div className="text-center font-mono text-lg text-red-400">-{result.Wfinal.bias.toFixed(1)}g</div>
                <div className="text-center font-mono text-gray-300">-</div>
            </div>

            {/* Row 3: Net (Standard/Unadjusted) - Only if IMU active to show contrast */}
            {hasImu && (
                <div className="grid grid-cols-4 gap-3 items-center mb-3 min-w-[320px] opacity-60">
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        {t('netVal')} <span className="text-[10px] block font-normal">({t('raw')})</span>
                    </div>
                    <div className="text-center font-mono text-lg text-gray-600 dark:text-gray-400">{baseNetStd.toFixed(1)}g</div>
                    <div className="text-center font-mono text-lg text-gray-600 dark:text-gray-400">{finalNetStd.toFixed(1)}g</div>
                    <div className="text-center font-mono text-lg text-gray-400">{stdNetPercent.toFixed(2)}%</div>
                </div>
            )}

            {/* Row 4: Net (Corrected) */}
            <div className="grid grid-cols-4 gap-3 items-center pt-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded p-3 min-w-[320px]">
                <div className="text-sm font-extrabold text-nautical-700 dark:text-nautical-400">
                    {t('netVal')} <span className="text-[10px] block font-normal text-nautical-500">({t('corrected')})</span>
                </div>
                <div className="text-center font-mono font-bold text-2xl text-nautical-900 dark:text-white">{result.Wbase.fixedValue.toFixed(1)}g</div>
                <div className="text-center font-mono font-bold text-2xl text-nautical-900 dark:text-white">{result.Wfinal.fixedValue.toFixed(1)}g</div>
                <div className="text-center font-mono font-bold text-2xl text-nautical-700 dark:text-nautical-300">{result.percent.toFixed(2)}%</div>
            </div>
        </div>
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
           <div>
             <span className="uppercase block text-xs">{t('ratio')}</span>
             <span className="font-mono text-lg font-bold text-gray-700 dark:text-gray-300">{result.ratio.toFixed(4)}</span>
           </div>
           <div>
             <span className="uppercase block text-xs">k-factor (n={result.nEff})</span>
             <span className="font-mono text-lg font-bold text-gray-700 dark:text-gray-300">{result.k95.toFixed(2)}</span>
           </div>
        </div>

        {result.notes && result.notes.length > 0 && (
          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded text-start border-l-4 rtl:border-l-0 rtl:border-r-4 border-yellow-400">
             {result.notes.map((note, i) => (
               <div key={i} className="flex gap-2 text-base text-yellow-800 dark:text-yellow-200 mb-2 last:mb-0">
                 <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                 {note}
               </div>
             ))}
          </div>
        )}
      </div>

      <div className="p-5 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
        <button 
          onClick={onReset}
          className="w-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-100 font-bold py-5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors text-xl shadow-sm"
        >
          {t('startNew')}
        </button>
      </div>
    </div>
  );
};