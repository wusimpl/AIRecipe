"use client";

import type { ReactNode } from "react";
import { Clock, ChefHat } from "lucide-react";
import type { Recipe } from "../types";
import { ExportButton } from "./ExportButton";

interface RecipeMetaProps {
  recipe: Recipe;
  cached?: boolean;
  provider?: string;
  children?: ReactNode;
}

export const RecipeMeta = ({ recipe, cached, provider, children }: RecipeMetaProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="relative mx-auto max-w-5xl px-6 py-8">
        {children}
        {/* 菜名和缓存徽章 */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-4xl font-bold text-gray-900">{recipe.菜名}</h1>
          {cached ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-full shadow-md">
              <span className="text-base">⚡</span>
              <span>本菜谱来自缓存</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-sm font-medium rounded-full shadow-md">
              <span className="text-base">🎉</span>
              <span>恭喜你第一个生成此菜谱</span>
            </span>
          )}
          <ExportButton recipe={recipe} provider={provider} />
        </div>

        {/* 标签容器 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.标签.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 简介 */}
        <p className="text-gray-600 text-lg leading-relaxed mb-6">{recipe.简介}</p>

        {/* 快速信息卡片 - 手机端2列，平板及以上4列 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 难度卡片 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <ChefHat className="w-5 h-5" />
              <span className="font-semibold">难度</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{recipe.难度}</p>
          </div>

          {/* 准备时间卡片 */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">准备</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{recipe.准备时间}</p>
          </div>

          {/* 烹饪时间卡片 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">烹饪</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{recipe.烹饪时间}</p>
          </div>

          {/* 总时间卡片 */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">总计</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">{recipe.总时间}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
