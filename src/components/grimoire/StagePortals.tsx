"use client";

import type { ComponentType } from "react";
import { Package, Skull, Castle, Check, type LucideProps } from "lucide-react";
import { QuestStage, QUEST_SEQUENCE } from "@/domain/customs";

interface PortalMeta {
  readonly stage: QuestStage;
  readonly title: string;
  readonly icon: ComponentType<LucideProps>;
  readonly activeColor: string;
  readonly activeGlow: string;
}

const PORTALS: readonly PortalMeta[] = [
  {
    stage: QuestStage.OriginPortal,
    title: "Origin Portal",
    icon: Package,
    activeColor: "text-portal-origin",
    activeGlow: "shadow-[0_0_24px_-2px_var(--portal-origin)]",
  },
  {
    stage: QuestStage.CustomsAbyss,
    title: "Customs Abyss",
    icon: Skull,
    activeColor: "text-portal-abyss",
    activeGlow: "shadow-[0_0_24px_-2px_var(--portal-abyss)]",
  },
  {
    stage: QuestStage.GuildDelivery,
    title: "Guild Delivery",
    icon: Castle,
    activeColor: "text-portal-delivery",
    activeGlow: "shadow-[0_0_24px_-2px_var(--portal-delivery)]",
  },
];

export interface StagePortalsProps {
  readonly current: QuestStage;
}

/**
 * Visualizes the three arcane portals Origin Portal -> Customs Abyss ->
 * Guild Delivery, highlighting the active stage and marking completed stages.
 * Maps QuestStage to portal visuals; performs no transition logic.
 */
export function StagePortals({ current }: StagePortalsProps) {
  const currentIndex = QUEST_SEQUENCE.indexOf(current);

  return (
    <div className="flex items-center justify-between gap-1">
      {PORTALS.map((portal, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;
        const Icon = portal.icon;

        return (
          <div key={portal.stage} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={[
                  "relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-500",
                  isActive
                    ? `border-current bg-black/60 ${portal.activeColor} ${portal.activeGlow} animate-arcane-glow`
                    : isComplete
                      ? "border-emerald-500/50 bg-emerald-950/40 text-emerald-300"
                      : "border-border-arcane/60 bg-black/40 text-foreground/25",
                ].join(" ")}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" aria-hidden />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden />
                )}
              </div>
              <span
                className={[
                  "text-center text-[0.6rem] font-semibold uppercase tracking-wider transition-colors",
                  isActive
                    ? portal.activeColor
                    : isComplete
                      ? "text-emerald-300/80"
                      : "text-foreground/30",
                ].join(" ")}
              >
                {portal.title}
              </span>
            </div>

            {index < PORTALS.length - 1 ? (
              <div className="relative mx-0.5 mb-5 h-px flex-1">
                <div className="absolute inset-0 bg-border-arcane/40" />
                <div
                  className={[
                    "absolute inset-0 origin-left bg-gradient-to-r from-arcane-violet to-portal-delivery transition-transform duration-700",
                    index < currentIndex ? "scale-x-100" : "scale-x-0",
                  ].join(" ")}
                />
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[0.5rem] text-arcane-violet/50"
                  aria-hidden
                >
                  ✦
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default StagePortals;
