import './style.css';

const view1 = document.querySelector('#view-1');
const view2 = document.querySelector('#view-2');
const view1Frame = view1.querySelector('.view-frame');
const view2Frame = view2.querySelector('.view-frame');
const view1Line = view1.querySelector('.view-line');
const view2Line = view2.querySelector('.view-line');
const view1Particles = view1.querySelector('.view-particles');
const view2Particles = view2.querySelector('.view-particles');
const view1FlowerWrap = view1.querySelector('.view-flower-wrap');
const view2FlowerWrap = view2.querySelector('.view-flower-wrap');
const view1Overlay = view1.querySelector('.view-overlay');
const view2Overlay = view2.querySelector('.view-overlay');
const burst = document.querySelector('.view-burst');

// Flower center on the 1080x1920 canvas (49.72%, 59.27% — center of the v2
// asset's alpha bounding box 764x722+155+777, glow halo included) and the
// burst's diameter relative to canvas width. Used to place the app-level
// burst overlay over the flower.
const FLOWER_CENTER_NATIVE = { x: 537, y: 1138 };
const BURST_DIAMETER_NATIVE = 594; // 55% of ART_W

// Artwork's native canvas size — shared by the sky, line, flower and
// overlay layers of both views (all authored at 1080x1920).
const ART_W = 1080;
const ART_H = 1920;
const ART_RATIO = ART_W / ART_H; // 0.5625

// Browser chrome (address bar / nav bar) eats into viewport height on real
// phones, making the visible area "wider" than the artwork → plain CONTAIN
// then leaves side bars. Fixed by zooming to fill the width and cropping the
// excess off the BOTTOM only, bounded by MAX_BOTTOM_CROP — verified against
// the actual artwork that this only trims the fading sparkle trail near the
// bottom corners, never the flower or the label text (label text's lowest
// point measured at y=64.9%, crop starts at 80%).
//
// The opposite case — a container NARROWER than the artwork (very tall phone
// screens, e.g. 412x905) — cannot be fixed the same way by cropping the
// sides: the flow-streak label text ("PARTNERSHIP" etc.) runs almost
// edge-to-edge (measured x=0.4%-99.7% of width), so there is no safe
// horizontal crop budget. That case falls back to plain CONTAIN (top/bottom
// letterbox). Either way, the .view-sky layer (full-frame cover, z-index 0)
// shows through the gap, so it never reads as a flat bar.
const MAX_BOTTOM_CROP = 0.2; // fraction of the image's native height
const MAX_FILL_RATIO = ART_RATIO / (1 - MAX_BOTTOM_CROP); // ~0.703

// Overlay artwork placement on the 1080x1920 canvas, in native px.
// Both overlays are 810px wide (75% of 1080, centered) starting 5% down;
// heights are each file's own natural crop height.
const OVERLAY_NATIVE = {
  view1: { left: 135, top: 96, width: 810, height: 487 },
  view2: { left: 135, top: 136, width: 810, height: 352 }, // nudged 40px down per design
};

// Central tap target = the hop flower area, in native px. Measured from the
// artwork: flower spans roughly x 23%-72%, y 43%-67%; padded out a bit for
// a more forgiving touch target. y max (71%) stays well clear of the 80%
// line where MAX_BOTTOM_CROP could ever cut in.
const TAP_ZONE_NATIVE = { left: 216, right: 864, top: 748.8, bottom: 1363.2 };

// Maps the 1080x1920 artwork onto a cw x ch container: returns the scale
// factor and the (offsetX, offsetY) top-left position of the full-size
// scaled image relative to the container. Used to place the line/flower
// layers, the overlay and the tap zone from one shared source of truth.
function computeImageTransform(cw, ch) {
  if (!cw || !ch) return { scale: 1, offsetX: 0, offsetY: 0 };
  const containerRatio = cw / ch;

  if (containerRatio <= ART_RATIO) {
    // Container taller/narrower than the artwork: no safe horizontal crop
    // budget (see comment above) — CONTAIN, width-bound, letterbox
    // top/bottom (sky-filled).
    const scale = cw / ART_W;
    const offsetY = (ch - ART_H * scale) / 2;
    return { scale, offsetX: 0, offsetY };
  }

  if (containerRatio <= MAX_FILL_RATIO) {
    // Fill the width exactly and crop the excess off the bottom only
    // (bounded by MAX_BOTTOM_CROP) — no side letterbox.
    const scale = cw / ART_W;
    return { scale, offsetX: 0, offsetY: 0 };
  }

  // Too wide (tablet landscape, unfolded fold, desktop): cropping enough
  // to fill the width would cut into real content, so fall back to
  // CONTAIN, height-bound, letterbox left/right (sky-filled).
  const scale = ch / ART_H;
  const offsetX = (cw - ART_W * scale) / 2;
  return { scale, offsetX, offsetY: 0 };
}

