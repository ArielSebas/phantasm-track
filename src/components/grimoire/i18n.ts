// Bilingual (es / en) translation dictionary for the grimoire UI.
//
// This is a pure, UI-adjacent constant map — it holds display strings only and
// imports no domain logic. Spanish ("es") is the default language so Ecuadorian
// shoppers feel at home; English ("en") is one toggle away for judges/visitors.

export type Lang = "es" | "en";

export const LANGS: readonly Lang[] = ["es", "en"] as const;

/** The full UI string table. Both languages must stay in structural sync. */
export interface Dictionary {
  readonly langName: string; // human label for this language
  readonly langFlag: string; // flag emoji for this language

  // Judge banner / language switch
  readonly judgeBanner: string;
  readonly switchTo: string; // label on the toggle button (switches to the OTHER lang)
  readonly langActiveToast: string; // toast shown on load + every switch, in the active lang

  // Header
  readonly appTagline: string;
  readonly footer: string;
  readonly playHandoff: string; // "🎬 Play Handoff" replay button
  readonly editionBadge: string; // "Ecuador Edition · SENAE 4x4 Rules"
  readonly feedbackButton: string; // "🦉 Feedback" header button

  // Suggestion / Raven Messenger modal
  readonly suggestTitle: string;
  readonly suggestSubtitle: string;
  readonly suggestAliasLabel: string;
  readonly suggestAliasPlaceholder: string;
  readonly suggestCategoryLabel: string;
  readonly suggestCatIdea: string;
  readonly suggestCatBug: string;
  readonly suggestCatCourier: string;
  readonly suggestCatDesign: string;
  readonly suggestMessageLabel: string;
  readonly suggestMessagePlaceholder: string;
  readonly suggestSend: string;
  readonly suggestSending: string;
  readonly suggestGithub: string;
  readonly suggestClose: string;
  readonly suggestConfirm: string; // gothic confirmation seal
  readonly suggestError: string; // failure fallback message
  readonly suggestValidation: string; // empty-message validation

  // Cinematic handoff banners
  readonly cinematicDelivered: string; // parcel delivered to the pumpkin lord
  readonly cinematicInTransit: string; // customs in transit, skull retains parcel
  // 4-stage quest-lifecycle cinematic banners
  readonly cinematicWelcome: string; // macabre welcome ritual on load/reload
  readonly cinematicPacking: string; // packing at origin portal
  readonly cinematicCustoms: string; // customs abyss inspection
  readonly cinematicDeliveredStage: string; // guild delivery complete
  readonly cinematicBanished: string; // quest banished / swept away

  // Mana bars
  readonly perParcelWeightMana: string; // per-package 4x4 weight-cap bar title
  readonly perParcelWeightNote: string; // subtitle: no annual weight cap
  readonly annualBudgetMana: string; // annual $1,600 budget quota bar title
  readonly manaStable: string;
  readonly manaWaning: string;
  readonly manaBreach: string;

  // Portals / stages
  readonly portalOrigin: string;
  readonly portalAbyss: string;
  readonly portalDelivery: string;

  // Alchemist calculator
  readonly calcTitle: string;
  readonly quickPotions: string;
  readonly quickPotionsAccordion: string; // collapsible header w/ count
  readonly detailedBreakdown: string; // collapsible tax-table toggle
  readonly compactSenaeBadge: string; // inline locked fee badge (short)
  readonly shippingMode: string;
  readonly modeTemu: string;
  readonly modeTemuHint: string;
  readonly modeCourier: string;
  readonly modeCourierHint: string;
  readonly weightUnit: string;
  readonly ratePerLb: string;
  readonly ratePerLbHint: string;

  // Courier quoter (picker of real Ecuador courier tariffs)
  readonly courierPickerLabel: string; // "Selecciona tu Courier / Tarifario"
  readonly courierPickerHelp: string; // tooltip explaining how it works
  readonly courierLaarbox: string;
  readonly courierUpper: string;
  readonly courierTiered: string;
  readonly courierCustom: string;
  readonly courierLaarboxHint: string;
  readonly courierUpperHint: string;
  readonly courierTieredHint: string;
  readonly courierCustomHint: string;
  // Compact pill labels + single-line formula badges
  readonly courierPillLaarbox: string;
  readonly courierPillUpper: string;
  readonly courierPillTiered: string;
  readonly courierPillCustom: string;
  readonly courierFormulaLaarbox: string;
  readonly courierFormulaUpper: string;
  readonly courierFormulaTiered: string;
  readonly courierFormulaCustom: string;

