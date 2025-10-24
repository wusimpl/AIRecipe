# AIRecipe Backend

> 基于 FastAPI 的智能菜谱生成服务，通过大语言模型生成结构化中文菜谱 JSON

## 项目简介

AIRecipe Backend 是一个高性能的 AI 菜谱生成后端服务，支持调用多个兼容 OpenAI API 协议的大语言模型提供商，根据用户输入的菜名生成详细、结构化的中文菜谱数据。

### 核心特性

- **多 LLM 提供商支持**：支持配置多个 OpenAI 兼容的 API 提供商（OpenAI、Groq、Ark、BigModel 等）
- **智能路由策略**：支持默认提供商、加权轮询等多种路由策略
- **流式输出**：通过 Server-Sent Events (SSE) 提供实时流式生成体验
- **高性能缓存**：支持 Redis 和内存缓存，避免重复调用 LLM
- **API 认证**：基于 X-API-Key 的请求认证机制
- **请求追踪**：自动为每个请求生成唯一 ID，便于日志追踪
- **结构化日志**：完整记录请求/响应、缓存操作、LLM 调用等关键事件
- **Schema 验证**：严格的 JSON Schema 验证确保输出数据质量

### 技术栈

- **Web 框架**：FastAPI 0.110.0
- **异步服务器**：Uvicorn 0.29.0
- **HTTP 客户端**：httpx 0.27.0（异步）
- **数据验证**：Pydantic 2.10.4 + jsonschema 4.21.1
- **缓存系统**：Redis 5.0.3（支持内存缓存备选）
- **配置管理**：python-dotenv + PyYAML
- **开发工具**：pytest、mypy、ruff、black

## 项目架构

### 三层架构设计

```
┌─────────────────────────────────────────────────────┐
│              路由层 (routers/)                       │
│  - API 端点定义                                      │
│  - 请求/响应模型                                     │
│  - API Key 验证                                      │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              服务层 (services/)                      │
│  - 业务逻辑编排                                      │
│  - Prompt 组装                                       │
│  - 缓存管理                                          │
│  - 结果验证                                          │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│            Provider 层 (llm/)                        │
│  - LLM 提供商抽象                                    │
│  - 多提供商实现                                      │
│  - 智能路由选择                                      │
└─────────────────────────────────────────────────────┘
```

### 目录结构

```
backend/
├── app/
│   ├── main.py                    # 应用入口，FastAPI 实例创建
│   ├── core/                      # 核心功能模块
│   │   ├── config.py              # 配置管理（Settings、LLM Provider 配置加载）
│   │   ├── cache.py               # 缓存抽象（Redis/内存）
│   │   └── errors.py              # 自定义异常与错误处理
│   ├── routers/                   # API 路由
│   │   └── recipes.py             # 菜谱生成相关端点
│   ├── services/                  # 业务逻辑层
│   │   └── recipe_service.py      # 核心菜谱生成服务
│   ├── llm/                       # LLM 提供商系统
│   │   ├── base.py                # Provider 抽象接口
│   │   ├── registry.py            # Provider 注册表与路由
│   │   ├── mock.py                # Mock Provider（测试用）
│   │   └── providers/
│   │       ├── base.py            # Provider 基类
│   │       └── openai_like.py     # OpenAI 兼容实现
│   ├── middleware/                # 中间件
│   │   ├── request_id.py          # 请求 ID 生成
│   │   └── structured_logging.py  # 结构化日志
│   ├── schemas/                   # 数据模型
│   │   └── recipe.py              # Pydantic 模型定义
│   └── prompts/                   # Prompt 管理
│       └── loader.py              # Prompt 加载器
├── config/                        # 配置文件
│   ├── llm_providers.json         # LLM 提供商配置
│   └── llm_providers.example.json # 配置示例
├── prompt/
│   └── system_recipe.txt          # System Prompt
├── schemas/
│   └── recipe_output.json         # 菜谱输出 JSON Schema
├── docs/                          # 文档
│   └── backend_design.md          # 架构设计文档
├── scripts/                       # 工具脚本
├── requirements.txt               # Python 依赖
├── start.sh                       # 启动脚本
├── .env                           # 环境变量（需自行创建）
└── CLAUDE.md                      # AI 助手指引文档
```

## 核心组件说明

### 1. Provider 系统

**抽象层**：`RecipeLLMProvider` 定义了 LLM 提供商的标准接口

**实现类**：
- `OpenAILikeLLMProvider`：支持所有 OpenAI 兼容 API 的通用实现
- `MockLLMProvider`：用于测试的模拟提供商

**注册表**：`ProviderRegistry` 负责：
- 从配置文件加载提供商
- 管理提供商生命周期
- 实现路由策略（默认/加权轮询）

### 2. 配置系统

**环境变量**（`.env` 文件）：
- 应用配置（日志级别、CORS 设置）
- API Keys 白名单
- 缓存配置（类型、连接 URL）
- 文件路径配置

**LLM 提供商配置**（`config/llm_providers.json`）：
- 支持环境变量替换（`${ENV_VAR}` 格式）
- 提供商详细配置（API 地址、模型、超时、重试策略）
- 路由策略配置

### 3. 缓存系统

**抽象接口**：`CacheBackend` 定义统一的缓存操作

**实现**：
- `RedisCacheBackend`：生产环境推荐，支持持久化
- `InMemoryCacheBackend`：开发/测试用，内存缓存

