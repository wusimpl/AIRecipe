import { describe, it, expect } from '@jest/globals';
import { cleanLLMJsonOutput, safeParseRecipeJson } from '../json-cleaner';

describe('cleanLLMJsonOutput', () => {
  describe('基础功能测试', () => {
    it('应该移除 <think> 标签及其内容', () => {
      const input = '<think>这是思考过程</think>{"name": "红烧肉"}';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "红烧肉"}');
    });

    it('应该移除 markdown code blocks (```json```)', () => {
      const input = '```json\n{"name": "宫保鸡丁"}\n```';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "宫保鸡丁"}');
    });

    it('应该移除 markdown code blocks (```)', () => {
      const input = '```\n{"name": "麻婆豆腐"}\n```';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "麻婆豆腐"}');
    });

    it('应该清理首尾空白字符', () => {
      const input = '\n\n  {"name": "鱼香肉丝"}  \n\n';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "鱼香肉丝"}');
    });
  });

  describe('组合场景测试', () => {
    it('应该同时处理 <think> 和 markdown code blocks', () => {
      const input = `<think>需要考虑食材搭配</think>
\`\`\`json
{"name": "糖醋排骨", "ingredients": ["排骨", "糖", "醋"]}
\`\`\``;
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "糖醋排骨", "ingredients": ["排骨", "糖", "醋"]}');
    });

    it('应该处理复杂场景: <think> + markdown + 空白', () => {
      const input = `
      <think>
      1. 焯水去腥
      2. 炒糖色
      3. 炖煮
      </think>

      \`\`\`json
      {
        "name": "红烧排骨",
        "steps": ["焯水", "炒糖色", "炖煮"]
      }
      \`\`\`
      `;
      const result = cleanLLMJsonOutput(input);
      expect(result).toContain('"name": "红烧排骨"');
      expect(result).not.toContain('<think>');
      expect(result).not.toContain('```');
    });
  });

  describe('边界情况测试', () => {
    it('应该处理空 <think> 标签', () => {
      const input = '<think></think>{"name": "空心菜"}';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "空心菜"}');
    });

    it('应该处理多个 <think> 标签', () => {
      const input = '<think>思考1</think>{"name": "菜名"}<think>思考2</think>';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "菜名"}');
    });

    it('应该处理 <think> 标签包含换行', () => {
      const input = `<think>
第一行思考
第二行思考
第三行思考
</think>
{"name": "多行菜谱"}`;
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "多行菜谱"}');
    });

    it('应该处理纯净 JSON (无需清理)', () => {
      const input = '{"name": "纯净菜谱", "time": "30分钟"}';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "纯净菜谱", "time": "30分钟"}');
    });

    it('应该处理 markdown 无换行格式', () => {
      const input = '```json{"name": "紧凑格式"}```';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "紧凑格式"}');
    });

    it('应该处理大小写不敏感的 <THINK> 标签', () => {
      const input = '<THINK>大写思考</THINK>{"name": "大写测试"}';
      const result = cleanLLMJsonOutput(input);
      expect(result).toBe('{"name": "大写测试"}');
    });
  });

  describe('真实场景测试', () => {
    it('应该处理 think 模型的典型输出', () => {
      const input = `<think>
红烧排骨需要考虑以下几点:
1. 排骨要焯水去腥
2. 糖色要炒好
3. 调料要平衡
4. 火候要掌握好
</think>

\`\`\`json
{
  "菜名": "红烧排骨",
  "食材": [
    {"名称": "排骨", "用量": "500g"},
    {"名称": "冰糖", "用量": "30g"}
  ],
  "步骤": [
    "排骨冷水下锅焯水",
    "炒糖色",
    "加入调料炖煮40分钟"
  ]
}
\`\`\``;

      const result = cleanLLMJsonOutput(input);
      expect(result).not.toContain('<think>');
      expect(result).not.toContain('```');
      expect(JSON.parse(result)).toHaveProperty('菜名', '红烧排骨');
    });
  });
});

describe('safeParseRecipeJson', () => {
  interface TestRecipe {
    name: string;
    ingredients?: string[];
  }

  describe('成功场景', () => {
    it('应该成功解析纯净 JSON', () => {
      const input = '{"name": "测试菜谱"}';
      const result = safeParseRecipeJson<TestRecipe>(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('测试菜谱');
      }
    });

    it('应该成功解析包含 <think> 的 JSON', () => {
      const input = '<think>思考...</think>{"name": "红烧肉"}';
      const result = safeParseRecipeJson<TestRecipe>(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('红烧肉');
      }
    });

    it('应该成功解析 markdown code blocks 包裹的 JSON', () => {
      const input = '```json\n{"name": "宫保鸡丁"}\n```';
      const result = safeParseRecipeJson<TestRecipe>(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('宫保鸡丁');
      }
    });

    it('应该成功解析复杂场景', () => {
      const input = `<think>复杂思考</think>
\`\`\`json
{
  "name": "复杂菜谱",
  "ingredients": ["食材1", "食材2"]
}
\`\`\``;
      const result = safeParseRecipeJson<TestRecipe>(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('复杂菜谱');
        expect(result.data.ingredients).toHaveLength(2);
      }
    });
  });

  describe('错误处理测试', () => {
    it('应该处理清理后内容为空的情况', () => {
      const input = '<think>只有思考没有内容</think>';
      const result = safeParseRecipeJson<TestRecipe>(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('清理后的内容为空');
        expect(result.rawContent).toBe(input);
      }
    });

    it('应该处理无效 JSON 格式', () => {
      const input = '{"name": "无效JSON"';  // 缺少闭合括号
      const result = safeParseRecipeJson<TestRecipe>(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('JSON 解析失败');
        expect(result.rawContent).toBe(input);
        expect(result.cleanedContent).toBeDefined();
      }
    });

    it('应该处理清理后仍然无效的 JSON', () => {
      const input = '<think>思考</think>```json\n{invalid json}\n```';
      const result = safeParseRecipeJson<TestRecipe>(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('JSON 解析失败');
        expect(result.rawContent).toBe(input);
      }
    });

    it('应该处理完全空白的输入', () => {
      const input = '   \n\n  ';
      const result = safeParseRecipeJson<TestRecipe>(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('清理后的内容为空');
      }
    });
  });

  describe('类型安全测试', () => {
    it('应该保持泛型类型推断', () => {
      interface ComplexRecipe {
        菜名: string;
        食材: Array<{ 名称: string; 用量: string }>;
        步骤: string[];
      }

      const input = `{
        "菜名": "复杂菜谱",
        "食材": [{"名称": "食材1", "用量": "100g"}],
        "步骤": ["步骤1"]
      }`;

      const result = safeParseRecipeJson<ComplexRecipe>(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.菜名).toBe('复杂菜谱');
        expect(result.data.食材).toHaveLength(1);
        expect(result.data.步骤).toHaveLength(1);
      }
    });
  });
});
