'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Recipe } from '@/features/recipe-generator/types';
import { fetchRecipeByName } from '@/lib/api/recipes';
import { RecipeResult } from '@/features/recipe-generator/components/RecipeResult';
import EmptyState from '@/components/EmptyState';
import BackToHome from '@/components/BackToHome';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * 菜谱详情页面 - 通过 URL 直接访问特定菜谱
 *
 * 路由格式：/recipe/[dishName]?provider=xxx
 */
export default function RecipeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  // 从 URL 获取菜名和提供商
  const dishName = decodeURIComponent(params.dishName as string);
  const provider = searchParams.get('provider') || undefined;

  // 状态管理
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeProvider, setRecipeProvider] = useState<string>('');
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadRecipe() {
      if (!dishName) {
        setError('菜名参数缺失');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);

        const data = await fetchRecipeByName(dishName, provider);

        // 提取 recipe 对象并进行类型转换
        setRecipe(data.recipe as Recipe);
        setRecipeProvider(data.provider);
        setIsCached(data.cached);
      } catch (err: unknown) {
        if (err instanceof Error) {
          // 404 表示缓存中没有该菜谱
          if (err.message.includes('404') || err.message.includes('未找到')) {
            setNotFound(true);
          } else {
            setError(err.message);
          }
        } else {
          setError('加载菜谱失败，请稍后重试');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadRecipe();
  }, [dishName, provider]);

  // Loading 骨架屏
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <BackToHome className="mb-6" />
          <LoadingSkeleton dishName={dishName} />
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <BackToHome className="mb-6" />
          <ErrorState error={error} />
        </div>
      </div>
    );
  }

  // 菜谱未找到状态
  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <BackToHome className="mb-6" />
          <EmptyState dishName={dishName} />
        </div>
      </div>
    );
  }

  // 菜谱展示
  if (recipe) {
    // 将 cached 信息添加到 recipe 对象中
    const recipeWithCached = {
      ...recipe,
      cached: isCached,
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <BackToHome className="mb-6" />
          <RecipeResult recipe={recipeWithCached} provider={recipeProvider} />
        </div>
      </div>
    );
  }

  // 默认返回（理论上不应到达这里）
  return null;
}

/**
 * Loading 骨架屏组件
 */
function LoadingSkeleton({ dishName }: { dishName: string }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
        {/* 标题骨架 */}
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <div className="text-lg text-gray-600">
            正在加载 <span className="font-semibold text-gray-900">&quot;{dishName}&quot;</span> 的菜谱...
          </div>
        </div>

        {/* 内容骨架 */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="mt-8 space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 错误状态组件
 */
function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        {/* 错误图标 */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          加载失败
        </h2>

        {/* 错误信息 */}
        <p className="text-gray-600 mb-8">
          {error}
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            重新加载
          </button>
          <BackToHome variant="button" />
        </div>
      </div>
    </div>
  );
}
