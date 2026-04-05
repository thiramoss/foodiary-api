export type CalculateGoalsParams = {
  height: number;
  weight: number;
  gender: 'male' | 'female';
  birthDate: Date | string | null; 
  activityLevel: number;
  goal: 'lose' | 'gain' | 'maintain';
};

const activityMultipliers = {
  1: 1.2,
  2: 1.375,
  3: 1.55,
  4: 1.725,
  5: 1.9,
} as const;

function calculateCalories(params: CalculateGoalsParams): number {
  const { activityLevel, birthDate, gender, goal, height, weight } = params;

  const date = birthDate instanceof Date ? birthDate : new Date(birthDate || '');
  if (isNaN(date.getTime())) return 2000; 
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  const safeWeight = weight > 0 ? weight : 70;
  const safeHeight = height > 0 ? height : 170;

  const bmr = gender === 'male'
    ? 88.36 + (13.4 * safeWeight) + (4.8 * safeHeight) - (5.7 * age)
    : 447.6 + (9.2 * safeWeight) + (3.1 * safeHeight) - (4.3 * age);

  const multiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2;
  const tdee = bmr * multiplier;

  let targetCalories = tdee;
  if (goal === 'gain') targetCalories += 500;
  if (goal === 'lose') targetCalories -= 500;

  return Math.round(Math.max(targetCalories, bmr));
}

export function calculateGoals(params: CalculateGoalsParams) {
  if (!params) return { calories: 0, proteins: 0, carbohydrates: 0, fats: 0 };

  const weight = params.weight || 0;
  const calories = calculateCalories(params);

  const proteinGrams = Math.round(weight * 2); 
  const fatGrams = Math.round(weight * 0.9);
  
  const remainingCalories = calories - (proteinGrams * 4) - (fatGrams * 9);
  
  const carbsGrams = Math.max(Math.round(remainingCalories / 4), 0);

  return {
    calories: (proteinGrams * 4) + (fatGrams * 9) + (carbsGrams * 4),
    proteins: proteinGrams,
    carbohydrates: carbsGrams,
    fats: fatGrams,
  };
}