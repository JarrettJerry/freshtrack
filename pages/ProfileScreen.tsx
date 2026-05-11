import React, { useRef, useState, useMemo, useEffect } from 'react';
import { UserProfile, UserStats, Meal } from '../types.ts';

interface ProfileScreenProps {
  profile: UserProfile;
  stats: UserStats;
  meals: Meal[];
  onUpdate: (updates: Partial<UserProfile>) => void;
  onUpdateStats: (updates: Partial<UserStats>) => void;
}

const CUISINES = [
  { id: 'Western', name: 'Western', icon: 'lunch_dining' },
  { id: 'Chinese', name: 'Chinese', icon: 'rice_bowl' },
  { id: 'Japanese', name: 'Japanese', icon: 'set_meal' },
  { id: 'Mediterranean', name: 'Mediterranean', icon: 'tapas' },
  { id: 'Thai', name: 'Thai', icon: 'ramen_dining' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, stats, meals, onUpdate, onUpdateStats }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);

  const [tempGoals, setTempGoals] = useState({
    dailyGoal: stats.dailyGoal,
    proteinGoal: stats.proteinGoal,
    carbsGoal: stats.carbsGoal,
    fatGoal: stats.fatGoal,
  });
  
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const activityMap: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    meals.forEach(meal => {
        const date = meal.timestamp ? new Date(meal.timestamp) : new Date();
        const key = date.toISOString().split('T')[0];
        map[key] = (map[key] || 0) + meal.kcal;
    });
    return map;
  }, [meals]);

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (activityMap[key] && activityMap[key] > 0) count++;
      else {
        if (i === 0) continue;
        break;
      }
    }
    return count;
  }, [activityMap]);

  const { days, monthName, yearName } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      result.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      result.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }
    return {
      days: result,
      monthName: viewDate.toLocaleString('en-US', { month: 'long' }),
      yearName: viewDate.getFullYear()
    };
  }, [viewDate]);

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const handleToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const handleToggleTheme = () => {
    const global = window as any;
    if (global.toggleTheme) global.toggleTheme();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate({ avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleNameSave = async () => {
    if (tempName.trim() && tempName !== profile.name) {
      setIsSaving(true);
      // Simulate a small delay for silkiness
      await new Promise(r => setTimeout(r, 400));
      onUpdate({ name: tempName });
      setIsEditingName(false);
      setIsSaving(false);
      setShowSuccessFlash(true);
      setTimeout(() => setShowSuccessFlash(false), 2000);
    } else {
      setIsEditingName(false);
    }
  };

  const handleGoalsSave = () => {
    onUpdateStats(tempGoals);
    setIsEditingGoals(false);
  };

  const selectedDateActivity = activityMap[selectedDate.toISOString().split('T')[0]];

  return (
    <div className="bg-background-light dark:bg-background-dark text-charcoal dark:text-gray-100 font-display min-h-full pb-48 transition-colors duration-300">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg flex items-center px-6 py-4 justify-between border-b border-gray-100/50 dark:border-white/5">
        <div className="w-10"></div>
        <h2 className="text-lg font-bold flex-1 text-center tracking-tight">Health Profile</h2>
        <div className="flex w-10 items-center justify-end">
          <button onClick={handleToggleTheme} className="flex items-center justify-center rounded-full h-10 w-10 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[24px]">sunny</span>
          </button>
        </div>
      </div>

      <div className="px-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center py-10 gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 ring-8 ring-primary/10 border-4 border-white dark:border-[#20251e] shadow-2xl transition-transform hover:scale-105 active:scale-95" style={{ backgroundImage: `url("${profile.avatar}")` }}></div>
            <div className="absolute bottom-1 right-1 bg-primary text-white rounded-full size-10 flex items-center justify-center border-4 border-white dark:border-[#20251e] shadow-lg">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </div>
          </div>
          <div className="flex flex-col items-center w-full">
            <div className={`flex items-center gap-3 cursor-pointer group relative ${showSuccessFlash ? 'animate-pulse' : ''}`} onClick={() => { setTempName(profile.name); setIsEditingName(true); }}>
              <p className={`text-3xl font-black tracking-tighter text-charcoal dark:text-white group-active:scale-95 transition-all duration-500 ${showSuccessFlash ? 'text-primary scale-110' : ''}`}>
                {profile.name}
              </p>
              <span className="material-symbols-outlined text-primary text-xl opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
              {showSuccessFlash && (
                <div className="absolute -inset-x-4 -inset-y-2 bg-primary/10 rounded-xl animate-ping pointer-events-none"></div>
              )}
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 rounded-full">
                <span className="material-symbols-outlined text-primary text-sm font-bold">local_fire_department</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{streak} Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-400/10 rounded-full">
                <span className="material-symbols-outlined text-orange-500 text-sm font-bold">verified</span>
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Pro Member</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Card */}
        <div className="bg-white dark:bg-white/5 rounded-[2.5rem] p-6 mb-10 shadow-soft border border-gray-100 dark:border-white/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className="flex items-center justify-between mb-6 relative z-10">
             <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary animate-float"><span className="material-symbols-outlined">track_changes</span></div>
                <div>
                  <h3 className="text-base font-black dark:text-white tracking-tight leading-none">Nutrition Targets</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-green dark:text-gray-500">Daily benchmarks</span>
                </div>
             </div>
             <button onClick={() => setIsEditingGoals(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all animate-pulse-soft">Adjust</button>
           </div>
           <div className="grid grid-cols-2 gap-4 relative z-10">
             <div className="p-4 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl flex flex-col items-center border border-gray-100 dark:border-white/5 transition-transform hover:scale-[1.03]"><span className="text-[9px] font-black text-muted-green dark:text-gray-500 uppercase tracking-widest mb-1">Calories</span><span className="text-lg font-black dark:text-white">{stats.dailyGoal} <span className="text-[10px] opacity-40">kcal</span></span></div>
             <div className="p-4 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl flex flex-col items-center border border-gray-100 dark:border-white/5 transition-transform hover:scale-[1.03]"><span className="text-[9px] font-black text-muted-green dark:text-gray-500 uppercase tracking-widest mb-1">Protein</span><span className="text-lg font-black dark:text-white">{stats.proteinGoal}<span className="text-[10px] opacity-40">g</span></span></div>
             <div className="p-4 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl flex flex-col items-center border border-gray-100 dark:border-white/5 transition-transform hover:scale-[1.03]"><span className="text-[9px] font-black text-muted-green dark:text-gray-500 uppercase tracking-widest mb-1">Carbs</span><span className="text-lg font-black dark:text-white">{stats.carbsGoal}<span className="text-[10px] opacity-40">g</span></span></div>
             <div className="p-4 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl flex flex-col items-center border border-gray-100 dark:border-white/5 transition-transform hover:scale-[1.03]"><span className="text-[9px] font-black text-muted-green dark:text-gray-500 uppercase tracking-widest mb-1">Fat</span><span className="text-lg font-black dark:text-white">{stats.fatGoal}<span className="text-[10px] opacity-40">g</span></span></div>
           </div>
        </div>

        {/* Preferences */}
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
           <h3 className="text-lg font-black tracking-tight dark:text-white mb-5 flex items-center gap-2">Taste Preference</h3>
           <div className="flex overflow-x-auto gap-4 no-scrollbar pt-6 pb-10 px-2">
             {CUISINES.map(cuisine => {
               const isSelected = profile.preferredCuisine === cuisine.id;
               return (
                 <button 
                   key={cuisine.id} 
                   onClick={() => onUpdate({ preferredCuisine: cuisine.id })} 
                   className={`relative flex flex-col items-center justify-center min-w-[110px] p-6 rounded-[2.5rem] border-2 transition-all duration-300 active:scale-95 ${isSelected ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 -translate-y-1' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-muted-green dark:text-gray-400'}`}
                 >
                   {isSelected && (
                     <div className="absolute -top-3 -right-2 bg-white text-primary size-8 rounded-full flex items-center justify-center shadow-lg animate-pop-in z-20 border-2 border-primary/20">
                       <span className="material-symbols-outlined text-sm font-black">done</span>
                     </div>
                   )}
                   <span className="material-symbols-outlined text-[36px] mb-3">{cuisine.icon}</span>
                   <span className="text-[11px] font-black uppercase tracking-widest">{cuisine.name}</span>
                 </button>
               );
             })}
           </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-white/5 rounded-[3rem] shadow-soft p-8 mb-8 border border-gray-100 dark:border-white/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-16 duration-1000">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">{yearName}</span>
              <span className="text-2xl font-black text-charcoal dark:text-white tracking-tight">{monthName}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleToday} className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest text-primary mr-2 active:scale-90">Today</button>
              <button onClick={handlePrevMonth} className="size-11 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/10 text-muted-green hover:text-primary active:scale-90"><span className="material-symbols-outlined">chevron_left</span></button>
              <button onClick={handleNextMonth} className="size-11 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/10 text-muted-green hover:text-primary active:scale-90"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center gap-y-4 gap-x-1 relative z-10">
            {WEEKDAYS.map((d, i) => <p key={i} className="text-muted-green dark:text-gray-500 text-[10px] font-black opacity-60 uppercase mb-2">{d}</p>)}
            {days.map((item, i) => {
              const selected = selectedDate.toDateString() === item.date.toDateString();
              const today = new Date().toDateString() === item.date.toDateString();
              const dateKey = item.date.toISOString().split('T')[0];
              const activity = activityMap[dateKey];
              return (
                <div key={i} className="flex flex-col items-center">
                  <button onClick={() => { setSelectedDate(item.date); if (!item.currentMonth) setViewDate(new Date(item.date.getFullYear(), item.date.getMonth(), 1)); }} className={`relative h-12 w-full flex items-center justify-center rounded-2xl transition-all duration-300 active:scale-90 ${selected ? 'bg-primary text-white shadow-fab-glow z-10 scale-110' : today ? 'bg-primary/10 text-primary border-2 border-primary/20' : item.currentMonth ? 'text-charcoal dark:text-gray-200' : 'text-charcoal/20 dark:text-gray-600'}`}>
                    <span className="text-sm font-black">{item.day}</span>
                    {activity && activity > 0 && !selected && <div className={`absolute bottom-2 size-1 rounded-full ${activity > stats.dailyGoal * 1.1 ? 'bg-orange-500' : 'bg-primary'}`}></div>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modern Silk Animated Name Editor */}
      {isEditingName && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500" 
            onClick={() => !isSaving && setIsEditingName(false)}
          ></div>
          <div 
            className="relative w-full max-w-[380px] bg-white dark:bg-[#1e231c] rounded-[3.5rem] p-10 shadow-2xl border border-white/10"
            style={{ 
              animation: 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            <h3 className="text-2xl font-black text-charcoal dark:text-white tracking-tighter mb-2 text-center">Update Identity</h3>
            <p className="text-muted-green dark:text-gray-500 text-[10px] font-black uppercase tracking-widest text-center mb-8">What should we call you?</p>
            
            <div className="relative mb-10 group">
              <input 
                autoFocus 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && !isSaving && handleNameSave()} 
                className="w-full bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem] border-2 border-transparent outline-none focus:border-primary text-charcoal dark:text-white font-black text-2xl text-center shadow-inner transition-all group-hover:bg-gray-100 dark:group-hover:bg-white/10"
                placeholder="Enter Name..."
              />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-primary/20 rounded-full blur-sm group-focus-within:bg-primary transition-colors"></div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsEditingName(false)} 
                disabled={isSaving}
                className="flex-1 h-16 font-black text-muted-green dark:text-gray-500 uppercase tracking-widest text-[11px] active:scale-90 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleNameSave} 
                disabled={isSaving}
                className="flex-[2] h-16 bg-primary text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-fab-glow active:scale-95 transition-all flex items-center justify-center gap-2 overflow-hidden relative"
              >
                {isSaving ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals Dialog */}
      {isEditingGoals && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditingGoals(false)}></div>
          <div className="relative w-full max-w-[430px] bg-white dark:bg-[#181c16] rounded-t-[3rem] p-8 pb-12 animate-in slide-in-from-bottom duration-400">
            <h3 className="text-2xl font-black text-charcoal dark:text-white tracking-tighter mb-6 flex items-center gap-3"><span className="material-symbols-outlined text-primary text-3xl">track_changes</span>Adjust Health Goals</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-muted-green uppercase ml-2">Calorie Goal</label><input type="number" value={tempGoals.dailyGoal} onChange={(e) => setTempGoals({...tempGoals, dailyGoal: Number(e.target.value)})} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border-none outline-none dark:text-white font-bold" /></div>
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-muted-green uppercase ml-2">Protein (g)</label><input type="number" value={tempGoals.proteinGoal} onChange={(e) => setTempGoals({...tempGoals, proteinGoal: Number(e.target.value)})} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border-none outline-none dark:text-white font-bold" /></div>
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-muted-green uppercase ml-2">Carbs (g)</label><input type="number" value={tempGoals.carbsGoal} onChange={(e) => setTempGoals({...tempGoals, carbsGoal: Number(e.target.value)})} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border-none outline-none dark:text-white font-bold" /></div>
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-muted-green uppercase ml-2">Fat (g)</label><input type="number" value={tempGoals.fatGoal} onChange={(e) => setTempGoals({...tempGoals, fatGoal: Number(e.target.value)})} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border-none outline-none dark:text-white font-bold" /></div>
            </div>
            <div className="flex gap-4"><button onClick={() => setIsEditingGoals(false)} className="flex-1 h-14 font-black text-muted-green uppercase">Cancel</button><button onClick={handleGoalsSave} className="flex-[2] h-14 bg-primary text-white rounded-2xl font-black uppercase">Save</button></div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
