# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Pre-code / scaffolding stage ("Giai đoạn 0" in `PLAN.md`). The repo currently
holds only planning docs and assets — **no build system, source, or dependencies
exist yet**. There is no `package.json`, so there are no build/lint/test commands
until Vite is initialized. Read `CONTEXT.md` and `PLAN.md` (both in Vietnamese)
before doing anything; they are the source of truth for scope and sequencing.

## What this is

A single-screen **web** experience (not a native app, despite the brief calling it
one) for the Carlsberg Vietnam Supplier Day event. Guests scan a QR code on a big
screen, open it on their phone, and interact immediately.

Core flow (see `CONTEXT.md` for the authoritative detail):
1. **Recognition Moment** — hop flower + 4 flowing lines, each tagged with a keyword
   (Partnership / Innovation Co-Creation / Sustainable Growth / Value Creation). Lines
   animate in. User taps to select exactly one keyword (freely re-selectable; the last
   selection is what commits). Selected line brightens, others dim, keyword scales up
   over the flower. COMMIT button is locked until a selection is made.
2. **Together Brewing Tomorrow** — closing screen showing the chosen keyword + a
   CONFIRMED badge.

## Planned tech stack

- Vanilla HTML/CSS/JS (no framework — single screen, minimal state)
- Vite (dev server + static build)
- GSAP (line-flow animation + transitions)
- SVG (hop flower + the 4 flowing lines, for crisp vector rendering)

## Hard constraints (do not violate)

- **Mobile-only target** (iOS + Android, many sizes): vertical-responsive first,
  animation performance on mobile is a priority.
- **Frontend only**: no backend, no database, no persistence — the user's choice is
  never stored or transmitted.
- **No haptics, no sound.**
- **Static hosting** deploy (Vercel / Netlify / GitHub Pages); no custom domain needed.

## Visual design reference (from Flow Commitment scene screenshots)

Not-yet-implemented target look, documented in `CONTEXT.md` for when Phase 3 starts:

- **Hop flower shape**: organic irregular multi-lobed blob (not a symmetric 4-petal
  shape), with a deep notch at the top splitting the two upper lobes — that notch is
  the key identifying feature. Bubbly/foam texture, top-center highlight for 3D
  volume, even white outer glow.
- **4 flow lines**: particle/light-streak style (many thin parallel strands with
  motion blur), NOT solid paths. They radiate from the 4 screen corners, converge at
  the flower's center, brightening near the center. Each line has its own color tied
  to its keyword: green (top-left), blue (bottom-left), amber (top-right), orange-red
  (bottom-right).
- **Select/commit fill mechanic**: the flower fills like liquid from the bottom up
  (e.g. 79% → 100%). The unfilled portion keeps the flowing stream color bleeding on
  its surface; the filled portion turns solid opaque beer-yellow. This reuses the
  same liquid-fill mechanic from a previous hold-to-confirm button built earlier.
- **Background**: blue sky gradient with soft clouds and depth — NOT the dark
  moss-green (`#10301c`) seen in the slide template (that green is only the
  presentation-deck background, unrelated to the actual web background).
- **Reference palette**: sky gradient `#0040a0` → `#5090f0`; blue stream
  `#0040a0`–`#2050e0`; amber stream `#e0a030`; filled flower = opaque beer-yellow;
  CONFIRMED badge = white background, red `#e01020` ribbon, white italic text.

## Working principles

- The hop flower and brand colors are **placeholders** until the official design file
  arrives. Build the frame + flow + animation first (Phases 1–2); real design is a
  later phase (Phase 3) that is blocked on that file. The visual reference above is
  a directional guide only, not a final spec.
- **Scenes 1–4** referenced in the brief are the big-screen presentation at the event —
  **out of scope, do not code them.** Use them only as color/direction reference.
- Assets: `CBVN - App Brief1.pptx` (original brief), `TEMP-CARL-B.CO.svg` (temporary
  placeholder asset).
