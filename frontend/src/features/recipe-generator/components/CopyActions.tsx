"use client";

import { useState } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";
import type { Recipe } from "../types";

interface CopyActionsProps {
  recipe: Recipe;
  onRegenerate?: () => void;
}

export const CopyActions = ({ recipe, onRegenerate }: CopyActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const jsonString = JSON.stringify(recipe, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* 复制 JSON 按钮 */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
        aria-label="复制 JSON"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>已复制</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>复制 JSON</span>
          </>
        )}
      </button>

      {/* 重新生成按钮 */}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          aria-label="重新生成菜谱"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重新生成</span>
        </button>
      )}
    </div>
  );
};
