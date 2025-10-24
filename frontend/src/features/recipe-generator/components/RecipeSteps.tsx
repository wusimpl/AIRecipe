"use client";

import { Lightbulb } from "lucide-react";
import type { Recipe } from "../types";

interface RecipeStepsProps {
  recipe: Recipe;
}

export const RecipeSteps = ({ recipe }: RecipeStepsProps) => {
  const { 烹饪流程, 预处理 } = recipe;
  const steps = 烹饪流程.步骤顺序数组;

  const renderPreparation = () => {
    if (!预处理 || Object.keys(预处理).length === 0) {
      return null;
    }

    return (
      <div className="mb-8 bg-green-50 rounded-lg p-5 border-l-4 border-green-500">
        <h3 className="text-xl font-bold text-green-900 mb-3">预处理</h3>
        <div className="space-y-4">
          {Object.entries(预处理).map(([key, value], index) => {
            // 如果是字符串，直接显示
            if (typeof value === "string") {
              return (
                <div key={index} className="bg-green-100 rounded-lg p-3">
                  <p className="text-gray-800">
                    <strong className="text-green-900">{key}:</strong> {value}
                  </p>
                </div>
              );
            }

            // 如果是对象（包含操作和 tips）
            if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              const details = value as Record<string, string | undefined>;
              return (
                <div key={index} className="bg-green-100 rounded-lg p-4">
                  <p className="font-semibold text-green-900 mb-2">{key}:</p>
                  {details.操作 && (
                    <p className="text-gray-800 mb-2">{details.操作}</p>
                  )}
                  {details.tips && (
                    <div className="bg-green-50 border-l-4 border-green-400 rounded p-3 mt-2">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-green-900">{details.tips}</p>
                      </div>
                    </div>
                  )}
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
        烹饪步骤
      </h2>

      {/* 预处理 */}
      {renderPreparation()}

      {/* 时间轴 */}
      <div className="space-y-0">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`relative pl-12 pb-8 ${
              index < steps.length - 1
                ? "border-l-2 border-orange-200"
                : "border-l-0"
            }`}
          >
            {/* 步骤数字圆圈 */}
            <div className="absolute -left-4 top-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">
              {index + 1}
            </div>

            {/* 步骤卡片 */}
            <div className="bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow">
              {/* 步骤标题行 */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{step.步骤名}</h3>
                <div className="flex gap-2">
                  {step.火候 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                      {step.火候}
                    </span>
                  )}
                  {step.时间 && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium whitespace-nowrap">
                      {step.时间}
                    </span>
                  )}
                </div>
              </div>

              {/* 操作描述 */}
              <p className="text-gray-700 leading-relaxed mb-3">{step.操作}</p>

              {/* 提示框 */}
              {step.tips && (
                <div className="bg-amber-50 border-l-4 border-amber-400 rounded p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-900">{step.tips}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
