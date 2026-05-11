
import React from 'react';
import { AppScreen } from '../types';

interface NavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate }) => {
  return (
    <div className="fixed bottom-8 left-0 w-full z-[100] flex justify-center pointer-events-none px-6">
      {/* Floating Island Container - Flex Row Layout */}
      <div className="pointer-events-auto bg-white/90 dark:bg-[#181c16]/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 px-4 py-2 rounded-[3.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-black/60 flex items-center justify-between w-full max-w-[400px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        
        {/* Dashboard Tab */}
        <button 
          onClick={() => onNavigate(AppScreen.DASHBOARD)}
          className="flex-1 flex flex-col items-center justify-center gap-1 h-16 rounded-[2.5rem] active:bg-gray-100 dark:active:bg-white/10 transition-colors group"
        >
          <span 
            className={`material-symbols-outlined text-[28px] transition-all duration-300 ${
              currentScreen === AppScreen.DASHBOARD 
                ? 'text-primary scale-110' 
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600'
            }`}
            style={{ fontVariationSettings: currentScreen === AppScreen.DASHBOARD ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
          >
            home
          </span>
          <span 
            className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
              currentScreen === AppScreen.DASHBOARD ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            Home
          </span>
        </button>

        {/* Camera Button - Larger and more prominent circular design */}
        <div className="px-4 -mt-10">
            <button 
            onClick={() => onNavigate(AppScreen.CAMERA)}
            className="relative size-20 bg-primary rounded-full flex items-center justify-center text-white shadow-[0_15px_30px_-5px_rgba(154,190,137,0.6)] active:scale-90 active:shadow-inner transition-all duration-300 group hover:scale-110 border-[8px] border-white dark:border-[#181c16]"
            >
            <span className="material-symbols-outlined text-[40px] group-hover:rotate-12 transition-transform duration-500 ease-out">
                photo_camera
            </span>
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping opacity-0 group-hover:opacity-100"></div>
            </button>
        </div>

        {/* Profile Tab */}
        <button 
          onClick={() => onNavigate(AppScreen.PROFILE)}
          className="flex-1 flex flex-col items-center justify-center gap-1 h-16 rounded-[2.5rem] active:bg-gray-100 dark:active:bg-white/10 transition-colors group"
        >
          <span 
            className={`material-symbols-outlined text-[28px] transition-all duration-300 ${
              currentScreen === AppScreen.PROFILE 
                ? 'text-primary scale-110' 
                : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600'
            }`}
            style={{ fontVariationSettings: currentScreen === AppScreen.PROFILE ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
          >
            person
          </span>
          <span 
            className={`text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
              currentScreen === AppScreen.PROFILE ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            Profile
          </span>
        </button>
      </div>
    </div>
  );
};
