import React, { useState, useRef, useEffect } from 'react';
import { TarePanel } from '../components/TarePanel';
import { SessionPanel } from '../components/SessionPanel';
import { ResultCard } from '../components/ResultCard';
import { ReportForm } from '../components/ReportForm';
import { HistoryModal } from '../components/HistoryModal';
import { HelpModal } from '../components/HelpModal';
import { SensorBadge } from '../components/SensorBadge';
import { useSensors } from '../hooks/useSensors';
import { TareModel, SessionResult, RatioResult } from '../types';
import { RatioCalculator } from '../measurement/RatioCalculator';
import { Anchor, Calculator, History, HelpCircle, Moon, Sun, Globe, ToggleLeft, ToggleRight, Scale } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const App: React.FC = () => {
  const { t, isDarkMode, toggleTheme, setLanguage, language, singleShotMode, toggleSingleShot } = useSettings();
  const sensors = useSensors();

  // --- STATE ---
  const [imuEnabled, setImuEnabled] = useState(false);
  const [tareModel, setTareModel] = useState<TareModel | null>(null);

  // Session Results
  const [baseResult, setBaseResult] = useState<SessionResult | null>(null);
  const [finalResult, setFinalResult] = useState<SessionResult | null>(null);
  
  // Final Computation
  const [ratioResult, setRatioResult] = useState<RatioResult | null>(null);

  // Refs for scrolling
  const resultRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Effect to handle Single Shot Mode Switching
  useEffect(() => {
    handleResetAll();
    if (singleShotMode) {
      // Inject dummy tare model so sessions are enabled immediately
      setTareModel({
        isReady: true,
        method: 'single-shot',
        bias: 0,
        tareUncertainty: 0,
        n: 0
      });
    } else {
      setTareModel(null);
    }
  }, [singleShotMode]);

  // Toggle IMU mode if no tare model is locked
  const toggleImu = () => {
    if (tareModel && !singleShotMode) return; 
    setImuEnabled(!imuEnabled);
  };

  const handleCompute = () => {
    if (baseResult && finalResult) {
      const res = RatioCalculator.calculate(baseResult, finalResult);
      setRatioResult(res);
      // Scroll to result card (top of results)
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleResetAll = () => {
    setBaseResult(null);
    setFinalResult(null);
    setRatioResult(null);
    if (!singleShotMode) {
      setTareModel(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center transition-colors duration-300">
      <header className="w-full bg-nautical-900 dark:bg-slate-900 text-white p-4 shadow-md sticky top-0 z-40">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="text-nautical-500" />
            <div className="flex flex-col">
              <h1 className="font-bold text-lg tracking-wide leading-none">{t('appTitle')}</h1>
              <span className="text-[10px] text-nautical-100 opacity-80 uppercase tracking-widest">{t('appSubtitle')}</span>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <button onClick={toggleTheme} className="text-nautical-100 hover:text-white transition-colors" title="Toggle Theme">
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)} className="text-nautical-100 hover:text-white transition-colors pt-1" title="Language">
                <Globe size={20} />
                <span className="absolute -bottom-1 -right-1 text-[8px] uppercase font-bold bg-nautical-500 px-1 rounded">{language}</span>
              </button>
              {showLangMenu && (
                <div className="absolute top-8 right-0 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 shadow-xl rounded-lg py-1 w-24 border border-gray-200 dark:border-slate-700 z-50">
                  <button onClick={() => {setLanguage('en'); setShowLangMenu(false)}} className="block w-full text-start px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">English</button>
                  <button onClick={() => {setLanguage('he'); setShowLangMenu(false)}} className="block w-full text-start px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">עברית</button>
                  <button onClick={() => {setLanguage('ar'); setShowLangMenu(false)}} className="block w-full text-start px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">العربية</button>
                  <button onClick={() => {setLanguage('ru'); setShowLangMenu(false)}} className="block w-full text-start px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Русский</button>
                </div>
              )}
            </div>

            <button onClick={() => setShowHistory(true)} className="text-nautical-100 hover:text-white transition-colors" title={t('history')}>
              <History size={20} />
            </button>
            <button onClick={() => setShowHelp(true)} className="text-nautical-100 hover:text-white transition-colors" title={t('help')}>
              <HelpCircle size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-md p-4 flex-1 pb-20">
        
        {/* Mode Toggle */}
        {!ratioResult && (
           <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg mb-4 shadow border border-gray-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <Scale size={20} className={singleShotMode ? "text-orange-500" : "text-nautical-500"} />
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{singleShotMode ? t('singleShot') : t('tareConfig')}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {singleShotMode ? t('singleShotDesc') : t('helpTareBody').substring(0, 30) + "..."}
                    </span>
                 </div>
              </div>
              <button onClick={toggleSingleShot} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                 {singleShotMode ? <ToggleRight size={36} className="text-orange-500" /> : <ToggleLeft size={36} />}
              </button>
           </div>
        )}

        {/* Sensor Badge */}
        <SensorBadge 
           state={sensors.sensorState}
           onRequest={sensors.requestPermissions}
           onToggle={sensors.sensorState.isActive ? sensors.stopSensors : sensors.startSensors}
        />

        {/* Tare Panel (Only show if not Single Shot) */}
        {!ratioResult && !singleShotMode && (
           <TarePanel 
             onLock={setTareModel}
             activeModel={tareModel} 
             sensorSnapshot={sensors.captureSnapshot}
             isSensorActive={sensors.sensorState.isActive}
             imuEnabled={imuEnabled}
             toggleImu={toggleImu}
           />
        )}

        {/* Measurement Sessions */}
        {!ratioResult && (
          <>
            <SessionPanel 
                kind="base" 
                title={t('baseMeas')} 
                tareModel={tareModel}
                sensorSnapshot={sensors.captureSnapshot}
                startSensorLog={sensors.startRecording}
                stopSensorLog={sensors.stopRecording}
                existingResult={baseResult}
                onComplete={setBaseResult}
                onReset={() => setBaseResult(null)}
                colorClass="text-blue-700 dark:text-blue-400"
            />

            <SessionPanel 
                kind="final" 
                title={t('finalMeas')} 
                tareModel={tareModel}
                sensorSnapshot={sensors.captureSnapshot}
                startSensorLog={sensors.startRecording}
                stopSensorLog={sensors.stopRecording}
                existingResult={finalResult}
                onComplete={setFinalResult}
                onReset={() => setFinalResult(null)}
                colorClass="text-purple-700 dark:text-purple-400"
            />
          </>
        )}

        {/* Compute Action */}
        {!ratioResult && baseResult && finalResult && (
           <button 
             onClick={handleCompute}
             className="w-full py-4 bg-nautical-900 dark:bg-nautical-700 text-white rounded-lg shadow-lg font-bold text-xl hover:bg-black dark:hover:bg-nautical-800 transition-all flex items-center justify-center gap-2 animate-bounce-subtle"
           >
             <Calculator size={24} /> {t('compute')}
           </button>
        )}

        {/* Final Result */}
        {ratioResult && (
           <div ref={resultRef} className="scroll-mt-20">
            <ResultCard result={ratioResult} onReset={handleResetAll} />
            <ReportForm result={ratioResult} onSaved={() => {/* Optional post-save action */}} />
           </div>
        )}

      </main>

      {/* Modals */}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <footer className="w-full text-center p-6 text-gray-400 dark:text-gray-500 text-xs bg-slate-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
         <p className="font-bold text-nautical-900 dark:text-nautical-400 mb-1">{t('disclaimer')}</p>
         <p>{t('license')}</p>
      </footer>
    </div>
  );
};

export default App;