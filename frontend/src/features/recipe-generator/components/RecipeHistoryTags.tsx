"use client";

import { X } from "lucide-react";

interface RecipeHistoryTagsProps {
  history: string[];
  onSelectDish: (dishName: string) => void;
  onRemoveItem: (dishName: string) => void;
}

/**
 * 菜谱历史标签组件
 * 显示最近搜索的菜名，支持快速选择和删除
 */
export const RecipeHistoryTags = ({ history, onSelectDish, onRemoveItem }: RecipeHistoryTagsProps) => {

  // 没有历史记录时不显示组件
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <span>最近搜索</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((dishName) => (
          <button
            key={dishName}
            type="button"
            onClick={() => onSelectDish(dishName)}
            className="group relative inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition-all hover:bg-sky-100 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1"
            aria-label={`选择菜名：${dishName}`}
          >
            <span>{dishName}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation(); // 阻止触发父按钮的 onClick
                onRemoveItem(dishName);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveItem(dishName);
                }
              }}
              className="flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 cursor-pointer"
              aria-label={`删除历史记录：${dishName}`}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