// Applies the same canvas transform to every layer in layerEls (line +
// flower share the 1080x1920 canvas) plus the overlay, which has its own
// sub-rectangle within that canvas.
function applyTransform(frameEl, layerEls, overlayEl, overlayNative) {
  const cw = frameEl.clientWidth;
  const ch = frameEl.clientHeight;
  const { scale, offsetX, offsetY } = computeImageTransform(cw, ch);

  for (const layerEl of layerEls) {
    layerEl.style.left = `${offsetX}px`;
    layerEl.style.top = `${offsetY}px`;
    layerEl.style.width = `${ART_W * scale}px`;
    layerEl.style.height = `${ART_H * scale}px`;
  }

  overlayEl.style.left = `${offsetX + overlayNative.left * scale}px`;
  overlayEl.style.top = `${offsetY + overlayNative.top * scale}px`;
  overlayEl.style.width = `${overlayNative.width * scale}px`;
  overlayEl.style.height = `${overlayNative.height * scale}px`;

  return { scale, offsetX, offsetY };
}

// Sizes and positions a particle canvas to exactly cover the same
// ART_W x ART_H box as the line/flower layers (via the same scale/offset),
// and backs its pixel buffer with devicePixelRatio so strokes stay crisp on
// high-density phone screens. cssW/cssH are cached on the element so the
// draw loop (which runs independently of resize/render) knows the current
// size without re-reading layout.
function placeCanvasLayer(canvas, offsetX, offsetY, scale) {
  const cssW = ART_W * scale;
  const cssH = ART_H * scale;
  canvas.style.left = `${offsetX}px`;
  canvas.style.top = `${offsetY}px`;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  // DPR capped at 2: on 3x phones this cuts canvas fill work ~2.25x, and
  // the content is all soft translucent glow — the resolution loss isn't
  // visually detectable there, unlike with sharp-edged graphics.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pixelW = Math.max(1, Math.round(cssW * dpr));
  const pixelH = Math.max(1, Math.round(cssH * dpr));
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW;
    canvas.height = pixelH;
  }
  canvas._cssW = cssW;
  canvas._cssH = cssH;
  canvas._dpr = dpr;
}

let view1Transform = { scale: 1, offsetX: 0, offsetY: 0 };

function render() {
  view1Transform = applyTransform(view1Frame, [view1Line, view1FlowerWrap], view1Overlay, OVERLAY_NATIVE.view1);
  placeCanvasLayer(view1Particles, view1Transform.offsetX, view1Transform.offsetY, view1Transform.scale);

  const view2Transform = applyTransform(view2Frame, [view2Line, view2FlowerWrap], view2Overlay, OVERLAY_NATIVE.view2);
  placeCanvasLayer(view2Particles, view2Transform.offsetX, view2Transform.offsetY, view2Transform.scale);

  // App-level burst overlay: centered on the flower via view 1's transform
  // (the views share the same transform whenever both are visible).
  const { scale, offsetX, offsetY } = view1Transform;
  const diameter = BURST_DIAMETER_NATIVE * scale;
  burst.style.left = `${offsetX + FLOWER_CENTER_NATIVE.x * scale}px`;
  burst.style.top = `${offsetY + FLOWER_CENTER_NATIVE.y * scale}px`;
  burst.style.width = `${diameter}px`;
  burst.style.height = `${diameter}px`;
}

render();
window.addEventListener('resize', render);

