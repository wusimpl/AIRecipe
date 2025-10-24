"use client";

import { Lightbulb } from "lucide-react";
import type { Recipe } from "../types";

interface RecipeTipsProps {
  recipe: Recipe;
}

const colorSchemes = [
  {
    bg: "from-blue-50 to-blue-100",
    border: "border-blue-200",
    iconColor: "text-blue-600",
    textColor: "text-blue-900",
  },
  {
    bg: "from-green-50 to-green-100",
    border: "border-green-200",
    iconColor: "text-green-600",
    textColor: "text-green-900",
  },
  {
    bg: "from-purple-50 to-purple-100",
    border: "border-purple-200",
    iconColor: "text-purple-600",
    textColor: "text-purple-900",
  },
  {
    bg: "from-amber-50 to-amber-100",
    border: "border-amber-200",
    iconColor: "text-amber-600",
    textColor: "text-amber-900",
  },
];

export const RecipeTips = ({ recipe }: RecipeTipsProps) => {
  const { 进阶技巧 } = recipe;

  if (!进阶技巧 || Object.keys(进阶技巧).length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-200">
          进阶技巧
        </h2>
        <p className="text-gray-500 text-center py-8">暂无进阶技巧</p>
      </div>
    );
  }

  const tips = Object.entries(进阶技巧);

  return (
    <div className="space-y-6">
      {/* 章节标题 */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-200">
        进阶技巧
      </h2>

      {/* 技巧网格 */}
      <div className="grid md:grid-cols-2 gap-4">
        {tips.map(([title, content], index) => {
          const scheme = colorSchemes[index % colorSchemes.length];

          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${scheme.bg} rounded-lg p-5 border ${scheme.border}`}
            >
              <div className="flex items-start gap-3">
                <Lightbulb className={`w-5 h-5 ${scheme.iconColor} mt-1 flex-shrink-0`} />
                <div className="flex-1">
                  <h3 className={`font-bold ${scheme.textColor} mb-2`}>{title}</h3>
                  {typeof content === "string" ? (
                    <p className="text-gray-700 text-sm leading-relaxed">{content}</p>
                  ) : Array.isArray(content) ? (
                    <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                      {content.map((item, idx) => (
                        <li key={idx}>{String(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-700 text-sm bg-white/50 rounded px-3 py-2">
                      {JSON.stringify(content, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