**缓存策略**：
- 缓存键：`recipe:{sha256(dish_name:provider_name)}`
- 基于菜名和提供商生成唯一标识
- 支持配置缓存过期时间（TTL）

### 4. RecipeService

核心业务服务，负责：
- 加载 System Prompt 和 JSON Schema
- 构建完整的 LLM 请求消息
- 调用 Provider 生成菜谱
- 验证输出符合 Schema
- 管理缓存读写

**支持两种生成模式**：
- 同步生成：直接返回完整菜谱（适合缓存命中场景）
- 流式生成：通过 SSE 实时推送生成内容

### 5. 中间件链

执行顺序（从外到内）：
1. **CORS 中间件**：处理跨域请求
2. **结构化日志中间件**：记录请求/响应详情
3. **请求 ID 中间件**：为每个请求分配唯一 UUID

## API 端点

### 主要接口

| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| GET | `/` | 健康检查 | 否 |
| POST | `/api/v1/recipes/generate` | 同步生成菜谱 | 是 |
| POST | `/api/v1/recipes/generate/stream` | 流式生成菜谱（SSE） | 是 |
| POST | `/api/v1/recipes/cache` | 前端回传菜谱缓存 | 是 |
| GET | `/api/v1/recipes/providers` | 获取可用提供商列表 | 是 |

### 认证方式

所有需要认证的接口需在 Header 中提供：
```
X-API-Key: your-api-key
```

## 快速开始

### 环境要求

- Python 3.11+
- Redis（推荐）或使用内存缓存
- Conda（推荐）或 venv

### 安装步骤

1. **创建 Conda 环境**：
```bash
conda create -n airecipe python=3.11
conda activate airecipe
```

2. **安装依赖**：
```bash
pip install -r requirements.txt
```

3. **配置环境变量**：
```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的环境变量
```

4. **配置 LLM 提供商**：
```bash
cp config/llm_providers.example.json config/llm_providers.json
# 编辑 config/llm_providers.json，添加你的 API Keys
```

5. **启动服务**：
```bash
# 使用启动脚本（推荐，自动处理端口占用）
./start.sh

# 或手动启动
uvicorn app.main:app --host 0.0.0.0 --port 8089 --reload
```

6. **访问 API 文档**：
- Swagger UI：http://localhost:8089/docs
- ReDoc：http://localhost:8089/redoc

## 配置说明

### 环境变量

关键配置项：

```bash
# 应用配置
APP_ENV=development
LOG_LEVEL=INFO
API_KEYS=key1,key2,key3  # 逗号分隔的 API Keys

# LLM 配置
LLM_CONFIG_PATH=config/llm_providers.json
SYSTEM_PROMPT_PATH=prompt/system_recipe.txt
RECIPE_SCHEMA_PATH=schemas/recipe_output.json

# 缓存配置
CACHE_BACKEND=redis  # redis 或 memory
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_SECONDS=86400  # 缓存过期时间（秒）

# CORS 配置
CORS_ALLOW_ORIGINS=*
CORS_ALLOW_METHODS=*
CORS_ALLOW_HEADERS=*
```

### LLM Provider 配置

示例配置：

```json
{
  "default_provider": "primary-openai",
  "routing": {
    "strategy": "default"
  },
  "providers": [
    {
      "name": "primary-openai",
      "api_base": "https://api.openai.com/v1",
      "model": "gpt-4o",
      "api_key": "${OPENAI_API_KEY}",
      "timeout": 30,
      "max_retries": 2,
      "backoff_factor": 0.5,
      "weight": 1.0,
      "switch": true,
      "description": "主要 OpenAI 提供商"
    }
  ]
}
```

**配置字段说明**：
- `default_provider`：默认使用的提供商名称
- `routing.strategy`：路由策略（`default` 或 `weighted`）
- `api_base`：API 基础 URL
- `model`：模型名称
- `api_key`：API 密钥（支持 `${ENV_VAR}` 环境变量替换）
- `timeout`：请求超时时间（秒）
- `max_retries`：最大重试次数
- `backoff_factor`：重试退避因子
- `weight`：权重（用于加权路由）
- `switch`：是否启用该提供商

### Provider 选择

- **低延迟优先**：使用 Groq 等快速提供商作为默认
- **负载均衡**：通过加权路由分散请求
- **故障恢复**：配置超时和重试策略

### 流式输出

- 减少用户等待时间
- 提升用户体验
- 适合长文本生成场景

## 安全考虑

### API Key 管理

- 在 `.env` 文件中配置白名单
- 不在日志中打印完整 API Key
- 使用环境变量管理敏感信息

### CORS 配置

- 开发环境：允许所有来源
- 生产环境：限制为具体域名

### 数据验证

- 请求参数使用 Pydantic 验证
- 输出结果使用 JSON Schema 验证
- 防止恶意输入和无效输出

## 常见问题

### 1. 如何添加新的 LLM 提供商？

编辑 `config/llm_providers.json`，在 `providers` 数组中添加新配置，确保 API 兼容 OpenAI 格式。

### 2. 缓存不生效怎么办？

检查：
- Redis 服务是否运行
- `REDIS_URL` 配置是否正确
- 查看日志中的缓存操作记录

### 3. JSON Schema 验证失败？

查看：
- LLM 输出是否符合 `schemas/recipe_output.json` 定义
- System Prompt 是否明确指定输出格式
- 是否需要优化 Prompt


## 许可证

待定

