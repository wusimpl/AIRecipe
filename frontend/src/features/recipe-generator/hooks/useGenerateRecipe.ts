"use client";

import { useMutation } from "@tanstack/react-query";

import {
  generateRecipe,
  type GenerateRecipePayload,
  type RecipeGenerationResult,
} from "@/lib/api/recipes";
import { ApiError } from "@/lib/api/client";

export const useGenerateRecipeMutation = () =>
  useMutation<RecipeGenerationResult, ApiError, GenerateRecipePayload>({
    mutationFn: async (payload) => generateRecipe(payload),
  });
