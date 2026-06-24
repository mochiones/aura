#!/bin/bash
cd /Users/gregory/Desktop/week-1/aura
NODE=/Users/gregory/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
exec $NODE node_modules/.bin/next dev -p 3001
