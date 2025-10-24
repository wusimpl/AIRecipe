"use client";

import { AlertCircle } from "lucide-react";
import type { Recipe } from "../types";

interface RecipeNotesProps {
  recipe: Recipe;
}

export const RecipeNotes = ({ recipe }: RecipeNotesProps) => {
  const { 其他注意事项, 保存与食用 } = recipe;

  const renderSection = (
    title: string,
    data: Record<string, unknown> | undefined,
    type: "info" | "warning"
  ) => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    const isWarning = type === "warning";
    const bgClass = isWarning ? "bg-red-50" : "bg-blue-50";
    const borderClass = isWarning ? "border-red-500" : "border-blue-500";
    const iconColor = isWarning ? "text-red-600" : "text-blue-600";
    const textColor = isWarning ? "text-red-900" : "text-blue-900";
    const symbol = isWarning ? "✗" : "✓";
    const symbolColor = isWarning ? "text-red-600" : "text-blue-600";

    return (
      <div className="space-y-3">
        <h3 className={`text-xl font-bold ${textColor} flex items-center gap-2`}>
          <AlertCircle className={`w-5 h-5 ${iconColor}`} />
          {title}
        </h3>
        <div className="space-y-2">
          {Object.entries(data).map(([key, value], index) => (
            <div
              key={index}
              className={`${bgClass} rounded-lg p-4 border-l-4 ${borderClass}`}
            >
              <div className="flex items-start gap-3">
                <span className={`${symbolColor} font-bold text-lg flex-shrink-0`}>
                  {symbol}
                </span>
                <div className="flex-1">
                  {typeof value === "string" ? (
                    <div>
                      <span className="font-semibold text-gray-900">{key}:</span>{" "}
                      <span className="text-gray-700">{value}</span>
                    </div>
                  ) : Array.isArray(value) ? (
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">{key}:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {value.map((item, idx) => (
                          <li key={idx}>{String(item)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : typeof value === "object" && value !== null ? (
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">{key}:</p>
                      <div className="space-y-2 pl-3">
                        {Object.entries(value as Record<string, unknown>).map(
                          ([subKey, subValue], subIdx) => {
                            // 如果子值是字符串，直接显示
                            if (typeof subValue === "string") {
                              return (
                                <p key={subIdx} className="text-gray-700 text-sm">
                                  <span className="font-medium text-gray-800">
                                    {subKey}:
                                  </span>{" "}
                                  {subValue}
                                </p>
                              );
                            }
                            // 如果子值是数组，显示列表
                            if (Array.isArray(subValue)) {
                              return (
                                <div key={subIdx}>
                                  <p className="font-medium text-gray-800 text-sm mb-1">
                                    {subKey}:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm pl-3">
                                    {subValue.map((item, itemIdx) => (
                                      <li key={itemIdx}>{String(item)}</li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            }
                            // 其他情况显示为字符串
                            return (
                              <p key={subIdx} className="text-gray-700 text-sm">
                                <span className="font-medium text-gray-800">
                                  {subKey}:
                                </span>{" "}
                                {String(subValue)}
                              </p>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold text-gray-900">{key}:</span>{" "}
                      <span className="text-gray-700">{String(value)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasContent =
    (其他注意事项 && Object.keys(其他注意事项).length > 0) ||
    (保存与食用 && Object.keys(保存与食用).length > 0);

  if (!hasContent) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-200">
          注意事项
        </h2>
        <p className="text-gray-500 text-center py-8">暂无注意事项</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 章节标题 */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-200">
        注意事项
      </h2>

      {/* 保存与食用提示 */}
      {renderSection("保存与食用", 保存与食用, "info")}

      {/* 其他注意事项 */}
      {renderSection("其他注意事项", 其他注意事项, "warning")}
    </div>
  );
};
