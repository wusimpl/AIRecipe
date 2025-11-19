# 部署环境切换指南

## 本地开发 → 服务器部署

### 需要修改的文件

#### 1. 前端环境变量 (`frontend/.env`)

```bash
# 本地开发
NEXT_PUBLIC_API_BASE_URL=http://localhost:8089

# 服务器部署（改为服务器公网IP和端口）
NEXT_PUBLIC_API_BASE_URL=http://domain:8089
```

#### 2. 启动脚本 (`start-dev.sh`)

```bash
# 第 95 行：conda 环境名

# 本地开发
conda activate airecipe

# 服务器部署（使用相同的环境名）
conda activate airecipe
```

#### 3. 后端环境变量 (`backend/.env`)

**缓存配置**（强烈推荐使用 Redis，避免重启丢失缓存）：
```bash
# 使用 Redis 缓存（默认，推荐）
CACHE_BACKEND=redis
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_SECONDS=0  # 永久缓存，避免重复调用 LLM

# 仅当 Redis 不可用时使用内存缓存（不推荐，重启丢失）
# CACHE_BACKEND=memory
```

---

## 服务器部署 → 本地开发

反向操作，按上述相反修改即可。

---

## 快速检查清单

部署到服务器前检查：
- [ ] `frontend/.env` - API 地址改为服务器 IP
- [ ] `start-dev.sh` - conda 环境名正确
- [ ] 服务器 Redis 是否运行（如使用 Redis 缓存）
- [ ] 服务器防火墙端口开放（8089, 8090）

拉回本地前检查：
- [ ] `frontend/.env` - API 地址改为 localhost
- [ ] `start-dev.sh` - conda 环境名为 airecipe
- [ ] 本地 Redis 是否运行
- [ ] 本地 conda 环境已创建
