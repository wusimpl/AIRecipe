#!/bin/bash
export PATH="/root/.nvm/versions/node/v22.20.0/bin:$PATH"


set -euo pipefail

# ========================================
# AIRecipe 一键启动脚本（后台运行版本）
# ========================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_DIR="/root/AIRecipe"
BACKEND_PORT=8089
FRONTEND_PORT=8090

# 日志和PID目录
LOG_DIR="$PROJECT_DIR/logs"
PID_DIR="$PROJECT_DIR/pids"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PID="$PID_DIR/backend.pid"
FRONTEND_PID="$PID_DIR/frontend.pid"

# 创建目录
mkdir -p "$LOG_DIR" "$PID_DIR"

# ========================================
# 辅助函数
# ========================================

log_info() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# 检查端口是否被占用
is_port_in_use() {
    netstat -tuln 2>/dev/null | grep -q ":$1 " && return 0 || return 1
}

# 清理占用的端口
kill_port() {
    local port=$1
    local service=$2

    if is_port_in_use "$port"; then
        log_warn "端口 $port 已被占用，正在清理..."
        fuser -k "$port"/tcp 2>/dev/null || true
        sleep 2
    fi
}

# 检查服务是否已运行
is_service_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# ========================================
# 启动后端
# ========================================

start_backend() {
    log_info "启动后端服务（端口 $BACKEND_PORT）..."

    # 检查是否已运行
    if is_service_running "$BACKEND_PID"; then
        log_warn "后端服务已在运行，PID: $(cat $BACKEND_PID)"
        return 0
    fi

    # 清理端口
    kill_port "$BACKEND_PORT" "backend"

    # 启动后端
    cd "$PROJECT_DIR/backend"
    nohup /root/miniconda3/envs/airecipe/bin/uvicorn app.main:app \
        --host 0.0.0.0 --port $BACKEND_PORT \
        >> "$BACKEND_LOG" 2>&1 &

    local pid=$!
    echo "$pid" > "$BACKEND_PID"

    # 等待启动完成
    sleep 2

    if kill -0 "$pid" 2>/dev/null; then
        log_info "后端启动成功 (PID: $pid)"
        return 0
    else
        log_error "后端启动失败！"
        log_error "查看日志: $BACKEND_LOG"
        return 1
    fi
}

# ========================================
# 启动前端
# ========================================

start_frontend() {
    log_info "启动前端服务（端口 $FRONTEND_PORT）..."

    # 检查是否已运行
    if is_service_running "$FRONTEND_PID"; then
        log_warn "前端服务已在运行，PID: $(cat $FRONTEND_PID)"
        return 0
    fi

    # 清理端口
    kill_port "$FRONTEND_PORT" "frontend"

    # 启动前端
    cd "$PROJECT_DIR/frontend"
    nohup bash -c "
        export PORT=$FRONTEND_PORT
        export NEXT_PUBLIC_API_BASE_URL=http://localhost:$BACKEND_PORT
        pnpm start
    " >> "$FRONTEND_LOG" 2>&1 &

    local pid=$!
    echo "$pid" > "$FRONTEND_PID"

    # 等待启动完成
    sleep 2

    if kill -0 "$pid" 2>/dev/null; then
        log_info "前端启动成功 (PID: $pid)"
        return 0
    else
        log_error "前端启动失败！"
        log_error "查看日志: $FRONTEND_LOG"
        return 1
    fi
}

# ========================================
# 停止服务
# ========================================

stop_services() {
    log_info "正在停止服务..."

    # 停止后端
    if [ -f "$BACKEND_PID" ]; then
        local pid=$(cat "$BACKEND_PID")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "停止后端 (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
        fi
        rm -f "$BACKEND_PID"
    fi

    # 停止前端
    if [ -f "$FRONTEND_PID" ]; then
        local pid=$(cat "$FRONTEND_PID")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "停止前端 (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
        fi
        rm -f "$FRONTEND_PID"
    fi

    # 清理可能残留的进程
    kill_port "$BACKEND_PORT" "backend"
    kill_port "$FRONTEND_PORT" "frontend"

    log_info "所有服务已停止"
}

# ========================================
# 查看状态
# ========================================

show_status() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  AIRecipe 服务状态${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    # 后端状态
    if is_service_running "$BACKEND_PID"; then
        local pid=$(cat "$BACKEND_PID")
        log_info "后端服务: 运行中 (PID: $pid)"
    else
        log_warn "后端服务: 未运行"
    fi

    # 前端状态
    if is_service_running "$FRONTEND_PID"; then
        local pid=$(cat "$FRONTEND_PID")
        log_info "前端服务: 运行中 (PID: $pid)"
    else
        log_warn "前端服务: 未运行"
    fi

    # 端口状态
    echo ""
    echo -e "${BLUE}端口状态：${NC}"
    if is_port_in_use "$BACKEND_PORT"; then
        log_info "后端端口 $BACKEND_PORT: 正常"
    else
        log_error "后端端口 $BACKEND_PORT: 未开放"
    fi

    if is_port_in_use "$FRONTEND_PORT"; then
        log_info "前端端口 $FRONTEND_PORT: 正常"
    else
        log_error "前端端口 $FRONTEND_PORT: 未开放"
    fi

    echo -e "\n${BLUE}日志位置：${NC}"
    echo "  后端: $BACKEND_LOG"
    echo "  前端: $FRONTEND_LOG"

    echo -e "\n${BLUE}访问地址：${NC}"
    echo "  前端: https://airecipe.wusimpl.fun"
    echo "  API: https://airecipe.wusimpl.fun/api"
    echo ""
}

# ========================================
# 查看日志
# ========================================

show_logs() {
    if [ "${1:-}" = "backend" ]; then
        log_info "查看后端日志（Ctrl+C 退出）"
        tail -f "$BACKEND_LOG"
    elif [ "${1:-}" = "frontend" ]; then
        log_info "查看前端日志（Ctrl+C 退出）"
        tail -f "$FRONTEND_LOG"
    else
        log_error "用法: $0 logs [backend|frontend]"
    fi
}

# ========================================
# 主程序
# ========================================

main() {
    local command=${1:-start}

    case "$command" in
        start)
            echo -e "\n${GREEN}========================================${NC}"
            echo -e "${GREEN}  AIRecipe 启动中...${NC}"
            echo -e "${GREEN}========================================${NC}\n"

            if start_backend && start_frontend; then
                show_status
                log_info "✓ 所有服务启动成功！"
                exit 0
            else
                log_error "✗ 某些服务启动失败！"
                exit 1
            fi
            ;;

        stop)
            stop_services
            exit 0
            ;;

        restart)
            stop_services
            sleep 2
            main start
            ;;

        status)
            show_status
            exit 0
            ;;

        logs)
            show_logs "${2:-}"
            ;;

        *)
            echo "使用方法:"
            echo "  $0 start          - 启动所有服务（后台运行）"
            echo "  $0 stop           - 停止所有服务"
            echo "  $0 restart        - 重启所有服务"
            echo "  $0 status         - 查看服务状态"
            echo "  $0 logs backend   - 查看后端日志"
            echo "  $0 logs frontend  - 查看前端日志"
            exit 1
            ;;
    esac
}

main "$@"
