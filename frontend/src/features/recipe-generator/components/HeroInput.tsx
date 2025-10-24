"use client";

import type {
  FieldErrors,
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form";
import clsx from "clsx";
import { ChefHat, Sparkles } from "lucide-react";

import type { RecipeFormValues } from "../schema";
import { RecipeHistoryTags } from "./RecipeHistoryTags";

interface ProviderOption {
  name: string;
  model: string;
  type: string;
}

export interface HeroInputProps {
  register: UseFormRegister<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  handleSubmit: UseFormHandleSubmit<RecipeFormValues>;
  onSubmit: SubmitHandler<RecipeFormValues>;
  isSubmitting: boolean;
  serverError?: string;
  providers: ProviderOption[];
  isLoadingProviders: boolean;
  history: string[];
  onSelectHistory: (dishName: string) => void;
  onRemoveHistory: (dishName: string) => void;
}

export const HeroInput = ({
  register,
  errors,
  handleSubmit,
  onSubmit,
  isSubmitting,
  serverError,
  providers,
  isLoadingProviders,
  history,
  onSelectHistory,
  onRemoveHistory,
}: HeroInputProps) => {
  const dishNameError = errors.dishName?.message;
  const providerDisabled =
    isSubmitting || isLoadingProviders || providers.length === 0;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
      <div className="space-y-3">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-slate-900 sm:gap-3 sm:text-5xl">
          <ChefHat className="h-8 w-8 text-sky-600 sm:h-12 sm:w-12" />
          AI Recipe Studio
        </h1>
        <p className="text-base text-slate-600 sm:text-lg">
          输入菜名，生成详细的食谱。
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full"
        aria-describedby={dishNameError ? "dish-name-error" : undefined}
        noValidate
      >
        {/* 搜索框风格：一行布局 */}
        <div className="flex w-full flex-col gap-3 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 transition-shadow hover:shadow-xl sm:flex-row sm:items-center">
          {/* 菜名输入框 */}
          <div className="relative flex min-w-0 flex-1">
            <label className="sr-only" htmlFor="dish-name">
              菜名
            </label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="dish-name"
              type="text"
              placeholder="例如：宫保鸡丁"
              className={clsx(
                "w-full rounded-xl border-0 bg-slate-50 py-3 pl-12 pr-4 text-base transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400",
                isSubmitting && "cursor-not-allowed opacity-80",
                dishNameError && "ring-2 ring-red-400 focus:ring-red-400"
              )}
              aria-invalid={dishNameError ? "true" : "false"}
              aria-label="菜名"
              autoComplete="off"
              disabled={isSubmitting}
              {...register("dishName")}
            />
          </div>

          {/* 模型选择器 */}
          <div className="flex w-full items-center sm:w-60">
            <label className="sr-only" htmlFor="provider">
              模型
            </label>
            <select
              id="provider"
              defaultValue=""
              className={clsx(
                "w-full cursor-pointer rounded-xl border-0 bg-slate-50 px-4 py-3 text-base transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400",
                providerDisabled && "cursor-not-allowed opacity-80"
              )}
              disabled={providerDisabled}
              aria-label="选择模型"
              {...register("provider")}
            >
              {isLoadingProviders ? (
                <option value="">加载中…</option>
              ) : providers.length ? (
                providers.map((provider) => (
                  <option key={provider.name} value={provider.name}>
                    厨师：{provider.name}
                  </option>
                ))
              ) : (
                <option value="">暂无模型</option>
              )}
            </select>
          </div>

          {/* 生成按钮 */}
          <button
            type="submit"
            className={clsx(
              "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:shadow-md hover:from-sky-500 hover:to-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
              isSubmitting && "cursor-not-allowed opacity-80"
            )}
            disabled={isSubmitting}
          >
            {isSubmitting ? "生成中..." : "生成菜谱"}
          </button>
        </div>
      </form>

      {/* 历史标签 */}
      <RecipeHistoryTags
        history={history}
        onSelectDish={onSelectHistory}
        onRemoveItem={onRemoveHistory}
      />

      {/* 错误提示 */}
      {dishNameError || serverError ? (
        <div className="w-full rounded-xl bg-red-50 p-4 text-center">
          {dishNameError ? (
            <p
              id="dish-name-error"
              role="alert"
              className="text-sm font-medium text-red-600"
            >
              {dishNameError}
            </p>
          ) : null}
          {serverError ? (
            <p role="alert" className="text-sm font-medium text-red-600">
              {serverError}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
