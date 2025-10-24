"use client";

import { Lightbulb, AlertCircle } from "lucide-react";
import type { Recipe, RecipeIngredientCategory, RecipeIngredients } from "../types";

type ExportSection = 'ingredients' | 'steps' | 'tips' | 'notes';

interface ExportableSectionProps {
  recipe: Recipe;
  section: ExportSection;
  provider?: string;
  hideRecipeTitle?: boolean; // 是否隐藏菜名标题（用于合并导出时）
}

/**
 * ExportableSection 组件
 * 用于包装需要导出的菜谱内容区域，便于 html2canvas 渲染
 *
 * 功能：
 * - 根据导出类型渲染对应的菜谱部分
 * - 用料选材包含主料、辅料和调味料
 * - 固定宽度布局，适合图片导出
 */
export const ExportableSection = ({ recipe, section, hideRecipeTitle = false }: ExportableSectionProps) => {

  // 渲染用料选材（主料、辅料和调味料）
  const renderIngredients = () => {
    const { 用料 } = recipe;

    // 包含主料、辅料和调味料
    const filteredIngredients: RecipeIngredients = {
      主料: 用料.主料,
      ...(用料.辅料 && { 辅料: 用料.辅料 }),
      ...(用料.调味料 && { 调味料: 用料.调味料 })
    };

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

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-200">
          用料选材
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {renderIngredientCard("主料", filteredIngredients.主料, "orange")}
          {renderIngredientCard("辅料", filteredIngredients.辅料, "green")}
        </div>
        {/* 调味料单独一行显示 */}
        {filteredIngredients.调味料 && Object.keys(filteredIngredients.调味料).length > 0 && (
          <div className="mt-6">
            {renderIngredientCard("调味料", filteredIngredients.调味料, "orange")}
          </div>
        )}
      </div>
    );
  };

  // 渲染烹饪步骤
  const renderSteps = () => {
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
              <div className="bg-gray-50 rounded-lg p-5">
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

  // 渲染进阶技巧
  const renderTips = () => {
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

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-200">
          进阶技巧
        </h2>

        <div className="grid grid-cols-2 gap-4">
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

  // 渲染小贴士
  const renderNotes = () => {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-200">
          小贴士
        </h2>

        {/* 保存与食用提示 */}
        {renderSection("保存与食用", 保存与食用, "info")}

        {/* 其他注意事项 */}
        {renderSection("其他注意事项", 其他注意事项, "warning")}
      </div>
    );
  };

  // 根据section类型渲染对应内容
  const renderContent = () => {
    switch (section) {
      case 'ingredients':
        return renderIngredients();
      case 'steps':
        return renderSteps();
      case 'tips':
        return renderTips();
      case 'notes':
        return renderNotes();
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white p-8"
      style={{
        width: '1000px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
      }}
    >
      {/* 菜名标题 */}
      {!hideRecipeTitle && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{recipe.菜名}</h1>
        </div>
      )}

      {/* 内容区域 */}
      {renderContent()}
    </div>
  );
};