function isInTapZone(clientX, clientY) {
  const rect = view1Frame.getBoundingClientRect();
  const { scale, offsetX, offsetY } = view1Transform;
  const left = rect.left + offsetX + TAP_ZONE_NATIVE.left * scale;
  const right = rect.left + offsetX + TAP_ZONE_NATIVE.right * scale;
  const top = rect.top + offsetY + TAP_ZONE_NATIVE.top * scale;
  const bottom = rect.top + offsetY + TAP_ZONE_NATIVE.bottom * scale;
  return clientX >= left && clientX <= right && clientY >= top && clientY <= bottom;
}

// Motion must run CONTINUOUSLY through the cross-fade (design review flagged
// any freeze as a visible stutter), so view-1's fibers keep being drawn
// while it fades out — its canvas stays live until the fade has fully ended.
// The only thing paused for the window is the line-pulse brightness loop
// (see #app.is-swapping in style.css).
const CROSS_FADE_MS = 450; // .view opacity transition (400ms) + margin
const app = document.querySelector('#app');
let view1DrawUntil = 0; // timestamp; after the swap, view-1 draws while now < this

function goToView2() {
  view2.classList.add('is-arriving'); // flower settle + text ease-in (style.css)
  view1DrawUntil = performance.now() + CROSS_FADE_MS;
  app.classList.add('is-swapping');
  view1.classList.remove('is-active');
  view2.classList.add('is-active');
  setTimeout(() => {
    app.classList.remove('is-swapping');
  }, CROSS_FADE_MS);
}

// Tap stays locked until the entrance sequence has mostly played out, and
// the commit runs once — a second tap during the transition does nothing.
let tapEnabled = false;
let transitioning = false;

// Instant feedback on the flower (pulse + burst via .is-committing), then
// start the cross-fade under the burst while it's still covering the swap.
const COMMIT_SWAP_DELAY_MS = 250;

view1.addEventListener('click', (event) => {
  if (!tapEnabled || transitioning) return;
  if (!isInTapZone(event.clientX, event.clientY)) return;
  transitioning = true;
  view1.classList.add('is-committing');
  burst.classList.add('is-live');
  setTimeout(goToView2, COMMIT_SWAP_DELAY_MS);
});

// ---- View 1 entrance ----
// Start the entrance only after view-1's images have actually decoded, so
// the sequence never plays over empty frames on a slow connection; the
// race's timeout keeps a broken/hung image from blanking the page forever.
// Tap unlocks shortly before the title finishes fading in.
const ENTRANCE_TAP_UNLOCK_MS = 1400;
const ENTRANCE_DECODE_TIMEOUT_MS = 2500;

const entranceImages = [view1.querySelector('.view-sky'), view1Line, view1.querySelector('.view-flower'), view1Overlay];

Promise.race([
  Promise.all(entranceImages.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))),
  new Promise((resolve) => setTimeout(resolve, ENTRANCE_DECODE_TIMEOUT_MS)),
]).then(() => {
  view1.classList.add('is-enter');
  // Pre-decode view-2's images and pre-rasterize its stack behind the
  // entrance (see #view-2.is-warm in style.css). Without the explicit
  // decode() the browser can defer decoding the two big webps until the
  // swap actually paints them — measured as a ~350ms freeze right at
  // goToView2() on a real phone.
  for (const img of view2.querySelectorAll('img')) {
    if (img.decode) img.decode().catch(() => {});
  }
  view2.classList.add('is-warm');
  setTimeout(() => {
    tapEnabled = true;
  }, ENTRANCE_TAP_UNLOCK_MS);
});

