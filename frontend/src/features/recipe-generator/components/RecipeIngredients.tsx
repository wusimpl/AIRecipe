"use client";

import { Lightbulb } from "lucide-react";
import type { Recipe, RecipeIngredientCategory } from "../types";

interface RecipeIngredientsProps {
  recipe: Recipe;
}

export const RecipeIngredients = ({ recipe }: RecipeIngredientsProps) => {
  const { 用料, 选材 } = recipe;

  const renderIngredientCard = (
    title: string,
    ingredients: RecipeIngredientCategory | undefined,
    colorClass: "orange" | "green"
  ) => {
    if (!ingredients || Object.keys(ingredients).length === 0) {
      return null;
    }

    const bgClass = colorClass === "orange" ? "bg-orange-50" : "bg-green-50";
    const borderClass =
      colorClass === "orange" ? "border-orange-200" : "border-green-200";
    const titleColorClass =
      colorClass === "orange" ? "text-orange-900" : "text-green-900";

    return (
      <div className={`${bgClass} rounded-lg p-5 border ${borderClass}`}>
        <h3 className={`text-xl font-bold ${titleColorClass} mb-3`}>{title}</h3>
        <ul className="space-y-2">
          {Object.entries(ingredients).map(([name, amount], index) => {
            // 如果 amount 是字符串，直接渲染
            if (typeof amount === 'string') {
              return (
                <li key={index} className="flex justify-between text-gray-700">
                  <span className="font-medium">{name}</span>
                  <span className="text-gray-600">{amount}</span>
                </li>
              );
            }

            // 如果 amount 是对象（如"可选"字段），递归渲染
            if (typeof amount === 'object' && amount !== null && !Array.isArray(amount)) {
              return (
                <li key={index} className="flex flex-col space-y-1">
                  <span className="font-semibold text-gray-800">{name}:</span>
                  <ul className="ml-4 space-y-1">
                    {Object.entries(amount).map(([subName, subAmount], subIndex) => (
                      <li key={subIndex} className="flex justify-between text-gray-600 text-sm">
                        <span>{subName}</span>
                        <span>{typeof subAmount === 'string' ? subAmount : JSON.stringify(subAmount)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            // 其他类型，尝试转为字符串
            return (
              <li key={index} className="flex justify-between text-gray-700">
                <span className="font-medium">{name}</span>
                <span className="text-gray-600">{String(amount)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderSelectionGuide = () => {
    if (!选材 || Object.keys(选材).length === 0) {
      return null;
    }

    return (
      <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
        <div className="flex items-center gap-2 text-blue-900 mb-3">
          <Lightbulb className="w-5 h-5" />
          <h3 className="text-xl font-bold">选材指南</h3>
        </div>
        <div className="space-y-4">
          {Object.entries(选材).map(([key, value], index) => {
            // 如果是字符串，直接显示
            if (typeof value === "string") {
              return (
                <div key={index} className="bg-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>{key}:</strong> {value}
                  </p>
                </div>
              );
            }

            // 如果是对象，检查是否有主要食材、可替代食材等分类
            if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              // 检查是否为空对象
              const entries = Object.entries(value as Record<string, unknown>);

              return (
                <div key={index} className="space-y-2">
                  <p className="font-semibold text-blue-900">{key}:</p>
                  <div className="space-y-3">
                    {entries.length === 0 ? (
                      // 空对象时显示友好提示
                      <div className="bg-blue-100 rounded-lg p-3">
                        <p className="text-sm text-blue-700 italic">暂无</p>
                      </div>
                    ) : (
                      entries.map(
                        ([itemName, itemDetails], itemIndex) => {
                          // 如果 itemDetails 是字符串，直接显示
                          if (typeof itemDetails === "string") {
                            return (
                              <div
                                key={itemIndex}
                                className="bg-blue-100 rounded-lg p-3"
                              >
                                <p className="text-sm text-blue-900">
                                  <strong>{itemName}:</strong> {itemDetails}
                                </p>
                              </div>
                            );
                          }

                          // 如果 itemDetails 是对象（包含描述和 tips）
                          if (
                            typeof itemDetails === "object" &&
                            itemDetails !== null
                          ) {
                            const details = itemDetails as Record<string, string | undefined>;
                            return (
                              <div
                                key={itemIndex}
                                className="bg-blue-100 rounded-lg p-3"
                              >
                                <p className="font-semibold text-blue-900 mb-2">
                                  {itemName}
                                </p>
                                {details.描述 && (
                                  <p className="text-sm text-blue-800 mb-1">
                                    {details.描述}
                                  </p>
                                )}
                                {details.tips && (
                                  <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 mt-2">
                                    💡 {details.tips}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          return null;
                        }
                      )
                    )}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 章节标题 */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-200">
        用料选材
      </h2>

      {/* 用料网格 */}
      <div className="grid md:grid-cols-2 gap-6">
        {renderIngredientCard("主料", 用料.主料, "orange")}
        {renderIngredientCard("辅料", 用料.辅料, "green")}
        {renderIngredientCard("调味料", 用料.调味料, "orange")}

        {/* 渲染其他可能的用料类别 */}
        {Object.entries(用料)
          .filter(([key]) => !["主料", "辅料", "调味料"].includes(key))
          .map(([key, value], index) =>
            renderIngredientCard(key, value as RecipeIngredientCategory, index % 2 === 0 ? "orange" : "green")
          )}
      </div>

      {/* 选材指南 */}
      {renderSelectionGuide()}
    </div>
  );
};
