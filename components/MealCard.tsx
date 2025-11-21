import React, { useState, useEffect } from 'react';
import { DayPlan, Meal } from '../types';

// Helper to download and cache image
const useImageCache = (meal: Meal | undefined) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meal) return;

    // Unique cache key including calories to avoid collision
    const cacheKey = `nutrigen_img_v2_${meal.name}_${meal.calories}`;
    
    // Default placeholder if no prompt
    const placeholder = 'https://placehold.co/200x200/FFFBF0/F97316?text=Delicious';

    if (!meal.visual_prompt_en) {
        setImgSrc(placeholder);
        setLoading(false);
        return;
    }

    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setImgSrc(cachedData);
      setLoading(false);
    } else {
      // Generate URL
      const prompt = encodeURIComponent(`${meal.visual_prompt_en}, food photography, high resolution, appetizing, isolated on white plate, studio lighting`);
      // Requesting small size to save localStorage space
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=200&height=200&nologo=true&model=flux&seed=${meal.calories}`;
      
      setLoading(true);
      
      // Try to fetch and convert to Base64 for caching
      fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.blob();
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            try {
              // Try to save to local storage
              localStorage.setItem(cacheKey, base64data);
            } catch (e) {
              console.warn('LocalStorage full, skipping cache for image');
            }
            setImgSrc(base64data);
            setLoading(false);
          };
          reader.readAsDataURL(blob);
        })
        .catch((err) => {
          console.warn('Image fetch failed, using direct URL fallback:', err);
          // Fallback to URL if fetch/CORS fails or Blob fails
          setImgSrc(url);
          setLoading(false);
        });
    }
  }, [meal]);

  return { imgSrc, loading };
};

const MealRow = ({ type, meal }: { type: string, meal: Meal | undefined }) => {
  const { imgSrc, loading } = useImageCache(meal);

  if (!meal) return null;

  return (
    <div className="flex gap-3 py-4 border-b border-dashed border-orange-200 last:border-0 break-inside-avoid">
       {/* Image with Skeleton */}
       <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-orange-100 bg-slate-50 shadow-sm relative print:border-slate-200">
          {loading && (
             <div className="absolute inset-0 bg-slate-200 animate-pulse"></div>
          )}
          <img 
            src={imgSrc || 'https://placehold.co/200x200/FFFBF0/F97316?text=Food'} 
            alt={meal.name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
            onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/FFFBF0/F97316?text=Meal';
            }}
          />
       </div>

       {/* Content */}
       <div className="flex-grow min-w-0 flex flex-col">
          <div className="mb-2">
            <div className="flex justify-between items-start mb-1">
                <div>
                    <span className="font-serif font-bold text-orange-800 text-base mr-2">{type}</span>
                    <span className="text-sm font-bold text-slate-800">{meal.name}</span>
                </div>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded whitespace-nowrap print:text-black print:border-slate-300">
                    {meal.calories} kcal
                </span>
            </div>
            
            {/* Ingredients */}
            <div className="text-xs text-slate-600 mb-2 leading-relaxed">
                <span className="bg-slate-100 text-slate-500 px-1 rounded text-[10px] mr-1 print:bg-slate-200 print:text-black">食材</span>
                {meal.ingredients.map(i => `${i.name}${i.amount}`).join('、')}
            </div>
          </div>

          {/* Full Steps - Ensure visibility */}
          <div className="bg-orange-50/50 p-2 rounded border border-orange-100/50 mt-auto print:bg-transparent print:border-slate-200 print:border-dashed">
             <div className="text-[10px] font-bold text-orange-400 mb-0.5 print:text-slate-600">做法:</div>
             <ol className="list-decimal list-inside text-[10px] text-slate-600 leading-tight space-y-1">
                {meal.recipe_steps.map((step, idx) => (
                    <li key={idx} className="pl-1 -indent-1 ml-1">{step}</li>
                ))}
             </ol>
          </div>
       </div>
    </div>
  );
};

// Calorie Distribution Chart Component
const CalorieChart = ({ breakfast, lunch, dinner, snack, total }: { breakfast: number, lunch: number, dinner: number, snack: number, total: number }) => {
    const getPct = (val: number) => Math.max(5, (val / total) * 100); // Min width for visibility
    
    return (
        <div className="mt-2 w-full">
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100 print:bg-slate-200 print:border print:border-slate-300">
                <div style={{ width: `${getPct(breakfast)}%` }} className="bg-emerald-400 print:bg-emerald-500" title={`早餐: ${breakfast}kcal`}></div>
                <div style={{ width: `${getPct(lunch)}%` }} className="bg-orange-400 print:bg-orange-500" title={`午餐: ${lunch}kcal`}></div>
                <div style={{ width: `${getPct(dinner)}%` }} className="bg-red-400 print:bg-red-500" title={`晚餐: ${dinner}kcal`}></div>
                {snack > 0 && <div style={{ width: `${getPct(snack)}%` }} className="bg-blue-300 print:bg-blue-400" title={`加餐: ${snack}kcal`}></div>}
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-1 print:text-slate-600">
                <div className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 print:bg-emerald-500"></div>早</div>
                <div className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-1 print:bg-orange-500"></div>午</div>
                <div className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1 print:bg-red-500"></div>晚</div>
                {snack > 0 && <div className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-300 mr-1 print:bg-blue-400"></div>加</div>}
            </div>
        </div>
    )
}

interface DailyPlanCardProps {
  dayPlan: DayPlan;
  index: number;
}

const DailyPlanCard: React.FC<DailyPlanCardProps> = ({ dayPlan, index }) => {
  const snackCal = dayPlan.snack ? dayPlan.snack.calories : 0;

  return (
    <div className="bg-white border-2 border-orange-200 rounded-xl shadow-sm flex flex-col relative print:border-slate-400 print:shadow-none print:break-inside-avoid h-full">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 p-3 print:border-slate-300">
         <div className="flex justify-between items-center mb-2">
            <div className="flex items-baseline gap-2">
                <span className="font-serif font-black text-3xl text-orange-500 opacity-20 absolute top-1 left-2 pointer-events-none select-none print:opacity-10 print:text-slate-500">0{index + 1}</span>
                <span className="relative font-serif font-bold text-xl text-slate-800 z-10 ml-4">
                {dayPlan.day}
                </span>
            </div>
            <div className="text-right z-10">
                <span className="text-xs text-slate-400 mr-1 print:text-slate-600">总摄入</span>
                <span className="text-lg font-black text-orange-600 print:text-slate-800">{dayPlan.total_calories}</span>
            </div>
         </div>
         
         {/* Visualization Chart */}
         <CalorieChart 
            breakfast={dayPlan.breakfast.calories}
            lunch={dayPlan.lunch.calories}
            dinner={dayPlan.dinner.calories}
            snack={snackCal}
            total={dayPlan.total_calories}
         />
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col bg-white flex-grow">
        <MealRow type="早" meal={dayPlan.breakfast} />
        <MealRow type="午" meal={dayPlan.lunch} />
        <MealRow type="晚" meal={dayPlan.dinner} />
        {dayPlan.snack && (
             <div className="mt-2 pt-2 border-t border-dashed border-orange-100 print:border-slate-300">
                 <MealRow type="加" meal={dayPlan.snack} />
             </div>
        )}
      </div>
    </div>
  );
};

export default DailyPlanCard;