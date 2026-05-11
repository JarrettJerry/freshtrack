
import React, { useState, useMemo } from 'react';
import { Meal, UserStats, UserProfile, MealRecommendation } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type SortCriteria = 'time' | 'kcal';
type SortOrder = 'asc' | 'desc';
type CategoryFilter = 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

const MacroCard: React.FC<{ label: string; value: number; goal: number; unit: string }> = ({ label, value, goal, unit }) => (
  <div className="flex min-w-[120px] flex-1 flex-col gap-1 rounded-[1.8rem] p-5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-soft transition-colors shrink-0">
    <p className="text-muted-green dark:text-gray-400 text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{label}</p>
    <div className="flex items-baseline gap-1 flex-wrap mb-2">
      <p className="text-charcoal dark:text-white text-2xl font-black leading-tight">{value}</p>
      <div className="flex items-baseline text-muted-green/50 dark:text-gray-500 font-bold">
        <span className="text-[11px] mx-0.5">/</span>
        <span className="text-[13px]">{goal}</span>
        <span className="text-[10px] ml-0.5">{unit}</span>
      </div>
    </div>
    <div className="w-full h-1 bg-gray-50 dark:bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${Math.min(100, (value / goal) * 100)}%` }}></div>
    </div>
  </div>
);

interface DashboardProps {
  stats: UserStats;
  meals: Meal[];
  profile: UserProfile;
  recommendations: MealRecommendation[];
  onSelectRec: (rec: MealRecommendation) => void;
  onDeleteMeal: (id: string) => void;
  onUpdateMeal: (id: string, updates: Partial<Meal>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, meals, profile, recommendations, onSelectRec, onDeleteMeal, onUpdateMeal }) => {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [newName, setNewName] = useState('');
  const [showInsights, setShowInsights] = useState(false);

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [sortBy, setSortBy] = useState<SortCriteria>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const consumed = stats.currentKcal;
  const goal = stats.dailyGoal;
  const calorieBalance = goal - consumed;
  const isOverGoal = calorieBalance < 0;
  
  const progressValue = Math.min(100, (consumed / goal) * 100);
  const remainingValue = Math.max(0, 100 - progressValue);

  const chartData = [
    { name: 'Consumed', value: progressValue },
    { name: 'Remaining', value: remainingValue },
  ];
  
  const progressColor = isOverGoal ? '#ef4444' : '#9abe89';
  const trackColor = isDark ? '#2a3127' : '#f2f3f1';
  const COLORS = [progressColor, trackColor];

  const mealTargets = {
    Breakfast: Math.round(stats.dailyGoal * 0.25),
    Lunch: Math.round(stats.dailyGoal * 0.35),
    Dinner: Math.round(stats.dailyGoal * 0.30),
    Snack: Math.round(stats.dailyGoal * 0.10)
  };

  const insightsData = useMemo(() => {
    const activityMap: Record<string, number> = {};
    let totalWeeklyKcal = 0;
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    meals.forEach(meal => {
      const mealDate = meal.timestamp ? new Date(meal.timestamp) : new Date();
      const key = mealDate.toISOString().split('T')[0];
      activityMap[key] = (activityMap[key] || 0) + meal.kcal;
      if (mealDate >= sevenDaysAgo) totalWeeklyKcal += meal.kcal;
    });

    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (activityMap[key] && activityMap[key] > 0) {
        currentStreak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }
    const trackedDaysCount = Object.keys(activityMap).length;
    return {
      totalWeeklyKcal,
      currentStreak,
      trackedDaysCount,
      weeklyAverage: trackedDaysCount > 0 ? Math.round(totalWeeklyKcal / Math.min(trackedDaysCount, 7)) : 0
    };
  }, [meals]);

  const handleToggleTheme = () => {
    const global = window as any;
    if (global.toggleTheme) global.toggleTheme();
  };

  const handleOpenRename = (meal: Meal) => {
    setEditingMeal(meal);
    setNewName(meal.name);
  };

  const handleSaveRename = () => {
    if (editingMeal && newName.trim()) {
      onUpdateMeal(editingMeal.id, { name: newName.trim() });
      setEditingMeal(null);
    }
  };

  const processedMeals = useMemo(() => {
    let result = [...meals];
    const todayStr = new Date().toDateString();
    result = result.filter(m => {
        const mealDate = m.timestamp ? new Date(m.timestamp).toDateString() : todayStr;
        return mealDate === todayStr;
    });

    if (activeCategory !== 'All') result = result.filter(m => m.category === activeCategory);
    
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'kcal') {
        comparison = a.kcal - b.kcal;
      } else {
        const timeToMinutes = (t: string) => {
          const parts = t.split(' ');
          if (parts.length < 2) return 0;
          const [time, modifier] = parts;
          let [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };
        comparison = timeToMinutes(a.time) - timeToMinutes(b.time);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [meals, activeCategory, sortBy, sortOrder]);

  return (
    <div className="flex flex-col w-full pb-48 px-0 theme-transition">
      {/* Top Bar */}
      <div className="flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-6 justify-between sticky top-0 z-20 border-b border-gray-100/50 dark:border-white/5">
        <div className="flex size-12 shrink-0 items-center">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 ring-2 ring-primary/20" style={{ backgroundImage: `url("${profile.avatar}")` }}></div>
        </div>
        <div className="flex-1 px-4 text-left">
          <p className="text-muted-green dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
          </p>
          <h2 className="text-charcoal dark:text-white text-2xl font-black tracking-tight leading-none mt-1">Hi, {profile.name}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleToggleTheme} className="flex size-11 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <span className="material-symbols-outlined text-charcoal dark:text-white text-[22px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button onClick={() => setShowInsights(true)} className="flex size-11 items-center justify-center rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-primary relative">
            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            <span className="absolute top-1 right-1 size-2 bg-orange-500 rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
        </div>
      </div>

      {/* Main Calorie Summary */}
      <div className="flex flex-col items-center justify-center py-10 px-8 relative">
        <div className="size-64 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius="82%" outerRadius="98%" paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className={`text-[11px] font-black uppercase tracking-[0.3em] mb-1 ${isOverGoal ? 'text-red-500 opacity-100' : 'text-muted-green dark:text-gray-400 opacity-60'}`}>
                {isOverGoal ? 'Surplus' : 'Remaining'}
            </span>
            <span className={`text-6xl font-black my-1 tracking-tighter transition-colors ${isOverGoal ? 'text-red-500' : 'text-charcoal dark:text-white'}`}>
                {Math.abs(calorieBalance).toLocaleString()}
            </span>
            <span className="text-muted-green dark:text-primary text-[10px] font-black px-4 py-1.5 bg-accent-cream dark:bg-primary/10 rounded-full mt-4 tracking-[0.15em] uppercase border border-primary/10">
                Goal: {stats.dailyGoal}
            </span>
          </div>
        </div>
      </div>

      {/* Macro Summary Row */}
      <div className="flex overflow-x-auto gap-3 px-6 py-2 no-scrollbar">
        <MacroCard label="Carbs" value={stats.carbs} goal={stats.carbsGoal} unit="g" />
        <MacroCard label="Protein" value={stats.protein} goal={stats.proteinGoal} unit="g" />
        <MacroCard label="Fat" value={stats.fat} goal={stats.fatGoal} unit="g" />
      </div>

      {/* AI Meal Plan */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-charcoal dark:text-white text-3xl font-black tracking-tight leading-none">Your {profile.preferredCuisine} Plan</h3>
              <p className="text-muted-green dark:text-gray-500 text-[11px] font-black uppercase tracking-[0.2em] mt-2">Personalized daily strategy</p>
            </div>
            <button className="size-12 flex items-center justify-center bg-primary/10 text-primary rounded-2xl active:scale-90 transition-all border border-primary/10">
                <span className="material-symbols-outlined text-2xl">refresh</span>
            </button>
        </div>

        <div className="relative space-y-6">
          <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent pointer-events-none"></div>
          {recommendations.length > 0 ? recommendations.map((rec, idx) => {
            const icons: Record<string, string> = { Breakfast: 'wb_twilight', Lunch: 'sunny', Dinner: 'nights_stay' };
            const colors: Record<string, string> = { Breakfast: 'text-orange-400', Lunch: 'text-yellow-500', Dinner: 'text-indigo-400' };
            return (
              <div key={idx} onClick={() => onSelectRec(rec)} className="relative pl-14 animate-in fade-in slide-in-from-left duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="absolute left-2.5 top-0 size-7 bg-white dark:bg-background-dark border-2 border-primary rounded-full flex items-center justify-center z-10 shadow-sm">
                  <span className={`material-symbols-outlined text-sm ${colors[rec.type] || 'text-primary'}`}>{icons[rec.type] || 'restaurant'}</span>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/10 p-5 shadow-soft hover:shadow-lg active:scale-[0.98] transition-all flex gap-4 cursor-pointer overflow-hidden group">
                  <div className="size-20 rounded-2xl bg-cover bg-center shrink-0 border border-black/5" style={{ backgroundImage: `url(${rec.image})` }} />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{rec.type}</span>
                      <span className="text-charcoal dark:text-white font-black text-sm">{rec.kcal} kcal</span>
                    </div>
                    <h4 className="text-charcoal dark:text-white font-bold text-base leading-tight mb-1 group-hover:text-primary transition-colors">{rec.name}</h4>
                    <p className="text-muted-green dark:text-gray-400 text-[10px] line-clamp-2 leading-relaxed opacity-80">{rec.reason}</p>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center py-10 opacity-40">
                <span className="material-symbols-outlined animate-spin text-4xl mb-2">progress_activity</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Designing Plan...</span>
            </div>
          )}
        </div>
      </div>

      {/* Logs Section */}
      <div className="flex items-center justify-between px-6 pt-10 pb-4">
        <h3 className="text-charcoal dark:text-white text-xl font-black tracking-tight">Today's Logs</h3>
      </div>

      <div className="flex flex-col gap-4 mb-4">
        <div className="flex overflow-x-auto gap-2 px-6 no-scrollbar">
          {(['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'] as CategoryFilter[]).map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-soft scale-105' : 'bg-gray-50 dark:bg-white/5 text-muted-green dark:text-gray-400'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-6">
          <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-gray-100 dark:border-white/5">
            <button onClick={() => setSortBy('time')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'time' ? 'bg-white dark:bg-white/10 text-primary' : 'text-muted-green dark:text-gray-500'}`}>Time</button>
            <button onClick={() => setSortBy('kcal')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'kcal' ? 'bg-white dark:bg-white/10 text-primary' : 'text-muted-green dark:text-gray-500'}`}>Kcal</button>
          </div>
          <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-muted-green dark:text-gray-400 hover:text-primary">
            <span className="text-[9px] font-black uppercase tracking-widest">{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
            <span className="material-symbols-outlined text-sm">{sortOrder === 'asc' ? 'south' : 'north'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6">
        {processedMeals.length === 0 ? (
          <div className="p-12 text-center text-muted-green dark:text-gray-400 italic bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-white/10">No entries for today.</div>
        ) : processedMeals.map((meal) => {
          const target = mealTargets[meal.category as keyof typeof mealTargets] || 500;
          const percentOfTarget = Math.round((meal.kcal / target) * 100);
          return (
            <div key={meal.id} className="flex flex-col bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-soft-card group transition-all">
              <div className="flex items-center gap-4">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-14 shadow-inner shrink-0" style={{ backgroundImage: `url(${meal.image})` }}></div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-start gap-2">
                    <p className="text-charcoal dark:text-gray-100 text-base font-black leading-tight break-words">{meal.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-black uppercase tracking-tighter">{meal.category}</span>
                  </div>
                  <p className="text-muted-green dark:text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">{meal.time} • Target: {target}kcal</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-charcoal dark:text-white text-lg font-black leading-none">{meal.kcal}</p>
                    <p className="text-[10px] font-bold text-muted-green dark:text-gray-500 uppercase mt-1">Calories</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleOpenRename(meal)} className="size-8 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-muted-green hover:text-primary transition-all active:scale-90 shadow-sm border border-gray-100 dark:border-white/5">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => onDeleteMeal(meal.id)} className="size-8 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 text-muted-green hover:text-red-500 transition-all active:scale-90 shadow-sm border border-gray-100 dark:border-white/5">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                  <span className={percentOfTarget > 110 ? 'text-orange-500' : 'text-primary'}>{percentOfTarget > 110 ? 'Slightly High' : percentOfTarget < 90 ? 'Light Meal' : 'Optimal'}</span>
                  <span className="text-muted-green dark:text-gray-400">{percentOfTarget}% of Target</span>
                </div>
                <div className="h-1.5 w-full bg-gray-50 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${percentOfTarget > 110 ? 'bg-orange-400' : 'bg-primary'}`} style={{ width: `${Math.min(100, percentOfTarget)}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights Modal */}
      {showInsights && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowInsights(false)}></div>
          <div className="relative w-full max-w-[380px] bg-white dark:bg-[#181c16] rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><span className="material-symbols-outlined text-[120px]">insights</span></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner"><span className="material-symbols-outlined text-3xl">auto_awesome</span></div>
              <div className="flex flex-col">
                <h3 className="text-2xl font-black text-charcoal dark:text-white tracking-tighter leading-none">Weekly Insight</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Consistency Report</span>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                <p className="text-charcoal/80 dark:text-gray-300 text-base leading-relaxed font-medium">
                  {insightsData.currentStreak > 0 
                    ? `Great job, ${profile.name}! You've tracked your diet consistently for ${insightsData.currentStreak} day${insightsData.currentStreak > 1 ? 's' : ''}. This habit helped you manage a total of ${insightsData.totalWeeklyKcal.toLocaleString()} kcal this week.` 
                    : `Welcome, ${profile.name}! Start logging your meals today to build your streak and get personalized nutritional insights.`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-4 bg-primary/5 rounded-2xl border border-primary/10">
                   <span className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Weekly Streak</span>
                   <span className="text-lg font-black dark:text-white">{insightsData.currentStreak} Days</span>
                </div>
                <div className="flex flex-col p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                   <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Avg Calories</span>
                   <span className="text-lg font-black dark:text-white">{insightsData.weeklyAverage} kcal</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowInsights(false)} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-fab-glow active:scale-95 transition-all mt-8">Close</button>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingMeal(null)}></div>
          <div className="relative w-full max-w-[430px] bg-white dark:bg-[#181c16] rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500 ease-out border-t border-white/10">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-8"></div>
            <h3 className="text-2xl font-black text-charcoal dark:text-white tracking-tighter mb-6 flex items-center gap-3"><span className="material-symbols-outlined text-primary text-3xl">edit_note</span>Rename Meal</h3>
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-green dark:text-gray-500 ml-4">Current Name</label>
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 text-charcoal dark:text-gray-400 font-bold opacity-60">{editingMeal.name}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-4">New Name</label>
                <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()} placeholder="Enter custom meal name..." className="w-full bg-white dark:bg-white/10 p-4 rounded-2xl border-2 border-primary outline-none text-charcoal dark:text-white font-bold text-lg shadow-soft transition-all focus:ring-4 focus:ring-primary/20" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setEditingMeal(null)} className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-muted-green dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSaveRename} className="flex-[2] h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-fab-glow active:scale-95 transition-all flex items-center justify-center gap-2"><span className="material-symbols-outlined">save</span>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
