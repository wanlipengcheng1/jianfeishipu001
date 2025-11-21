export enum Gender {
  Male = '男',
  Female = '女',
}

export enum Goal {
  LoseWeight = '减脂',
  Maintain = '维持',
  GainMuscle = '增肌',
}

export enum ActivityLevel {
  Sedentary = '久坐不动',
  Light = '轻度活动 (每周1-3次运动)',
  Moderate = '中度活动 (每周3-5次运动)',
  Active = '重度活动 (每周6-7次运动)',
}

export interface UserProfile {
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  activity: ActivityLevel;
  goal: Goal;
  excludedIngredients: string; // e.g., "cilantro, pork"
  dietaryPreference: string; // e.g., "low carb", "spicy", "light"
}

export interface Ingredient {
  name: string;
  amount: string; // e.g., "50g", "1个"
}

export interface Meal {
  name: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  ingredients: Ingredient[];
  recipe_steps: string[]; // Step by step instructions
  visual_prompt_en: string; // English keyword for image generation
}

export interface DayPlan {
  day: string; // "周一", "Day 1"...
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack?: Meal;
  total_calories: number;
}

export interface DietPlan {
  title: string; // e.g., "东北地区秋季减脂食谱"
  summary: string;
  days: DayPlan[];
  shopping_list: string[];
}

export interface FoodAnalysis {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  health_score: number;
  advice: string;
}