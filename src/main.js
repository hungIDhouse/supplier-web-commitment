import './style.css';

const view1 = document.querySelector('#view-1');
const view2 = document.querySelector('#view-2');
const view1Frame = view1.querySelector('.view-frame');
const view2Frame = view2.querySelector('.view-frame');
const view1Line = view1.querySelector('.view-line');
const view2Line = view2.querySelector('.view-line');
const view1Particles = view1.querySelector('.view-particles');
const view2Particles = view2.querySelector('.view-particles');
const view1Flower = view1.querySelector('.view-flower');
const view2Flower = view2.querySelector('.view-flower');
const view1Overlay = view1.querySelector('.view-overlay');
const view2Overlay = view2.querySelector('.view-overlay');

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
  view2: { left: 135, top: 96, width: 810, height: 352 },
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

  const dpr = window.devicePixelRatio || 1;
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
  view1Transform = applyTransform(view1Frame, [view1Line, view1Flower], view1Overlay, OVERLAY_NATIVE.view1);
  placeCanvasLayer(view1Particles, view1Transform.offsetX, view1Transform.offsetY, view1Transform.scale);

  const view2Transform = applyTransform(view2Frame, [view2Line, view2Flower], view2Overlay, OVERLAY_NATIVE.view2);
  placeCanvasLayer(view2Particles, view2Transform.offsetX, view2Transform.offsetY, view2Transform.scale);
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

function goToView2() {
  view1.classList.remove('is-active');
  view2.classList.add('is-active');
}

view1.addEventListener('click', (event) => {
  if (isInTapZone(event.clientX, event.clientY)) {
    goToView2();
  }
});

// ---- Flow particles: thin glowing fibers (with sparkle dots) travelling
// inward along the artwork's own 4 flow curves ----
//
// Each path is a list of [x%, y%] points (percent of the 1080x1920 canvas),
// ordered from the screen edge (t=0) to the flower center (t=1). These are
// NOT hand-drawn approximations — they were measured directly from
// liquid_lineview1.webp's pixels (per-column, alpha-weighted centroid of the
// hue matching each branch's color: green/blue/yellow/orange), so particles
// riding this path track the real streak's centerline instead of a
// generic diagonal. Both views share the same paths: the two artworks were
// authored on the same underlying flow silhouette (view2 just drops the
// keyword text and color-codes the streaks pale/white instead), confirmed
// by an ~78% IoU between their alpha silhouettes.
const FLOW_PATHS = [
  // green — left edge (top) into the top-left flower lobe
  [
    [0, 33.7], [4, 35.2], [8, 36.1], [12, 37.4], [16, 39.2], [20, 41.0], [24, 42.9],
    [28, 45.1], [32, 47.2], [36, 49.0], [40, 50.5], [44, 50.5], [48, 51.0],
  ],
  // blue — left edge (bottom) into the bottom-left flower lobe
  [
    [0, 83.8], [4, 83.6], [8, 83.3], [12, 82.5], [16, 81.6], [20, 80.5], [24, 78.1],
    [28, 75.8], [32, 73.0], [36, 67.9], [40, 65.1], [44, 65.3], [48, 65.8],
  ],
  // yellow — right edge (top) into the top-right flower lobe
  [
    [100, 33.4], [96, 36.0], [92, 38.6], [88, 40.3], [84, 41.7], [80, 43.6], [76, 44.7],
    [72, 49.0], [68, 52.6], [64, 53.3], [60, 53.4], [56, 53.0], [52, 53.2],
  ],
  // orange — right edge (bottom) into the bottom-right flower lobe
  [
    [100, 86.4], [96, 84.7], [92, 83.6], [88, 81.0], [84, 77.5], [80, 73.7], [76, 71.5],
    [72, 65.4], [68, 59.6], [64, 57.3], [60, 56.9], [56, 58.0], [52, 58.8],
  ],
];

