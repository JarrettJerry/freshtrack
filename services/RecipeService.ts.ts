export async function getRecipes(cuisine: string) {
  const map: any = {
    "Chinese": "Chinese",
    "Japanese": "Japanese",
    "Korean": "Japanese",
    "Thai": "Thai",
    "Western": "Italian",
    "中餐": "Chinese",
    "日料": "Japanese",
    "韩餐": "Japanese",
    "泰餐": "Thai",
    "西餐": "Italian"
  };

  const area = map[cuisine] || "Italian";

  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`
    );

    const data = await res.json();

    if (!data.meals) return [];

    const first3 = data.meals.slice(0, 3);

    const detailed = await Promise.all(
      first3.map(async (meal: any, i: number) => {
        const detailRes = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
        );

        const detailData = await detailRes.json();
        const d = detailData.meals[0];

        const ingredients = [];

        for (let x = 1; x <= 20; x++) {
          const ing = d[`strIngredient${x}`];
          const measure = d[`strMeasure${x}`];

          if (ing && ing.trim()) {
            ingredients.push(`${measure} ${ing}`);
          }
        }

        return {
          type:
            i === 0 ? "Breakfast" :
            i === 1 ? "Lunch" :
            "Dinner",

          name: d.strMeal,
          image: d.strMealThumb,

          kcal: 520,
          protein: 32,
          carbs: 48,
          fat: 16,

          reason: d.strCategory,

          ingredients,
          instructions: d.strInstructions.split(". ")
        };
      })
    );

    return detailed;

  } catch (e) {
    console.error(e);
    return [];
  }
}