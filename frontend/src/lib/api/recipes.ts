import { apiFetch } from "./client";

const GENERATE_RECIPE_PATH = "/api/v1/recipes/generate";
const CACHE_RECIPE_PATH = "/api/v1/recipes/cache";
const LIST_PROVIDERS_PATH = "/api/v1/recipes/providers";
const REQUIRE_API_KEY_PATH = "/api/v1/recipes/config/require-api-key";
const GET_RECIPE_PATH = "/api/v1/recipes"; // 根据菜名查询缓存的菜谱

export interface GenerateRecipePayload {
  dishName: string;
  servings?: number;
  dietaryPreferences?: string[];
  ingredients?: string[];
  language?: string;
  extraInstructions?: string | null;
  provider?: string | null;
  routingStrategy?: "default" | "weighted" | null;
}

interface RecipeGenerationApiResponse {
  request_id: string;
  provider: string;
  recipe: Record<string, unknown>;
  cached: boolean;
}

interface RecipeProviderApiSummary {
  name: string;
  model: string;
  type: string;
  description?: string | null;
}

interface RecipeProvidersApiResponse {
  default_provider: string;
  providers: RecipeProviderApiSummary[];
}

export interface RecipeGenerationResult {
  requestId: string;
  provider: string;
  recipe: Record<string, unknown>;
  cached: boolean;
}

export interface CacheRecipePayload {
  dishName: string;
  provider: string;
  recipe: Record<string, unknown>;
}

export interface RecipeProviderSummary {
  name: string;
  model: string;
  type: string;
  description?: string | null;
}

export interface RecipeProvidersResult {
  defaultProvider: string;
  providers: RecipeProviderSummary[];
}

export interface RequireApiKeyConfig {
  requireApiKey: boolean;
}