// A "runner" is one thin light fiber. Each flow spawns several of them in
// parallel LANES (a random perpendicular offset off the measured centerline),
// so the streaks read as a dense bundle rather than every fiber tracing the
// exact same line. Only the active view is drawn per frame, so the budget is
// per-view: 4 flows x 7 lanes = 28 fibers x 6 segments = 168 stroke segments
// + 56 sparkle dots — still comfortable on mobile.
const LANES_PER_FLOW = 7;
const DOTS_PER_FIBER = 2;
const FIBER_SAMPLES = 6; // polyline segments used to draw one curved fiber
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
  runner.speed = 0.11 + Math.random() * 0.09; // full 0->1 traverse in ~5-9s
  runner.len = 0.16 + Math.random() * 0.12; // long, soft fiber (~16-28% of path)
  runner.gap = 0.4 + Math.random() * 0.7; // invisible rest before the next lap
  runner.offset = (Math.random() * 2 - 1) * LANE_HALF_WIDTH; // lane, fraction of width
  runner.alpha = 0.16 + Math.random() * 0.13; // faint, semi-transparent fiber
  runner.width = 0.85 + Math.random() * 0.7; // relative line-width jitter
  runner.dots = Array.from({ length: DOTS_PER_FIBER }, () => ({
    rel: 0.22 + Math.random() * 0.56, // position along the fiber (0 tail .. 1 head)
    phase: Math.random() * Math.PI * 2, // twinkle phase
    freq: 2.2 + Math.random() * 2.2, // twinkle speed
    r: 1.1 + Math.random() * 1.4, // core radius multiplier
  }));
  return runner;
}

function createParticleSystem(canvas) {
  const ctx = canvas.getContext('2d');
  const flows = FLOW_PATHS.map((path) => ({
    path,
    runners: Array.from({ length: LANES_PER_FLOW }, () =>
      randomizeRunner({ p: Math.random() * 1.5 })
    ),
  }));
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

  for (const { path, runners } of flows) {
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

      // --- fiber: a curved polyline faded to nothing at both ends ---
      ctx.lineWidth = baseWidth * runner.width;
      let prev = null;
      for (let s = 0; s <= FIBER_SAMPLES; s++) {
        const ft = s / FIBER_SAMPLES; // 0 at tail .. 1 at head
        const t = tailP + (headP - tailP) * ft;
        const pt = offsetPointPx(path, t, offsetPx, cssW, cssH);
        if (prev) {
          const midFt = ft - 0.5 / FIBER_SAMPLES;
          const edgeFade = Math.sin(midFt * Math.PI); // 0 at both ends, 1 mid
          const visible = t > 0 && t <= 1 ? 1 : 0;
          ctx.globalAlpha = runner.alpha * edgeFade * visible;
          if (ctx.globalAlpha > 0.001) {
            ctx.strokeStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
          }
        }
        prev = pt;
      }

      // --- sparkle dots riding the fiber ---
      for (const dot of runner.dots) {
        const t = tailP + (headP - tailP) * dot.rel;
        if (t <= 0 || t > 1) continue;
        const pt = offsetPointPx(path, t, offsetPx, cssW, cssH);
        const twinkle = 0.45 + 0.55 * Math.sin(elapsed * dot.freq + dot.phase);
        const along = Math.sin(dot.rel * Math.PI); // dimmer near the fiber ends
        const a = Math.min(1, runner.alpha * 3.2 * twinkle * along);
        if (a <= 0.02) continue;
        const core = dotBase * dot.r;
        const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, core * 3);
        glow.addColorStop(0, `rgba(255, 255, 255, ${a})`);
        glow.addColorStop(0.35, `rgba(255, 255, 255, ${a * 0.5})`);
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, core * 3, 0, Math.PI * 2);
        ctx.fill();
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

  // Only the visible view is drawn — the other is opacity:0, so painting its
  // canvas each frame would be wasted work. Runners still advance on the
  // active one; the inactive one simply isn't rendered until it's shown.
  if (view1.classList.contains('is-active')) updateAndDrawSystem(particleSystem1, dt, particlesElapsed);
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
