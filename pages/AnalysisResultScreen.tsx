
import React from 'react';
import { AnalysisResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AnalysisResultScreenProps {
  image: string;
  result: AnalysisResult;
  onSave: () => void;
  onRetake: () => void;
}

export const AnalysisResultScreen: React.FC<AnalysisResultScreenProps> = ({ image, result, onSave, onRetake }) => {
  const totalMacros = (result.protein || 0) + (result.carbs || 0) + (result.fat || 0);
  
  const data = [
    { name: 'Protein', value: result.protein || 0 },
    { name: 'Carbs', value: result.carbs || 0 },
    { name: 'Fat', value: result.fat || 0 },
  ];
  
  const COLORS = ['#9abe89', '#f5e6a1', '#737c6e'];

  const getPercentage = (val: number) => {
    if (totalMacros === 0) return 0;
    return Math.round((val / totalMacros) * 100);
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-white dark:bg-background-dark overflow-x-hidden pb-32 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center px-6 py-4 justify-between sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg border-b border-gray-100 dark:border-white/5">
        <button onClick={onRetake} className="size-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          <span className="material-symbols-outlined dark:text-white">arrow_back</span>
        </button>
        <h2 className="text-lg font-black dark:text-white tracking-tight">AI Nutrition Report</h2>
        <div className="size-11"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6">
        {/* Food Card */}
        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white dark:border-[#2a3127] aspect-[4/3] group">
          <img src={`data:image/jpeg;base64,${image}`} alt="Scanned Food" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="bg-primary/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg w-max mb-2">
                <span className="material-symbols-outlined text-white text-[14px]">verified</span>
                <span className="text-white text-[10px] font-black uppercase tracking-widest">AI Analyzed</span>
              </div>
              <h3 className="text-white text-2xl font-black leading-tight tracking-tighter drop-shadow-md line-clamp-2">{result.name}</h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Portion</span>
              <p className="text-white font-bold text-sm">{result.servingSize}</p>
            </div>
          </div>
        </div>

        {/* Calories Headline */}
        <div className="flex flex-col items-center py-8">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black tracking-tighter dark:text-white">{result.kcal}</span>
            <span className="text-xl font-bold text-muted-green dark:text-gray-500 uppercase tracking-widest">kcal</span>
          </div>
          <p className="text-muted-green dark:text-gray-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Energy Content</p>
        </div>

        {/* Donut Chart and Breakdown */}
        <div className="bg-gray-50 dark:bg-white/5 rounded-[3rem] p-8 border border-gray-100 dark:border-white/5 mb-8">
          <div className="flex flex-col items-center gap-10">
            <div className="size-52 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                    cornerRadius={12}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-green dark:text-gray-500">Macro</span>
                <span className="text-primary font-black text-2xl tracking-tighter mt-1">Split</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 w-full">
              <MacroResult label="Protein" val={result.protein} pct={getPercentage(result.protein)} color="bg-primary" />
              <MacroResult label="Carbs" val={result.carbs} pct={getPercentage(result.carbs)} color="bg-[#f5e6a1]" />
              <MacroResult label="Fat" val={result.fat} pct={getPercentage(result.fat)} color="bg-muted-green" />
            </div>
          </div>
        </div>

        {/* Retake Prompt */}
        <div className="flex items-center justify-center gap-4 py-4 mb-10">
            <button onClick={onRetake} className="flex items-center gap-2 text-muted-green hover:text-primary transition-all active:scale-95 group">
              <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">refresh</span>
              <span className="text-[11px] font-black uppercase tracking-widest">Retake Photo</span>
            </button>
            <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10"></div>
            <button className="flex items-center gap-2 text-muted-green hover:text-primary transition-all active:scale-95">
              <span className="material-symbols-outlined text-lg">edit</span>
              <span className="text-[11px] font-black uppercase tracking-widest">Adjust Info</span>
            </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white dark:from-background-dark via-white/95 dark:via-background-dark/95 to-transparent flex justify-center z-50">
        <button 
          onClick={onSave}
          className="w-full max-w-[380px] bg-primary text-white h-16 rounded-2xl font-black text-lg shadow-fab-glow flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">add_task</span>
          ADD TO LOG
        </button>
      </div>
    </div>
  );
};

const MacroResult: React.FC<{ label: string, val: number, pct: number, color: string }> = ({ label, val, pct, color }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`size-3 rounded-full ${color}`}></div>
    <p className="text-[10px] font-black dark:text-gray-400 uppercase tracking-widest">{label}</p>
    <div className="flex flex-col items-center">
      <span className="text-lg font-black dark:text-white leading-none">{val}g</span>
      <span className="text-[10px] font-bold text-muted-green mt-1">{pct}%</span>
    </div>
  </div>
);
