#!/bin/bash

# -------------------------------
# start_linux.sh - restartable script
# -------------------------------

# Set project directory
PROJECT_DIR="/home/michael/ellioth"

# Log files
PHP_LOG="$PROJECT_DIR/php.log"
NPM_LOG="$PROJECT_DIR/npm.log"

# Kill any existing PHP server (port 8000)
echo "Stopping existing PHP servers..."
pkill -f "php -S 0.0.0.0:8000" 2>/dev/null

# Kill any existing Node/Vite dev server
echo "Stopping existing Node/Vite servers..."
pkill -f "vite" 2>/dev/null

# Go to project directory
cd "$PROJECT_DIR" || { echo "Project directory not found!"; exit 1; }

# Start PHP backend
echo "Starting PHP server on port 8000..."
nohup php -S 0.0.0.0:8000 -t backend > "$PHP_LOG" 2>&1 &

# Start npm dev server
echo "Starting npm dev server..."
nohup npm run dev > "$NPM_LOG" 2>&1 &

echo "Servers started!"
echo "PHP logs: $PHP_LOG"
echo "NPM logs: $NPM_LOG"
