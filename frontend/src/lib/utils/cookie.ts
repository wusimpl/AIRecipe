/**
 * Cookie 工具函数
 * 用于管理 API Key 的 Cookie 存储
 */

const COOKIE_NAME = 'airecipe_api_key';

/**
 * 从 Cookie 中获取 API Key
 * @returns API Key 字符串，如果不存在则返回 null
 */
export function getApiKey(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * 将 API Key 存储到 Cookie 中
 * @param key - API Key 字符串
 * @param days - 过期天数，默认 30 天
 */
export function setApiKey(key: string, days: number = 30): void {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(key)}; expires=${expires.toUTCString()}; path=/; sameSite=lax`;
}

/**
 * 清除 Cookie 中的 API Key
 */
export function clearApiKey(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
