"use client";

import { useEffect, useRef } from "react";

interface LoadingBannerProps {
  dishName: string;
  streamingContent?: string;
  onCancel?: () => void;
}

const LoadingIcon = () => (
  <svg
    className="h-5 w-5 animate-spin text-sky-600"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

export const LoadingBanner = ({
  dishName,
  streamingContent,
  onCancel,
}: LoadingBannerProps) => {
  const contentRef = useRef<HTMLPreElement>(null);

  // Auto-scroll to bottom-right when content updates (to show latest content)
  useEffect(() => {
    if (contentRef.current && streamingContent) {
      // Scroll to bottom vertically
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
      // Scroll to right horizontally to show the latest content
      contentRef.current.scrollLeft = contentRef.current.scrollWidth;
    }
  }, [streamingContent]);

  return (
    <div className="w-full max-w-3xl space-y-3">
      {/* Loading header */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-left shadow-sm backdrop-blur">
        <LoadingIcon />
        <div className="flex-1 text-sm text-slate-600">
          <p className="font-medium text-slate-700">菜谱生成中，预计时间10秒~2分钟...</p>
          <p>正在为「{dishName}」构思食材与步骤，请稍候。</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="取消生成"
          >
            取消
          </button>
        )}
      </div>

      {/* Streaming content display */}
      {streamingContent && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm backdrop-blur">
          <div className="border-b border-slate-200 bg-white/50 px-4 py-2">
            <p className="text-xs font-medium text-slate-600">实时生成内容</p>
          </div>
          <pre
            ref={contentRef}
            className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-800 scrollbar-hide"
          >
            {streamingContent}
          </pre>
        </div>
      )}
    </div>
  );
};
