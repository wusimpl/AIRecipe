'use client';

import { useState } from 'react';
import { setApiKey } from '@/lib/utils/cookie';

interface ApiKeyInputProps {
  onKeySet: () => void;
}

export default function ApiKeyInput({ onKeySet }: ApiKeyInputProps) {
  const [apiKey, setApiKeyInput] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      setError('请输入密钥');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // 验证 API Key 是否有效：发送一个测试请求
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/recipes/providers`, {
        headers: {
          'X-API-Key': apiKey.trim(),
        },
      });

      if (response.status === 401) {
        setError('密钥无效，请检查后重试');
        setIsValidating(false);
        return;
      }

      if (!response.ok) {
        setError('验证失败，请稍后重试');
        setIsValidating(false);
        return;
      }

      // 验证通过，存储到 Cookie
      setApiKey(apiKey.trim());
      onKeySet();
    } catch {
      setError('网络错误，请检查后端服务是否正常运行');
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSubmit(e as React.FormEvent);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">请输入密钥以使用</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入密钥"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
              disabled={isValidating}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isValidating}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isValidating ? '验证中...' : '确认'}
          </button>
        </form>
      </div>
    </div>
  );
}
