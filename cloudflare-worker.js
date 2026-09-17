// Cloudflare Worker — minimal CORS proxy for the SLOP·TRADER cockpit.
//
// Why: Gate.io's REST API doesn't send `access-control-allow-origin`, so
// browsers block direct fetches. This worker re-fetches the target URL
// server-side and adds the missing CORS header.
//
// Deploy (free tier, ~5 minutes):
//   1. Go to https://workers.cloudflare.com and sign in (free account works).
//   2. Click "Create application" → "Create Worker" → give it any name.
//   3. Click "Edit code", delete the boilerplate, paste this whole file.
//   4. Click "Save and deploy".
//   5. Copy the worker URL (e.g. https://slop-proxy.your-name.workers.dev/).
//   6. In the cockpit → Gate.io CORS Proxy field, paste that URL.
//
// Usage shape: GET https://<worker>/<full target URL>
//   e.g. https://slop-proxy.your-name.workers.dev/https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BTC_USDT

// Tighten this if you only call the cockpit from one origin (e.g. "http://localhost:8000").
const ALLOWED_ORIGIN = '*';

// Whitelist of hosts the proxy will forward to. Prevents your worker from being
// abused as a generic open proxy.
const ALLOWED_HOSTS = new Set([
  'api.gateio.ws',
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Strip the leading slash to recover the target URL.
    const target = url.pathname.slice(1) + url.search;
    if (!target || !/^https?:\/\//.test(target)) {
      return new Response('Usage: /<full target URL>\nExample: /https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BTC_USDT', {
        status: 400,
        headers: { ...corsHeaders(), 'content-type': 'text/plain' },
      });
    }

    let targetUrl;
    try { targetUrl = new URL(target); }
    catch { return new Response('Invalid target URL', { status: 400, headers: corsHeaders() }); }

    if (!ALLOWED_HOSTS.has(targetUrl.host)) {
      return new Response(`Host not allowed: ${targetUrl.host}`, { status: 403, headers: corsHeaders() });
    }

    const upstream = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: { 'accept': 'application/json', 'user-agent': 'slop-trader-cors-proxy' },
    });

    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(),
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store',
      },
    });
  },
};

function corsHeaders() {
  return {
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}
