#!/bin/bash

# Asset Management API Startup Script
# This script properly handles running the server in the background

cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create one from .env.example"
    exit 1
fi

# Build the project
echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

# Start the server
echo "Starting server..."
nohup node dist/index.js < /dev/null > server.log 2>&1 &

# Get the process ID
PID=$!

# Save PID to file
echo $PID > server.pid

echo "Server started with PID: $PID"
echo "Logs are being written to: server.log"
echo "To stop the server, run: kill $PID"
echo "Or use: ./stop.sh"

