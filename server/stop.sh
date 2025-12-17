#!/bin/bash

# Asset Management API Stop Script

cd "$(dirname "$0")"

if [ -f server.pid ]; then
    PID=$(cat server.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Stopping server (PID: $PID)..."
        kill $PID
        rm server.pid
        echo "Server stopped"
    else
        echo "Server process not found (PID: $PID)"
        rm server.pid
    fi
else
    echo "No server.pid file found. Server may not be running."
    # Try to find and kill by process name
    pkill -f "node dist/index.js"
    if [ $? -eq 0 ]; then
        echo "Server process killed"
    else
        echo "No server process found"
    fi
fi

