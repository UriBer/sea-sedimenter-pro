import React, { useEffect, useState } from 'react';
import { SavedReport } from '../types';
import { X, Trash2, Calendar, ArrowRight, Anchor, Share2 } from 'lucide-react';
import { useSettings } from '../src/contexts/SettingsContext';

interface HistoryModalProps {
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose }) => {
  const { t, direction } = useSettings();
  const [reports, setReports] = useState<SavedReport[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('sea_sedimenter_reports');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Sort by CreatedAt descending
        setReports(parsed.sort((a: SavedReport, b: SavedReport) => b.createdAt - a.createdAt));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const deleteReport = (id: string) => {
    if (confirm(t('confirmDelete'))) {
      const updated = reports.filter(r => r.id !== id);
      setReports(updated);
      localStorage.setItem('sea_sedimenter_reports', JSON.stringify(updated));
    }
  };

  const shareReport = (report: SavedReport) => {
    const result = report.result;
    const isLoss = result.percent > 0;
    const typeLabel = isLoss ? t('weightLoss') : t('weightChange');
    const minRange = result.percent - result.errorBand95Percent;
    const maxRange = result.percent + result.errorBand95Percent;

    // Calculate Raw Values
    const baseRaw = result.Wbase.fixedValue + result.Wbase.bias;
    const finalRaw = result.Wfinal.fixedValue + result.Wfinal.bias;
    
    // Use grossPercent if available (new format), else calculate on fly (old format)
    const grossPercent = result.grossPercent ?? (baseRaw > 0 ? (100 * (baseRaw - finalRaw) / baseRaw) : 0);

    const reportText = [
      `*${t('appTitle')} ${t('reportHeader')}*`,
      `------------------`,
      `${t('vessel')}: ${report.vesselName}`,
      `${t('operator')}: ${report.operatorName}`,
      `${t('date')}: ${new Date(report.date).toLocaleString()}`,
      `${t('loadNum')}: ${report.loadNumber || '-'}`,
      `${t('dredgeArea')}: ${report.dredgeArea || '-'}`,
      ``,
      `*${t('base')} ${t('value')}*`,
      `${t('grossVal')}: ${baseRaw.toFixed(1)}g`,
      `${t('tareVal')}: -${result.Wbase.bias.toFixed(1)}g`,
      `*${t('netVal')}: ${result.Wbase.fixedValue.toFixed(1)}g* (±${result.Wbase.errorBand95.toFixed(2)})`,
      ``,
      `*${t('final')} ${t('value')}*`,
      `${t('grossVal')}: ${finalRaw.toFixed(1)}g`,
      `${t('tareVal')}: -${result.Wfinal.bias.toFixed(1)}g`,
      `*${t('netVal')}: ${result.Wfinal.fixedValue.toFixed(1)}g* (±${result.Wfinal.errorBand95.toFixed(2)})`,
      ``,
      `*${typeLabel}: ${result.percent.toFixed(2)}%* (${t('netVal')})`,
      `${t('grossVal')} ${t('change')}: ${grossPercent.toFixed(2)}%`,
      `${t('range')}: ${minRange.toFixed(2)}% — ${maxRange.toFixed(2)}%`,
      `_(±${result.errorBand95Percent.toFixed(2)}% ${t('conf')})_`,
      ``,
      `_${t('disclaimer')}_`
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800 rounded-t-xl">
          <h2 className="font-bold text-2xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Calendar size={28} className="text-nautical-700 dark:text-nautical-400"/>
            {t('histCalc')}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            <X size={32} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 bg-gray-100/50 dark:bg-slate-950">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 space-y-2">
              <Anchor size={64} className="opacity-20" />
              <div className="italic text-lg">{t('noHist')}</div>
            </div>
          ) : (
            reports.map((report) => {
              const minRange = report.result.percent - report.result.errorBand95Percent;
              const maxRange = report.result.percent + report.result.errorBand95Percent;
              
              return (
              <div key={report.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                {/* Card Header: Vessel & Date */}
                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-nautical-900 dark:text-nautical-100 text-2xl mb-1">{report.vesselName}</div>
                    <div className="text-base text-gray-500 dark:text-gray-400">{new Date(report.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => shareReport(report)} 
                      className="p-3 text-gray-400 dark:text-slate-600 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                      title={t('sendWhatsapp')}
                    >
                      <Share2 size={28} />
                    </button>
                    <button 
                      onClick={() => deleteReport(report.id)} 
                      className="p-3 text-gray-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 size={28} />
                    </button>
                  </div>
                </div>
                
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-base mb-4 text-gray-700 dark:text-gray-300">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-400 dark:text-gray-500 font-bold">{t('operator')}</span>
                    <span className="truncate font-bold text-lg">{report.operatorName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs uppercase text-gray-400 dark:text-gray-500 font-bold">{t('loadNum')}</span>
                    <span className="truncate font-bold text-lg">{report.loadNumber || '-'}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-xs uppercase text-gray-400 dark:text-gray-500 font-bold">{t('dredgeArea')}</span>
                    <span className="truncate font-bold text-lg">{report.dredgeArea || '-'}</span>
                  </div>
                </div>

                {/* Calculation Details Block */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  
                  {/* Weights Row */}
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col items-center w-5/12">
                      <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-1">{t('base')}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-2xl">
                        {report.result.Wbase.fixedValue.toFixed(1)}<span className="text-sm">g</span>
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        ±{report.result.Wbase.errorBand95.toFixed(2)}
                      </span>
                    </div>

                    <div className="w-2/12 flex justify-center text-slate-300 dark:text-slate-600">
                      {direction === 'rtl' ? <ArrowRight size={32} className="rotate-180" /> : <ArrowRight size={32} />}
                    </div>

                    <div className="flex flex-col items-center w-5/12">
                      <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-1">{t('final')}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-2xl">
                        {report.result.Wfinal.fixedValue.toFixed(1)}<span className="text-sm">g</span>
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                        ±{report.result.Wfinal.errorBand95.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Result Highlight */}
                  <div className="p-5 text-center bg-white dark:bg-slate-900">
                    <div className="text-sm text-gray-400 uppercase font-bold mb-2">{t('weightChange')}</div>
                    <div className="text-4xl font-extrabold text-nautical-700 dark:text-nautical-300 leading-none mb-2 font-mono">
                      {report.result.percent.toFixed(2)}%
                    </div>
                    <div className="text-base font-medium text-blue-600 dark:text-blue-400 mb-2 font-mono">
                       ± {report.result.errorBand95Percent.toFixed(2)}% <span className="text-gray-400 font-normal">({t('conf')})</span>
                    </div>
                  </div>
                </div>

              </div>
            )})
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 text-center bg-gray-50 dark:bg-slate-800 rounded-b-xl">
           <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">Local Storage Data</span>
        </div>
      </div>
    </div>
  );
};