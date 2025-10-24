/**
 * JSON 清理工具
 * 用于处理大语言模型返回的原始内容，清理 <think> 标签、markdown code blocks、控制字符等格式
 */

import { jsonrepair } from 'jsonrepair';

/**
 * 移除 <think>...</think> 标签及其内容
 *
 * 推理模型（如 DeepSeek）会在输出中包含思考过程，需要清理掉
 *
 * @param content - 待清理的内容
 * @returns 移除 <think> 标签后的内容
 *
 * @example
 * ```typescript
 * const content = '<think>思考过程...</think>{"name": "菜名"}';
 * const result = removeThinkTags(content);
 * // 返回: '{"name": "菜名"}'
 * ```
 */
export function removeThinkTags(content: string): string {
  // 使用非贪婪匹配，支持多行内容，不区分大小写
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '');
}

/**
 * 移除 markdown code blocks
 *
 * LLM 可能将 JSON 包裹在 ```json...``` 或 ```...``` 中
 * 支持完整和不完整的 code block（流式生成时可能不完整）
 *
 * @param content - 待清理的内容
 * @returns 提取或移除 code block 后的内容
 *
 * @example
 * ```typescript
 * const content1 = '```json\n{"name": "菜名"}\n```';
 * const result1 = removeMarkdownCodeBlocks(content1);
 * // 返回: '{"name": "菜名"}'
 *
 * const content2 = '```json\n{"name": "菜名"}';  // 不完整
 * const result2 = removeMarkdownCodeBlocks(content2);
 * // 返回: '{"name": "菜名"}'
 * ```
 */
