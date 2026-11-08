"use client";

import React, { useRef, useState } from "react";
import { Feather, Send, Sparkles, X, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Lang } from "./i18n";

export interface SuggestionPrefill {
  /** Bump `seq` on every request so the same prefill can be re-applied. */
  seq: number;
  category: "idea" | "bug" | "courier" | "design";
  message: string;
}

export interface SuggestionModalProps {
  open: boolean;
  onClose: () => void;
  lang?: Lang;
  prefill?: SuggestionPrefill | null;
}

type CategoryKey = "idea" | "bug" | "courier" | "design";

const SUBMIT_COOLDOWN_MS = 30_000;

export function SuggestionModal({ open, onClose, lang = "es", prefill = null }: SuggestionModalProps) {
  const [alias, setAlias] = useState("");
  const [category, setCategory] = useState<CategoryKey>("idea");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  // Honeypot: real users never see or fill this field.
  const [website, setWebsite] = useState("");
  const lastSubmitRef = useRef(0);
  const [cooldownMsg, setCooldownMsg] = useState(false);
  // Apply an external prefill (e.g. from the Tracking Oracle) once per request.
  const [appliedSeq, setAppliedSeq] = useState(0);
  if (prefill && prefill.seq !== appliedSeq) {
    setAppliedSeq(prefill.seq);
    setCategory(prefill.category);
    setMessage(prefill.message.slice(0, 800));
    setStatus("idle");
    setCooldownMsg(false);
  }

  if (!open) return null;

  const isEs = lang === "es";

  const categories: { key: CategoryKey; label: string }[] = [
    { key: "idea", label: isEs ? "💡 Idea" : "💡 Idea" },
    { key: "bug", label: isEs ? "🐛 Bug" : "🐛 Bug" },
    { key: "courier", label: isEs ? "🚚 Añadir/Ajustar Courier" : "🚚 Add/Adjust Courier" },
    { key: "design", label: isEs ? "🎃 Diseño" : "🎃 Design" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || status === "sending") return;

    // Client-side cooldown: block repeat submissions for 30 seconds.
    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN_MS) {
      setCooldownMsg(true);
      return;
    }
    lastSubmitRef.current = now;
    setCooldownMsg(false);
    setStatus("sending");

    const cleanAlias = (alias.trim() || (isEs ? "Viajero Anónimo" : "Anonymous Traveler")).slice(0, 60);
    const cleanMsg = message.trim().slice(0, 800);

    try {
      // 1. Enviar al servidor interno (Notificación privada a Discord + Log local)
      const internalPromise = fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanAlias,
          category,
          message: cleanMsg,
          website,
        }),
      });

      // 2. Enviar desde el navegador a Web3Forms (Pasa Cloudflare al 100% y llega directo a Gmail sin revelar tu correo)
      const web3Key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
      const emailPromise =
        web3Key && !web3Key.includes("PEGA_AQUI") && !website.trim()
          ? fetch("https://api.web3forms.com/submit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                access_key: web3Key,
                subject: `🎃 [PhantasmTrack] Sugerencia (${category}) de ${cleanAlias}`,
                from_name: "Cuervo Mensajero · GrimCourier",
                name: cleanAlias,
                category,
                message: cleanMsg,
              }),
            })
          : Promise.resolve(null);

      const [internalRes] = await Promise.allSettled([internalPromise, emailPromise]);

      // Guardar copia en localStorage
      try {
        const prev = JSON.parse(localStorage.getItem("phantasm-track-suggestions-v1") || "[]");
        prev.unshift({
          id: Date.now(),
          alias: cleanAlias,
          category,
          message: cleanMsg,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("phantasm-track-suggestions-v1", JSON.stringify(prev.slice(0, 20)));
      } catch {}

      if (internalRes.status === "fulfilled" && internalRes.value.ok) {
        setStatus("sent");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  function handleOpenGithubIssue() {
    const title = encodeURIComponent(`[${category.toUpperCase()}] Sugerencia de ${alias || "Viajero"}`);
    const body = encodeURIComponent(message || "Describe tu sugerencia aquí...");
    window.open(
      `https://github.com/ArielSebas/phantasm-track/issues/new?title=${title}&body=${body}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-purple-500/40 bg-[#120b22]/95 p-6 text-purple-50 shadow-[0_0_50px_rgba(139,92,246,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <Feather className="h-5 w-5 text-purple-400" aria-hidden="true" />
            <h3 className="font-serif text-xl font-bold tracking-wide text-purple-100">
              🦉 {isEs ? "Cuervo Mensajero" : "Raven Messenger"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-purple-300/70 transition hover:bg-purple-500/20 hover:text-purple-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === "sent" ? (
          <div className="py-8 text-center flex flex-col items-center">
            {/* Medallón circular limpio (sin cuadrado negro de fondo) */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/15 shadow-[0_0_30px_rgba(52,211,153,0.4)]">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" strokeWidth={2.2} />
            </div>

            <p className="font-serif text-lg font-bold text-emerald-300 px-4">
              ✦ {isEs ? "¡El Cuervo Mensajero ha partido con tu sugerencia!" : "The Raven Messenger has departed with your feedback!"} ✦
            </p>
            <p className="mt-1.5 text-xs text-purple-300/75">
              {isEs
                ? "Tu pergamino fue entregado al guardián del Grimorio."
                : "Your scroll has been delivered to the Grimoire keeper."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenGithubIssue}
                className="flex items-center gap-2 rounded-xl border border-purple-400/35 bg-purple-950/50 px-4 py-2 text-xs font-medium text-purple-200 transition hover:border-purple-400/70 hover:bg-purple-900/60"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                {isEs ? "Abrir como Issue en GitHub" : "Open as GitHub Issue"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  onClose();
                }}
                className="rounded-xl border border-purple-400/40 bg-purple-600/30 px-5 py-2 text-xs font-semibold text-purple-100 transition hover:bg-purple-600/50"
              >
                {isEs ? "Cerrar" : "Close"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-purple-300/80">
              {isEs
                ? "Envía una idea, reporta un hechizo roto o comparte tu experiencia con couriers de Ecuador."
                : "Send an idea, report a broken spell, or share your experience with Ecuador couriers."}
            </p>

            {/* Honeypot: hidden from users and assistive tech, bots fill it. */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">
                {isEs ? "Tu nombre o alias (opcional)" : "Your name or alias (optional)"}
              </label>
              <input
                type="text"
                maxLength={60}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={isEs ? "Ej. Alquimista de Quito" : "e.g. Quito Alchemist"}
                className="w-full rounded-xl border border-purple-500/30 bg-[#090514]/90 px-3.5 py-2 text-sm text-purple-100 placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1.5">
                {isEs ? "Categoría" : "Category"}
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      category === cat.key
                        ? "border-purple-400 bg-purple-600/35 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                        : "border-purple-500/25 bg-[#090514]/60 text-purple-300/75 hover:border-purple-400/50",
                    ].join(" ")}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">
                {isEs ? "Tu mensaje" : "Your message"}
              </label>
              <textarea
                rows={4}
                required
                maxLength={800}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isEs
                    ? "Escribe tu sugerencia para mejorar PhantasmTrack..."
                    : "Write your suggestion to improve PhantasmTrack..."
                }
                className="w-full rounded-xl border border-purple-500/30 bg-[#090514]/90 p-3.5 text-sm text-purple-100 placeholder-purple-400/40 focus:border-purple-400 focus:outline-none"
              />
            </div>

            {cooldownMsg && (
              <p role="status" className="text-xs text-amber-300">
                {isEs
                  ? "El cuervo está descansando. Espera 30 segundos antes de enviar otro mensaje."
                  : "The raven is resting. Wait 30 seconds before sending another message."}
              </p>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>
                  {isEs
                    ? "El cuervo se perdió en la niebla. Intenta de nuevo o usa el Issue de GitHub."
                    : "The raven got lost in the fog. Try again or open a GitHub Issue."}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="submit"
                disabled={status === "sending" || !message.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-400/50 bg-gradient-to-r from-purple-700/80 to-indigo-700/80 py-2.5 text-sm font-semibold text-purple-50 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50"
              >
                {status === "sending" ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    {isEs ? "El cuervo levanta vuelo..." : "The raven takes flight..."}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {isEs ? "Enviar al Cuervo" : "Send with Raven"}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenGithubIssue}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/25 bg-[#090514]/70 py-2 text-xs font-medium text-purple-300 transition hover:border-purple-400/50 hover:text-purple-100"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                {isEs ? "Abrir como Issue en GitHub" : "Open as GitHub Issue"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SuggestionModal;
