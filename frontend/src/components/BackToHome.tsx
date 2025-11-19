'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackToHomeProps {
  className?: string;
  variant?: 'button' | 'link';
}

/**
 * 返回主页组件
 *
 * @param className - 自定义样式类
 * @param variant - 样式变体：'button'（按钮样式）或 'link'（链接样式）
 */
export default function BackToHome({
  className = '',
  variant = 'button'
}: BackToHomeProps) {
  const baseClasses = 'inline-flex items-center gap-2 transition-all duration-200';

  const variantClasses = variant === 'button'
    ? 'px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 shadow-sm hover:shadow-md'
    : 'text-blue-600 hover:text-blue-700 hover:underline';

  return (
    <Link
      href="/"
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>返回主页</span>
    </Link>
  );
}
