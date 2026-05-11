
import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 100));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-background-light h-screen flex flex-col items-center justify-between py-12 px-6">
      <div className="h-20"></div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute filter blur-[40px] bg-accent-cream w-[180px] h-[180px] rounded-full opacity-60"></div>
          <div className="relative z-10 w-32 h-32 bg-white rounded-[2.5rem] shadow-xl shadow-primary/10 flex items-center justify-center border border-primary/5">
            <div className="relative">
              <span className="material-symbols-outlined text-[64px] text-primary" style={{ fontVariationSettings: "'wght' 200, 'FILL' 0" }}>
                lens_blur
              </span>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm">
                <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  eco
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-[#141613] tracking-tight text-[36px] font-bold leading-tight">
            FreshTrack
          </h1>
          <p className="text-[#737c6e] text-lg font-medium leading-normal mt-2">
            Intelligent Nutrition
          </p>
        </div>
      </div>

      <div className="w-full max-w-[280px]">
        <div className="flex flex-col gap-4">
          <div className="relative h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary/60 animate-spin">
              progress_activity
            </span>
            <span className="text-[#737c6e] text-xs font-black tracking-[0.2em] uppercase">
              {progress}% Loaded
            </span>
          </div>
        </div>
      </div>
      <div className="h-8"></div>
    </div>
  );
};
