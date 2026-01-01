import React from 'react';

interface SensorBadgeProps {
  isEnabled: boolean;
  isActive: boolean;
  onToggle: () => void;
  status: 'stable' | 'moving' | 'unknown';
}

export const SensorBadge: React.FC<SensorBadgeProps> = ({ isEnabled, isActive, onToggle, status }) => {
  return (
    <div className="flex items-center justify-between bg-slate-800 text-white p-3 rounded-lg mb-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          !isEnabled ? 'bg-gray-400' : 
          status === 'stable' ? 'bg-green-400 animate-pulse' : 
          status === 'moving' ? 'bg-red-400' : 'bg-yellow-400'
        }`} />
        <span className="text-sm font-medium">
          {!isEnabled ? "Sensors Off" :
           status === 'stable' ? "MEASURE OK" :
           status === 'moving' ? "UNSTABLE" : "Waiting..."}
        </span>
      </div>
      
      {!isEnabled ? (
         <button 
           onClick={onToggle}
           className="text-xs bg-slate-600 px-3 py-1 rounded hover:bg-slate-500 transition-colors"
         >
           Enable IMU
         </button>
      ) : (
        <button 
           onClick={onToggle}
           className={`text-xs px-3 py-1 rounded transition-colors ${isActive ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
         >
           {isActive ? "Stop" : "Start"}
        </button>
      )}
    </div>
  );
};
