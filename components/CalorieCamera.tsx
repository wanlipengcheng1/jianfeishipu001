import React, { useState, useRef } from 'react';
import { analyzeFoodImage } from '../services/geminiService';
import { FoodAnalysis } from '../types';

const CalorieCamera: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      processImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzeFoodImage(base64);
      setResult(analysis);
    } catch (err) {
        console.error(err);
      setError("识别失败，请确保图片清晰，并包含食物。");
    } finally {
      setAnalyzing(false);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 mt-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        AI 食物热量扫描
      </h2>
      <p className="text-sm text-slate-500 mb-6">不确定这顿饭的热量？拍张照，AI帮您计算卡路里和营养成分。</p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Input Section */}
        <div className="flex-shrink-0 w-full md:w-64 flex flex-col items-center">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          <div 
            onClick={triggerCamera}
            className={`
              w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden
              ${preview ? 'border-primary' : 'border-slate-300 hover:border-primary hover:bg-slate-50'}
            `}
          >
            {preview ? (
              <img src={preview} alt="Food Preview" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-slate-500">点击拍照或上传</span>
              </>
            )}
            
            {analyzing && (
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center text-white">
                    <svg className="animate-spin h-8 w-8 mb-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xs">AI识别中...</span>
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div className="flex-grow">
           {error && (
             <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
                {error}
             </div>
           )}

           {result && !analyzing && (
             <div className="animate-fade-in">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">{result.food_name}</h3>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    健康分: {result.health_score}/10
                  </div>
               </div>
               
               <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-slate-400">热量</div>
                    <div className="font-bold text-primary">{result.calories}</div>
                    <div className="text-xs text-slate-400">kcal</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-slate-400">蛋白质</div>
                    <div className="font-bold text-slate-700">{result.protein}g</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-slate-400">碳水</div>
                    <div className="font-bold text-slate-700">{result.carbs}g</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-slate-400">脂肪</div>
                    <div className="font-bold text-slate-700">{result.fat}g</div>
                  </div>
               </div>

               <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                 <h4 className="text-xs font-bold text-blue-800 uppercase mb-1">AI 建议</h4>
                 <p className="text-sm text-blue-700 leading-relaxed">{result.advice}</p>
               </div>
             </div>
           )}
           
           {!result && !analyzing && !error && (
             <div className="h-full flex items-center justify-center text-slate-400 text-sm p-8 border-2 border-dashed border-slate-100 rounded-xl">
               识别结果将显示在这里
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default CalorieCamera;
