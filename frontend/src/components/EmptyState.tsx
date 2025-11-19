'use client';

import { ChefHat, Search } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  dishName: string;
  className?: string;
}

/**
 * 空状态组件 - 当菜谱未在缓存中找到时显示
 *
 * @param dishName - 菜名
 * @param className - 自定义样式类
 */
export default function EmptyState({ dishName, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] px-4 ${className}`}>
      <div className="text-center max-w-md">
        {/* 图标 */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <ChefHat className="w-12 h-12 text-gray-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Search className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          菜谱尚未生成
        </h2>

        {/* 描述 */}
        <p className="text-gray-600 mb-2">
          未找到 <span className="font-semibold text-gray-900">&quot;{dishName}&quot;</span> 的菜谱
        </p>
        <p className="text-sm text-gray-500 mb-8">
          您可以返回主页，通过输入框生成这道菜的详细菜谱
        </p>

        {/* 操作按钮 */}
        <div className="flex justify-center">
          <Link
            href={`/?dish=${encodeURIComponent(dishName)}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <ChefHat className="w-5 h-5" />
            <span>立即生成菜谱</span>
          </Link>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-12 text-center">
        <p className="text-xs text-gray-400">
          💡 提示：生成后的菜谱会自动缓存，下次访问即可直接查看
        </p>
      </div>
    </div>
  );
}