export function removeMarkdownCodeBlocks(content: string): string {
  // 首先尝试匹配完整的 code block（有开头和结尾）
  const completeCodeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (completeCodeBlockMatch) {
    return completeCodeBlockMatch[1];
  }

  // 如果没有完整的 code block，尝试只移除开头的 ```json 或 ```
  let cleaned = content;
  // 匹配开头的 ``` 及其后面的可选语言标识（如 json）
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  // 移除末尾可能的 ```（如果存在）
  cleaned = cleaned.replace(/```\s*$/, '');

  return cleaned;
}

/**
 * 移除控制字符和不可见字符
 *
 * LLM 流式输出可能包含不可见的控制字符，导致 JSON 解析失败
 * 移除范围：
 * - \u0000-\u001F：控制字符（保留 \n \r \t）
 * - \u200B-\u200D：零宽字符（零宽空格、零宽非连接符、零宽连接符）
 * - \uFEFF：字节顺序标记（BOM）
 *
 * @param content - 待清理的内容
 * @returns 移除控制字符后的内容
 *
 * @example
 * ```typescript
 * const content = '{"name"\u200B: "菜名"}';  // 包含零宽空格
 * const result = removeControlCharacters(content);
 * // 返回: '{"name": "菜名"}'
 * ```
 */
export function removeControlCharacters(content: string): string {
  // 移除常见控制字符：\u0000-\u001F（除了 \n=0A, \r=0D, \t=09）
  // 移除零宽字符：\u200B, \u200C, \u200D
  // 移除 BOM：\uFEFF
  return content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u200B-\u200D\uFEFF]/g, '');
}

/**
 * 清理首尾空白字符
 *
 * @param content - 待清理的内容
 * @returns 清理首尾空白后的内容
 */
export function trimWhitespace(content: string): string {
  return content.trim();
}


/**
 * 尝试自动修复 JSON 格式错误
 *
 * 使用 jsonrepair 库自动修复常见的 JSON 格式问题：
 * - 转义字符串值内部的未转义双引号
 * - 移除末尾多余的逗号（trailing comma）
 * - 补全缺失的右括号/右大括号
 * - 修复单引号为双引号
 * - 移除注释和 JSONP 标记
 * - 以及更多 LLM 输出中的常见问题
 *
 * @param content - 待修复的 JSON 字符串
 * @returns 修复成功返回修复后的内容，失败返回 null
 *
 * @example
 * ```typescript
 * const content = '{"name": "菜名",}';  // 末尾多余逗号
 * const repaired = attemptJsonRepair(content);
 * // 返回: '{"name": "菜名"}'
 * ```
 */
export function attemptJsonRepair(content: string): string | null {
  try {
    // 使用 jsonrepair 库自动修复各种 JSON 格式问题
    const repaired = jsonrepair(content);
    // 验证修复后的内容可以解析
    JSON.parse(repaired);
    return repaired;
  } catch {
    return null; // 修复失败
  }
}

/**
 * 清理 LLM 返回的 JSON 输出
 *
 * 使用管道模式串联多个清理函数，处理以下格式：
 * 1. 移除 <think>...</think> 标签及其内容（用于推理模型）
 * 2. 移除 markdown code blocks (```json...``` 或 ```...```)
 * 3. 移除控制字符和不可见字符（新增）
 * 4. 清理首尾空白字符
 *
 * @param rawContent - LLM 返回的原始内容
 * @returns 清理后的纯 JSON 字符串
 *
 * @example
 * ```typescript
 * const raw = `<think>思考过程...</think>\n\`\`\`json\n{"name": "菜名"}\n\`\`\``;
 * const cleaned = cleanLLMJsonOutput(raw);
 * // 返回: '{"name": "菜名"}'
 * ```
 */
export function cleanLLMJsonOutput(rawContent: string): string {
  // 使用管道模式：依次应用所有清理函数
  return [
    removeThinkTags,
    removeMarkdownCodeBlocks,
    removeControlCharacters,
    trimWhitespace,
  ].reduce((content, cleanFn) => cleanFn(content), rawContent);
}

/**
 * 解析结果类型（成功）
 */
export interface ParseSuccess<T> {
  success: true;
  data: T;
}

/**
 * 解析结果类型（失败）
 */
export interface ParseError {
  success: false;
  error: string;
  rawContent: string;
  cleanedContent?: string;
  errorPosition?: number;        // 错误发生的字符位置
  errorContext?: string;          // 错误位置前后的内容片段（±50 字符）
  contentLength?: number;         // 清理后内容的总长度
}

/**
 * 解析结果联合类型
 */
export type ParseResult<T> = ParseSuccess<T> | ParseError;

/**
 * 安全地解析菜谱 JSON
 *
 * 先清理内容，再尝试解析 JSON，如果失败则尝试自动修复，并捕获错误返回详细信息
 *
 * @param rawContent - LLM 返回的原始内容
 * @returns ParseResult<T> - 成功返回解析后的数据，失败返回错误信息
 *
 * @example
 * ```typescript
 * const result = safeParseRecipeJson<Recipe>(rawContent);
 * if (result.success) {
 *   console.log('解析成功:', result.data);
 * } else {
 *   console.error('解析失败:', result.error);
 *   console.error('原始内容:', result.rawContent);
 * }
 * ```
 */
export function safeParseRecipeJson<T>(rawContent: string): ParseResult<T> {
  // 清理内容
  const cleanedContent = cleanLLMJsonOutput(rawContent);

  // 检查清理后内容是否为空
  if (!cleanedContent) {
    return {
      success: false,
      error: '清理后的内容为空',
      rawContent,
      cleanedContent,
      contentLength: 0,
    };
  }

  // 尝试直接解析 JSON
  try {
    const data = JSON.parse(cleanedContent) as T;
    return {
      success: true,
      data,
    };
  } catch (firstError) {
    // 首次解析失败，尝试自动修复
    const errorMessage = firstError instanceof Error ? firstError.message : String(firstError);

    console.warn('JSON 首次解析失败，尝试自动修复:', errorMessage);

    const repairedContent = attemptJsonRepair(cleanedContent);

    if (repairedContent) {
      // 修复成功，尝试重新解析
      try {
        const data = JSON.parse(repairedContent) as T;
        console.warn('JSON 自动修复成功，已解析');
        return {
          success: true,
          data,
        };
      } catch (secondError) {
        // 修复后仍然失败
        const secondErrorMessage = secondError instanceof Error ? secondError.message : String(secondError);
        console.error('JSON 修复后仍然解析失败:', secondErrorMessage);
      }
    } else {
      console.warn('JSON 自动修复失败');
    }

    // 自动修复失败，返回详细错误信息
    // 提取错误位置信息（从错误消息中解析 "position XXX"）
    const positionMatch = errorMessage.match(/position (\d+)/);
    const errorPosition = positionMatch ? parseInt(positionMatch[1], 10) : undefined;

    // 提取错误位置的上下文（前后 ±50 字符）
    let errorContext: string | undefined;
    if (errorPosition !== undefined) {
      const contextStart = Math.max(0, errorPosition - 50);
      const contextEnd = Math.min(cleanedContent.length, errorPosition + 50);
      errorContext = cleanedContent.slice(contextStart, contextEnd);
    }

    return {
      success: false,
      error: `JSON 解析失败: ${errorMessage}`,
      rawContent,
      cleanedContent,
      errorPosition,
      errorContext,
      contentLength: cleanedContent.length,
    };
  }
}
