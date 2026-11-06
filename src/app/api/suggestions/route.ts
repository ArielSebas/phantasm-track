import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const alias = String(body.alias || "Viajero Anónimo").slice(0, 80);
    const category = String(body.category || "idea").slice(0, 40);
    const message = String(body.message || "").slice(0, 1500);

    if (!message.trim()) {
      return NextResponse.json({ ok: false, error: "Empty message" }, { status: 400 });
    }

    const entry = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      alias,
      category,
      message,
    };

    console.log("\n🦉 [CUERVO MENSAJERO - NUEVA SUGERENCIA]:", entry);

    try {
      const logPath = path.join(process.cwd(), "suggestions-log.json");
      const existing = fs.existsSync(logPath)
        ? JSON.parse(fs.readFileSync(logPath, "utf8"))
        : [];
      existing.unshift(entry);
      fs.writeFileSync(logPath, JSON.stringify(existing, null, 2), "utf8");
    } catch {}

    const discordWebhook = process.env.DISCORD_WEBHOOK_URL?.trim();
    if (discordWebhook && discordWebhook.startsWith("https://")) {
      try {
        await fetch(discordWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "🦉 Cuervo Mensajero · GrimCourier",
            embeds: [
              {
                title: "🎃 Nueva Sugerencia en PhantasmTrack",
                color: 10181046,
                fields: [
                  { name: "👤 Viajero", value: alias, inline: true },
                  { name: "🏷️ Categoría", value: category, inline: true },
                  { name: "📜 Mensaje", value: message },
                ],
                timestamp: entry.createdAt,
              },
            ],
          }),
        });
      } catch (e) {
        console.error("Error Discord:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
