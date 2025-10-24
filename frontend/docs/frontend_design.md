# 前端设计文档

## 1. 背景与目标

- 为 AIRecipe 提供可视化的配方生成入口，降低用户调用后端 API 的门槛。
- 支撑阶段 3 的可观测性与多模型策略展示，保证与后端能力演进同步。
- 兼顾中英文用户，提供一致的体验与完整的错误反馈。

## 2. 技术栈选择

| 维度 | 方案 | 说明 |
| --- | --- | --- |
| 框架 | **Next.js 14 + React 18 + TypeScript** | 提供 SSR/SSG 能力，可在后续扩展 SEO、国际化；与 Vercel/自建容器部署兼容性好。 |
| 构建 | Turbopack(Vite 备选) | Next.js 默认支持；若后续需要更细粒度控制，可迁移到 Vite。 |
| 样式 | Tailwind CSS + Headless UI | 快速落地响应式布局；Headless UI 提供无样式组件，方便自定义主题。 |
| 表单 | React Hook Form | 轻量、易于与 TypeScript、Zod schema 集成。 |
| 校验 | Zod | 复用后端 Pydantic schema 结构，降低重复定义成本。 |
| 状态 | React Query + React Context | React Query 处理 API 请求、缓存与重试；Context 承载全局配置（当前语言、默认偏好等）。 |
| 测试 | Vitest + Testing Library + Playwright | 覆盖单元/组件/E2E；Playwright 与后端联调简便。 |
| 质量保障 | ESLint + Prettier + Husky + lint-staged | 与后端 Ruff/Black 流程对齐，保证提交前质量。 |

## 3. 目录结构（`frontend/` 规划）

```
frontend/
  package.json
  next.config.js
  tsconfig.json
  public/
  src/
    pages/           # Next.js 路由（App Router 可选）
    app/             # 若启用 App Router，统一入口
    components/      # 通用组件
    features/
      recipe-generator/
        components/
        hooks/
        services/
    layouts/
    lib/
      api/
      i18n/
      config/
    styles/
    store/
    tests/
      e2e/
      fixtures/
  docs/
    frontend_design.md
```

> 若采用 Next.js App Router，可将 `pages/` 替换为 `app/`，并在 `features/` 中组织 server/client component。

## 4. 用户旅程与界面状态

1. **初始态（首页）**：
   - 居中呈现标题“AI Recipe”与一句简短副标题，背景保持简洁留白。
   - 单一输入框收集菜名，支持按 Enter 或点击“生成菜谱”按钮提交。
   - 页脚简要展示使用说明（示例：输入任意菜名，返回完整菜谱）。
2. **生成中状态**：
   - 输入框禁用，按钮切换为加载动画（Skeleton 按钮或旋转图标）。
   - 在结果区域展示“菜谱生成中，请稍候…”提示，以及与菜名呼应的小段文案。
3. **结果态**：
   - 根据 `recipe` JSON 映射到固定区域：顶部信息、标签、简介、时间、食材、步骤、技巧与附加说明。
   - 保持卡片式布局，每个字段使用清晰标题与分隔线，便于扫读。
   - 提供“复制 JSON”和“重新生成”按钮；`request_id`、`provider` 放置在结果页角落供调试。
4. **后续扩展**：
   - 历史记录与健康状态页仍保留规划，但不在当前迭代实现。界面设计保持可插拔，未来可在导航栏加入入口。

## 5. 组件与状态设计

- **HeroInput**：负责首页居中的菜名输入框与提交按钮，包含错误提示与 Enter 快捷提交。
- **LoadingBanner**：以非侵入式提示呈现生成状态，可复用为 ResultCard 的 Skeleton。
- **RecipeResult**：根据后端 JSON schema 渲染整份菜谱；内部拆分 `MetaSection`（菜名、作者、时间）、`TagsSection`、`IngredientSection`、`StepsSection`（按“步骤顺序数组”编号列出）、`TipsSection` 等。
- **CopyActions**：封装复制 JSON、重新生成按钮逻辑，支持响应式布局。
- **HistoryList**（预留）：保留接口定义，当前版本隐藏。
- **GlobalContext**：存储当前语言、默认 servings 与最近使用的本地偏好。
- **React Query**：
  - `useGenerateRecipeMutation`: 调用 `POST /api/v1/recipes/generate`，封装重试、超时处理。
  - `useHealthQuery`: 轮询 `/healthz`，用于状态页和导航条状态提示。
  - `usePreferenceQuery`: 预留后端用户偏好接口。

