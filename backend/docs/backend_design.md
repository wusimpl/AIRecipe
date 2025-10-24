# AIRecipe 后端设计文档

## 目标与范围
- 提供统一的 HTTP API，调用兼容 OpenAI API 协议的各家大模型，根据本地 system prompt 生成结构化菜谱 JSON。
- 支持按配置选择模型、控制参数、校验模型输出，并记录请求元信息，方便追踪和扩展。
- 当前专注于同步生成流程；异步批量、用户偏好等功能在后续迭代中扩展。

## 技术栈
- **语言与框架**：Python 3.11、FastAPI（REST 接口）、Uvicorn（运行时）。
- **数据结构与校验**：Pydantic v2 + fastjsonschema（运行时 JSON Schema 校验）。
- **模型请求**：httpx（异步 HTTP 客户端）、支持多 provider。
- **配置与日志**：pydantic-settings、结构化日志（loguru 或 stdlib logging JSON 格式）。
- **缓存（可选）**：Redis 存储 prompt、响应缓存或速率限制计数。
- **依赖管理**：Conda + pip。

## 架构概览
```
HTTP API (FastAPI)
  └─ 请求中间件：鉴权、速率限制、请求 ID
      └─ 服务层 RecipeService：装配 prompt，调用模型，校验返回
          └─ 模型路由器：依据配置/请求选择 Provider
              └─ Provider 适配器：统一 ChatCompletion 接口
  └─ 基础设施：配置、日志、缓存、持久化（预留）
```

### 模块划分
- `app/main.py`：应用入口、路由注册、生命周期管理（加载配置、schema 缓存）。
- `app/routers/recipes.py`：REST 路由、入参/出参模型、API Key 校验。
- `app/services/recipe_service.py`：核心业务流程（prompt 读取、消息组装、调用模型、输出校验、记录日志）。
- `app/llm/registry.py`：读取配置，返回指定模型的 Provider 实例。
- `app/llm/providers/base.py`：Provider 抽象；`openai_like.py` 实现通用兼容逻辑。
- `app/prompts/loader.py`：加载 system prompt，支持文件修改时间缓存。
- `app/schemas/recipe.py`：Pydantic 模型与 JSON Schema 校验器。
- `app/core/config.py`：全局配置（API Key 列表、默认模型、重试策略等）。
- `app/core/logging.py`：初始化结构化日志、集成请求 ID。
- `app/storage/*`（预留）：历史记录、错误持久化；初期可写入文件或 memory。

## 配置与文件布局
- `config/llm_providers.yaml`：描述 provider 列表、base URL、模型名、调用参数、密钥环境变量名。
- `prompt/system_recipe.txt`：菜谱生成的 system prompt 文档，可选加版本号。
- `schemas/recipe_output.json`：目标 JSON Schema，服务启动时加载为校验器。
- `.env`：API 服务配置，例如 `API_KEYS=...`、各 provider 密钥。
- `scripts/`：实用脚本（如 prompt 校验、配置检查）。

## API 设计
- `POST /api/v1/recipes/generate`
  - **请求体**
    ```json
    {
      "dish_name": "红烧茄子",
      "tags": ["家常菜"],
      "model": "qwen-plus",
      "options": {
        "temperature": 0.7
      }
    }
    ```
  - **行为**
    1. 校验 API Key、速率限制。
    2. 读取 system prompt，组装 messages。
    3. 选择 provider 并调用。
    4. 校验模型响应（JSON + Schema）。
    5. 返回结构化菜谱，记录日志与可选存档。
  - **响应体**：合法菜谱 JSON；失败时返回错误码与描述。
- `GET /api/v1/models`: 返回配置中可用模型及默认参数。
- 预留接口：`GET /api/v1/recipes/{id}`（查询历史）、`POST /api/v1/recipes/validate`（仅校验外部 JSON）。

## 流程细节
1. 请求进入，API Key 中间件校验合法性；必要时进行速率限制。
2. FastAPI 路由层解析请求体，转换为 `RecipeRequest` 领域对象。
3. `RecipeService` 调用 prompt loader 读取 system prompt（优先缓存，若文件变更则刷新）。
4. 构建 ChatCompletion `messages`：`system` + 用户输入 + 其他上下文（后续扩展）；
   需要确保模型提示中强调必须返回标准 JSON。
5. 从 `ModelRegistry` 选择 provider：若请求指定模型则按名称匹配，否则使用默认、权重或轮询策略。
6. 通过 provider 适配器调用外部模型接口，处理超时、限流、网络错误；按策略重试。
7. 响应到达后依次执行 `json.loads` 与 Schema 校验；失败则抛出自定义异常。
8. 成功结果写入日志，必要时存储到 Redis/数据库并连同版本信息返回。
9. 中间件写入请求耗时、模型信息到结构化日志与监控。

## 错误处理与重试
- 网络异常、HTTP 429、5xx：指数退避重试（默认 2~3 次），每次记录 warning。
- 模型响应不可解析或 Schema 不符：记录原始内容片段，返回 502；可尝试备选模型作为降级。
- prompt 缺失或加载失败：启动阶段提前校验，若运行中失败立即告警并返回 500。
- 自定义异常映射至 HTTP 状态码，统一错误响应结构。

## 安全与鉴权
- Header 携带 `x-api-key` 或 Bearer Token；服务端维护白名单。
- 速率限制（SlowAPI/Redis 计数器）防止滥用。
- 日志脱敏：掩码 API Key、模型密钥；用户输入与模型输出可按需裁剪。
- HTTPS 由上层入口（Nginx/LB）处理；服务内部只接受来自负载均衡的流量。

## 监控与运维
- `/healthz`：返回应用、依赖（Redis/数据库）的健康状态。
- Prometheus 指标：请求总数、耗时、模型调用失败率、重试次数。
- 结构化日志输出 JSON，便于集中采集；必要时接入 OpenTelemetry trace。
- 环境配置通过 `.env` 或密钥管理服务注入，容器镜像只包含模板。

## 测试策略
- **单元测试**
  - prompt loader、Schema 校验器。
  - 模型 provider（使用 httpx `MockTransport`）。
  - Service 流程（依赖注入 mock provider）。
- **集成测试**
  - FastAPI `TestClient` 测试 `/recipes/generate`，注入假 provider，验证响应 JSON。
  - 鉴权 & 错误路径（非法 API Key、Schema 失败等）。
- **合同测试**
  - 新增 provider 前运行 schema 校验脚本，确保配置项完整。
  - JSON Schema 版本号与响应字段保持同步。

## 部署建议
- 打包 Docker 镜像（基础镜像 `python:3.11-slim`），多阶段构建减少体积。
- 运行命令：`uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2`。
- CI/CD：静态检查（ruff、mypy 可选）、测试、生成镜像并推送。
- 配置管理：使用环境变量或 Secret Manager；密钥不随代码发布。

## 规划路线图
1. **迭代 1**：搭建基础 FastAPI 服务、加载 prompt、调用单一模型、Schema 校验。
2. **迭代 2**：引入多个模型配置、模型路由策略、Redis 缓存、速率限制。
3. **迭代 3**：持久化请求记录、提供历史查询接口、细化监控指标。
4. **迭代 4**：支持异步生成、批量任务、用户偏好定制。

## 下一步建议
1. 初始化项目结构与依赖管理（Conda + pip），搭建目录骨架。
2. 编写 `schemas/recipe_output.json` 与对应 Pydantic 模型。
3. 实现基础 `/api/v1/recipes/generate` 路由，使用 mock provider 跑通端到端流程。
