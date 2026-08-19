#!/bin/bash
set -e

echo "=== Starting Ethiopia AI Transparency Project ===" > /tmp/project_run.log 2>&1
echo "Node.js version: $(node --version)" >> /tmp/project_run.log 2>&1
echo "npm version: $(npm --version)" >> /tmp/project_run.log 2>&1

cd /home/belay/Documents/A.I/Ethiopia\ A.I\ transparency\ chat\ gpt

echo "" >> /tmp/project_run.log 2>&1
echo "=== Running npm install ===" >> /tmp/project_run.log 2>&1
npm install >> /tmp/project_run.log 2>&1

echo "" >> /tmp/project_run.log 2>&1
echo "=== Running npm test ===" >> /tmp/project_run.log 2>&1
npm test >> /tmp/project_run.log 2>&1

echo "" >> /tmp/project_run.log 2>&1
echo "=== Running npm run build ===" >> /tmp/project_run.log 2>&1
npm run build >> /tmp/project_run.log 2>&1

echo "" >> /tmp/project_run.log 2>&1
echo "=== Project run completed ===" >> /tmp/project_run.log 2>&1