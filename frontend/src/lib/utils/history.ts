/**
 * 菜谱历史记录工具函数
 * 用于管理菜名搜索历史的 localStorage 存储
 */

const STORAGE_KEY = 'airecipe_history';
const MAX_HISTORY_SIZE = 20;

/**
 * 从 localStorage 中获取历史记录列表
 * @returns 菜名数组，按时间倒序（最新的在前），如果不存在或出错则返回空数组
 */
export function getHistory(): string[] {
  // SSR 环境检查
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    // 验证数据格式
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string');
    }

    return [];
  } catch (error) {
    console.error('Failed to read history from localStorage:', error);
    return [];
  }
}

/**
 * 添加菜名到历史记录
 * - 自动去重：如果菜名已存在，将其移到最前面
 * - 限制数量：超过 MAX_HISTORY_SIZE 条时自动删除最旧的记录
 * @param dishName - 菜名
 */
export function addToHistory(dishName: string): void {
  // SSR 环境检查
  if (typeof window === 'undefined') {
    return;
  }

  // 忽略空字符串
  const trimmed = dishName.trim();
  if (!trimmed) {
    return;
  }

  try {
    let history = getHistory();

    // 去重：移除已存在的相同菜名
    history = history.filter((item) => item !== trimmed);

    // 添加到最前面
    history.unshift(trimmed);

    // 限制数量（FIFO）
    if (history.length > MAX_HISTORY_SIZE) {
      history = history.slice(0, MAX_HISTORY_SIZE);
    }

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to add history to localStorage:', error);
  }
}

/**
 * 从历史记录中删除指定菜名
 * @param dishName - 要删除的菜名
 */
export function removeFromHistory(dishName: string): void {
  // SSR 环境检查
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const history = getHistory();
    const filtered = history.filter((item) => item !== dishName);

    // 只有在确实删除了内容时才更新 localStorage
    if (filtered.length !== history.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error('Failed to remove history from localStorage:', error);
  }
}

/**
 * 清空所有历史记录
 */
export function clearHistory(): void {
  // SSR 环境检查
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear history from localStorage:', error);
  }
}
