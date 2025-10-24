"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchRecipeProviders,
  type RecipeProvidersResult,
} from "@/lib/api/recipes";

const RECIPE_PROVIDERS_QUERY_KEY = ["recipeProviders"];

export const useRecipeProviders = () =>
  useQuery<RecipeProvidersResult>({
    queryKey: RECIPE_PROVIDERS_QUERY_KEY,
    queryFn: fetchRecipeProviders,
    staleTime: 10 * 60 * 1000, // 10分钟内不重新请求
    gcTime: 15 * 60 * 1000, // 缓存保持15分钟
    refetchOnMount: false, // 组件挂载时不自动重新请求
    refetchOnReconnect: false, // 网络重连时不自动重新请求
    refetchOnWindowFocus: false, // 窗口获得焦点时不自动重新请求
  });
