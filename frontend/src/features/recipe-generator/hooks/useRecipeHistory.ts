"use client";

import { useState, useEffect, useCallback } from "react";

import {
  getHistory,
  addToHistory as addToHistoryUtil,
  removeFromHistory as removeFromHistoryUtil,
  clearHistory as clearHistoryUtil,
} from "@/lib/utils/history";

/**
 * 菜谱历史记录 Hook
 * 管理菜名搜索历史的状态和 localStorage 同步
 */
export function useRecipeHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // 组件挂载时从 localStorage 加载历史记录
  useEffect(() => {
    const loadedHistory = getHistory();
    setHistory(loadedHistory);
  }, []);

  /**
   * 添加菜名到历史记录
   * 自动去重并移到最前面，限制最多 20 条
   */
  const addHistory = useCallback((dishName: string) => {
    addToHistoryUtil(dishName);
    // 更新状态以触发 UI 更新
    setHistory(getHistory());
  }, []);

  /**
   * 从历史记录中删除指定菜名
   */
  const removeItem = useCallback((dishName: string) => {
    removeFromHistoryUtil(dishName);
    // 更新状态以触发 UI 更新
    setHistory(getHistory());
  }, []);

  /**
   * 清空所有历史记录
   */
  const clearHistory = useCallback(() => {
    clearHistoryUtil();
    // 更新状态以触发 UI 更新
    setHistory([]);
  }, []);

  return {
    history,
    addHistory,
    removeItem,
    clearHistory,
  };
}
