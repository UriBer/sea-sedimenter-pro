import React, { useState, useEffect } from 'react';
import { RatioResult, ReportMetadata, SavedReport, SessionResult } from '../types';
import { Save, FileText, Share2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

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
    loadDate: '', 
    loadNumber: '',
    dredgeArea: ''
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load last used values for persistent fields
    const lastOp = localStorage.getItem('sea_sed_last_op');
    const lastVessel = localStorage.getItem('sea_sed_last_vessel');
    const lastDredge = localStorage.getItem('sea_sed_last_dredge');
    const lastLoad = localStorage.getItem('sea_sed_last_load_num');

    setFormData(prev => {
        let nextLoad = prev.loadNumber;
        // Auto increment load number if it exists and is numeric
        if (lastLoad) {
            const num = parseInt(lastLoad);
            if (!isNaN(num)) {
                nextLoad = (num + 1).toString();
            } else {
                nextLoad = lastLoad; // Fallback if alphanumeric
            }
        }

        return { 
            ...prev, 
            operatorName: lastOp || '', 
            vesselName: lastVessel || '',
            dredgeArea: lastDredge || '',
            loadNumber: nextLoad
        };
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const persistData = () => {
     if (formData.operatorName) localStorage.setItem('sea_sed_last_op', formData.operatorName);
     if (formData.vesselName) localStorage.setItem('sea_sed_last_vessel', formData.vesselName);
     if (formData.dredgeArea) localStorage.setItem('sea_sed_last_dredge', formData.dredgeArea);
     if (formData.loadNumber) localStorage.setItem('sea_sed_last_load_num', formData.loadNumber);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    persistData();

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

  const formatMeasurements = (res: SessionResult, title: string) => {
    const lines = [`*${title} Measurements:*`];
    res.measurements.forEach((m, idx) => {
       let line = `${idx+1}) ${m.adjustedValue.toFixed(1)}g (Raw: ${m.rawReading})`;
       if (m.snapshot) {
         line += ` [G: x=${m.snapshot.ax.toFixed(2)}, y=${m.snapshot.ay.toFixed(2)}, z=${m.snapshot.azRaw.toFixed(2)}]`;
       }
       lines.push(line);
    });
    return lines.join('\n');
  };

  const handleWhatsApp = () => {
    persistData();

    const isLoss = result.percent > 0;
    const typeLabel = isLoss ? t('weightLoss') : t('weightChange');
    const minRange = result.percent - result.errorBand95Percent;
    const maxRange = result.percent + result.errorBand95Percent;

    // Use pre-calculated means from result object
    const baseRaw = result.Wbase.meanRaw;
    const finalRaw = result.Wfinal.meanRaw;
    
    // Check IMU significant presence
    const baseImu = result.Wbase.meanImuAdj;
    const finalImu = result.Wfinal.meanImuAdj;
    const hasImu = Math.abs(baseImu) > 0.01 || Math.abs(finalImu) > 0.01;

    // Use standard gross percent
    const grossPercent = result.grossPercent;

    const reportText = [
      `*${t('appTitle')} ${t('reportHeader')}*`,
      `------------------`,
      `${t('vessel')}: ${formData.vesselName}`,
      `${t('operator')}: ${formData.operatorName}`,
      `${t('date')}: ${new Date(formData.date).toLocaleString()}`,
      `${t('loadNum')}: ${formData.loadNumber || '-'}`,
      `${t('dredgeArea')}: ${formData.dredgeArea || '-'}`,
      ``,
      `*${t('base')} ${t('value')}*`,
      `${t('grossVal')}: ${baseRaw.toFixed(1)}g`,
      `${t('tareVal')}: -${result.Wbase.bias.toFixed(1)}g`,
      hasImu ? `${t('imuCorrection')}: -${baseImu.toFixed(2)}g` : null,
      `*${t('netVal')}: ${result.Wbase.fixedValue.toFixed(1)}g* (±${result.Wbase.errorBand95.toFixed(2)})`,
      ``,
      `*${t('final')} ${t('value')}*`,
      `${t('grossVal')}: ${finalRaw.toFixed(1)}g`,
      `${t('tareVal')}: -${result.Wfinal.bias.toFixed(1)}g`,
      hasImu ? `${t('imuCorrection')}: -${finalImu.toFixed(2)}g` : null,
      `*${t('netVal')}: ${result.Wfinal.fixedValue.toFixed(1)}g* (±${result.Wfinal.errorBand95.toFixed(2)})`,
      ``,
      `*${typeLabel}: ${result.percent.toFixed(2)}%* (${t('netVal')})`,
      `${t('grossVal')} ${t('change')}: ${grossPercent.toFixed(2)}%`,
      `${t('range')}: ${minRange.toFixed(2)}% — ${maxRange.toFixed(2)}%`,
      `_(±${result.errorBand95Percent.toFixed(2)}% ${t('conf')})_`,
      ``,
      `--- Detailed Data ---`,
      formatMeasurements(result.Wbase, t('base')),
      ``,
      formatMeasurements(result.Wfinal, t('final')),
      ``,
      `_${t('disclaimer')}_`
    ].filter(line => line !== null).join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  if (isSaved) {
      return (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-6 mt-8 text-center text-green-800 dark:text-green-300">
              <p className="font-bold text-lg">{t('savedSuccess')}</p>
          </div>
      )
  }

  const inputClass = "w-full border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-nautical-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition-colors placeholder:text-gray-300";
  const labelClass = "block text-sm font-bold text-gray-600 dark:text-gray-300 uppercase mb-2";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 mt-8 border border-gray-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-slate-800">
        <FileText size={24} className="text-nautical-700 dark:text-nautical-400"/>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xl">{t('saveRecord')}</h3>
      </div>
      
      <form onSubmit={handleSave} className="space-y-5">
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
                type="number"
                inputMode="numeric"
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

        <div className="flex flex-col gap-3 mt-8">
            <button 
                type="button" 
                onClick={handleWhatsApp}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow"
            >
              <Share2 size={24} /> {t('sendWhatsapp')}
            </button>
            <button 
                type="submit" 
                className="w-full bg-nautical-700 dark:bg-nautical-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-nautical-900 dark:hover:bg-nautical-500 transition-colors flex items-center justify-center gap-2 shadow"
            >
              <Save size={24} /> {t('saveBtn')}
            </button>
        </div>
      </form>
    </div>
  );
};