import { z } from "zod";

export const recipeFormSchema = z.object({
  dishName: z
    .string()
    .min(1, "请输入菜名")
    .max(20, "菜名长度不能超过 20 个字符"),
  provider: z.string().optional(),
});

export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
