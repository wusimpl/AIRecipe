"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Check, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import type { Recipe } from "../types";
import { ExportableSection } from "./ExportableSection";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  provider?: string;
}

// 导出选项类型定义
type ExportSection = "ingredients" | "steps" | "tips" | "notes";

interface ExportOptions {
  ingredients: boolean; // 用料选材
  steps: boolean; // 烹饪步骤
  tips: boolean; // 进阶技巧
  notes: boolean; // 小贴士
}

// 导出选项配置
const exportSections = [
  {
    key: "ingredients" as ExportSection,
    label: "用料选材",
    description: "包含主料、辅料和调味料，方便购物时对照",
    icon: "🥬",
  },
  {
    key: "steps" as ExportSection,
    label: "烹饪步骤",
    description: "完整步骤和预处理流程，适合厨房查看",
    icon: "👨‍🍳",
  },
  {
    key: "tips" as ExportSection,
    label: "进阶技巧",
    description: "所有烹饪技巧和窍门，收藏学习",
    icon: "💡",
  },
  {
    key: "notes" as ExportSection,
    label: "小贴士",
    description: "保存方法和注意事项，长期参考",
    icon: "⚠️",
  },
];

export const ExportModal = ({
  isOpen,
  onClose,
  recipe,
  provider,
}: ExportModalProps) => {
  // 导出选项状态管理
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    ingredients: false,
    steps: false,
    tips: false,
    notes: false,
  });

  // 加载状态管理
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 切换单个选项
  const toggleOption = (section: ExportSection) => {
    setExportOptions((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 检查是否至少选择了一个选项
  const hasSelection = Object.values(exportOptions).some((value) => value);

  // 重置状态并关闭
  const handleClose = () => {
    setExportOptions({
      ingredients: false,
      steps: false,
      tips: false,
      notes: false,
    });
    setError(null);
    onClose();
  };

  // 分部分导出图片（原有功能）
  const handleGenerateSeparateImages = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // 获取所有选中的部分
      const selectedSections = Object.entries(exportOptions)
        .filter(([, selected]) => selected)
        .map(([key]) => key as ExportSection);

      if (selectedSections.length === 0) {
        setError("请至少选择一个要导出的部分");
        return;
      }

      // 逐个导出选中的部分
      for (const section of selectedSections) {
        await exportSectionAsImage(section);
      }

      // 导出成功后关闭模态框
      handleClose();
    } catch (err) {
      console.error("图片生成失败:", err);
      setError(err instanceof Error ? err.message : "图片生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 导出完整图片（将选中的部分合并为一张长图）
  const handleGenerateFullImage = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      // 获取所有选中的部分
      const selectedSections = Object.entries(exportOptions)
        .filter(([, selected]) => selected)
        .map(([key]) => key as ExportSection);

      if (selectedSections.length === 0) {
        setError("请至少选择一个要导出的部分");
        return;
      }

      // 导出合并后的完整图片
      await exportFullRecipeImage();

      // 导出成功后关闭模态框
      handleClose();
    } catch (err) {
      console.error("图片生成失败:", err);
      setError(err instanceof Error ? err.message : "图片生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 导出单个部分为图片
  const exportSectionAsImage = async (section: ExportSection) => {
    // 获取要导出的元素
    const exportElement = document.getElementById(`export-section-${section}`);
    if (!exportElement) {
      throw new Error(`未找到要导出的元素: ${section}`);
    }

    // 使用 html2canvas 生成 Canvas
    const canvas = await html2canvas(exportElement, {
      scale: 2, // 2倍分辨率提高清晰度
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false, // 避免中文字体问题
    });

    // 转换为 JPEG Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas 转换为 Blob 失败"));
          }
        },
        "image/jpeg",
        0.92 // JPEG 质量 (0.92 = 高质量)
      );
    });

    // 生成文件名
    const sectionNames = {
      ingredients: "用料选材",
      steps: "烹饪步骤",
      tips: "进阶技巧",
      notes: "小贴士",
    };
    const today = new Date();
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const fileName = `${recipe.菜名}-${sectionNames[section]}-${dateString}.jpg`;

    // 触发浏览器下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导出完整图片（将选中的部分合并为一张长图）
  const exportFullRecipeImage = async () => {
    // 获取完整菜谱导出元素
    const exportElement = document.getElementById("export-full-recipe");
    if (!exportElement) {
      throw new Error("未找到完整菜谱导出元素");
    }

    // 使用 html2canvas 生成 Canvas
    const canvas = await html2canvas(exportElement, {
      scale: 2, // 2倍分辨率提高清晰度
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false, // 避免中文字体问题
    });

    // 转换为 JPEG Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas 转换为 Blob 失败"));
          }
        },
        "image/jpeg",
        0.92 // JPEG 质量 (0.92 = 高质量)
      );
    });

    // 生成文件名
    const today = new Date();
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const fileName = `${recipe.菜名}-完整菜谱-${dateString}.jpg`;

    // 触发浏览器下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* 背景遮罩 */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* 模态框容器 */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-2xl transition-all">
                {/* 标题栏 */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-slate-900"
                  >
                    导出菜谱图片
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    onClick={handleClose}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* 提示信息 */}
                <div className="mb-6">
                  <p className="text-sm text-slate-600">
                    选择要导出的菜谱部分，生成高清图片保存到本地
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    菜名：{recipe.菜名}
                  </p>
                </div>

                {/* 选择区域 */}
                <div className="mb-6 space-y-3">
                  {exportSections.map((section) => {
                    const isSelected = exportOptions[section.key];
                    return (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => toggleOption(section.key)}
                        className={`
                          w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all
                          ${
                            isSelected
                              ? "border-orange-500 bg-orange-50"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }
                        `}
                      >
                        {/* 复选框 */}
                        <div
                          className={`
                          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${
                            isSelected
                              ? "border-orange-500 bg-orange-500"
                              : "border-slate-300 bg-white"
                          }
                        `}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{section.icon}</span>
                            <span
                              className={`font-medium ${
                                isSelected
                                  ? "text-orange-900"
                                  : "text-slate-900"
                              }`}
                            >
                              {section.label}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${
                              isSelected ? "text-orange-700" : "text-slate-500"
                            }`}
                          >
                            {section.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 选择提示 */}
                {!hasSelection && !error && (
                  <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      💡 请至少选择一个要导出的部分
                    </p>
                  </div>
                )}

                {/* 错误提示 */}
                {error && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">❌ {error}</p>
                  </div>
                )}

                {/* 底部按钮 */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    onClick={handleClose}
                    disabled={isGenerating}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={!hasSelection || isGenerating}
                    onClick={handleGenerateFullImage}
                    title={
                      !hasSelection
                        ? "请至少选择一个要导出的部分"
                        : "导出完整图片"
                    }
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        正在生成...
                      </>
                    ) : (
                      "导出完整图片"
                    )}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={!hasSelection || isGenerating}
                    onClick={handleGenerateSeparateImages}
                    title={
                      !hasSelection
                        ? "请至少选择一个要导出的部分"
                        : "分部分导出"
                    }
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        正在生成...
                      </>
                    ) : (
                      "分部分导出"
                    )}
                  </button>
                </div>

                {/* 隐藏的导出区域 - 用于 html2canvas 渲染 */}
                <div className="fixed left-[-9999px] top-0">
                  {/* 单个部分导出 */}
                  {exportSections.map((section) => (
                    <div
                      key={section.key}
                      id={`export-section-${section.key}`}
                      className="w-[1000px]"
                    >
                      <ExportableSection
                        recipe={recipe}
                        section={section.key}
                        provider={provider}
                      />
                    </div>
                  ))}

                  {/* 完整菜谱导出（合并选中的部分） */}
                  <div id="export-full-recipe" className="w-[1000px] bg-white">
                    <div
                      className="p-8"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
                      }}
                    >
                      {/* 菜名标题 */}
                      <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">
                          {recipe.菜名}
                        </h1>
                      </div>

                      {/* 根据选中的部分渲染内容 */}
                      <div className="space-y-10">
                        {exportOptions.ingredients && (
                          <div className="bg-white">
                            <ExportableSection
                              recipe={recipe}
                              section="ingredients"
                              provider={provider}
                              hideRecipeTitle={true}
                            />
                          </div>
                        )}
                        {exportOptions.steps && (
                          <div className="bg-white">
                            <ExportableSection
                              recipe={recipe}
                              section="steps"
                              provider={provider}
                              hideRecipeTitle={true}
                            />
                          </div>
                        )}
                        {exportOptions.tips && (
                          <div className="bg-white">
                            <ExportableSection
                              recipe={recipe}
                              section="tips"
                              provider={provider}
                              hideRecipeTitle={true}
                            />
                          </div>
                        )}
                        {exportOptions.notes && (
                          <div className="bg-white">
                            <ExportableSection
                              recipe={recipe}
                              section="notes"
                              provider={provider}
                              hideRecipeTitle={true}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
