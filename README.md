# AIRecipe

> 基于 AI 的智能菜谱生成系统 - 通过大语言模型生成详细、结构化的中文菜谱

## 项目简介

AIRecipe 是一个全栈 AI 菜谱生成应用，通过调用多个大语言模型（LLM）提供商，根据用户输入的菜名实时生成详细的结构化中文菜谱。项目采用前后端分离架构，支持流式输出、智能缓存、多提供商路由等特性。

### 核心特性

- 🤖 **多 LLM 支持** - 集成 OpenAI、Groq、Ark、BigModel 等多个提供商
- 🔄 **实时流式输出** - 通过 Server-Sent Events (SSE) 提供即时反馈
- 💾 **智能缓存** - Redis 持久化缓存避免重复调用
- ⚖️ **灵活路由** - 支持默认、加权轮询、指定提供商等策略
- 🔐 **安全认证** - API Key 认证与速率限制
- 🎨 **精美界面** - React + Next.js 响应式菜谱展示
- 📤 **多种导出** - 支持 JSON 复制、图片导出、打印

### 技术栈

**后端技术：**
- FastAPI 0.110.0 + Uvicorn 0.29.0
- Python 3.11+ (Conda 环境)
- Redis 5.0.3 缓存系统
- httpx 异步 HTTP 客户端
- Pydantic 数据验证

**前端技术：**
- Next.js 14.2.15 (App Router + Turbopack)
- React 18.3.1 + TypeScript 5.9.3
- TanStack React Query 5.90.5
- Tailwind CSS 3.4.18
- Zod 运行时验证

## 项目结构

```
AIRecipe/
├── backend/              # FastAPI 后端服务
│   ├── app/              # 应用核心代码
│   │   ├── main.py       # 应用入口
│   │   ├── core/         # 配置、缓存、异常
│   │   ├── routers/      # API 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── llm/          # LLM 提供商系统
│   │   ├── middleware/   # 中间件
│   │   └── schemas/      # 数据模型
│   ├── config/           # 配置文件
│   ├── prompt/           # Prompt 模板
│   └── schemas/          # JSON Schema
│
├── frontend/             # Next.js 前端应用
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── features/     # 功能模块
│   │   │   └── recipe-generator/  # 菜谱生成功能
│   │   │       ├── components/    # 专用组件 (11个)
│   │   │       ├── hooks/         # 自定义 Hook (3个)
│   │   │       ├── types.ts       # TypeScript 类型
│   │   │       └── schema.ts      # Zod 验证
│   │   ├── lib/          # 工具库
│   │   │   ├── api/      # API 客户端
│   │   │   └── utils/    # 实用工具
│   │   └── providers/    # React Context
│   └── package.json
│
├── docs/                 # 项目文档
├── start-dev.sh          # 开发启动脚本
└── README.md             # 项目说明
```

## 快速开始

### 环境要求

**后端：**
- Python 3.11+
- Redis（推荐）或内存缓存
- Conda（推荐）

**前端：**
- Node.js 18.17.0+
- pnpm 8.0.0+

### 安装与运行

#### 1. 启动后端

```bash
# 进入后端目录
cd backend

# 创建 Conda 环境
conda create -n airecipe python=3.11
conda activate airecipe

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 API Keys 等

# 配置 LLM 提供商
cp config/llm_providers.example.json config/llm_providers.json
# 编辑配置文件，添加你的 API Keys

# 启动服务（自动处理端口占用）
./start.sh
```

后端将在 `http://localhost:8089` 运行，API 文档可访问 `http://localhost:8089/docs`

#### 2. 启动前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置后端 API 地址

# 启动开发服务器
pnpm dev
```

前端将在 `http://localhost:3000` 运行

#### 3. 一键启动（推荐）

在项目根目录使用启动脚本：

```bash
./start-dev.sh
```

将自动启动后端（端口 8089）和前端（端口 8090）服务。

### 首次使用

1. 访问前端地址 `http://localhost:3000`
2. 在界面输入 API Key（配置在后端 `.env` 的 `API_KEYS` 中）
3. 输入菜名，点击生成
4. 实时查看菜谱生成过程和结果

## 详细文档

### 后端文档

详细的后端架构、API 端点、配置说明等，请查看：

**📖 [后端 README](./backend/README.md)**

主要内容包括：
- API 端点说明（生成、流式、缓存、提供商列表）
- LLM 提供商配置
- 缓存系统说明
- 开发指南与测试

### 前端文档

详细的前端架构、组件说明、开发规范等，请查看：

**📖 [前端 README](./frontend/README.md)**

主要内容包括：
- 功能模块架构
- 核心组件说明
- SSE 流式输出
- API 通信层
- 开发规范

## 核心功能

### 1. 流式生成

通过 Server-Sent Events (SSE) 实时推送生成内容：
- 前端显示实时生成进度
- 支持取消生成
- 自动 JSON 清理与验证

### 2. 智能缓存

基于菜名和提供商的 SHA256 缓存策略：
- 相同菜名相同提供商直接返回缓存
- Redis 持久化存储
- 支持缓存过期时间配置

### 3. 多提供商路由

支持灵活的 LLM 提供商选择：
- **默认模式**：使用配置的默认提供商
- **加权轮询**：根据权重分配请求
- **指定提供商**：用户手动选择模型

### 4. 菜谱展示

前端提供 4 标签页精美展示：
- 🥬 **用料选材** - 主料、辅料、调味料、选材指南
- 👨‍🍳 **烹饪步骤** - 时间线式步骤展示
- 💡 **进阶技巧** - 专业烹饪技巧卡片
- ⚠️ **注意事项** - 存储、禁忌等信息

## 开发指南

### 代码规范

**后端：**
- 遵循 PEP 8 规范
- 使用类型注解
- 使用 ruff、mypy 进行检查
- 日志全部使用中文

**前端：**
- TypeScript strict 模式
- ESLint + Prettier
- 组件使用 PascalCase
- 函数使用 camelCase
- **修改代码后必须运行 `pnpm lint` 检查**

### 提交规范

遵循 Conventional Commits 格式：
```
<类型>: <简短描述>

<详细说明>（可选）
```

类型包括：`feat`, `fix`, `refactor`, `docs`, `test`, `chore`

**注意：** 仅在用户明确要求时才执行 git 提交操作。

## 性能优化

- ⚡ **Redis 缓存** - 避免重复 LLM 调用
- 🚀 **流式输出** - 减少用户等待时间
- 📦 **React Query** - 智能数据缓存与重试
- 🎯 **代码分割** - Next.js 自动按路由拆分

## 安全考虑

- 🔐 **API Key 认证** - 白名单验证机制
- 🛡️ **速率限制** - 防止滥用（默认 60次/60秒）
- 🌐 **CORS 配置** - 可配置跨域策略
- ✅ **数据验证** - Pydantic + Zod 双层验证

## 贡献与反馈

欢迎提交 Issue 和 Pull Request！

在提交代码前请确保：
- 运行所有测试通过
- 代码符合规范（后端 ruff/mypy，前端 ESLint）
- 更新相关文档

## 许可证

待定

---

**最后更新：** 2025-10-24
**版本：** 0.2.0
