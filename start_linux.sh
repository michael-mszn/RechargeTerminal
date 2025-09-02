#!/bin/bash

# Change into project directory
cd /home/michael/ellioth || exit 1

# Start PHP backend on port 8000
echo "Starting PHP backend..."
php -S 0.0.0.0:8000 -t backend > php.log 2>&1 &

# Start npm frontend (usually runs on 5173 or 3000 depending on your framework)
echo "Starting npm dev server..."
npm run dev > npm.log 2>&1 &

echo "Servers started. Check php.log and npm.log for output."