  // 3-box breakdown summary
  readonly boxProductValue: string; // Valor Producto (Tienda FOB)
  readonly boxFreight: string; // Flete Internacional
  readonly boxFreightTemuNote: string; // "$0 en Temu"
  readonly boxCustoms: string; // Impuestos y Tasas Aduana SENAE
  readonly boxCustomsFourByFour: string; // "$20 fijo en 4x4 + recargos"
  readonly boxCustomsGeneral: string; // "Ad-Valorem + IVA 15% en Régimen General"
  readonly grandImportTotal: string; // Total a Pagar (Solo Importación)
  readonly grandFinalTotal: string; // Costo Final Total (Producto + Importación)
  readonly rowFreight: string; // freight line label, uses {lb} {rate}
  readonly rowSurcharge: string; // courier surcharge/recargos line

  readonly conversionHint: string; // uses {kg} {lb}
  readonly limitHint: string; // 4x4 limit note
  readonly packageWeight: string; // uses {unit}
  readonly fobValue: string;
  readonly fixedFeeBadge: string; // locked $20 SENAE fee row
  readonly questNamePlaceholder: string;
  readonly inscribe: string;

  // Verdict / breakdown
  readonly regimeFourByFour: string;
  readonly regimeGeneral: string;
  readonly generalWarning: string; // arcane skull warning for General regime
  readonly rowAdValorem: string;
  readonly rowVat: string; // uses {pct}
  readonly rowFixedFee: string;

  // Quest log
  readonly logTitle: string;
  readonly activeCount: string; // uses {n}
  readonly filterAll: string;
  readonly filterFourByFour: string;
  readonly filterGeneral: string;
  readonly filterDelivered: string;
  readonly emptyLog: string;
  readonly resetDemo: string;

  // Quest card
  readonly rune: string;
  readonly cardWeight: string;
  readonly cardFob: string;
  readonly cardTribute: string;
  readonly badgeFourByFour: string;
  readonly badgeGeneral: string;
  readonly advancePortal: string;
  readonly banishQuest: string;
  readonly unnamedParcel: string;
  readonly expandDetails: string; // aria-label: show quest secondary stats
  readonly collapseDetails: string; // aria-label: hide quest secondary stats

  // Presets
  readonly presetSafe: string;
  readonly presetHeavy: string;
  readonly presetHighValue: string;
  readonly presetUndertale: string;

  // Judge toast
  readonly toastDismiss: string; // aria-label for the ✕ close button

  // Validation / errors
  readonly errFieldRejected: string; // uses {field}
  readonly errMissing: string; // uses {field}
  readonly errNegative: string; // uses {field}
  readonly errNonFinite: string; // uses {field}
  readonly errAlreadyFinal: string;
  readonly errOutOfSequence: string;
}

