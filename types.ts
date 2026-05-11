
export interface UserProfile {
  name: string;
  avatar: string;
  preferredCuisine: string;
}

export interface MealRecommendation {
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
  reason: string;
  ingredients: string[];
  instructions: string[];
}

export interface Meal {
  id: string;
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  time: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
  servingSize?: string;
  timestamp?: number;
}

export interface UserStats {
  dailyGoal: number;
  currentKcal: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
}

export enum AppScreen {
  SPLASH = 'SPLASH',
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  ANALYSIS = 'ANALYSIS',
  PROFILE = 'PROFILE',
  MEAL_DETAIL = 'MEAL_DETAIL'
}

export interface AnalysisResult {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}
