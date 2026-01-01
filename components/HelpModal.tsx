import React, { useState } from 'react';
import { X, BookOpen, Calculator, Scale, FileText } from 'lucide-react';
import { useSettings } from '../src/contexts/SettingsContext';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState<'usage' | 'math' | 'license'>('usage');

  const tabClass = (isActive: boolean) => 
    `flex-1 py-4 text-base font-bold transition-colors ${
      isActive 
      ? 'border-b-2 border-nautical-500 text-nautical-700 dark:text-nautical-400 bg-gray-50 dark:bg-slate-800' 
      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-nautical-900 dark:bg-slate-900 text-white rounded-t-lg">
          <h2 className="font-bold text-xl flex items-center gap-2">
            <BookOpen size={24} />
            {t('help')}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={28} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          <button onClick={() => setActiveTab('usage')} className={tabClass(activeTab === 'usage')}>{t('usage')}</button>
          <button onClick={() => setActiveTab('math')} className={tabClass(activeTab === 'math')}>{t('math')}</button>
          <button onClick={() => setActiveTab('license')} className={tabClass(activeTab === 'license')}>{t('licTab')}</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          
          {activeTab === 'usage' && (
            <div className="space-y-6">
              <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2 border-gray-100 dark:border-slate-800">
                <Scale size={20} /> {t('usage')}
              </h3>
              
              <div>
                <strong className="text-nautical-700 dark:text-nautical-400 block mb-1">{t('helpTareTitle')}</strong>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('helpTareBody')}</p>
              </div>

              <div>
                <strong className="text-nautical-700 dark:text-nautical-400 block mb-1">{t('helpBaseTitle')}</strong>
                 <p className="text-sm text-gray-600 dark:text-gray-400">{t('helpBaseBody')}</p>
              </div>

              <div>
                <strong className="text-nautical-700 dark:text-nautical-400 block mb-1">{t('helpFinalTitle')}</strong>
                 <p className="text-sm text-gray-600 dark:text-gray-400">{t('helpFinalBody')}</p>
              </div>

              <div>
                <strong className="text-nautical-700 dark:text-nautical-400 block mb-1">{t('helpResultsTitle')}</strong>
                 <p className="text-sm text-gray-600 dark:text-gray-400">{t('helpResultsBody')}</p>
              </div>
            </div>
          )}

          {activeTab === 'math' && (
            <div className="space-y-6">
              <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2 border-gray-100 dark:border-slate-800">
                <Calculator size={20} /> {t('math')}
              </h3>
              
              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{t('mathSysTitle')}</h4>
                <p className="mb-3 text-sm">{t('mathSysBody')}</p>
                <code className="block bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700 text-xs mb-1 font-mono">Bias (b) = Median(TareSamples)</code>
                <code className="block bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700 text-xs font-mono">Uncertainty (T) = (Max - Min) / 4</code>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{t('mathRandTitle')}</h4>
                <p className="mb-3 text-sm">{t('mathRandBody')}</p>
                <code className="block bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700 text-xs font-mono">SE = StdDev / sqrt(n_trim)</code>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{t('mathTotalTitle')}</h4>
                <p className="mb-3 text-sm">{t('mathTotalBody')}</p>
                <code className="block bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700 text-xs mb-1 font-mono">σ_total = sqrt(SE² + T²)</code>
                <code className="block bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700 text-xs font-mono">95% Band = k(n) × σ_total</code>
              </div>
            </div>
          )}

          {activeTab === 'license' && (
            <div className="space-y-4">
              <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2 border-gray-100 dark:border-slate-800">
                <FileText size={20} /> GNU GPLv3
              </h3>
              <div className="text-xs font-mono bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 h-64 overflow-y-auto text-gray-600 dark:text-gray-400">
                <p className="mb-2"><strong>Sea Sedimenter</strong></p>
                <p className="mb-4">Copyright (C) 2024 even-derech-it.com</p>
                <p className="mb-2">This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</p>
                <p className="mb-2">This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.</p>
                <p className="mb-4">You should have received a copy of the GNU General Public License along with this program. If not, see &lt;https://www.gnu.org/licenses/&gt;.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};