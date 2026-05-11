
import React from 'react';
import { MealRecommendation, Meal } from '../types';

interface MealDetailScreenProps {
  recommendation: MealRecommendation;
  dailyGoal: number;
  onBack: () => void;
  onLog: (meal: Meal) => void;
}

export const MealDetailScreen: React.FC<MealDetailScreenProps> = ({ recommendation, dailyGoal, onBack, onLog }) => {
  const kcalPercent = Math.round((recommendation.kcal / dailyGoal) * 100);

  const handleLogMeal = () => {
    const newMeal: Meal = {
      id: Date.now().toString(),
      name: recommendation.name,
      category: recommendation.type as any,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      kcal: recommendation.kcal,
      protein: recommendation.protein,
      carbs: recommendation.carbs,
      fat: recommendation.fat,
      image: recommendation.image,
      servingSize: 'Suggested Serving'
    };
    onLog(newMeal);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark theme-transition pb-32">
      {/* Hero Header */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: `url(${recommendation.image})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background-light dark:to-background-dark"></div>
        
        <button 
          onClick={onBack}
          className="absolute top-12 left-6 size-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform z-20"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="absolute bottom-10 left-6 z-20">
          <div className="bg-primary/90 backdrop-blur-sm px-4 py-1.5 rounded-full inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-sm">local_dining</span>
            <span className="text-white text-[11px] font-black uppercase tracking-widest">{recommendation.type} Suggestion</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 -mt-6 relative z-10 bg-background-light dark:bg-background-dark rounded-t-[3rem] pt-8">
        <h1 className="text-charcoal dark:text-white text-3xl font-black tracking-tighter leading-tight mb-4">
          {recommendation.name}
        </h1>
        
        {/* Quick Stats Bar */}
        <div className="flex items-center gap-6 mb-8 py-4 border-y border-gray-100 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-primary text-2xl font-black leading-none">{recommendation.kcal}</span>
            <span className="text-muted-green dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Calories</span>
          </div>
          <div className="w-[1px] h-8 bg-gray-100 dark:bg-white/10"></div>
          <div className="flex flex-col">
            <span className="text-charcoal dark:text-white text-2xl font-black leading-none">{kcalPercent}%</span>
            <span className="text-muted-green dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Daily Target</span>
          </div>
          <div className="flex-1"></div>
          <div className="bg-accent-cream dark:bg-white/5 size-12 rounded-full flex items-center justify-center">
             <span className="material-symbols-outlined text-primary">eco</span>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-6 mb-8 border border-gray-100 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">psychology</span>
            AI Nutri-Insight
          </h3>
          <p className="text-charcoal/80 dark:text-gray-300 text-base leading-relaxed font-medium italic">
            "{recommendation.reason}"
          </p>
        </div>

        {/* Detailed Macros */}
        <div className="space-y-6 mb-10">
          <h3 className="text-lg font-black tracking-tight dark:text-white">Nutritional Profile</h3>
          <div className="grid grid-cols-1 gap-4">
            <MacroProgress label="Protein" value={recommendation.protein} goal={40} unit="g" color="bg-primary" />
            <MacroProgress label="Carbohydrates" value={recommendation.carbs} goal={100} unit="g" color="bg-[#f5e6a1]" />
            <MacroProgress label="Healthy Fats" value={recommendation.fat} goal={30} unit="g" color="bg-muted-green" />
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
           <h3 className="text-lg font-black tracking-tight dark:text-white mb-5 flex items-center gap-2">
             <span className="material-symbols-outlined text-primary">shopping_basket</span>
             Ingredients
           </h3>
           <div className="grid grid-cols-1 gap-3">
             {recommendation.ingredients.map((item, idx) => (
               <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                 <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                 <span className="text-sm font-bold text-charcoal/80 dark:text-gray-300">{item}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Instructions Stepper Section */}
        <div className="mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
           <h3 className="text-lg font-black tracking-tight dark:text-white mb-6 flex items-center gap-2">
             <span className="material-symbols-outlined text-primary">menu_book</span>
             Cooking Steps
           </h3>
           <div className="relative pl-6 space-y-8">
             {/* Vertical line connector */}
             <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-white/10"></div>
             
             {recommendation.instructions.map((step, idx) => (
               <div key={idx} className="relative flex flex-col gap-3 group">
                 {/* Step circle */}
                 <div className="absolute -left-[19px] top-1 size-6 bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-white border-4 border-background-light dark:border-background-dark z-10 transition-transform group-hover:scale-110">
                   {idx + 1}
                 </div>
                 <div className="bg-white dark:bg-white/5 p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-soft transition-all hover:shadow-md">
                   <p className="text-sm font-medium leading-relaxed text-charcoal/80 dark:text-gray-300">
                     {step}
                   </p>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Floating Log Button */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/95 dark:via-background-dark/95 to-transparent flex justify-center z-50">
        <button 
          onClick={handleLogMeal}
          className="w-full max-w-[360px] h-16 bg-primary dark:bg-primary text-white rounded-2xl font-black text-lg shadow-fab-glow active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-2xl">add_task</span>
          LOG THIS MEAL
        </button>
      </div>
    </div>
  );
};

const MacroProgress: React.FC<{ label: string; value: number; goal: number; unit: string; color: string }> = ({ label, value, goal, unit, color }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest">
      <span className="text-charcoal/60 dark:text-gray-400">{label}</span>
      <span className="text-charcoal dark:text-white">{value}{unit}</span>
    </div>
    <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${Math.min(100, (value / goal) * 100)}%` }}></div>
    </div>
  </div>
);
