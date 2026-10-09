const ALLOWED_ORIGINS = ['https://blueeylabs.com', 'https://www.blueeylabs.com'];
const EVENTS = ['view', 'tap'];
const SRC_RE = /^[a-z0-9-]{1,20}$/;

let schemaReady = false;

async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(
      'CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, event TEXT NOT NULL, button TEXT, src TEXT NOT NULL)'
    ),
    db.prepare('CREATE INDEX IF NOT EXISTS events_ts ON events (ts)'),
  ]);
  schemaReady = true;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

function originAllowed(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return env.DEV_ORIGIN && origin === env.DEV_ORIGIN;
}

async function track(request, env) {
  if (!originAllowed(request, env)) return new Response(null, { status: 403 });

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = EVENTS.includes(body.event) ? body.event : null;
  const src = typeof body.src === 'string' && SRC_RE.test(body.src) ? body.src : 'direct';
  const button = event === 'tap' && typeof body.button === 'string' ? body.button.trim().slice(0, 80) : null;
  if (!event || (event === 'tap' && !button)) return new Response(null, { status: 400 });

  await ensureSchema(env.DB);
  await env.DB.prepare('INSERT INTO events (ts, event, button, src) VALUES (?, ?, ?, ?)')
    .bind(Date.now(), event, button, src)
    .run();
  return new Response(null, { status: 204 });
}

function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function stats(request, env) {
  if (!env.STATS_KEY) return json({ error: 'Stats key is not set up yet.' }, 503);
  const auth = request.headers.get('authorization') || '';
  const key = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!safeEqual(key, env.STATS_KEY)) return json({ error: 'Wrong key.' }, 401);

  const days = Math.max(0, Math.min(3650, parseInt(new URL(request.url).searchParams.get('days') ?? '7', 10) || 0));
  const since = days ? Date.now() - days * 86400000 : 0;

  await ensureSchema(env.DB);
  const [taps, views, tapsBySrc] = await env.DB.batch([
    env.DB.prepare("SELECT button, COUNT(*) AS n FROM events WHERE event = 'tap' AND ts >= ? GROUP BY button ORDER BY n DESC").bind(since),
    env.DB.prepare("SELECT src, COUNT(*) AS n FROM events WHERE event = 'view' AND ts >= ? GROUP BY src ORDER BY n DESC").bind(since),
    env.DB.prepare("SELECT src, COUNT(*) AS n FROM events WHERE event = 'tap' AND ts >= ? GROUP BY src ORDER BY n DESC").bind(since),
  ]);

  return json({ days, taps: taps.results, views: views.results, tapsBySrc: tapsBySrc.results });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/track' && request.method === 'POST') return track(request, env);
    if (pathname === '/api/stats' && request.method === 'GET') return stats(request, env);
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });

    return env.ASSETS.fetch(request);
  },
};
