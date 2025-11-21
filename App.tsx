import React, { useState } from 'react';
import { Gender, ActivityLevel, Goal, UserProfile, DietPlan } from './types';
import { generateDietPlan } from './services/geminiService';
import DailyPlanCard from './components/MealCard'; // Note: Component renamed internally but file name kept for simplicity in update
import GroceryList from './components/GroceryList';
import CalorieCamera from './components/CalorieCamera';

const App: React.FC = () => {
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
  const [profile, setProfile] = useState<UserProfile>({
    gender: Gender.Female,
    age: 28,
    height: 162,
    weight: 55,
    activity: ActivityLevel.Sedentary,
    goal: Goal.LoseWeight,
    excludedIngredients: '',
    dietaryPreference: ''
  });
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('generating');
    try {
      const plan = await generateDietPlan(profile);
      setDietPlan(plan);
      setStep('result');
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      alert('生成食谱失败，请重试。建议检查网络或API Key。');
      setStep('input');
    }
  };

  const handleExportPDF = () => {
    // Temporarily change document title to the plan title for the PDF filename
    const originalTitle = document.title;
    if (dietPlan?.title) {
      document.title = dietPlan.title;
    }
    
    window.print();

    // Revert title after a short delay (print dialog blocks JS execution usually, but good practice)
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const renderInputForm = () => (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border-2 border-orange-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500"></div>
      
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl font-black text-slate-800 mb-2">AI 膳食指南</h1>
        <p className="text-orange-600 font-medium">基于中国居民膳食指南 · 个性化定制</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">性别</label>
            <select name="gender" value={profile.gender} onChange={handleInputChange} className="w-full p-4 bg-orange-50/50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-lg">
              {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">年龄</label>
            <input type="number" name="age" value={profile.age} onChange={handleInputChange} className="w-full p-4 bg-orange-50/50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-lg font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
             <label className="block text-sm font-bold text-slate-700">身高 (cm)</label>
             <input type="number" name="height" value={profile.height} onChange={handleInputChange} className="w-full p-4 bg-orange-50/50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-lg font-mono" />
          </div>
          <div className="space-y-2">
             <label className="block text-sm font-bold text-slate-700">体重 (kg)</label>
             <input type="number" name="weight" value={profile.weight} onChange={handleInputChange} className="w-full p-4 bg-orange-50/50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-lg font-mono" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">日常活动强度</label>
          <select name="activity" value={profile.activity} onChange={handleInputChange} className="w-full p-4 bg-orange-50/50 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none">
            {Object.values(ActivityLevel).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">目标</label>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(Goal).map(g => (
              <button
                type="button"
                key={g}
                onClick={() => setProfile(p => ({ ...p, goal: g as Goal }))}
                className={`py-4 px-2 rounded-xl font-bold transition-all duration-200 border-2 ${
                  profile.goal === g 
                  ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30' 
                  : 'bg-white text-slate-600 border-slate-100 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        
        {/* Dietary Preferences Section */}
        <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 space-y-4">
            <h3 className="font-serif font-bold text-orange-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                饮食偏好设置 (选填)
            </h3>
            
            <div className="space-y-2">
               <label className="block text-xs font-bold text-slate-500 uppercase">不喜欢的食材 / 忌口 (逗号分隔)</label>
               <input 
                 type="text" 
                 name="excludedIngredients" 
                 value={profile.excludedIngredients} 
                 onChange={handleInputChange} 
                 placeholder="例如: 香菜, 苦瓜, 猪肉"
                 className="w-full p-3 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none text-sm" 
               />
            </div>
            
            <div className="space-y-2">
               <label className="block text-xs font-bold text-slate-500 uppercase">饮食风格偏好</label>
               <input 
                 type="text" 
                 name="dietaryPreference" 
                 value={profile.dietaryPreference} 
                 onChange={handleInputChange} 
                 placeholder="例如: 清淡, 喜辣, 低碳水, 面食为主"
                 className="w-full p-3 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none text-sm" 
               />
            </div>
        </div>

        <button 
          type="submit" 
          className="w-full py-5 bg-slate-900 text-white font-bold text-xl rounded-2xl shadow-xl hover:bg-slate-800 transition-all transform hover:-translate-y-1"
        >
          立即生成食谱
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
        <CalorieCamera />
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-orange-50/30">
      <div className="w-24 h-24 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6"></div>
      <h2 className="font-serif text-2xl font-bold text-slate-800 mb-2">AI 营养师正在规划...</h2>
      <p className="text-slate-500">正在考虑您的偏好，计算热量缺口并匹配家常菜</p>
    </div>
  );

  const renderResult = () => {
    if (!dietPlan) return null;
    return (
      <div className="w-full max-w-7xl mx-auto">
        {/* Header Actions (No Print) */}
        <div className="flex justify-between items-center mb-6 no-print bg-white p-4 rounded-xl shadow-sm border border-slate-100 sticky top-4 z-50">
          <button onClick={() => setStep('input')} className="text-slate-500 hover:text-slate-900 font-bold text-sm flex items-center">
            ← 重新设定
          </button>
          <div className="flex gap-3">
            <button onClick={() => setShowFeedback(true)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">
              反馈
            </button>
            <button onClick={handleExportPDF} className="px-6 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-lg shadow-orange-500/20 flex items-center transition-all">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出完整食谱 PDF
            </button>
          </div>
        </div>

        {/* Poster Content Wrapper */}
        <div className="bg-white p-0 md:p-8 print:p-0 print:bg-white">
          
          {/* Poster Header */}
          <div className="text-center mb-10 print:mb-6 border-b-4 border-orange-500 pb-6">
             <h1 className="font-serif text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
               {dietPlan.title || "定制健康食谱"}
             </h1>
             <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base font-bold text-slate-600 font-serif">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-200">
                  {profile.goal}
                </span>
                <span className="bg-slate-100 px-3 py-1 rounded-full">
                  {profile.gender} · {profile.age}岁
                </span>
                <span className="bg-slate-100 px-3 py-1 rounded-full">
                  BMI: {(profile.weight / ((profile.height/100)**2)).toFixed(1)}
                </span>
                {(profile.excludedIngredients || profile.dietaryPreference) && (
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100">
                        已应用偏好设置
                    </span>
                )}
             </div>
             <p className="mt-4 text-slate-500 max-w-3xl mx-auto text-sm leading-relaxed italic">
               "{dietPlan.summary}"
             </p>
          </div>

          {/* Grid Layout for Days - Optimised for Print */}
          {/* print-grid class is defined in index.html to force 2 columns on paper */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print-grid mb-10">
            {dietPlan.days.map((day, idx) => (
              <DailyPlanCard key={idx} index={idx} dayPlan={day} />
            ))}
          </div>

          {/* Footer Info & Grocery List */}
          <div className="page-break grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 pt-8 border-t-4 border-slate-800">
             <div className="lg:col-span-2 break-inside-avoid">
                <GroceryList items={dietPlan.shopping_list} />
             </div>
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 break-inside-avoid">
                <h3 className="font-serif font-bold text-xl mb-4 text-slate-800">饮食须知</h3>
                <ul className="space-y-2 text-sm text-slate-600 list-disc pl-4">
                  <li>烹饪时请控制油盐用量，推荐使用橄榄油或山茶油。</li>
                  <li>每天饮水至少 2000ml。</li>
                  <li>蔬菜分量不限，饿了可以多吃绿叶菜。</li>
                  <li>如有食物过敏，请自行替换同类食材。</li>
                </ul>
                <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                  <div className="font-serif font-bold text-2xl text-slate-900">NutriGen AI</div>
                  <div className="text-xs text-slate-400">智能膳食规划系统</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  // Feedback Modal - kept simple
  const renderFeedbackModal = () => {
    if (!showFeedback) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">意见反馈</h3>
                <textarea className="w-full h-32 border rounded-lg p-3 mb-4" placeholder="请输入您的建议..."></textarea>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setShowFeedback(false)} className="px-4 py-2 text-slate-600">取消</button>
                    <button onClick={() => {alert('感谢反馈'); setShowFeedback(false);}} className="px-4 py-2 bg-orange-500 text-white rounded-lg">提交</button>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50/30 text-slate-900 font-sans">
      {/* Header - Simple & Clean (Hidden on Print) */}
      <header className="h-16 border-b border-orange-100 bg-white/80 backdrop-blur flex items-center justify-center no-print">
        <span className="font-serif font-black text-xl text-orange-600 tracking-widest">NUTRI·GEN</span>
      </header>

      <main className="p-4 md:p-8">
        {step === 'input' && renderInputForm()}
        {step === 'generating' && renderLoading()}
        {step === 'result' && renderResult()}
      </main>

      {renderFeedbackModal()}
    </div>
  );
};

export default App;