// ---- Flow particles: thin glowing fibers (with sparkle dots) travelling
// inward along the artwork's own 4 flow curves ----
//
// Each path is a list of [x%, y%] points (percent of the 1080x1920 canvas),
// ordered from the screen edge (t=0) to the flower center (t=1). These are
// NOT hand-drawn approximations — they were measured directly from
// the line artwork's pixels (per-column, alpha-weighted centroid of the
// hue matching each branch's color: green/blue/yellow/orange), so particles
// riding this path track the real streak's centerline instead of a
// generic diagonal. Both views share the same paths: the v2 line artworks
// use identical colored flows (only the baked-in static flower differs),
// and every path was re-verified 100% on-texture against the v2 files.
const FLOW_PATHS = [
  // green — left edge (top) into the top-left flower lobe
  [
    [0, 33.7], [4, 35.2], [8, 36.1], [12, 37.4], [16, 39.2], [20, 41.0], [24, 42.9],
    [28, 45.1], [32, 47.2], [36, 49.0], [40, 50.5], [44, 50.5], [48, 51.0],
  ],
  // blue — bottom edge into the bottom-left flower lobe. Hand-authored
  // S-curve (per design direction, ref public/asset/ref/avdly4wko.webp):
  // exact horizontal mirror of the orange path below, with the final point
  // pinned to the flower's measured center (49.49, 60.16) — a true mirror
  // endpoint would be (50.51, 60.16), a 0.5% nudge that's invisible but
  // keeps both bottom flows converging on the same spot as the breathing
  // origin. Verified against the artwork: 100% of its flower-visible length
  // lies on the blue streak bundle (text holes closed).
  [
    [3, 95], [10.5, 88.5], [16, 81.5], [19.5, 74.5], [21.5, 70], [25.5, 65.5],
    [30, 62], [33, 60.5], [49.49, 60.16],
  ],
  // yellow — right edge (top) into the top-right flower lobe
  [
    [100, 33.4], [96, 36.0], [92, 38.6], [88, 40.3], [84, 41.7], [80, 43.6], [76, 44.7],
    [72, 49.0], [68, 52.6], [64, 53.3], [60, 53.4], [56, 53.0], [52, 53.2],
  ],
  // orange — bottom-right corner into the bottom-right flower lobe. Traced
  // from the design's GREEN guide curve in public/asset/ref/feedback2.png
  // (image px converted to canvas %), then softened twice per follow-up
  // feedback: interior points pulled toward the straight entry->notch chord
  // (~45% overall), with the notch-approach segment (y <= 70) damped hardest
  // (factor ~0.4-0.55) so the run into the flower's lower-right notch is
  // near-straight; the S's two opposing leans survive only as a gentle wave
  // around the chord. The final sweep to the center runs hidden under the
  // flower layer. Control points sit inside the measured corridor (on the
  // orange streak texture AND not covered by the flower alpha): 100% of the
  // path's visible length lies on the streak bundle.
  [
    [97, 95], [89.5, 88.5], [84, 81.5], [80.5, 74.5], [78.5, 70], [74.5, 65.5],
    [70, 62], [67, 60.5], [49.49, 60.16],
  ],
];

// Per-flow light tints, same order as FLOW_PATHS (green, blue, yellow,
// orange). Base colors were sampled from each bundle's mid-brightness pixels
// in the line artwork, then lightened ~30% toward white so that, with
// the 'lighter' composite, the fibers read as glowing light of that flow's
// color rather than flat paint. Sparkle dots keep a white-hot core with a
// tinted halo.
const FLOW_COLORS = [
  [95, 247, 128], // green  (sampled rgb(27,244,74))
  [79, 206, 253], // blue   (sampled rgb(3,185,252))
  [253, 233, 161], // yellow (sampled rgb(252,224,121))
  [255, 185, 70], // orange (sampled rgb(253,202,54), kept warmer/less white)
];

// A "runner" is one thin light fiber. Each flow spawns several of them in
// parallel LANES (a random perpendicular offset off the measured centerline),
// so the streaks read as a dense bundle rather than every fiber tracing the
// exact same line. Fibers are long (~35-60% of the path) with near-zero rest
// between laps and staggered start phases, so at any instant every stretch
// of the path carries light — the flow reads as one continuous pour, not
// isolated passing streaks. Only the active view is drawn per frame, so the
// budget is per-view: 4 flows x 10 lanes = 40 fibers x 10 segments = 400
// stroke segments + sparkle dots — still fine on mobile (simple strokes,
// no shadowBlur). At 14 lanes: 56 fibers x 10 segments = 560 segments + 112
// dots per frame.
const LANES_PER_FLOW = 14;
const DOTS_PER_FIBER = 2;
const FIBER_SAMPLES = 10; // polyline segments used to draw one curved fiber
const LANE_HALF_WIDTH = 0.06; // max perpendicular lane offset, fraction of canvas width

