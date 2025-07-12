#!/bin/sh

# Start frontend in background
serve -s dist/frontend -l ${FRONTEND_PORT:-3001} &
FRONTEND_PID=$!

# Start backend
node dist/backend/index.js &
BACKEND_PID=$!

# Handle graceful shutdown
trap 'kill $FRONTEND_PID $BACKEND_PID; exit' SIGINT SIGTERM

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
