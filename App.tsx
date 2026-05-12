import React, { useState, useEffect } from 'react';
import { AppScreen, Meal, UserStats, AnalysisResult, UserProfile, MealRecommendation } from './types.ts';
import { SplashScreen } from './pages/SplashScreen.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { CameraScanner } from './pages/CameraScanner.tsx';
import { AnalysisResultScreen } from './pages/AnalysisResultScreen.tsx';
import { ProfileScreen } from './pages/ProfileScreen.tsx';
import { MealDetailScreen } from './pages/MealDetailScreen.tsx';
import { Navigation } from './components/Navigation.tsx';
import { analyzeFoodImage } from './services/QwenService.ts';
import { getRecipes } from './services/RecipeService.ts';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [selectedRec, setSelectedRec] = useState<MealRecommendation | null>(null);

  const randomSeed = React.useMemo(() => Math.random().toString(36).substring(7), []);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'User',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`,
    preferredCuisine: 'Western'
  });

  const [recommendations, setRecommendations] = useState<MealRecommendation[]>([]);
  const [loadingText] = useState("AI Analysis...");
  const [isLoading, setIsLoading] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const [meals, setMeals] = useState<Meal[]>([
    {
      id: '1',
      name: 'Avocado Toast',
      category: 'Breakfast',
      time: '8:30 AM',
      kcal: 350,
      protein: 12,
      carbs: 45,
      fat: 18,
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300&auto=format&fit=crop',
      timestamp: Date.now()
    }
  ]);

  const [stats, setStats] = useState<UserStats>({
    dailyGoal: 2000,
    currentKcal: 350,
    protein: 12,
    carbs: 45,
    fat: 18,
    proteinGoal: 120,
    carbsGoal: 250,
    fatGoal: 65,
  });

  useEffect(() => {
    if (screen === AppScreen.SPLASH) {
      const timer = setTimeout(() => setScreen(AppScreen.DASHBOARD), 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // 改成从 RecipeService 取推荐
  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const recs = await getRecipes(userProfile.preferredCuisine);
        setRecommendations(recs);
      } catch (e) {
        console.warn("Recs fetching failed");
      }
    };

    if (
      (screen === AppScreen.DASHBOARD || screen === AppScreen.PROFILE) &&
      recommendations.length === 0
    ) {
      fetchRecs();
    }
  }, [userProfile.preferredCuisine, screen, recommendations.length]);

  useEffect(() => {
    setRecommendations([]);
  }, [userProfile.preferredCuisine]);

  useEffect(() => {
    const today = new Date().toDateString();

    const todayMeals = meals.filter(m => {
      const mealDate = m.timestamp
        ? new Date(m.timestamp).toDateString()
        : today;
      return mealDate === today;
    });

    const totalKcal = todayMeals.reduce((sum, m) => sum + m.kcal, 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + m.protein, 0);
    const totalCarbs = todayMeals.reduce((sum, m) => sum + m.carbs, 0);
    const totalFat = todayMeals.reduce((sum, m) => sum + m.fat, 0);

    setStats(prev => ({
      ...prev,
      currentKcal: totalKcal,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    }));
  }, [meals]);

  const handleCapture = async (base64: string) => {
    setScannedImage(base64);
    setIsLoading(true);
    setScreen(AppScreen.ANALYSIS);

    try {
      const result = await analyzeFoodImage(base64);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisResult({
        name: "Analysis Error",
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servingSize: "Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMeal = (manualMeal?: Meal) => {
    let mealToAdd: Meal | null = null;

    if (manualMeal) {
      mealToAdd = manualMeal;
    } else if (analysisResult && scannedImage) {
      mealToAdd = {
        id: Date.now().toString(),
        name: analysisResult.name,
        category: 'Lunch',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        kcal: analysisResult.kcal,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fat: analysisResult.fat,
        image: scannedImage,
        servingSize: analysisResult.servingSize,
        timestamp: Date.now()
      };
    }

    if (mealToAdd) {
      setMeals(prev => [mealToAdd!, ...prev]);
      setScreen(AppScreen.DASHBOARD);
      setScannedImage(null);
      setAnalysisResult(null);
    }
  };

  const handleDeleteMeal = (id: string) =>
    setMeals(prev => prev.filter(meal => meal.id !== id));

  const handleUpdateMeal = (id: string, updates: Partial<Meal>) => {
    setMeals(prev =>
      prev.map(meal =>
        meal.id === id ? { ...meal, ...updates } : meal
      )
    );
  };

  const handleUpdateStats = (updates: Partial<UserStats>) =>
    setStats(prev => ({ ...prev, ...updates }));

  const openRecommendation = (rec: MealRecommendation) => {
    setSelectedRec(rec);
    setScreen(AppScreen.MEAL_DETAIL);
  };

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.SPLASH:
        return <SplashScreen />;

      case AppScreen.DASHBOARD:
        return (
          <Dashboard
            stats={stats}
            meals={meals}
            profile={userProfile}
            recommendations={recommendations}
            onSelectRec={openRecommendation}
            onDeleteMeal={handleDeleteMeal}
            onUpdateMeal={handleUpdateMeal}
          />
        );

      case AppScreen.CAMERA:
        return (
          <CameraScanner
            onCapture={handleCapture}
            onClose={() => setScreen(AppScreen.DASHBOARD)}
          />
        );

      case AppScreen.ANALYSIS:
        if (isLoading) {
          return (
            <div className="h-screen flex flex-col items-center justify-center">
              <h2>Analyzing Food...</h2>
              <p>{loadingText}</p>
            </div>
          );
        }

        return scannedImage && analysisResult ? (
          <AnalysisResultScreen
            image={scannedImage}
            result={analysisResult}
            onSave={() => handleSaveMeal()}
            onRetake={() => setScreen(AppScreen.CAMERA)}
          />
        ) : null;

      case AppScreen.PROFILE:
        return (
          <ProfileScreen
            profile={userProfile}
            stats={stats}
            meals={meals}
            onUpdate={u => setUserProfile(p => ({ ...p, ...u }))}
            onUpdateStats={handleUpdateStats}
          />
        );

      case AppScreen.MEAL_DETAIL:
        return selectedRec ? (
          <MealDetailScreen
            recommendation={selectedRec}
            dailyGoal={stats.dailyGoal}
            onBack={() => setScreen(AppScreen.DASHBOARD)}
            onLog={handleSaveMeal}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center bg-gray-100 dark:bg-black min-h-screen">
      <div className="relative w-full max-w-[430px] min-h-screen bg-white dark:bg-background-dark shadow-2xl overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto no-scrollbar pb-safe">
          {renderScreen()}
        </main>

        {[AppScreen.DASHBOARD, AppScreen.PROFILE].includes(screen) && (
          <Navigation
            currentScreen={screen}
            onNavigate={setScreen}
          />
        )}
      </div>
    </div>
  );
};

export default App;