// Position at parameter t (0..1) along a path, linearly interpolated between
// its sample points (they're close enough together — ~4% of canvas width
// apart — that straight segments track the measured curve closely).
function pointAt(path, t) {
  const clamped = Math.min(Math.max(t, 0), 1);
  const segCount = path.length - 1;
  const segT = clamped * segCount;
  let i = Math.floor(segT);
  if (i >= segCount) i = segCount - 1;
  const localT = segT - i;
  const [x1, y1] = path[i];
  const [x2, y2] = path[i + 1];
  return { x: x1 + (x2 - x1) * localT, y: y1 + (y2 - y1) * localT };
}

// Point on a path at param t, in canvas px, pushed perpendicular by `offset`
// px. The offset tapers to 0 as t->1 so every lane converges onto the same
// flower center — reinforcing the "energy pouring in" read instead of
// running as fixed parallel rails. Tangent is estimated by a small central
// difference in px space so the perpendicular is geometrically correct even
// though x/y use different canvas scales.
function offsetPointPx(path, t, offsetPx, cssW, cssH) {
  const tc = Math.min(Math.max(t, 0), 1);
  const base = pointAt(path, tc);
  const bx = (base.x / 100) * cssW;
  const by = (base.y / 100) * cssH;
  if (!offsetPx) return { x: bx, y: by };

  const aHead = pointAt(path, Math.min(tc + 0.02, 1));
  const aTail = pointAt(path, Math.max(tc - 0.02, 0));
  let dx = ((aHead.x - aTail.x) / 100) * cssW;
  let dy = ((aHead.y - aTail.y) / 100) * cssH;
  const len = Math.hypot(dx, dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;
  const taper = 1 - tc; // full spread at the screen edge, merged at the center
  return { x: bx + perpX * offsetPx * taper, y: by + perpY * offsetPx * taper };
}

function randomizeRunner(runner) {
  runner.speed = 0.26 + Math.random() * 0.16; // full 0->1 traverse in ~2.4-3.8s — a hard pour
  runner.len = 0.42 + Math.random() * 0.28; // very long fiber (~42-70% of path), unbroken stream
  runner.gap = 0.01 + Math.random() * 0.08; // essentially back-to-back laps
  runner.offset = (Math.random() * 2 - 1) * LANE_HALF_WIDTH; // lane, fraction of width
  runner.alpha = 0.26 + Math.random() * 0.18; // bold presence, still translucent
  runner.width = 0.85 + Math.random() * 0.7; // relative line-width jitter
  runner.dots = Array.from({ length: DOTS_PER_FIBER }, () => ({
    rel: 0.22 + Math.random() * 0.56, // position along the fiber (0 tail .. 1 head)
    phase: Math.random() * Math.PI * 2, // twinkle phase
    freq: 2.2 + Math.random() * 2.2, // twinkle speed
    r: 1.1 + Math.random() * 1.4, // core radius multiplier
  }));
  return runner;
}

// Sparkle sprite per flow color, rendered once at startup: white-hot core,
// tinted halo. drawImage of a cached sprite replaces the per-dot-per-frame
// createRadialGradient + arc + fill the dots used before — same pixels
// (identical gradient stops; per-frame twinkle stays on globalAlpha), a
// fraction of the cost.
function makeDotSprite([r, g, b]) {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const sctx = sprite.getContext('2d');
  const grad = sctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.55)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, size, size);
  return sprite;
}

const FLOW_SPRITES = FLOW_COLORS.map(makeDotSprite);

function createParticleSystem(canvas) {
  const ctx = canvas.getContext('2d');
  const flows = FLOW_PATHS.map((path, i) => {
    const [r, g, b] = FLOW_COLORS[i];
    return {
      path,
      solid: `rgb(${r}, ${g}, ${b})`,
      transparent: `rgba(${r}, ${g}, ${b}, 0)`,
      sprite: FLOW_SPRITES[i],
      runners: Array.from({ length: LANES_PER_FLOW }, () =>
        randomizeRunner({ p: Math.random() * 1.5 })
      ),
    };
  });
  return { canvas, ctx, flows };
}

