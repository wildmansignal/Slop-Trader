# SLOP·TRADER — AI trading cockpit

Single-file cockpit (`index.html`) for paper trading, signal-only and live (webhook) modes on Gate.io spot pairs. No build step.

## Run it

    ./run.sh

Starts the page on http://127.0.0.1:5170/index.html and `local-proxy.py` on :5171 (a local CORS proxy for `api.gateio.ws`, the browser can't call Gate.io directly). The page uses the local proxy automatically when served from 127.0.0.1.

For a hosted version, deploy `cloudflare-worker.js` as a Cloudflare Worker and paste its URL into Settings → Gate.io CORS Proxy.

Live mode posts signals as JSON to your own bot at `http://localhost:5055/signal`. Paper trades only until you've audited the logic.
