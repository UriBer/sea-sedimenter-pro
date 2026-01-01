import React, { useState, useEffect } from 'react';
import { RatioResult, ReportMetadata, SavedReport } from '../types';
import { Save, FileText, Share2 } from 'lucide-react';
import { useSettings } from '../src/contexts/SettingsContext';

interface ReportFormProps {
  result: RatioResult;
  onSaved: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ result, onSaved }) => {
  const { t } = useSettings();
  
  // Format current date-time for input type="datetime-local" (YYYY-MM-DDTHH:mm)
  const now = new Date();
  const defaultDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

  const [formData, setFormData] = useState<ReportMetadata>({
    operatorName: '',
    date: defaultDateTime,
    vesselName: '',
    loadDate: '', // Deprecated/Removed from UI
    loadNumber: '',
    dredgeArea: ''
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load last operator name
    const lastOp = localStorage.getItem('sea_sed_last_op');
    if (lastOp) {
      setFormData(prev => ({ ...prev, operatorName: lastOp }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Persist operator name
    localStorage.setItem('sea_sed_last_op', formData.operatorName);

    const newReport: SavedReport = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...formData,
      result
    };

    try {
      const existingData = localStorage.getItem('sea_sedimenter_reports');
      const reports: SavedReport[] = existingData ? JSON.parse(existingData) : [];
      reports.push(newReport);
      localStorage.setItem('sea_sedimenter_reports', JSON.stringify(reports));
      setIsSaved(true);
      if (confirm(t('savedSuccess'))) {
          onSaved();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save report.');
    }
  };

  const handleWhatsApp = () => {
    // Persist operator name if sending via WA as well, for convenience
    if (formData.operatorName) {
        localStorage.setItem('sea_sed_last_op', formData.operatorName);
    }

    const isLoss = result.percent > 0;
    const typeLabel = isLoss ? t('weightLoss') : t('weightChange');
    const minRange = result.percent - result.errorBand95Percent;
    const maxRange = result.percent + result.errorBand95Percent;

    const reportText = [
      `*${t('appTitle')} Report*`,
      `------------------`,
      `${t('vessel')}: ${formData.vesselName}`,
      `${t('operator')}: ${formData.operatorName}`,
      `${t('date')}: ${new Date(formData.date).toLocaleString()}`,
      `${t('loadNum')}: ${formData.loadNumber || '-'}`,
      `${t('dredgeArea')}: ${formData.dredgeArea || '-'}`,
      ``,
      `*${t('base')}:* ${result.Wbase.fixedValue.toFixed(1)}g (±${result.Wbase.errorBand95.toFixed(2)})`,
      `*${t('final')}:* ${result.Wfinal.fixedValue.toFixed(1)}g (±${result.Wfinal.errorBand95.toFixed(2)})`,
      ``,
      `*${typeLabel}: ${result.percent.toFixed(2)}%*`,
      `${t('range')}: ${minRange.toFixed(2)}% — ${maxRange.toFixed(2)}%`,
      `_(±${result.errorBand95Percent.toFixed(2)}% 95% Conf)_`,
      ``,
      `_${t('disclaimer')}_`
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  if (isSaved) {
      return (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6 text-center text-green-800 dark:text-green-300">
              <p className="font-bold">{t('savedSuccess')}</p>
          </div>
      )
  }

  const inputClass = "w-full border border-gray-300 dark:border-slate-600 rounded px-3 py-2 focus:ring-2 focus:ring-nautical-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition-colors";
  const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 mt-6 border border-gray-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
        <FileText size={20} className="text-nautical-700 dark:text-nautical-400"/>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t('saveRecord')}</h3>
      </div>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className={labelClass}>{t('operator')}</label>
          <input 
            required 
            name="operatorName" 
            value={formData.operatorName} 
            onChange={handleChange} 
            placeholder="Name"
            className={inputClass} 
          />
        </div>
        
        <div>
           <label className={labelClass}>{t('date')}</label>
            <input 
                type="datetime-local" 
                required 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                className={inputClass} 
            />
        </div>

        <div>
            <label className={labelClass}>{t('vessel')}</label>
            <input 
                required 
                name="vesselName" 
                value={formData.vesselName} 
                onChange={handleChange} 
                placeholder="e.g. MILFORD"
                className={inputClass} 
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('loadNum')}</label>
            <input 
                name="loadNumber" 
                value={formData.loadNumber} 
                onChange={handleChange} 
                placeholder="#"
                className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>{t('dredgeArea')}</label>
            <input 
              name="dredgeArea" 
              value={formData.dredgeArea} 
              onChange={handleChange} 
              placeholder="Area"
              className={inputClass} 
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
            <button 
                type="button" 
                onClick={handleWhatsApp}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={18} /> WhatsApp
            </button>
            <button 
                type="submit" 
                className="flex-1 bg-nautical-700 dark:bg-nautical-600 text-white py-3 rounded-lg font-bold hover:bg-nautical-900 dark:hover:bg-nautical-500 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> {t('saveBtn')}
            </button>
        </div>
      </form>
    </div>
  );
};