import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entry = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      alias: body.alias || "Viajero Anónimo",
      category: body.category || "idea",
      message: body.message || "",
    };

    // 1. Mostrar inmediatamente en la consola del servidor
    console.log("\n🦉 [CUERVO MENSAJERO - NUEVA SUGERENCIA]:", entry);

    // 2. Guardar respaldo local en suggestions-log.json (en desarrollo)
    try {
      const logPath = path.join(process.cwd(), "suggestions-log.json");
      const existing = fs.existsSync(logPath)
        ? JSON.parse(fs.readFileSync(logPath, "utf8"))
        : [];
      existing.unshift(entry);
      fs.writeFileSync(logPath, JSON.stringify(existing, null, 2), "utf8");
    } catch {
      // Ignorar en entornos serverless de solo lectura (Vercel)
    }

    // 3. Reenviar desde el servidor a FormSubmit (evita bloqueadores de navegador / CORS)
    try {
      await fetch("https://formsubmit.co/ajax/arielsebas3452@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://phantasm-track.vercel.app",
          Referer: "https://phantasm-track.vercel.app/",
        },
        body: JSON.stringify({
          _subject: "🎃 Nueva Sugerencia en PhantasmTrack (GrimCourier)",
          alias: entry.alias,
          category: entry.category,
          message: entry.message,
        }),
      });
    } catch {
      // Si FormSubmit requiere activacion inicial, igual respondemos 200 OK al usuario
    }

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
