#!/bin/bash
# 轻量级启动脚本 - 针对低内存环境优化

# 限制 Node.js 最大堆内存为 512MB（可根据实际情况调整）
export NODE_OPTIONS="--max-old-space-size=512"

# 禁用 Next.js 的一些内存密集型功能
export NEXT_TELEMETRY_DISABLED=1

# 启动开发服务器（不使用 Turbopack）
pnpm dev --port 8090 --hostname 0.0.0.0