## 6. API 对接约定

- 所有请求通过 `fetch`/`axios` 封装的 `apiClient` 发送，统一在 `lib/api/client.ts` 管理。
- 默认从环境变量 `NEXT_PUBLIC_API_BASE_URL` 注入后端地址，方便在不同环境切换。
- 返回结构遵循 `backend/schemas/recipe_output.json`，前端通过映射表将中文字段名转成组件 props，保证展示顺序与 JSON 一致。
- 对错误码划分：
  - 4xx：表单校验问题，展示具体字段错误。
  - 5xx：提供重试按钮；若后端返回降级策略，展示提示条。
- 在 React Query 拦截器中记录日志（DevTools）、结合 Sentry/LogRocket 上报。

## 7. 表单与验证流程

1. 用户输入菜名后提交（Enter 或点击按钮）。
2. 使用 Zod schema 校验菜名是否为空、长度是否符合要求。
3. 校验通过后调用后端接口；期间禁用输入与按钮。
4. 接口返回成功：
   - 更新 RecipeResult 区域，与 JSON 字段逐一对应。
   - 将请求/响应写入本地历史（localStorage），待后续与后端持久化对接。
5. 接口失败：
   - 根据错误类型展示具体文案。
   - 若超时，提供“稍后再试”提示。

## 8. 国际化与无障碍

- 使用 `next-i18next` 管理多语言文案（默认 `zh-CN` 和 `en-US`）。
- 所有表单控件提供 `aria-label`、`aria-describedby`。
- 结果区域支持键盘导航与屏幕阅读器友好格式。
- 色彩对比度符合 WCAG AA。

## 9. 工程与开发流程

- 包管理：pnpm（兼容 npm/yarn）。
- 开发命令：
  - `pnpm dev`：启动本地开发服务器（默认 3000）。
  - `pnpm lint`：运行 ESLint + TypeScript 检查。
  - `pnpm test`：执行 Vitest 单元测试。
  - `pnpm test:e2e`：Playwright 端到端测试（需后端可用）。
  - `pnpm build && pnpm start`：生产构建与预览。
- Git Hooks：使用 Husky 在 `pre-commit` 时运行 `pnpm lint` 与 `pnpm test --runInBand`。
- CI：复用仓库 GitHub Actions，区分 `backend` 与 `frontend` workflow，以路径触发。

## 10. 部署建议

- **开发环境**：Vercel 或本地 Next.js 开发服务器（必要时配置后端代理/Mock Server）。
- **生产环境**：前端静态资源托管（Vercel、S3 + CloudFront、阿里云 OSS）；通过环境变量配置后端 API 地址。
- **监控**：整合 Vercel Analytics/Sentry；关键日志与后端 trace id 关联。
## 11. 风险与待办

- 后端降级策略接口尚未暴露，需要定义返回结构以便 UI 显示。
- Prometheus/Grafana 数据获取接口形式待定，影响健康页实现。
- 需要补充产品侧的风格指南（配色、图标库），目前仅规划 Tailwind 默认主题。
- 与后端的跨域策略需要在部署前确认（建议使用统一网关或配置 CORS）。

## 12. 迭代里程碑（建议）

1. **M1**：完成 Next.js 项目初始化、全局样式与表单页面原型；与后端联通生成接口。
2. **M2**：完善结果展示、错误处理、React Query 缓存、国际化基础。
3. **M3**：引入历史记录、健康状态页面；接入 Prometheus 指标。

文档会随着实现推进在 `frontend/docs/` 中持续更新。
