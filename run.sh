#!/bin/bash
# SLOP·TRADER: serve the cockpit + the local Gate.io CORS proxy, then open it.
#   ./run.sh          → http://127.0.0.1:5170/index.html  (proxy on :5171)
cd "$(dirname "$0")"
pkill -f "http.server 5170" 2>/dev/null; pkill -f "local-proxy.py" 2>/dev/null
python3 local-proxy.py 5171 >/tmp/sloptrader-proxy.log 2>&1 &
python3 -m http.server 5170 --bind 127.0.0.1 >/tmp/sloptrader-web.log 2>&1 &
for i in $(seq 1 20); do curl -s -o /dev/null http://127.0.0.1:5170/index.html && break; sleep 0.5; done
echo "SLOP·TRADER  →  http://127.0.0.1:5170/index.html   (Gate.io proxy: http://127.0.0.1:5171/)"
open "http://127.0.0.1:5170/index.html"
