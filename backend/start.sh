#!/usr/bin/env bash

PORT=8089

# 检查端口是否被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Port $PORT is already in use. Killing the process..."
    # 查找并杀死占用端口的进程
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 1
    echo "Process killed."
fi

# 启动后端服务（使用 conda 环境的 Python）
/root/miniconda3/envs/airecipe/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload
