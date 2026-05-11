import { AnalysisResult, MealRecommendation, UserStats } from "../types";

// 通义千问API配置
const API_KEY = "sk-0c1fd648c22745878aa3090318a414cc";
const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

export async function analyzeFoodImage(base64Image: string): Promise<AnalysisResult> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "qwen-vl-plus",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "你是一位专业的营养师。请分析图片中的食物，并以 JSON 格式返回结果。包含以下字段：name (食物名称), kcal (总热量kcal), protein (蛋白质g), fat (脂肪g), carbs (碳水g), servingSize (份量说明)。请确保数值为数字类型，用中文回答。请只返回 JSON 代码块。" },
            { type: "image_url", image_url: { url: base64Image } }
          ]
        }
      ]
    })
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AnalysisResult;
    }
  } catch (e) {
    console.error("Parse error:", e);
  }

  return {
    name: "无法识别",
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingSize: "未知"
  };
}

export async function getDailyRecommendations(stats: UserStats, cuisine: string = "中式"): Promise<MealRecommendation[]> {
  const remainingKcal = Math.max(0, stats.dailyGoal - stats.currentKcal);
  const prompt = `你是一位擅长${cuisine}料理的专业厨师。你会根据用户的剩余热量需求推荐健康的餐食。
  请为我推荐 3 顿${cuisine}餐食（早餐、午餐、晚餐）。
  目标剩余热量：${remainingKcal} kcal。
  请确保推荐的热量总和接近目标剩余热量。
  请以 JSON 数组格式返回，每个对象包含：type, name, kcal, protein, carbs, fat, image (来自 Unsplash 的关联图片 URL), reason, ingredients (数组), instructions (数组)。
  请只返回 JSON 代码块。`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "qwen-turbo",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as MealRecommendation[];
    }
  } catch (e) {
    console.error("Parse error:", e);
  }

  return [
    {
      type: 'Breakfast',
      name: `${cuisine}营养早餐`,
      kcal: 350, protein: 15, carbs: 40, fat: 12,
      image: 'https://images.unsplash.com/photo-149485981460c-38d02450319a?q=80&w=400&auto=format&fit=crop',
      reason: `均衡的${cuisine}风味早餐。`,
      ingredients: ['新鲜食材', '传统调料'],
      instructions: ['准备食材', '烹饪', '装盘']
    }
  ] as MealRecommendation[];
}

export async function callGeminiAPI(prompt: string) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: "qwen-turbo",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "请求失败 请检查API Key";
}
