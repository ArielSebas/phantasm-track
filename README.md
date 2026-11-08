# 🎃 PhantasmTrack · GrimCourier

**🇬🇧 English** · [🇪🇨 Español](#-español)

> An arcane, gothic customs and cross-border courier grimoire built for Ecuador's **SENAE 4x4 import regime**: a **$20 fixed fee**, a **4 kg / 8.81 lb** per-package limit (plus a $400 FOB cap) and a **$1,600 annual quota**.

Built for **Kiroween 2026 (Costume Contest)** with Kiro Specs, Agent Hooks and Property-Based Testing.

---

## ✨ The Problem

Online shoppers and small importers in Ecuador juggle many international packages, courier fees and strict customs limits. Cross the **4 kg / $400** line, or burn through the annual quota, and a package can trigger unexpected taxes or get retained. PhantasmTrack turns that paperwork into a dark-fantasy spellbook: every parcel is a **Quest** that travels through three portals:

```
Origin Warehouse  →  Customs Abyss  →  Local Guild Delivery
```

Visual **Mana Bars** show how close you are to the weight and budget limits.

## 🧙 Key Features

### ⚗️ Alchemist Customs & Tariff Calculator
- **Two shipping modes:** *Temu Direct* and *Locker / Courier*.
- **Courier tariff models:** LaarBox, Upper, a Tiered Table, and a **Manual rate** with a **`$/LB` ⇄ `$/KG`** switcher.
- **Friendly numeric input:** dot or comma decimals both work, and lb ⇄ kg conversion is live.
- **Instant regime classification:** *4x4* (flat $20 fee, no tariff or VAT) versus *General Import Regime* (10% ad-valorem tariff + 15% VAT, configurable). The 4 kg and $400 limits are inclusive.
- A full cost breakdown (product / freight / customs) and one-click inscription into the Adventurer's Guild Log.

### 🔮 Multi-Courier Tracking Oracle (Temu & Ecuador)
Paste a tracking code and the Oracle detects which carrier holds it:

| Pattern | Result |
|---|---|
| `^TMLC\d{6,12}$` | **LaarCourier** (official Temu code) |
| `^SP\d{10,14}EC$` | **Dual-stage guide:** Far International (international transit) + Urbano Express (local last mile in Ecuador) |
| Servientrega · Tramaco · Gintracom / Correos | Prefix and length rules for each carrier |

- **1-click launch:** clicking a carrier copies the code to the clipboard and opens the official portal in a new tab (`noopener,noreferrer`). LaarCourier gets a deep link with the code pre-filled.
- **Safe demo codes:** `TMLC99999999` and `SP1234567890EC`.
- **Crowd-sourced improvement:** a "Wrong carrier match? Report tracking pattern" button opens the feedback modal pre-filled so users can report mismatches.
- One click inscribes the parcel into the Guild Log.

### 💀 Full-Viewport Interactive Guardians
Choreographed SVG animations feature the **Skeleton Courier** and the **Pumpkin Lord**. A **🎬 Animations: ON / OFF** toggle (persisted locally) and a full **ES | EN** language switch keep the experience accessible.

### 🦉 Raven Messenger & Security Hardening
Feedback travels through a **dual notification pipeline**: a **Discord Webhook** (server-side) and **Web3Forms** (email). The API route is hardened with:
- per-IP **rate limiting** (3 requests / 10 minutes, HTTP 429),
- a hidden **honeypot** field plus a 30 s client cooldown,
- **payload limits** (4 KB) and strict type and length validation,
- **sanitization** of control characters and Discord mass mentions,
- same-origin checks in production and **no secret leakage** in responses,
- security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.

Persisted state in `localStorage` is validated and rounded on load so corrupted data cannot crash the UI.

## 🛠️ How We Built It with Kiro (Spec-Driven Development)

The project followed Kiro's spec workflow. The spec lives in [`.kiro/specs`](.kiro/specs) and has three stages: **Requirements → Design → Implementation Plan (tasks)**. Steering files in `.kiro/steering` fixed the stack, structure and product vision, and Agent Hooks automated repetitive checks.

That spec drove a **domain-driven architecture**:

```
src/
  domain/customs/     # Pure business logic: no React, no UI
  components/grimoire/# Gothic UI, a thin layer over the domain
  app/                # Routes, layout, API route
  __tests__/          # Vitest + fast-check
```

All tax, tariff, weight-validation, quest-transition and mana-bar math lives in `src/domain/customs/`. The UI only consumes it, never reimplements it.

**Property-Based Testing with Vitest and `fast-check`** (22 automated tests) checks the invariants instead of a handful of examples:
- regime boundaries are inclusive and exactly one regime is always chosen,
- 4x4 parcels pay only the flat fee; General totals match the rounded formula,
- monetary outputs are never negative, totals are monotonic in FOB and bounded below by the flat fee,
- results are deterministic and rounded to cents,
- mana bar percentages, thresholds (80% / 100%) and bounds hold for any input,
- quests only advance to the immediate next stage,
- invalid, missing or non-finite inputs are rejected with no result.

## 🚀 Local Setup & Testing

**Requirements:** Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local (never commit it) with:
#    DISCORD_WEBHOOK_URL=<your Discord webhook URL>
#    NEXT_PUBLIC_WEB3FORMS_KEY=<your Web3Forms access key>

# 3. Run the property-based test suite
npm test

# 4. Production build
npm run build

# 5. Development server (http://localhost:3000)
npm run dev
```

| Variable | Scope | Purpose |
|---|---|---|
| `DISCORD_WEBHOOK_URL` | Server only | Private Discord notifications. Never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | Public by design | Web3Forms email delivery. Restrict its allowed domain in the Web3Forms dashboard. |

Both are optional: without them the app still works and the corresponding channel is skipped.

**Deploying to Vercel:** import the repo and add the two variables under *Project Settings → Environment Variables*. The in-memory rate limiter is per serverless instance, so use Vercel WAF or a shared store such as Upstash for a global limit.

---

# 🇪🇨 Español

**[🇬🇧 English](#-phantasmtrack--grimcourier)** · 🇪🇨 Español

> Un grimorio gótico y arcano de aduanas y courier transfronterizo, creado para el **régimen 4x4 del SENAE** de Ecuador: **tarifa fija de $20**, límite de **4 kg / 8.81 lb** por paquete (más un tope de $400 FOB) y **cupo anual de $1,600**.

Creado para **Kiroween 2026 (Costume Contest)** con Kiro Specs, Agent Hooks y Property-Based Testing.

## ✨ El problema

Quienes compran en línea o importan en pequeño en Ecuador manejan varios paquetes internacionales, tarifas de courier y límites aduaneros estrictos. Si superas **4 kg / $400** o agotas el cupo anual, un paquete puede generar impuestos inesperados o quedar retenido. PhantasmTrack convierte ese trámite en un libro de hechizos: cada paquete es una **Misión (Quest)** que viaja por tres portales:

```
Bodega de Origen  →  Abismo Aduanero  →  Entrega al Gremio Local
```

Las **Barras de Maná** muestran qué tan cerca estás de los límites de peso y presupuesto.

## 🧙 Características principales

### ⚗️ Calculadora Alquimista de Aduanas y Aranceles
- **Dos modos de envío:** *Temu Directo* y *Casillero / Courier*.
- **Modelos de tarifa de courier:** LaarBox, Upper, Tabla Escalonada y **Tarifa Manual** con selector **`$/LB` ⇄ `$/KG`**.
- **Entrada numérica amigable:** acepta punto o coma decimal, con conversión lb ⇄ kg en vivo.
- **Clasificación instantánea:** *4x4* (tarifa fija de $20, sin arancel ni IVA) frente al *Régimen General de Importación* (arancel ad-valorem 10% + IVA 15%, configurables). Los límites de 4 kg y $400 son inclusivos.
- Desglose completo (producto / flete / aduana) e inscripción con un clic en la Bitácora del Gremio.

### 🔮 Oráculo Rastreador Multi-Courier (Temu y Ecuador)
Pega una guía y el Oráculo detecta qué courier la tiene:

| Patrón | Resultado |
|---|---|
| `^TMLC\d{6,12}$` | **LaarCourier** (código oficial de Temu) |
| `^SP\d{10,14}EC$` | **Guía de doble etapa:** Far International (tránsito internacional) + Urbano Express (última milla local en Ecuador) |
| Servientrega · Tramaco · Gintracom / Correos | Reglas de prefijo y longitud por courier |

- **Apertura en 1 clic:** al elegir un courier se copia la guía y se abre el portal oficial en una pestaña nueva (`noopener,noreferrer`). LaarCourier abre con la guía ya puesta en el enlace.
- **Códigos demo seguros:** `TMLC99999999` y `SP1234567890EC`.
- **Mejora colaborativa:** el botón "¿No coincide con tu courier? Reportar patrón de guía" abre el formulario de comentarios ya rellenado para reportar discrepancias.
- Un clic inscribe el paquete en la Bitácora del Gremio.

### 💀 Guardianes interactivos a pantalla completa
Animaciones SVG coreografiadas con el **Courier Esqueleto** y el **Señor Calabaza**. Un interruptor **🎬 Animaciones: ON / OFF** (guardado localmente) y el cambio completo **ES | EN** mantienen la experiencia accesible.

### 🦉 Cuervo Mensajero y endurecimiento de seguridad
Los comentarios viajan por una **doble vía de notificación**: un **Webhook de Discord** (en el servidor) y **Web3Forms** (correo). La ruta de la API está protegida con:
- **límite de tasa** por IP (3 solicitudes / 10 minutos, HTTP 429),
- campo **honeypot** oculto y una espera de 30 s en el cliente,
- **límite de tamaño** (4 KB) y validación estricta de tipos y longitudes,
- **sanitización** de caracteres de control y menciones masivas de Discord,
- verificación de origen en producción y **sin filtrar secretos** en las respuestas,
- cabeceras de seguridad: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.

El estado guardado en `localStorage` se valida y se redondea al cargar, para que datos corruptos no rompan la interfaz.

## 🛠️ Cómo lo construimos con Kiro (Desarrollo guiado por specs)

El proyecto siguió el flujo de specs de Kiro. La spec vive en [`.kiro/specs`](.kiro/specs) y tiene tres etapas: **Requisitos → Diseño → Plan de implementación (tareas)**. Los archivos de steering en `.kiro/steering` fijaron el stack, la estructura y la visión del producto, y los Agent Hooks automatizaron verificaciones repetitivas.

Esa spec guió una **arquitectura orientada al dominio**:

```
src/
  domain/customs/     # Lógica de negocio pura: sin React, sin UI
  components/grimoire/# UI gótica, capa fina sobre el dominio
  app/                # Rutas, layout, ruta de API
  __tests__/          # Vitest + fast-check
```

Todo el cálculo de impuestos, aranceles, validación de peso, transiciones de misión y barras de maná está en `src/domain/customs/`. La UI solo lo consume y nunca lo reimplementa.

Las **pruebas basadas en propiedades con Vitest y `fast-check`** (22 pruebas automatizadas) verifican invariantes en lugar de unos pocos ejemplos:
- los límites del régimen son inclusivos y siempre se elige exactamente un régimen,
- los paquetes 4x4 pagan solo la tarifa fija; los totales del régimen General coinciden con la fórmula redondeada,
- las salidas monetarias nunca son negativas, el total es monótono respecto al FOB y nunca baja de la tarifa fija,
- los resultados son deterministas y se redondean a centavos,
- los porcentajes, umbrales (80% / 100%) y límites de las barras de maná se cumplen para cualquier entrada,
- las misiones solo avanzan a la etapa inmediata siguiente,
- las entradas inválidas, ausentes o no finitas se rechazan sin producir resultado.

## 🚀 Instalación local y pruebas

**Requisitos:** Node.js 20+ y npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env.local (nunca lo subas al repositorio) con:
#    DISCORD_WEBHOOK_URL=<URL de tu webhook de Discord>
#    NEXT_PUBLIC_WEB3FORMS_KEY=<tu clave de acceso de Web3Forms>

# 3. Ejecutar las pruebas basadas en propiedades
npm test

# 4. Compilación de producción
npm run build

# 5. Servidor de desarrollo (http://localhost:3000)
npm run dev
```

| Variable | Alcance | Propósito |
|---|---|---|
| `DISCORD_WEBHOOK_URL` | Solo servidor | Notificaciones privadas a Discord. Nunca le pongas el prefijo `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_WEB3FORMS_KEY` | Pública por diseño | Envío de correo con Web3Forms. Restringe el dominio permitido en su panel. |

Ambas son opcionales: sin ellas la app funciona y se omite el canal correspondiente.

**Despliegue en Vercel:** importa el repositorio y agrega las dos variables en *Project Settings → Environment Variables*. El limitador en memoria funciona por instancia serverless; para un límite global usa Vercel WAF o un almacén compartido como Upstash.

---

Licencia / License: ver [LICENSE](LICENSE).
