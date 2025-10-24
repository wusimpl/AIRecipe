"use client";

import type { RecipeGenerationResult } from "@/lib/api/recipes";
import type { Recipe } from "../types";
import { RecipeResult } from "./RecipeResult";

interface RecipeResultPreviewProps {
  result?: RecipeGenerationResult | null;
}

export const RecipeResultPreview = ({
  result,
}: RecipeResultPreviewProps) => {
  if (!result) {
    return null;
  }

  // Type guard to check if the recipe data is valid
  const isValidRecipe = (data: unknown): data is Recipe => {
    if (!data || typeof data !== "object") return false;
    const recipe = data as Partial<Recipe>;
    return !!(
      recipe.菜名 &&
      recipe.标签 &&
      recipe.简介 &&
      recipe.难度 &&
      recipe.用料 &&
      recipe.烹饪流程
    );
  };

  // Validate the recipe data
  if (!isValidRecipe(result.recipe)) {
    return (
      <section className="flex w-full max-w-3xl flex-col gap-3">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900">生成结果</h2>
          <p className="text-sm text-slate-500">
            request_id: {result.requestId} · provider: {result.provider}
          </p>
        </header>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-amber-900 mb-3">
            返回的数据格式不符合预期,显示原始 JSON:
          </p>
          <pre className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200 bg-slate-950/95 p-4 text-sm text-slate-100 shadow-inner">
            <code>{JSON.stringify(result.recipe, null, 2)}</code>
          </pre>
        </div>
      </section>
    );
  }

  // Attach cached status to recipe object
  const recipeWithCached = {
    ...result.recipe,
    cached: result.cached,
  } as Recipe;

  return (
    <div className="w-full">
      <RecipeResult recipe={recipeWithCached} provider={result.provider} />
    </div>
  );
};
