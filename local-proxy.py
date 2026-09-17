#!/usr/bin/env python3
"""Local CORS proxy for the SLOP·TRADER cockpit (stand-in for the Cloudflare worker).
Run:  python3 local-proxy.py   → http://127.0.0.1:5171/
Then paste http://127.0.0.1:5171/ into the cockpit's Gate.io CORS Proxy field.
Usage shape (same as the worker): GET http://127.0.0.1:5171/https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BTC_USDT
Only api.gateio.ws is forwarded."""
import http.server, urllib.request, urllib.parse, sys
ALLOWED = {"api.gateio.ws"}
class H(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Access-Control-Allow-Headers", "*"); self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_GET(self):
        target = self.path.lstrip("/")
        if not target.startswith("http"): self.send_response(400); self._cors(); self.end_headers(); self.wfile.write(b"usage: /https://api.gateio.ws/..."); return
        host = urllib.parse.urlparse(target).hostname
        if host not in ALLOWED: self.send_response(403); self._cors(); self.end_headers(); return
        try:
            r = urllib.request.urlopen(urllib.request.Request(target, headers={"Accept": "application/json", "User-Agent": "sloptrader-local-proxy"}), timeout=20)
            body = r.read(); self.send_response(r.status); self._cors(); self.send_header("Content-Type", r.headers.get("Content-Type", "application/json")); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
        except urllib.error.HTTPError as e:
            body = e.read(); self.send_response(e.code); self._cors(); self.end_headers(); self.wfile.write(body)
        except Exception as e:
            self.send_response(502); self._cors(); self.end_headers(); self.wfile.write(str(e).encode())
    def log_message(self, *a): pass
port = int(sys.argv[1]) if len(sys.argv) > 1 else 5171
print(f"SLOP·TRADER local proxy on http://127.0.0.1:{port}/  (forwarding api.gateio.ws only)", flush=True)
http.server.ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
