#!/bin/bash

# -------------------------------
# start_linux.sh - production build with cleanup
# -------------------------------

# Set project directory
PROJECT_DIR="/home/michael/ellioth"

# Log file
BUILD_LOG="$PROJECT_DIR/build.log"
DB_LOG="$PROJECT_DIR/setup-db.log"

# -------------------------------
# Cleanup old processes (optional)
# -------------------------------
echo "Stopping any stray Node/Vite processes..."
pkill -f "vite" 2>/dev/null
pkill -f "node" 2>/dev/null

# -------------------------------
# Go to project directory
# -------------------------------
cd "$PROJECT_DIR" || { echo "Project directory not found!"; exit 1; }

# -------------------------------
# Build frontend
# -------------------------------
echo "Building frontend with Vite..."
npm run build > "$BUILD_LOG" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Check $BUILD_LOG for details."
  exit 1
fi
echo "✅ Build finished. Output in $PROJECT_DIR/dist"

# -------------------------------
# Setup PHP database
# -------------------------------
echo "Setting up PHP database..."
php backend/setup-db.php > "$DB_LOG" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Database setup failed! Check $DB_LOG for details."
  exit 1
fi
echo "✅ Database setup complete"

# -------------------------------
# Reload Apache
# -------------------------------
echo "Reloading Apache..."
sudo systemctl reload apache2

echo "✅ Done! Frontend available at https://ellioth.othdb.de/"
echo "Build logs: $BUILD_LOG"
echo "DB logs:    $DB_LOG"
