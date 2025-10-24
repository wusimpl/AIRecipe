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
