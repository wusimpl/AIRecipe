#!/usr/bin/env bash

set -euo pipefail

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 端口配置
BACKEND_PORT=8089
FRONTEND_PORT=8090

# 日志文件
LOG_DIR="./logs"
BACKEND_LOG="$LOG_DIR/backend-dev.log"
FRONTEND_LOG="$LOG_DIR/frontend-dev.log"

# PID 文件
PID_DIR="./pids"
BACKEND_PID="$PID_DIR/backend-dev.pid"
FRONTEND_PID="$PID_DIR/frontend-dev.pid"

# 创建日志和PID目录
mkdir -p "$LOG_DIR" "$PID_DIR"

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"

    # 停止后端
    if [ -f "$BACKEND_PID" ]; then
        BACKEND_PID_NUM=$(cat "$BACKEND_PID")
        if kill -0 "$BACKEND_PID_NUM" 2>/dev/null; then
            echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID_NUM)...${NC}"
            kill "$BACKEND_PID_NUM"
            wait "$BACKEND_PID_NUM" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID"
    fi

    # 停止前端
    if [ -f "$FRONTEND_PID" ]; then
        FRONTEND_PID_NUM=$(cat "$FRONTEND_PID")
        if kill -0 "$FRONTEND_PID_NUM" 2>/dev/null; then
            echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID_NUM)...${NC}"
            kill "$FRONTEND_PID_NUM"
            wait "$FRONTEND_PID_NUM" 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID"
    fi

    # 清理可能残留的端口占用
    if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Cleaning up backend port $BACKEND_PORT...${NC}"
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    fi

    if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Cleaning up frontend port $FRONTEND_PORT...${NC}"
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    fi

    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM EXIT

# 检查并清理端口
check_and_clean_port() {
    local port=$1
    local service=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Port $port is already in use by $service. Killing the process...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}Port $port cleaned.${NC}"
    fi
}

# 启动后端
start_backend() {
    echo -e "${BLUE}Starting backend in development mode on port $BACKEND_PORT...${NC}"

    cd backend

    # 启动后端（使用 conda 环境的 uvicorn）
    (
        /root/miniconda3/envs/airecipe/bin/uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > "../$BACKEND_LOG" 2>&1
    ) &

    BACKEND_PID_NUM=$!
    echo $BACKEND_PID_NUM > "../$BACKEND_PID"

    cd ..

    echo -e "${GREEN}Backend started (PID: $BACKEND_PID_NUM)${NC}"
    echo -e "${BLUE}Backend logs: $BACKEND_LOG${NC}"
}

# 启动前端
start_frontend() {
    echo -e "${BLUE}Starting frontend in development mode on port $FRONTEND_PORT...${NC}"

    cd frontend

    # 开发模式启动前端 (使用 Turbopack)
    (
        PORT=$FRONTEND_PORT pnpm dev > "../$FRONTEND_LOG" 2>&1
    ) &

    FRONTEND_PID_NUM=$!
    echo $FRONTEND_PID_NUM > "../$FRONTEND_PID"

    cd ..

    echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID_NUM)${NC}"
    echo -e "${BLUE}Frontend logs: $FRONTEND_LOG${NC}"
}

# 主函数
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  AIRecipe Development Launcher${NC}"
    echo -e "${GREEN}========================================${NC}"

    # 清理端口
    check_and_clean_port $BACKEND_PORT "backend"
    check_and_clean_port $FRONTEND_PORT "frontend"

    # 启动服务
    start_backend
    sleep 2  # 等待后端启动

    start_frontend
    sleep 3  # 等待前端启动

    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}  Development Services Running!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}Backend:  http://localhost:$BACKEND_PORT${NC}"
    echo -e "${BLUE}Frontend: http://localhost:$FRONTEND_PORT${NC}"
    echo -e "${BLUE}API Docs: http://localhost:$BACKEND_PORT/docs${NC}"
    echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"
    echo -e "${BLUE}Monitor logs:${NC}"
    echo -e "  Backend:  tail -f $BACKEND_LOG"
    echo -e "  Frontend: tail -f $FRONTEND_LOG"
    echo -e "${GREEN}========================================${NC}\n"

    # 持续监控进程
    while true; do
        # 检查后端是否还在运行
        if [ -f "$BACKEND_PID" ]; then
            BACKEND_PID_NUM=$(cat "$BACKEND_PID")
            if ! kill -0 "$BACKEND_PID_NUM" 2>/dev/null; then
                echo -e "${RED}Backend process died unexpectedly!${NC}"
                echo -e "${RED}Check logs: $BACKEND_LOG${NC}"
                cleanup
            fi
        fi

        # 检查前端是否还在运行
        if [ -f "$FRONTEND_PID" ]; then
            FRONTEND_PID_NUM=$(cat "$FRONTEND_PID")
            if ! kill -0 "$FRONTEND_PID_NUM" 2>/dev/null; then
                echo -e "${RED}Frontend process died unexpectedly!${NC}"
                echo -e "${RED}Check logs: $FRONTEND_LOG${NC}"
                cleanup
            fi
        fi

        sleep 2
    done
}

# 运行主函数
main