export const DICTIONARIES: Record<Lang, Dictionary> = {
  es: {
    langName: "Español",
    langFlag: "🇪🇨",

    judgeBanner: "🎃 Jueces / Visitantes: Cambia el Idioma 🇪🇨 ES ⇄ 🇺🇸 EN",
    switchTo: "🇺🇸 English",
    langActiveToast:
      "🎃 Idioma Español activo — Puedes cambiar entre Español (ES) e Inglés (EN) en cualquier momento desde el interruptor superior.",

    appTagline:
      "Un grimorio arcano para misiones de aduana transfronterizas y la regla 4x4",
    footer:
      "Tributos calculados por el grimorio de aduanas puro · Regla 4x4: ≤ 4 kg y ≤ $400 FOB",
    playHandoff: "🎬 Ver Entrega",
    editionBadge: "Edición Ecuador · Reglas SENAE 4x4",
    feedbackButton: "🦉 Sugerencias",
    suggestTitle: "🦉 Cuervo Mensajero",
    suggestSubtitle:
      "Envía una idea, reporta un hechizo roto o comparte tu experiencia con couriers de Ecuador.",
    suggestAliasLabel: "Tu nombre o alias (opcional)",
    suggestAliasPlaceholder: "ej. Nigromante Anónimo",
    suggestCategoryLabel: "Categoría",
    suggestCatIdea: "💡 Idea",
    suggestCatBug: "🐛 Bug",
    suggestCatCourier: "📦 Courier de Ecuador",
    suggestCatDesign: "🎃 Diseño",
    suggestMessageLabel: "Tu mensaje",
    suggestMessagePlaceholder: "Escribe tu sugerencia para el grimorio...",
    suggestSend: "Enviar al Cuervo",
    suggestSending: "El cuervo levanta vuelo...",
    suggestGithub: "Abrir como Issue en GitHub",
    suggestClose: "Cerrar",
    suggestConfirm: "✦ ¡El Cuervo Mensajero ha partido con tu sugerencia! ✦",
    suggestError:
      "El cuervo se perdió en la niebla. Intenta de nuevo o usa el Issue de GitHub.",
    suggestValidation: "Escribe un mensaje antes de enviar al cuervo.",
    cinematicDelivered: "✦ ¡PAQUETE ENTREGADO AL SEÑOR CALABAZA! ✦",
    cinematicInTransit: "⚡ ADUANA EN TRÁNSITO — LA CALAVERA RETIENE EL PAQUETE ⚡",
    cinematicWelcome:
      "🕯️ Bienvenido a este viaje macabro, viajero 🎃💀",
    cinematicPacking:
      "📦 Empaquetando tus reliquias en el Portal de Origen...",
    cinematicCustoms:
      "💀 Cinta de Aduana SENAE: Escaneando paquete...",
    cinematicDeliveredStage:
      "🎃 ¡Entrega completada! El Señor Calabaza recibe su paquete",
    cinematicBanished:
      "🧹 ¡Misión desterrada! El Señor Calabaza barre los restos",

    perParcelWeightMana: "Maná de Peso por Paquete (Tope 4x4: 4 kg / 8.81 lb)",
    perParcelWeightNote: "SENAE no limita peso anual; solo máx. 4 kg por paquete",
    annualBudgetMana: "Maná de Cupo Anual SENAE",
    manaStable: "Estable",
    manaWaning: "Menguante",
    manaBreach: "Ruptura",

    portalOrigin: "Portal de Origen",
    portalAbyss: "Abismo de Aduanas",
    portalDelivery: "Entrega del Gremio",

    calcTitle: "Alquimista de Aduanas y Aranceles",
    quickPotions: "Pociones de prueba rápida",
    quickPotionsAccordion: "🧪 Pociones de Prueba Rápida (4 casos preconfigurados)",
    detailedBreakdown: "📜 Ver desglose detallado de impuestos",
    compactSenaeBadge: "🔒 Tasa Fija 4x4 SENAE: $20.00",
    shippingMode: "Modo de Envío",
    modeTemu: "🛍️ Modo Temu / Directo",
    modeTemuHint:
      "Temu no cobra por libra; solo agrega la tasa fija de $20.00 USD.",
    modeCourier: "📦 Modo Courier / Casillero",
    modeCourierHint:
      "Cada courier en Ecuador cobra una tarifa distinta por libra.",
    weightUnit: "Unidad de peso",
    ratePerLb: "Tarifa Manual del Courier por Libra ($/lb)",
    ratePerLbHint: "Editable — varía según el courier.",

    courierPickerLabel: "Selecciona tu Courier / Tarifario",
    courierPickerHelp:
      "Elige cómo cobra tu courier por el peso. Calculamos el flete automáticamente y le sumamos la tasa fija 4x4 de $20 (SENAE). No necesitas saber la fórmula $/lb de memoria.",
    courierLaarbox: "🟡 LaarBox (Miami + Recargos)",
    courierUpper: "🟢 Upper Casillero ($5.75/lb IVA incl.)",
    courierTiered: "📋 Tarifario Escalonado por Libras",
    courierCustom: "⚙️ Tarifa Manual ($/lb)",
    courierLaarboxHint:
      "~$7.843/lb de flete + $3.74 de recargos (manejo/seguro) + $20 SENAE.",
    courierUpperHint: "peso × $5.75/lb (IVA incluido) + $20 SENAE.",
    courierTieredHint:
      "Tabla estándar por libras (1 lb=$11.00 … 12+ lb=$66.08 + $4/lb extra) + $20 SENAE.",
    courierCustomHint: "Escribe tu propia tarifa $/lb + $20 SENAE.",
    courierPillLaarbox: "🟡 LaarBox",
    courierPillUpper: "🟢 Upper ($5.75/lb)",
    courierPillTiered: "📋 Tabla Escalonada",
    courierPillCustom: "⚙️ Manual",
    courierFormulaLaarbox: "lb × $7.843 + $3.74 recargos",
    courierFormulaUpper: "lb × $5.75 (IVA incl.)",
    courierFormulaTiered: "Tabla escalonada por libras",
    courierFormulaCustom: "lb × tu tarifa manual $/lb",

    boxProductValue: "Valor Producto (Tienda FOB)",
    boxFreight: "Flete Internacional (Courier por Peso)",
    boxFreightTemuNote: "$0 en Temu",
    boxCustoms: "Impuestos y Tasas Aduana SENAE",
    boxCustomsFourByFour: "$20 fijo en 4x4 + recargos del courier",
    boxCustomsGeneral: "Ad-Valorem + IVA 15% (Régimen General)",
    grandImportTotal: "Total a Pagar (Solo Importación)",
    grandFinalTotal: "Costo Final Total (Producto + Importación)",
    rowFreight: "Flete Internacional ({lb} lb × ${rate}/lb)",
    rowSurcharge: "Recargos del Courier (manejo/seguro)",

    conversionHint: "1 kg = 2.20462 lb · {kg} kg = {lb} lb",
    limitHint: "Límite 4x4: 4 kg / 8.81 lb",
    packageWeight: "Peso del Paquete ({unit})",
    fobValue: "Valor FOB (USD)",
    fixedFeeBadge: "Tasa Fija 4x4 (SENAE): $20.00 USD",
    questNamePlaceholder: "Nombra esta misión (ej. GPU de Obsidiana de Amazon)",
    inscribe: "Inscribir como Misión Activa",

    regimeFourByFour: "Régimen Simplificado 4x4",
    regimeGeneral: "Régimen General de Importación",
    generalWarning:
      "Supera el límite 4x4 — se aplican aranceles del Régimen General.",
    rowAdValorem: "Arancel Ad-Valorem",
    rowVat: "IVA Ecuador {pct}%",
    rowFixedFee: "Tasa Fija 4x4 (SENAE)",

    logTitle: "Bitácora del Gremio de Aventureros",
    activeCount: "{n} activas",
    filterAll: "Todas",
    filterFourByFour: "Exentas 4x4",
    filterGeneral: "General",
    filterDelivered: "Entregadas",
    emptyLog: "Ninguna misión acecha esta página de la bitácora.",
    resetDemo: "Restaurar Demo / Reiniciar Grimorio",

    rune: "runa",
    cardWeight: "Peso",
    cardFob: "FOB",
    cardTribute: "Tributo",
    badgeFourByFour: "Exenta 4x4",
    badgeGeneral: "Gravada General",
    advancePortal: "Avanzar Portal",
    banishQuest: "Desterrar",
    unnamedParcel: "Paquete Arcano sin Nombre",
    expandDetails: "Mostrar detalles",
    collapseDetails: "Ocultar detalles",

    presetSafe: "Botín Seguro 4x4 (2.5kg / $180)",
    presetHeavy: "Reliquia Pesada (5.2kg / $250)",
    presetHighValue: "Artefacto de Alto Valor (1.8kg / $550)",
    presetUndertale: "🎮 Caso Real: Undertale Collector's (4.65 lb / $189.94 — LaarBox)",

    toastDismiss: "Cerrar aviso",

    errFieldRejected: "{field} rechazado",
    errMissing: "{field} es obligatorio",
    errNegative: "{field} no debe ser negativo",
    errNonFinite: "{field} debe ser un número finito",
    errAlreadyFinal: "la misión ya está en la etapa final",
    errOutOfSequence: "solo se permite avanzar a la etapa inmediata siguiente",
  },

  en: {
    langName: "English",
    langFlag: "🇺🇸",

    judgeBanner: "🎃 Judges / Visitors: Switch Language 🇪🇨 ES ⇄ 🇺🇸 EN",
    switchTo: "🇪🇨 Español",
    langActiveToast:
      "🎃 English language active — You can switch between English (EN) and Spanish (ES) anytime using the top toggle.",

    appTagline:
      "An arcane grimoire for cross-border customs quests & the 4x4 rule",
    footer:
      "Tributes computed by the pure customs grimoire · 4x4 rule: ≤ 4 kg & ≤ $400 FOB",
    playHandoff: "🎬 Play Handoff",
    editionBadge: "Ecuador Edition · SENAE 4x4 Rules",
    feedbackButton: "🦉 Feedback",
    suggestTitle: "🦉 Raven Messenger",
    suggestSubtitle:
      "Send an idea, report a broken spell, or share your experience with Ecuador couriers.",
    suggestAliasLabel: "Your name or alias (optional)",
    suggestAliasPlaceholder: "e.g. Anonymous Necromancer",
    suggestCategoryLabel: "Category",
    suggestCatIdea: "💡 Idea",
    suggestCatBug: "🐛 Bug",
    suggestCatCourier: "📦 Ecuador Courier",
    suggestCatDesign: "🎃 Design",
    suggestMessageLabel: "Your message",
    suggestMessagePlaceholder: "Write your suggestion for the grimoire...",
    suggestSend: "Send with the Raven",
    suggestSending: "The raven takes flight...",
    suggestGithub: "Open as a GitHub Issue",
    suggestClose: "Close",
    suggestConfirm: "✦ The Raven Messenger has departed with your suggestion! ✦",
    suggestError:
      "The raven got lost in the fog. Try again or use the GitHub Issue.",
    suggestValidation: "Write a message before sending the raven.",
    cinematicDelivered: "✦ PARCEL DELIVERED TO THE PUMPKIN LORD! ✦",
    cinematicInTransit: "⚡ CUSTOMS IN TRANSIT — THE SKULL RETAINS THE PARCEL ⚡",
    cinematicWelcome:
      "🕯️ Welcome to this macabre journey, traveler 🎃💀",
    cinematicPacking:
      "📦 Packing your relics at the Origin Portal...",
    cinematicCustoms:
      "💀 SENAE Customs Belt: Scanning parcel...",
    cinematicDeliveredStage:
      "🎃 Delivery complete! The Pumpkin Lord receives the parcel",
    cinematicBanished:
      "🧹 Quest banished! The Pumpkin Lord sweeps the remains",

    perParcelWeightMana: "Per-Parcel Weight Mana (4x4 Cap: 4 kg / 8.81 lb)",
    perParcelWeightNote: "SENAE has no annual weight cap; max 4 kg per parcel",
    annualBudgetMana: "Annual SENAE Budget Quota",
    manaStable: "Stable",
    manaWaning: "Waning",
    manaBreach: "Breach",

    portalOrigin: "Origin Portal",
    portalAbyss: "Customs Abyss",
    portalDelivery: "Guild Delivery",

    calcTitle: "Customs & Tariff Alchemist",
    quickPotions: "Quick-test potions",
    quickPotionsAccordion: "🧪 Quick-Test Potions (4 presets)",
    detailedBreakdown: "📜 View detailed tax breakdown",
    compactSenaeBadge: "🔒 Fixed 4x4 SENAE Fee: $20.00",
    shippingMode: "Shipping Mode",
    modeTemu: "🛍️ Temu / Direct Mode",
    modeTemuHint:
      "Temu charges nothing per pound; it only adds the fixed $20.00 USD fee.",
    modeCourier: "📦 Courier / Casillero Mode",
    modeCourierHint:
      "Every courier in Ecuador charges a different per-pound rate.",
    weightUnit: "Weight unit",
    ratePerLb: "Manual Courier Rate per Pound ($/lb)",
    ratePerLbHint: "Editable — varies by courier.",

    courierPickerLabel: "Select your Courier / Tariff",
    courierPickerHelp:
      "Pick how your courier charges by weight. We compute the freight automatically and add the fixed $20 4x4 (SENAE) fee. No need to memorize $/lb formulas.",
    courierLaarbox: "🟡 LaarBox (Miami + Surcharges)",
    courierUpper: "🟢 Upper Casillero ($5.75/lb VAT incl.)",
    courierTiered: "📋 Tiered Per-Pound Table",
    courierCustom: "⚙️ Manual Rate ($/lb)",
    courierLaarboxHint:
      "~$7.843/lb freight + $3.74 surcharge (handling/insurance) + $20 SENAE.",
    courierUpperHint: "weight × $5.75/lb (VAT included) + $20 SENAE.",
    courierTieredHint:
      "Standard per-pound table (1 lb=$11.00 … 12+ lb=$66.08 + $4/extra lb) + $20 SENAE.",
    courierCustomHint: "Type your own $/lb rate + $20 SENAE.",
    courierPillLaarbox: "🟡 LaarBox",
    courierPillUpper: "🟢 Upper ($5.75/lb)",
    courierPillTiered: "📋 Tiered Table",
    courierPillCustom: "⚙️ Manual",
    courierFormulaLaarbox: "lb × $7.843 + $3.74 surcharge",
    courierFormulaUpper: "lb × $5.75 (VAT incl.)",
    courierFormulaTiered: "Tiered per-pound table",
    courierFormulaCustom: "lb × your manual $/lb rate",

    boxProductValue: "Product Value (Store FOB)",
    boxFreight: "International Freight (Courier by Weight)",
    boxFreightTemuNote: "$0 on Temu",
    boxCustoms: "SENAE Customs Taxes & Fees",
    boxCustomsFourByFour: "$20 fixed under 4x4 + courier surcharges",
    boxCustomsGeneral: "Ad-Valorem + 15% VAT (General Regime)",
    grandImportTotal: "Total to Pay (Import Only)",
    grandFinalTotal: "Final Total Cost (Product + Import)",
    rowFreight: "International Freight ({lb} lb × ${rate}/lb)",
    rowSurcharge: "Courier Surcharge (handling/insurance)",

    conversionHint: "1 kg = 2.20462 lb · {kg} kg = {lb} lb",
    limitHint: "4x4 limit: 4 kg / 8.81 lb",
    packageWeight: "Package Weight ({unit})",
    fobValue: "FOB Value (USD)",
    fixedFeeBadge: "Fixed 4x4 Fee (SENAE): $20.00 USD",
    questNamePlaceholder: "Name this quest (e.g. Obsidian GPU from Amazon)",
    inscribe: "Inscribe as Active Quest",

    regimeFourByFour: "4x4 Simplified Regime",
    regimeGeneral: "General Import Regime",
    generalWarning:
      "Over the 4x4 limit — General Regime tariffs apply.",
    rowAdValorem: "Ad-Valorem Tariff",
    rowVat: "Ecuador VAT {pct}%",
    rowFixedFee: "Fixed 4x4 Fee (SENAE)",

    logTitle: "Adventurer's Guild Log",
    activeCount: "{n} active",
    filterAll: "All Quests",
    filterFourByFour: "4x4 Exempt",
    filterGeneral: "General",
    filterDelivered: "Delivered",
    emptyLog: "No quests haunt this page of the log.",
    resetDemo: "Restore Demo / Reset Grimoire",

    rune: "rune",
    cardWeight: "Weight",
    cardFob: "FOB",
    cardTribute: "Tribute",
    badgeFourByFour: "4x4 Exempt",
    badgeGeneral: "General Taxed",
    advancePortal: "Advance Portal",
    banishQuest: "Banish",
    unnamedParcel: "Unnamed Arcane Parcel",
    expandDetails: "Show details",
    collapseDetails: "Hide details",

    presetSafe: "4x4 Safe Loot (2.5kg / $180)",
    presetHeavy: "Heavy Relic (5.2kg / $250)",
    presetHighValue: "High-Value Artifact (1.8kg / $550)",
    presetUndertale: "🎮 Real Case: Undertale Collector's (4.65 lb / $189.94 — LaarBox)",

    toastDismiss: "Dismiss notice",

    errFieldRejected: "{field} rejected",
    errMissing: "{field} is required",
    errNegative: "{field} must not be negative",
    errNonFinite: "{field} must be a finite number",
    errAlreadyFinal: "quest is already at the final stage",
    errOutOfSequence: "only the immediate successor is allowed",
  },
};

/** Simple {token} interpolation for dictionary strings. */
export function tr(
  template: string,
  vars?: Record<string, string | number>
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  );
}

/** Pounds per kilogram (used for live lb ⇄ kg conversion in the UI). */
export const LB_PER_KG = 2.20462;

/** 4x4 weight limit expressed in pounds, for display only. */
export const FOUR_BY_FOUR_LB = 8.81; // ≈ 4 kg
