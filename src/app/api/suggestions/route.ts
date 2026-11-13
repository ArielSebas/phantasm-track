import { NextResponse } from "next/server";


// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------
const MAX_BODY_BYTES = 4096;
const MAX_NAME = 60;
const MAX_CATEGORY = 40;
const MAX_MESSAGE = 800;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ALLOWED_CATEGORIES = new Set(["idea", "bug", "courier", "design"]);

// ---------------------------------------------------------------------------
// In-memory rate limiter (best effort: per server instance on serverless).
// ---------------------------------------------------------------------------
const hits = new Map<string, number[]>();

function isRateLimited(ip: string, now = Date.now()): boolean {
  // Opportunistic cleanup to keep memory bounded.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
    if (hits.size > 5000) hits.clear();
  }
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return "unknown";
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------
function sanitize(input: string, max: number): string {
  return (
    input
      // Control chars (keep \n and \t), zero-width and bidi override chars.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, "")
      // Discord mass mentions and role/user/channel mentions.
      .replace(/@(everyone|here)/gi, "@\u200B$1")
      .replace(/<@[&!]?\d+>/g, "")
      .replace(/<#\d+>/g, "")
      .trim()
      .slice(0, max)
  );
}

// ---------------------------------------------------------------------------
// Origin check
// ---------------------------------------------------------------------------
function isOriginAllowed(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!host) return false;
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return false;
  try {
    return new URL(source).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

// Only post to real Discord webhook endpoints (guards against a mistyped or
// tampered env var turning this route into a generic outbound request).
function isDiscordWebhook(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      ["discord.com", "discordapp.com", "ptb.discord.com", "canary.discord.com"].includes(
        u.hostname
      ) &&
      u.pathname.startsWith("/api/webhooks/")
    );
  } catch {
    return false;
  }
}

function fail(status: number, error: string, headers?: Record<string, string>) {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

export async function POST(req: Request) {
  try {
    if (!isOriginAllowed(req)) return fail(403, "Forbidden");

    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return fail(429, "Too many requests", {
        "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
      });
    }

    // Cheap pre-check using the declared length, then verify the real size.
    const declared = Number(req.headers.get("content-length") ?? "0");
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      return fail(413, "Payload too large");
    }
    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return fail(413, "Payload too large");
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail(400, "Invalid request");
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return fail(400, "Invalid request");
    }
    const b = body as Record<string, unknown>;

    // Honeypot: bots fill it; pretend success and do nothing.
    if (typeof b.website === "string" && b.website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }
    if (typeof b.honeypot === "string" && b.honeypot.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    // Accept `name` (preferred) or legacy `alias`.
    const rawName = b.name !== undefined ? b.name : b.alias;
    const rawName2 = rawName === undefined || rawName === null ? "" : rawName;
    const rawCategory = b.category === undefined || b.category === null ? "idea" : b.category;
    if (
      typeof rawName2 !== "string" ||
      typeof rawCategory !== "string" ||
      typeof b.message !== "string"
    ) {
      return fail(400, "Invalid request");
    }

    const name = sanitize(rawName2, MAX_NAME) || "Viajero Anónimo";
    const categoryCandidate = sanitize(rawCategory, MAX_CATEGORY).toLowerCase();
    const category = ALLOWED_CATEGORIES.has(categoryCandidate) ? categoryCandidate : "idea";
    const message = sanitize(b.message, MAX_MESSAGE);

    if (!message) return fail(400, "Empty message");

    const createdAt = new Date().toISOString();

    const discordWebhook = process.env.DISCORD_WEBHOOK_URL?.trim();
    if (discordWebhook && isDiscordWebhook(discordWebhook)) {
      try {
        await fetch(discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "🦉 Cuervo Mensajero · GrimCourier",
            // Defense in depth: never allow Discord to ping anyone.
            allowed_mentions: { parse: [] },
            embeds: [
              {
                title: "🎃 Nueva Sugerencia en PhantasmTrack",
                color: 10181046,
                fields: [
                  { name: "👤 Viajero", value: name, inline: true },
                  { name: "🏷️ Categoría", value: category, inline: true },
                  { name: "📜 Mensaje", value: message },
                ],
                timestamp: createdAt,
              },
            ],
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        // Log a generic message only; never the webhook URL or error object.
        console.error("[suggestions] Discord delivery failed");
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return fail(400, "Invalid request");
  }
}
