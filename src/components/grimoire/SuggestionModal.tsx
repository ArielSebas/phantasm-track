"use client";

import { useEffect, useState } from "react";
import { X, Send, Feather, CheckCircle2, AlertTriangle } from "lucide-react";
import type { SVGProps } from "react";
import { DICTIONARIES, type Lang } from "./i18n";
import { CobwebCorner } from "./decorations";

/** Inline GitHub octocat mark — `Github` is not exported by lucide-react@1.66.0,
 *  so we draw it ourselves to avoid an invalid-element-type crash. */
function GithubMark({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export interface SuggestionModalProps {
  readonly open: boolean;
  readonly lang: Lang;
  readonly onClose: () => void;
}

type Category = "idea" | "bug" | "courier" | "design";
type Status = "idle" | "sending" | "sent" | "error";

const FORMSUBMIT_ENDPOINT =
  "/api/suggestions";
const GITHUB_ISSUE_BASE =
  "https://github.com/ArielSebas/phantasm-track/issues/new";
const SUGGESTIONS_KEY = "phantasm-track-suggestions-v1";

interface StoredSuggestion {
  readonly alias: string;
  readonly category: Category;
  readonly message: string;
  readonly page: string;
  readonly at: string;
}

/** Persist a submitted suggestion locally so the user keeps a trace of it. */
function persistSuggestion(entry: StoredSuggestion) {
  try {
    const raw = window.localStorage.getItem(SUGGESTIONS_KEY);
    const list: StoredSuggestion[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    window.localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(list));
  } catch {
    // Ignore quota / unavailable storage — email + GitHub remain available.
  }
}

/**
 * Gothic "Raven Messenger" feedback modal. Submits to FormSubmit (instant email
 * to the owner), offers a GitHub Issue fallback, and stores a local copy.
 */
export function SuggestionModal({ open, lang, onClose }: SuggestionModalProps) {
  const d = DICTIONARIES[lang];
  const [alias, setAlias] = useState("");
  const [category, setCategory] = useState<Category>("idea");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [validationError, setValidationError] = useState(false);

  const CATEGORIES: readonly { id: Category; label: string }[] = [
    { id: "idea", label: d.suggestCatIdea },
    { id: "bug", label: d.suggestCatBug },
    { id: "courier", label: d.suggestCatCourier },
    { id: "design", label: d.suggestCatDesign },
  ];

  // Reset the form each time the modal is freshly opened.
  useEffect(() => {
    if (open) {
      setStatus("idle");
      setValidationError(false);
    }
  }, [open]);

  // Close on Escape for keyboard accessibility.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const page = typeof window !== "undefined" ? window.location.href : "";

  async function handleSubmit() {
    const trimmed = message.trim();
    if (trimmed === "") {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    setStatus("sending");

    const safeAlias = alias.trim() || "Anonymous";
    const entry: StoredSuggestion = {
      alias: safeAlias,
      category,
      message: trimmed,
      page,
      at: new Date().toISOString(),
    };

    try {
      const res = await fetch(FORMSUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: "🎃 Nueva Sugerencia en PhantasmTrack (GrimCourier)",
          alias: safeAlias,
          category,
          message: trimmed,
          page,
        }),
      });
      // Always keep a local copy regardless of transport outcome.
      persistSuggestion(entry);
      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      // Network blocked / offline — still save locally and surface the GitHub path.
      persistSuggestion(entry);
      setStatus("error");
    }
  }

  function openGithubIssue() {
    const safeAlias = alias.trim() || "Anonymous";
    const title = `[${category}] PhantasmTrack feedback`;
    const body = [
      `**Alias:** ${safeAlias}`,
      `**Category:** ${category}`,
      "",
      message.trim() || "(no message)",
      "",
      `_Page: ${page}_`,
    ].join("\n");
    const url = `${GITHUB_ISSUE_BASE}?title=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={d.suggestTitle}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={d.suggestClose}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-arcane-violet/50 bg-surface-raised/95 p-5 shadow-[0_0_60px_-12px_rgba(167,139,250,0.7)] backdrop-blur-sm">
        <CobwebCorner position="tl" />
        <CobwebCorner position="tr" />

        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Feather className="h-5 w-5 text-arcane-violet" aria-hidden />
            <h2 className="font-serif text-lg font-bold tracking-wide text-foreground">
              {d.suggestTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={d.suggestClose}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-border-arcane/60 bg-black/40 p-1 text-foreground/60 transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-300 animate-arcane-glow" aria-hidden />
            <p className="max-w-xs font-serif text-base font-bold text-emerald-100">
              {d.suggestConfirm}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={openGithubIssue}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-black/60"
              >
                <GithubMark className="h-3.5 w-3.5" aria-hidden />
                {d.suggestGithub}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-arcane-violet/50 bg-arcane-violet/20 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-arcane-violet/35"
              >
                {d.suggestClose}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs leading-snug text-foreground/55">
              {d.suggestSubtitle}
            </p>

            {/* Alias */}
            <label className="mb-3 flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground/60">
                {d.suggestAliasLabel}
              </span>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder={d.suggestAliasPlaceholder}
                className="rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-arcane-violet/70 placeholder:text-foreground/30"
              />
            </label>

            {/* Category pills */}
            <div className="mb-3 flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground/60">
                {d.suggestCategoryLabel}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={[
                      "rounded-full border px-2.5 py-1 text-xs font-semibold transition-all",
                      category === c.id
                        ? "border-arcane-violet/60 bg-arcane-violet/20 text-foreground shadow-[0_0_14px_-5px_rgba(167,139,250,0.9)]"
                        : "border-border-arcane/50 bg-black/30 text-foreground/55 hover:text-foreground/80",
                    ].join(" ")}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <label className="mb-1 flex flex-col gap-1">
              <span className="text-xs font-medium text-foreground/60">
                {d.suggestMessageLabel}
              </span>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (validationError) setValidationError(false);
                }}
                rows={4}
                placeholder={d.suggestMessagePlaceholder}
                className="resize-none rounded-lg border border-border-arcane/60 bg-black/40 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-arcane-violet/70 placeholder:text-foreground/30"
              />
            </label>

            {validationError ? (
              <p className="mb-2 flex items-center gap-1.5 text-xs text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {d.suggestValidation}
              </p>
            ) : null}

            {status === "error" ? (
              <p className="mb-2 flex items-center gap-1.5 text-xs text-rose-300">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {d.suggestError}
              </p>
            ) : null}

            {/* Actions */}
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={status === "sending"}
                className="flex items-center justify-center gap-2 rounded-lg border border-arcane-violet/50 bg-gradient-to-r from-arcane-violet/25 to-arcane-blue/20 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:shadow-[0_0_24px_-6px_rgba(167,139,250,0.9)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden />
                {status === "sending" ? d.suggestSending : d.suggestSend}
              </button>
              <button
                type="button"
                onClick={openGithubIssue}
                className="flex items-center justify-center gap-2 rounded-lg border border-border-arcane/60 bg-black/40 px-4 py-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-black/60"
              >
                <GithubMark className="h-4 w-4" aria-hidden />
                {d.suggestGithub}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SuggestionModal;
