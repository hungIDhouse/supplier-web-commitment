import './style.css';

const view1 = document.querySelector('#view-1');
const view2 = document.querySelector('#view-2');
const view1Frame = view1.querySelector('.view-frame');
const view2Frame = view2.querySelector('.view-frame');
const view1Bg = view1.querySelector('.view-bg');
const view2Bg = view2.querySelector('.view-bg');
const view1Overlay = view1.querySelector('.view-overlay');
const view2Overlay = view2.querySelector('.view-overlay');

// Artwork's native canvas size (view1.png / view2.png are both 1080x1920).
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
// letterbox). Whatever letterbox gap survives either case is filled by the
// blurred .view-bg-fill layer, so it never shows as a flat bar.
const MAX_BOTTOM_CROP = 0.2; // fraction of the image's native height
const MAX_FILL_RATIO = ART_RATIO / (1 - MAX_BOTTOM_CROP); // ~0.703

// Overlay artwork placement on the 1080x1920 canvas, in native px.
// Both overlays are 810px wide (75% of 1080, centered) starting 5% down;
// heights are each file's own natural crop height.
const OVERLAY_NATIVE = {
  view1: { left: 135, top: 96, width: 810, height: 487 },
  view2: { left: 135, top: 96, width: 810, height: 352 },
};

// Central tap target = the hop flower area in view1.png, in native px.
// Measured from the artwork: flower spans roughly x 23%-72%, y 43%-67%;
// padded out a bit for a more forgiving touch target. y max (71%) stays
// well clear of the 80% line where MAX_BOTTOM_CROP could ever cut in.
const TAP_ZONE_NATIVE = { left: 216, right: 864, top: 748.8, bottom: 1363.2 };

// Maps the 1080x1920 artwork onto a cw x ch container: returns the scale
// factor and the (offsetX, offsetY) top-left position of the full-size
// scaled image relative to the container. Used to place the bg image, the
// overlay and the tap zone from one shared source of truth.
function computeImageTransform(cw, ch) {
  if (!cw || !ch) return { scale: 1, offsetX: 0, offsetY: 0 };
  const containerRatio = cw / ch;

  if (containerRatio <= ART_RATIO) {
    // Container taller/narrower than the artwork: no safe horizontal crop
    // budget (see comment above) — CONTAIN, width-bound, letterbox
    // top/bottom (blur-filled).
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
  // CONTAIN, height-bound, letterbox left/right (blur-filled).
  const scale = ch / ART_H;
  const offsetX = (cw - ART_W * scale) / 2;
  return { scale, offsetX, offsetY: 0 };
}

function applyTransform(frameEl, bgEl, overlayEl, overlayNative) {
  const cw = frameEl.clientWidth;
  const ch = frameEl.clientHeight;
  const { scale, offsetX, offsetY } = computeImageTransform(cw, ch);

  bgEl.style.left = `${offsetX}px`;
  bgEl.style.top = `${offsetY}px`;
  bgEl.style.width = `${ART_W * scale}px`;
  bgEl.style.height = `${ART_H * scale}px`;

  overlayEl.style.left = `${offsetX + overlayNative.left * scale}px`;
  overlayEl.style.top = `${offsetY + overlayNative.top * scale}px`;
  overlayEl.style.width = `${overlayNative.width * scale}px`;
  overlayEl.style.height = `${overlayNative.height * scale}px`;

  return { scale, offsetX, offsetY };
}

let view1Transform = { scale: 1, offsetX: 0, offsetY: 0 };

function render() {
  view1Transform = applyTransform(view1Frame, view1Bg, view1Overlay, OVERLAY_NATIVE.view1);
  applyTransform(view2Frame, view2Bg, view2Overlay, OVERLAY_NATIVE.view2);
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