function updateAndDrawSystem(system, dt, elapsed) {
  const { canvas, ctx, flows } = system;
  const cssW = canvas._cssW;
  const cssH = canvas._cssH;
  if (!cssW || !cssH) return;

  ctx.setTransform(canvas._dpr || 1, 0, 0, canvas._dpr || 1, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';

  const baseWidth = Math.min(Math.max(cssW * 0.004, 1), 2.4);
  const dotBase = Math.min(Math.max(cssW * 0.004, 1.2), 2.6);

  for (const { path, runners, solid, transparent, sprite } of flows) {
    for (const runner of runners) {
      runner.p += runner.speed * dt;
      const cycle = 1 + runner.gap;
      if (runner.p > cycle) {
        runner.p -= cycle;
        randomizeRunner(runner);
      }
      if (runner.p <= 0 || runner.p > 1) continue; // off-edge / resting

      const headP = runner.p;
      const tailP = headP - runner.len;
      const offsetPx = runner.offset * cssW;

      // --- fiber: ONE stroke along the visible stretch, faded to nothing at
      // both ends by a linear gradient over its endpoints (straight gradient
      // axis is a fine approximation for these gentle curves). One gradient
      // + one stroke per fiber, versus the 10 alpha-stepped segment strokes
      // this replaced — and the continuous fade looks smoother, too. ---
      const t0 = Math.max(tailP, 0);
      const t1 = Math.min(headP, 1);
      if (t1 - t0 < 0.01) continue;

      let first = null;
      let last = null;
      ctx.beginPath();
      for (let s = 0; s <= FIBER_SAMPLES; s++) {
        const t = t0 + (t1 - t0) * (s / FIBER_SAMPLES);
        const pt = offsetPointPx(path, t, offsetPx, cssW, cssH);
        if (s === 0) {
          ctx.moveTo(pt.x, pt.y);
          first = pt;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
        last = pt;
      }
      const fade = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
      fade.addColorStop(0, transparent);
      fade.addColorStop(0.5, solid);
      fade.addColorStop(1, transparent);
      ctx.globalAlpha = runner.alpha;
      ctx.strokeStyle = fade;
      ctx.lineWidth = baseWidth * runner.width;
      ctx.stroke();

      // --- sparkle dots riding the fiber (cached sprite, alpha twinkle) ---
      for (const dot of runner.dots) {
        const t = tailP + (headP - tailP) * dot.rel;
        if (t <= 0 || t > 1) continue;
        const pt = offsetPointPx(path, t, offsetPx, cssW, cssH);
        const twinkle = 0.45 + 0.55 * Math.sin(elapsed * dot.freq + dot.phase);
        const along = Math.sin(dot.rel * Math.PI); // dimmer near the fiber ends
        const a = Math.min(1, runner.alpha * 3.2 * twinkle * along);
        if (a <= 0.02) continue;
        const radius = dotBase * dot.r * 3;
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, pt.x - radius, pt.y - radius, radius * 2, radius * 2);
      }
    }
  }

  ctx.globalAlpha = 1;
}

const particleSystem1 = createParticleSystem(view1Particles);
const particleSystem2 = createParticleSystem(view2Particles);

let particlesRafId = null;
let lastFrameTime = null;
let particlesElapsed = 0; // seconds of run time, drives dot twinkle

function particleFrame(now) {
  if (lastFrameTime == null) lastFrameTime = now;
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05); // clamp to avoid jumps after a stall
  lastFrameTime = now;
  particlesElapsed += dt;

  // Draw only what's visible: view-1 while it's active AND through the
  // cross-fade window after the swap (so its fibers keep flowing as it fades
  // out — no freeze); view-2 from the moment it becomes active.
  if (view1.classList.contains('is-active') || now < view1DrawUntil) {
    updateAndDrawSystem(particleSystem1, dt, particlesElapsed);
  }
  if (view2.classList.contains('is-active')) updateAndDrawSystem(particleSystem2, dt, particlesElapsed);

  particlesRafId = requestAnimationFrame(particleFrame);
}

function startParticles() {
  if (particlesRafId != null) return;
  lastFrameTime = null;
  particlesRafId = requestAnimationFrame(particleFrame);
}

function stopParticles() {
  if (particlesRafId != null) cancelAnimationFrame(particlesRafId);
  particlesRafId = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopParticles();
  else startParticles();
});

startParticles();