export const generateRecipe = async (
  payload: GenerateRecipePayload
): Promise<RecipeGenerationResult> => {
  const {
    dishName,
    servings = 2,
    dietaryPreferences = [],
    ingredients = [],
    language = "zh",
    extraInstructions,
    provider,
    routingStrategy,
  } = payload;

  const body: Record<string, unknown> = {
    dish_name: dishName,
    servings,
    dietary_preferences: dietaryPreferences,
    ingredients,
    language,
  };

  if (extraInstructions) {
    body.extra_instructions = extraInstructions;
  }

  if (provider) {
    body.provider = provider;
  }

  if (routingStrategy) {
    body.routing_strategy = routingStrategy;
  }

  const response = await apiFetch<RecipeGenerationApiResponse>(
    GENERATE_RECIPE_PATH,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return {
    requestId: response.request_id,
    provider: response.provider,
    recipe: response.recipe,
    cached: response.cached,
  };
};

export const fetchRecipeProviders = async (): Promise<RecipeProvidersResult> => {
  const response = await apiFetch<RecipeProvidersApiResponse>(LIST_PROVIDERS_PATH);

  const providers = (response.providers ?? []).map((item) => ({
    name: item.name,
    model: item.model,
    type: item.type,
    description: item.description,
  }));

  return {
    defaultProvider: response.default_provider,
    providers,
  };
};

/**
 * 获取是否需要 API Key 的配置
 * 此端点是公开的，不需要 API Key 验证
 */
export const fetchRequireApiKey = async (): Promise<RequireApiKeyConfig> => {
  const response = await apiFetch<RequireApiKeyConfig>(REQUIRE_API_KEY_PATH);
  return response;
};

export const cacheRecipeResult = async (
  payload: CacheRecipePayload
): Promise<RecipeGenerationResult> => {
  const { dishName, provider, recipe } = payload;

  const body = {
    dish_name: dishName,
    provider,
    recipe,
  };

  const response = await apiFetch<RecipeGenerationApiResponse>(
    CACHE_RECIPE_PATH,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return {
    requestId: response.request_id,
    provider: response.provider,
    recipe: response.recipe,
    cached: response.cached,
  };
};

/**
 * Generate recipe with streaming output via Server-Sent Events (SSE).
 *
 * @param payload - Recipe generation parameters
 * @param onChunk - Callback invoked for each received chunk
 * @param onComplete - Callback invoked when streaming completes with full content
 * @param onError - Callback invoked on error
 * @param signal - Optional AbortSignal for cancellation
 */
export const generateRecipeStream = async (
  payload: GenerateRecipePayload,
  onChunk: (chunk: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> => {
  const {
    dishName,
    servings = 2,
    dietaryPreferences = [],
    ingredients = [],
    language = "zh",
    extraInstructions,
    provider,
    routingStrategy,
  } = payload;

  const body: Record<string, unknown> = {
    dish_name: dishName,
    servings,
    dietary_preferences: dietaryPreferences,
    ingredients,
    language,
  };

  if (extraInstructions) {
    body.extra_instructions = extraInstructions;
  }

  if (provider) {
    body.provider = provider;
  }

  if (routingStrategy) {
    body.routing_strategy = routingStrategy;
  }

  // Build URL and headers
  const url = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/recipes/generate/stream`
    : "http://localhost:8000/api/v1/recipes/generate/stream";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };

  // 动态导入 getApiKey 以避免服务端渲染问题
  const { getApiKey } = await import("@/lib/utils/cookie");
  const apiKey = getApiKey();
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  let fullContent = "";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If not JSON, use the raw text or statusText
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode the chunk
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages (format: "data: ...\n\n")
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) {
          continue;
        }

        const data = trimmed.substring(5).trim(); // Remove "data:" prefix

        // Check for end marker
        if (data === "[DONE]") {
          onComplete(fullContent);
          return;
        }

        // Accumulate content
        fullContent += data;
        onChunk(data);
      }
    }

    // If we reach here without [DONE], complete anyway
    onComplete(fullContent);
  } catch (error) {
    if (signal?.aborted) {
      onError(new Error("已取消生成"));
      return;
    }

    // 统一处理所有错误，显示友好的中文提示
    let friendlyMessage = "发生错误，请重试";

    if (error instanceof TypeError) {
      // 网络错误：fetch failed, CORS, 连接被拒绝等
      friendlyMessage = "网络连接失败，请检查网络后重试";
    } else if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      // CORS 错误
      if (errorMsg.includes("cors") || errorMsg.includes("access-control")) {
        friendlyMessage = "服务器连接失败，请稍后重试";
      }
      // 502/503/504 网关错误
      else if (errorMsg.includes("502") || errorMsg.includes("503") || errorMsg.includes("504")) {
        friendlyMessage = "服务器暂时不可用，请稍后重试";
      }
      // 500 服务器错误
      else if (errorMsg.includes("500")) {
        friendlyMessage = "服务器内部错误，请重试";
      }
      // 超时错误
      else if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
        friendlyMessage = "请求超时，请重试";
      }
      // 其他 HTTP 错误
      else if (errorMsg.includes("http")) {
        friendlyMessage = "发生错误，请重试";
      }
    }

    onError(new Error(friendlyMessage));
  }
};

/**
 * 根据菜名从缓存中查询菜谱
 *
 * @param dishName - 菜名（支持中文，会自动进行 URL 编码）
 * @param provider - 可选的提供商名称，如果未指定则使用默认提供商
 * @returns 菜谱生成结果，如果缓存未命中则抛出 404 错误
 * @throws {ApiError} 404 - 缓存中不存在该菜谱
 * @throws {ApiError} 401 - API Key 验证失败
 */
export const fetchRecipeByName = async (
  dishName: string,
  provider?: string
): Promise<RecipeGenerationResult> => {
  // URL 编码菜名以支持中文和特殊字符
  const encodedDishName = encodeURIComponent(dishName);

  // 构建请求路径
  let path = `${GET_RECIPE_PATH}/${encodedDishName}`;

  // 如果指定了提供商，添加查询参数
  if (provider) {
    path += `?provider=${encodeURIComponent(provider)}`;
  }

  const response = await apiFetch<RecipeGenerationApiResponse>(path, {
    method: "GET",
  });

  return {
    requestId: response.request_id,
    provider: response.provider,
    recipe: response.recipe,
    cached: response.cached,
  };
};
