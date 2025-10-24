"use client";

import { useState, useEffect } from "react";
import { RecipeGeneratorScreen } from "@/features/recipe-generator/components/RecipeGeneratorScreen";
import ApiKeyInput from "@/components/ApiKeyInput";
import { getApiKey } from "@/lib/utils/cookie";
import { fetchRequireApiKey } from "@/lib/api/recipes";

export default function Home() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // 先查询是否需要 API Key
        const config = await fetchRequireApiKey();
        if (!config.requireApiKey) {
          // 不需要 API Key，直接显示主界面
          setHasApiKey(true);
        } else {
          // 需要 API Key，检查 Cookie
          const apiKey = getApiKey();
          setHasApiKey(!!apiKey);
        }
      } catch (error) {
        console.error("获取配置失败:", error);
        // Fallback: 检查 Cookie（保持健壮性）
        const apiKey = getApiKey();
        setHasApiKey(!!apiKey);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  const handleKeySet = () => {
    setHasApiKey(true);
  };

  // 加载中状态
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </main>
    );
  }

  // 没有 API Key，显示输入界面
  if (!hasApiKey) {
    return <ApiKeyInput onKeySet={handleKeySet} />;
  }

  // 有 API Key，显示正常界面
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <RecipeGeneratorScreen />
    </main>
  );
}
