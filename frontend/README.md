# AIRecipe Frontend

> 基于 Next.js 14 的 AI 智能菜谱生成前端应用

## 项目简介

AIRecipe Frontend 是一个现代化的 Web 应用，通过调用后端 AI 服务实时生成结构化的中文菜谱。项目采用 **Feature-Based 架构**，使用 **Server-Sent Events (SSE)** 实现流式输出，为用户提供流畅的菜谱生成体验。

### 核心特性

- 🚀 **流式生成体验** - 通过 SSE 实时展示 AI 生成过程
- 🎯 **智能 JSON 清理** - 自动处理 LLM 输出的 `<think>` 标签和 markdown 格式
- 🎨 **精美菜谱展示** - 4 标签页展示（用料选材、烹饪步骤、进阶技巧、注意事项）
- 🔐 **API Key 认证** - 基于 Cookie 的安全认证机制
- 📤 **多种导出方式** - 支持复制 JSON、导出图片、打印
- 📱 **响应式设计** - 移动端友好的界面布局
- ♿ **无障碍访问** - 完整的 ARIA 标签和键盘导航支持

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.2.15 | React 框架，App Router |
| React | 18.3.1 | UI 组件库 |
| TypeScript | 5.9.3 | 类型安全 |
| Tailwind CSS | 3.4.18 | 原子式 CSS 框架 |
| TanStack React Query | 5.90.5 | 服务器状态管理与缓存 |
| React Hook Form | 7.65.0 | 表单状态管理 |
| Zod | 4.1.12 | 运行时类型验证 |
| Headless UI | 2.2.9 | 无样式可访问组件 |
| Lucide React | 0.546.0 | 图标库 |

## 快速开始

### 环境要求

- Node.js 18.17.0 或更高版本
- pnpm 8.0.0 或更高版本

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env` 文件：

```bash
NEXT_PUBLIC_API_BASE_URL=http://8.216.12.129:8089
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 生产构建

```bash
pnpm build
pnpm start
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页（API Key 验证）
│   └── globals.css        # 全局样式
│
├── features/              # 功能模块
│   └── recipe-generator/  # 菜谱生成模块
│       ├── components/    # 16+ 个专用组件
│       ├── hooks/         # 4 个自定义 Hook
│       ├── types.ts       # TypeScript 类型定义
│       └── schema.ts      # Zod 验证 schema
│
├── lib/                   # 工具库
│   ├── api/              # API 通信层
│   │   ├── client.ts     # HTTP 客户端封装
│   │   └── recipes.ts    # 菜谱 API 接口
│   └── utils/            # 实用工具
│       ├── json-cleaner.ts  # JSON 清理与修复
│       ├── cookie.ts        # Cookie 管理
│       └── history.ts       # 历史记录管理
│
├── components/            # 通用组件
│   └── ApiKeyInput.tsx   # API Key 输入组件
│
└── providers/             # React Context
    └── query-client-provider.tsx  # React Query 配置
```

## 核心功能模块

### 1. 菜谱生成流程

**用户输入** → **表单验证** → **SSE 流式请求** → **实时显示** → **JSON 清理** → **类型验证** → **结果展示**

### 2. 主要组件

| 组件 | 职责 |
|------|------|
| `RecipeGeneratorScreen` | 主编排器，管理整个生成流程 |
| `HeroInput` | 菜名输入 + 提供商选择 |
| `LoadingBanner` | SSE 流式内容实时显示 |
| `RecipeResult` | 菜谱结果展示（4 标签页） |
| `RecipeMeta` | 菜谱元数据头（难度、时间等） |
| `RecipeIngredients` | 食材详情（主料、辅料、调味料） |
| `RecipeSteps` | 烹饪步骤时间线 |
| `RecipeTips` | 进阶技巧卡片 |
| `RecipeNotes` | 注意事项展示 |
| `ExportModal` | 导出选项弹窗 |

### 3. 自定义 Hooks

| Hook | 功能 |
|------|------|
| `useGenerateRecipeStream` | SSE 流式菜谱生成 |
| `useRecipeProviders` | 获取 LLM 提供商列表 |
| `useRecipeHistory` | 本地历史记录管理 |

### 4. API 通信层

所有 HTTP 请求通过 `apiFetch` 函数统一管理：

- 自动注入 `X-API-Key` 头（从 Cookie 读取）
- 后端 snake_case ↔ 前端 camelCase 自动转换
- 统一错误处理

## 数据流架构

### 流式生成流程

```
用户输入菜名 → Zod 验证 → startStream()
    ↓
POST /api/v1/recipes/generate/stream
    ↓
后端 SSE 流响应（data: {...}\n\n）
    ↓
LoadingBanner 实时显示流内容
    ↓
[DONE] marker 标记流结束
    ↓
safeParseRecipeJson() 清理与修复
    ├─ 移除 <think> 标签
    ├─ 移除 markdown code blocks
    ├─ 移除控制字符
    └─ JSON.parse() 或 attemptJsonRepair()
    ↓
RecipeResultPreview 类型验证
    ├─ 验证通过 → RecipeResult 展示
    └─ 验证失败 → 显示原始 JSON
```

### React Query 缓存策略

- **Queries**: 失败重试 1 次，staleTime 5 分钟，gcTime 10 分钟
- **Mutations**: 不重试
- 提供商列表缓存 10 分钟

## 开发规范

### 代码风格

- 使用 **TypeScript strict mode**
- 组件命名：**PascalCase**
- 函数命名：**camelCase**
- 避免使用 `any` 类型
- 路径别名：`@/*` → `./src/*`

### 提交前检查

```bash
# 运行 Lint 检查
pnpm lint

# 运行测试
pnpm test
```

### 环境变量管理

- ✅ 仅使用一个 `.env` 文件
- ❌ 禁止创建 `.env.local`、`.env.development` 等
- 修改环境变量后需重启开发服务器

## 重要注意事项

### API 地址配置

- ✅ 生产环境：`NEXT_PUBLIC_API_BASE_URL=http://8.216.12.129:8089`
- ❌ 禁止使用 `localhost` 地址（项目部署在公网服务器）

### API Key 认证

- 用户首次访问时需手动输入 API Key
- API Key 存储在 Cookie 中（有效期 30 天）
- Cookie 名称：`airecipe_api_key`
- 用户可通过界面"更换密钥"按钮清除

### Redis 缓存（开发调试）

后端使用 Redis 缓存菜谱结果，缓存 key 基于菜名和 provider。

**测试同一菜名的流式输出时，需先清空 Redis：**

```bash
redis-cli FLUSHALL
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（Turbopack） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm test` | 运行单元测试 |
| `pnpm test:watch` | 测试监视模式 |

## 后续计划

- [ ] 本地历史列表展示
- [ ] 菜谱收藏功能
- [ ] 分享链接生成
- [ ] 打印样式优化
- [ ] 多语言支持
- [ ] PWA 支持

## 相关文档

- [前端设计文档](./docs/frontend_design.md)
- [菜谱展示页面设计](./docs/菜谱展示页面设计.md)
- [Claude Code 项目指引](./CLAUDE.md)
- [后端 API 文档](../backend/README.md)

## License

MIT

---

**最后更新：** 2025-01-24
