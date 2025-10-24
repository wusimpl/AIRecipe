"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api/client";
import { cacheRecipeResult, type RecipeGenerationResult } from "@/lib/api/recipes";
import { safeParseRecipeJson } from "@/lib/utils/json-cleaner";

import { useGenerateRecipeStream } from "../hooks/useGenerateRecipeStream";
import { useRecipeProviders } from "../hooks/useRecipeProviders";
import { useRecipeHistory } from "../hooks/useRecipeHistory";
import { recipeFormSchema, type RecipeFormValues } from "../schema";
import type { Recipe } from "../types";
import { HeroInput } from "./HeroInput";
import { LoadingBanner } from "./LoadingBanner";
import { RecipeResultPreview } from "./RecipeResultPreview";

const DEFAULT_LANGUAGE = "zh";

/**
 * Generate a UUID with fallback for browser compatibility.
 * Tries native crypto.randomUUID() first, falls back to a simple implementation.
 */
const generateUUID = (): string => {
  // Try native crypto.randomUUID first
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // If it fails, use fallback
    }
  }

  // Fallback: Simple UUID v4 implementation (compatible with all browsers)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const RecipeGeneratorScreen = () => {
  const [serverError, setServerError] = useState<string>();
  const [recipe, setRecipe] = useState<RecipeGenerationResult | undefined>();
  const {
    streamingContent,
    isStreaming,
    error: streamError,
    startStream,
    cancelStream,
    reset: resetStream,
  } = useGenerateRecipeStream();
  const {
    data: providerData,
    isLoading: isLoadingProviders,
  } = useRecipeProviders();
  const { history, addHistory, removeItem } = useRecipeHistory();

  const form = useForm<RecipeFormValues>({
    mode: "onSubmit",
    resolver: zodResolver(recipeFormSchema),
    defaultValues: { dishName: "红烧排骨", provider: "" },
  });

  const defaultProvider = providerData?.defaultProvider ?? "";

  useEffect(() => {
    if (!defaultProvider) {
      return;
    }
    const current = form.getValues("provider");
    if (current) {
      return;
    }
    form.setValue("provider", defaultProvider, { shouldDirty: false });
  }, [form, defaultProvider]);

  const onSubmit = async (values: RecipeFormValues) => {
    setServerError(undefined);
    setRecipe(undefined);

    const trimmedDishName = values.dishName.trim();
    form.setValue("dishName", trimmedDishName);

    if (!trimmedDishName) {
      form.setError("dishName", {
        type: "manual",
        message: "请输入菜名",
      });
      return;
    }

    // Update the pending dish name for display in LoadingBanner
    setPendingDishName(trimmedDishName);

    try {
      // Use streaming by default
      await startStream({
        dishName: trimmedDishName,
        language: DEFAULT_LANGUAGE,
        provider: values.provider || undefined,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message || "生成失败，请稍后重试。");
      } else {
        setServerError("生成失败，请稍后重试。");
      }
    }
  };

  // Parse JSON when streaming completes
  useEffect(() => {
    if (!isStreaming && streamingContent && !streamError) {
      // Debug: Log the raw streaming content (FULL)
      console.log("=== Raw streamingContent (FULL) ===");
      console.log(streamingContent);
      console.log("=== streamingContent length:", streamingContent.length, "chars ===");

      // Try to parse as RecipeGenerationResult first (cached response)
      const resultParsed = safeParseRecipeJson<RecipeGenerationResult>(streamingContent);

      if (resultParsed.success) {
        const parsed = resultParsed.data as RecipeGenerationResult & { request_id?: string };

        // Check if this is a complete RecipeGenerationResult (cached response)
        // Support both snake_case (backend) and camelCase (transformed)
        const hasRequestId = parsed.requestId || parsed.request_id;
        const hasProvider = parsed.provider;
        const hasRecipe = parsed.recipe;

        if (hasRequestId && hasProvider && hasRecipe) {
          console.log("=== Cache hit: RecipeGenerationResult ===");

          // Normalize to camelCase format
          const normalizedResult: RecipeGenerationResult = {
            requestId: parsed.request_id || parsed.requestId,
            provider: parsed.provider,
            recipe: parsed.recipe,
            cached: parsed.cached ?? false,
          };

          setRecipe(normalizedResult);
          resetStream();

          // 保存历史记录（缓存命中时也保存）
          const trimmedNameForHistory = form.getValues("dishName")?.trim() ?? "";
          if (trimmedNameForHistory) {
            addHistory(trimmedNameForHistory);
          }

          return;
        }
      }

      // Try to parse as Recipe object (streamed from LLM)
      const recipeParsed = safeParseRecipeJson<Recipe>(streamingContent);

      if (recipeParsed.success) {
        const recipeData = recipeParsed.data;

        console.log("=== Parsed recipe data ===");
        console.log("菜名:", recipeData.菜名);

        // Validate required fields
        if (!recipeData.菜名 || !recipeData.用料 || !recipeData.烹饪流程) {
          console.error("=== Recipe data incomplete ===");
          setServerError("生成的菜谱格式不完整，请重试。");
          return;
        }

        // Wrap the recipe in RecipeGenerationResult format
        const currentProvider = form.getValues("provider") || defaultProvider;
        const wrappedResult: RecipeGenerationResult = {
          requestId: generateUUID(),
          provider: currentProvider,
          recipe: recipeData,
          cached: false,
        };

        setRecipe(wrappedResult);
        resetStream();

        // 保存历史记录（流式生成成功时保存）
        const trimmedNameForCache = form.getValues("dishName")?.trim() ?? "";
        if (trimmedNameForCache) {
          addHistory(trimmedNameForCache);
        }

        if (trimmedNameForCache && currentProvider) {
          const recipePayload = JSON.parse(JSON.stringify(recipeData)) as Record<string, unknown>;

          void (async () => {
            try {
              const cachedResult = await cacheRecipeResult({
                dishName: trimmedNameForCache,
                provider: currentProvider,
                recipe: recipePayload,
              });
              setRecipe(cachedResult);
            } catch (error) {
              console.warn("缓存菜谱失败", error);
            }
          })();
        }
      } else {
        // Failed to parse JSON
        console.error("=== Failed to parse recipe JSON ===");
        console.error("Error:", recipeParsed.error);

        // 输出内容长度信息
        console.error("Raw content length:", recipeParsed.rawContent.length, "chars");
        console.error("Cleaned content length:", recipeParsed.contentLength ?? 0, "chars");

        // 如果有错误位置信息，输出错误上下文
        if (recipeParsed.errorPosition !== undefined) {
          console.error("Error position:", recipeParsed.errorPosition);
          console.error("Error context (±50 chars):", recipeParsed.errorContext);
        }

        // 输出前后 200 字符用于诊断
        const rawContent = recipeParsed.rawContent;
        const cleanedContent = recipeParsed.cleanedContent ?? "";

        console.error("Raw content (first 200 chars):", rawContent.slice(0, 200));
        console.error("Raw content (last 200 chars):", rawContent.slice(-200));
        console.error("Cleaned content (first 200 chars):", cleanedContent.slice(0, 200));
        console.error("Cleaned content (last 200 chars):", cleanedContent.slice(-200));

        setServerError(`生成的菜谱格式有误: ${recipeParsed.error}`);
      }
    }
  }, [isStreaming, streamingContent, streamError, resetStream, form, defaultProvider, addHistory]);

  // Handle stream errors
  useEffect(() => {
    if (streamError) {
      setServerError(streamError);
    }
  }, [streamError]);

  // Track the dish name that's being generated
  const [pendingDishName, setPendingDishName] = useState<string>("这道菜");

  // Handle history selection: fill the input with the selected dish name
  const handleSelectHistory = (dishName: string) => {
    form.setValue("dishName", dishName);
  };

  const hasRecipe = !!recipe;

  return (
    <div
      className={`flex w-full flex-col transition-all duration-700 ${
        hasRecipe
          ? "min-h-0 gap-12 px-4 py-8 sm:px-6 lg:px-8"
          : "min-h-screen items-center justify-center gap-8 px-4"
      }`}
    >
      <div
        className={`w-full transition-all duration-700 ${
          hasRecipe ? "mx-auto max-w-5xl" : ""
        }`}
      >
        <HeroInput
          register={form.register}
          errors={form.formState.errors}
          handleSubmit={form.handleSubmit}
          onSubmit={onSubmit}
          isSubmitting={isStreaming}
          serverError={serverError}
          providers={providerData?.providers ?? []}
          isLoadingProviders={isLoadingProviders}
          history={history}
          onSelectHistory={handleSelectHistory}
          onRemoveHistory={removeItem}
        />
      </div>

      {isStreaming ? (
        <div className="w-full flex justify-center">
          <LoadingBanner
            dishName={pendingDishName}
            streamingContent={streamingContent}
            onCancel={cancelStream}
          />
        </div>
      ) : null}

      {hasRecipe ? (
        <div className="mx-auto w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <RecipeResultPreview result={recipe} />
        </div>
      ) : null}
    </div>
  );
};
