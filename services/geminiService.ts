import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, DietPlan, FoodAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const ingredientSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    amount: { type: Type.STRING }
  },
  required: ["name", "amount"]
};

const mealSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    protein: { type: Type.STRING },
    carbs: { type: Type.STRING },
    fat: { type: Type.STRING },
    ingredients: { type: Type.ARRAY, items: ingredientSchema },
    recipe_steps: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "简明扼要的烹饪步骤 (3-4步)，例如: '1. 鸡胸肉切丁焯水。2. 热锅少油炒香配料。'"
    },
    visual_prompt_en: { type: Type.STRING, description: "Single English keyword or short phrase for the main dish. E.g. 'Steamed corn and boiled egg', 'Beef dumplings'. Used for image generation." }
  },
  required: ["name", "calories", "ingredients", "visual_prompt_en", "recipe_steps"]
};

const dayPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    day: { type: Type.STRING, description: "Day label, e.g., 'Day 1', '周一'" },
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
    snack: mealSchema,
    total_calories: { type: Type.NUMBER }
  },
  required: ["day", "breakfast", "lunch", "dinner", "total_calories"]
};

const dietPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "食谱的大标题，例如 '25岁女性春季减脂食谱' 或 '高效增肌七日餐单'" },
    summary: { type: Type.STRING },
    days: { type: Type.ARRAY, items: dayPlanSchema },
    shopping_list: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "summary", "days", "shopping_list"]
};

export const generateDietPlan = async (profile: UserProfile): Promise<DietPlan> => {
  if (!apiKey) throw new Error("API Key not found");

  let constraints = "";
  if (profile.excludedIngredients) {
    constraints += `\n    - **严格忌口/不吃**: ${profile.excludedIngredients}`;
  }
  if (profile.dietaryPreference) {
    constraints += `\n    - **饮食偏好**: ${profile.dietaryPreference}`;
  }

  const prompt = `
    请为一位中国用户生成详细的7天【${profile.goal}】食谱。
    
    用户档案: 性别${profile.gender}, ${profile.age}岁, ${profile.height}cm, ${profile.weight}kg, 活动量: ${profile.activity}。
    ${constraints}

    要求：
    1. **排版风格**: 内容需适配海报式排版。
    2. **菜品接地气**: 必须是中国大陆常见的家常菜（如：凉拌木耳、番茄炒蛋、清蒸鲈鱼、杂粮粥等）。
    3. **做法详情**: 每个菜必须包含【做法步骤】，不能只有名字。
    4. **精确分量**: 食材必须有克数。
    5. **视觉关键词**: visual_prompt_en 必须非常具体，例如 "bowl of millet porridge and boiled egg" 而不是 "breakfast"。
    6. **采购清单**: 生成一份本周所需的全部食材采购清单。

    请返回JSON格式。
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: dietPlanSchema,
      temperature: 0.4, 
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as DietPlan;
};

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysis> => {
    if (!apiKey) throw new Error("API Key not found");
    
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const prompt = "分析食物图片。识别名称、热量、营养占比、健康评分(0-10)及建议。JSON格式返回。";

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            food_name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            health_score: { type: Type.NUMBER },
            advice: { type: Type.STRING }
        },
        required: ["food_name", "calories", "health_score", "advice"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) throw new Error("Analysis failed");
    return JSON.parse(text) as FoodAnalysis;
};