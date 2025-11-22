# AIRecipe

> 基于 AI 的智能菜谱生成系统 - 通过大语言模型生成详细、结构化的中文菜谱

## 演示

![AIRecipe Demo](demo.gif)

## 项目简介

AIRecipe 是一个全栈 AI 菜谱生成应用，通过调用多个大语言模型（LLM）提供商，根据用户输入的菜名实时生成详细的结构化中文菜谱。项目采用前后端分离架构，支持流式输出、智能缓存、多提供商路由等特性。

### 核心特性

- **多 LLM 支持** - 可配置多个 OpenAI Compatible 模型
- **实时流式输出** - 通过 SSE 提供即时反馈
- **智能缓存** - Redis 持久化缓存避免重复调用
- **精美界面** - React + Next.js 响应式菜谱展示
- **导出** - 图片导出菜谱

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
- Redis
- Conda（optional, 推荐）

**前端：**
- Node.js 18.17.0+
- pnpm 8.0.0+

### 安装与运行

#### 1. 启动后端

```bash
# 进入后端目录
cd backend

# 创建 Conda 环境(确保你已经安装conda，或者你也可以使用其他python虚拟环境）
conda create -n airecipe python=3.11
conda activate airecipe

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 API Keys 和 redis URL

# 配置 LLM 提供商
cp config/llm_providers.example.json config/llm_providers.json

# 启动服务（自动处理端口占用）
./start.sh
```

后端将在 `http://localhost:8089` 运行

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

### 首次使用

1. 访问前端地址 `http://localhost:8090`
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

