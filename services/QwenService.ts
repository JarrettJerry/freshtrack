import { AnalysisResult, MealRecommendation, UserStats } from "../types";

const API_KEY = "sk-0c1fd648c22745878aa3090318a414cc";
const API_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

// ---------- 食物识别 ----------
export async function analyzeFoodImage(
  base64Image: string
): Promise<AnalysisResult> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen3-vl-plus",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: "识别图片中的食物，并返回 JSON：name, kcal, protein, fat, carbs, servingSize",
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Qwen返回:", data);

    // 如果接口报错，直接打印
    if (data.error) {
      throw new Error(data.error.message);
    }

    let content = data.choices?.[0]?.message?.content;

    // Qwen有时返回数组
    if (Array.isArray(content)) {
      content = content.map((x) => x.text || "").join("");
    }

    const jsonMatch = content?.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error("没有找到JSON");
  } catch (error) {
    console.error("AI Analysis Error:", error);

    return {
      name: "识别失败",
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servingSize: "未知",
    };
  }
}

// ---------- 推荐 ----------
export async function getDailyRecommendations(
  stats: UserStats,
  cuisine: string = "中式"
): Promise<MealRecommendation[]> {
  const remainingKcal = Math.max(
    0,
    stats.dailyGoal - stats.currentKcal
  );

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        messages: [
          {
            role: "user",
            content: `推荐3个${cuisine}健康餐，剩余热量${remainingKcal}kcal，返回JSON数组`,
          },
        ],
      }),
    });

    const data = await res.json();
    console.log("推荐返回:", data);

    let content = data.choices?.[0]?.message?.content;

    if (Array.isArray(content)) {
      content = content.map((x) => x.text || "").join("");
    }

    const jsonMatch = content?.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Recommendations Error:", e);
  }

  return [
    {
      type: "Lunch",
      name: "推荐餐食",
      kcal: 450,
      protein: 25,
      carbs: 40,
      fat: 15,
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop",
      reason: "根据您的目标自动生成",
      ingredients: ["新鲜食材"],
      instructions: ["简单烹饪即可"],
    },
  ];
}