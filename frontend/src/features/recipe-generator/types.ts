/**
 * TypeScript types for recipe data structure
 * Based on backend schema: /backend/schemas/recipe_output.json
 */

export type RecipeDifficulty = "入门" | "中级" | "进阶" | "大师";

export interface RecipeIngredientCategory {
  [key: string]: string;
}

export interface RecipeIngredients {
  主料: RecipeIngredientCategory;
  辅料?: RecipeIngredientCategory;
  调味料?: RecipeIngredientCategory;
  [key: string]: RecipeIngredientCategory | undefined;
}

export interface RecipeStep {
  步骤名: string;
  操作: string;
  时间?: string;
  火候?: string;
  tips?: string;
  [key: string]: string | undefined;
}

export interface RecipeCookingProcess {
  步骤顺序数组: RecipeStep[];
  [key: string]: unknown;
}

export interface RecipeAdvancedTips {
  [key: string]: string | string[] | Record<string, unknown>;
}

export interface RecipeSelection {
  [key: string]: unknown;
}

export interface RecipePreparation {
  [key: string]: unknown;
}

export interface RecipeStorageAndServing {
  [key: string]: unknown;
}

export interface RecipeOtherNotes {
  [key: string]: unknown;
}

export interface Recipe {
  菜名: string;
  标签: string[];
  简介: string;
  难度: RecipeDifficulty;
  准备时间: string;
  烹饪时间: string;
  总时间: string;
  选材?: RecipeSelection;
  用料: RecipeIngredients;
  预处理?: RecipePreparation;
  烹饪流程: RecipeCookingProcess;
  进阶技巧?: RecipeAdvancedTips;
  保存与食用?: RecipeStorageAndServing;
  其他注意事项?: RecipeOtherNotes;
  版本: string;
  作者: string;
  创建时间: string;
  cached?: boolean;
  [key: string]: unknown;
}
