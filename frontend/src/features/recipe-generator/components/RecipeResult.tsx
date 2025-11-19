"use client";

import { useEffect, useState } from "react";
import type { Recipe } from "../types";
import { ChefPopup } from "./ChefPopup";
import { RecipeMeta } from "./RecipeMeta";
import { RecipeIngredients } from "./RecipeIngredients";
import { RecipeSteps } from "./RecipeSteps";
import { RecipeTips } from "./RecipeTips";
import { RecipeNotes } from "./RecipeNotes";

type TabType = "ingredients" | "steps" | "tips" | "notes";

interface RecipeResultProps {
  recipe: Recipe;
  provider?: string;
}

/**
 * 生成 Recipe Schema.org 结构化数据 (JSON-LD 格式)
 * 用于 Google 搜索引擎优化和富媒体片段展示
 */
function generateRecipeSchema(recipe: Recipe) {
  // 提取所有食材
  const allIngredients: string[] = [];

  // 处理主料
  if (recipe.用料?.主料) {
    Object.entries(recipe.用料.主料).forEach(([name, amount]) => {
      allIngredients.push(`${name} ${amount}`);
    });
  }

  // 处理辅料
  if (recipe.用料?.辅料) {
    Object.entries(recipe.用料.辅料).forEach(([name, amount]) => {
      allIngredients.push(`${name} ${amount}`);
    });
  }

  // 处理调味料
  if (recipe.用料?.调味料) {
    Object.entries(recipe.用料.调味料).forEach(([name, amount]) => {
      allIngredients.push(`${name} ${amount}`);
    });
  }

  // 提取烹饪步骤
  const steps = recipe.烹饪流程?.步骤顺序数组?.map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.步骤名 || `步骤 ${index + 1}`,
    text: step.操作 || "",
    // 可选字段
    ...(step.火候 && {
      performTime: step.火候 === "大火" ? "PT2M" : step.火候 === "中火" ? "PT5M" : "PT10M"
    }),
  })) || [];

  // 计算总时间 (ISO 8601 duration 格式)
  const parseDuration = (timeStr: string): string => {
    if (!timeStr) return "PT0M";
    const match = timeStr.match(/(\d+)/);
    const minutes = match ? parseInt(match[1]) : 0;
    return `PT${minutes}M`;
  };

  const prepTime = parseDuration(recipe.准备时间 || "");
  const cookTime = parseDuration(recipe.烹饪时间 || "");

  // 计算总时间
  const totalMinutes =
    (parseInt(prepTime.match(/\d+/)?.[0] || "0")) +
    (parseInt(cookTime.match(/\d+/)?.[0] || "0"));
  const totalTime = `PT${totalMinutes}M`;

  // 构建 Schema.org Recipe 对象
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    name: recipe.菜名 || "",
    description: recipe.简介 || "",

    // 分类信息
    recipeCategory: "中式菜肴",
    recipeCuisine: "中式",
    keywords: recipe.标签?.join(", ") || "",

    // 时间信息
    prepTime,
    cookTime,
    totalTime,

    // 份量
    recipeYield: "2-4人份",

    // 食材列表
    recipeIngredient: allIngredients,

    // 烹饪步骤
    recipeInstructions: steps,

    // 作者信息
    author: {
      "@type": "Organization",
      name: "AIRecipe",
      description: "AI智能菜谱生成器",
    },

    // 发布日期
    datePublished: new Date().toISOString(),

    // 难度等级 (使用 aggregateRating 模拟)
    ...(recipe.难度 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: recipe.难度 === "入门" ? "5" : recipe.难度 === "中级" ? "4" : recipe.难度 === "进阶" ? "2" : "1",
        ratingCount: "1",
        reviewCount: "1",
      },
    }),
  };

  return schema;
}

export const RecipeResult = ({ recipe, provider }: RecipeResultProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("ingredients");
  const [showChefPopup, setShowChefPopup] = useState(false);

  useEffect(() => {
    setShowChefPopup(false);

    const timer = window.setTimeout(() => {
      setShowChefPopup(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [recipe.菜名, recipe.版本]);

  const tabs = [
    { id: "ingredients" as const, label: "🥬 用料选材", ariaLabel: "用料选材" },
    { id: "steps" as const, label: "👨‍🍳 烹饪步骤", ariaLabel: "烹饪步骤" },
    { id: "tips" as const, label: "💡 进阶技巧", ariaLabel: "进阶技巧" },
    { id: "notes" as const, label: "⚠️ 注意事项", ariaLabel: "注意事项" },
  ];

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, tabId: TabType) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabChange(tabId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Recipe 结构化数据 (JSON-LD) - 用于 SEO 优化 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateRecipeSchema(recipe)),
        }}
      />

      {/* 头部区域 */}
      <RecipeMeta recipe={recipe} cached={recipe.cached} provider={provider}>
        <ChefPopup show={showChefPopup} />
      </RecipeMeta>

      {/* 主内容区域 */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 标签页导航 */}
        <div
          className="bg-white rounded-t-xl shadow-sm border-b"
          role="tablist"
          aria-label="菜谱内容标签页"
        >
          <div className="flex gap-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                aria-label={tab.ariaLabel}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 标签页内容区 */}
        <div className="bg-white rounded-b-xl shadow-sm p-8">
          {activeTab === "ingredients" && (
            <div
              id="panel-ingredients"
              role="tabpanel"
              aria-labelledby="tab-ingredients"
              tabIndex={0}
            >
              <RecipeIngredients recipe={recipe} />
            </div>
          )}

          {activeTab === "steps" && (
            <div
              id="panel-steps"
              role="tabpanel"
              aria-labelledby="tab-steps"
              tabIndex={0}
            >
              <RecipeSteps recipe={recipe} />
            </div>
          )}

          {activeTab === "tips" && (
            <div
              id="panel-tips"
              role="tabpanel"
              aria-labelledby="tab-tips"
              tabIndex={0}
            >
              <RecipeTips recipe={recipe} />
            </div>
          )}

          {activeTab === "notes" && (
            <div
              id="panel-notes"
              role="tabpanel"
              aria-labelledby="tab-notes"
              tabIndex={0}
            >
              <RecipeNotes recipe={recipe} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
