import './style.css';

const keywordButtons = Array.from(document.querySelectorAll('.keyword'));
const labelByKeyword = new Map(
  keywordButtons.map((btn) => [btn.dataset.keyword, btn.textContent.trim()])
);

const selectedHeading = document.querySelector('#selected-keyword');
const commitBtn = document.querySelector('#commit-btn');
const recognitionScreen = document.querySelector('#screen-recognition');

let selectedKeyword = null;

function selectKeyword(keyword) {
  selectedKeyword = keyword;

  keywordButtons.forEach((btn) => {
    const isMatch = btn.dataset.keyword === keyword;
    btn.classList.toggle('is-selected', isMatch);
    btn.classList.toggle('is-dimmed', !isMatch);
  });

  document.querySelectorAll('.flow').forEach((flow) => {
    const isMatch = flow.classList.contains(`flow--${keyword}`);
    flow.classList.toggle('is-selected', isMatch);
    flow.classList.toggle('is-dimmed', !isMatch);
  });

  selectedHeading.textContent = labelByKeyword.get(keyword);
  selectedHeading.classList.add('is-visible');
  commitBtn.classList.add('is-visible');
}

// Final view: same stage (flower + flows) with the chosen keyword kept,
// "Together Brewing Tomorrow" as top heading and a CONFIRMED badge.
function commit() {
  if (!selectedKeyword) return;
  recognitionScreen.classList.add('is-final');
}

keywordButtons.forEach((btn) => {
  btn.addEventListener('click', () => selectKeyword(btn.dataset.keyword));
});

commitBtn.addEventListener('click', commit);

// ---- Flow lines: tapered, curved shapes anchored to each flower quadrant ----

// All flows start on the LEFT or RIGHT screen edge (near the corners) and
// pour toward the flower center in a gentle S curve.
// anchor = center of the matching flower piece, in viewBox (1532x1417) coords
const FLOW_CONFIG = {
  partnership: { edge: 'left', edgeY: 0.22, widthScale: 0.6, bendSign: 1, anchor: { x: 390, y: 400 } },
  innovation: { edge: 'right', edgeY: 0.22, widthScale: 1, bendSign: -1, anchor: { x: 1142, y: 400 } },
  sustainable: { edge: 'left', edgeY: 0.78, widthScale: 0.9, bendSign: -1, anchor: { x: 590, y: 960 } },
  value: { edge: 'right', edgeY: 0.78, widthScale: 1, bendSign: 1, anchor: { x: 942, y: 960 } },
};

const VB_W = 1532;
const VB_H = 1417;

const stage = document.querySelector('.stage');
const linesSvg = document.querySelector('.lines-svg');

// Centerline of the soft S curve: two cubic control points offset to
// opposite sides of the straight line, so the flow "pours" toward the center.
function flowGeometry(outer, inner, bend) {
  const dx = inner.x - outer.x;
  const dy = inner.y - outer.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;

  const c1 = {
    x: outer.x + dx / 3 + px * bend,
    y: outer.y + dy / 3 + py * bend,
  };
  const c2 = {
    x: outer.x + (dx * 2) / 3 - px * bend * 0.7,
    y: outer.y + (dy * 2) / 3 - py * bend * 0.7,
  };
  return { px, py, c1, c2 };
}

// Point on the centerline at parameter t (0 = screen edge, 1 = flower).
function flowPointAt(geo, outer, inner, t) {
  const mt = 1 - t;
  const bez = (a, b, c, d) =>
    mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
  return {
    x: bez(outer.x, geo.c1.x, geo.c2.x, inner.x),
    y: bez(outer.y, geo.c1.y, geo.c2.y, inner.y),
  };
}

// Tapered ribbon around the centerline.
function buildWedgePath(geo, outer, inner, outerHalfWidth, innerHalfWidth) {
  const { px, py, c1, c2 } = geo;
  const w1 = outerHalfWidth + (innerHalfWidth - outerHalfWidth) / 3;
  const w2 = outerHalfWidth + ((innerHalfWidth - outerHalfWidth) * 2) / 3;

  const outerLeft = { x: outer.x + px * outerHalfWidth, y: outer.y + py * outerHalfWidth };
  const outerRight = { x: outer.x - px * outerHalfWidth, y: outer.y - py * outerHalfWidth };
  const innerLeft = { x: inner.x + px * innerHalfWidth, y: inner.y + py * innerHalfWidth };
  const innerRight = { x: inner.x - px * innerHalfWidth, y: inner.y - py * innerHalfWidth };

  return (
    `M ${outerLeft.x} ${outerLeft.y} ` +
    `C ${c1.x + px * w1} ${c1.y + py * w1} ${c2.x + px * w2} ${c2.y + py * w2} ${innerLeft.x} ${innerLeft.y} ` +
    `L ${innerRight.x} ${innerRight.y} ` +
    `C ${c2.x - px * w2} ${c2.y - py * w2} ${c1.x - px * w1} ${c1.y - py * w1} ${outerRight.x} ${outerRight.y} Z`
  );
}

function updateFlows() {
  const rect = stage.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (!width || !height) return;

  linesSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const cx = width / 2;
  const cy = height / 2;

  // The flower-svg element is a 45% x 45% box, but the drawing letterboxes
  // inside it (preserveAspectRatio "meet"). Compute the real rendered scale
  // so flow anchors always land on the actual flower, on any screen ratio.
  // Keep in sync with the .flower-svg CSS size.
  const boxW = width * 0.45;
  const boxH = height * 0.45;
  const scale = Math.min(boxW / VB_W, boxH / VB_H);
  const toScreen = (vb) => ({
    x: cx + (vb.x - VB_W / 2) * scale,
    y: cy + (vb.y - VB_H / 2) * scale,
  });

  const minDim = Math.min(width, height);
  const baseOuterWidth = minDim * 0.045;
  const baseInnerWidth = minDim * 0.006;

  Object.entries(FLOW_CONFIG).forEach(([keyword, cfg]) => {
    const outerHalfWidth = baseOuterWidth * cfg.widthScale;
    // Start slightly off-screen: the end cap is tilted (perpendicular to the
    // flow direction), so anchoring exactly at x=0/width leaves a sliver of
    // background. Overshooting keeps the ribbon flush with the screen edge;
    // the SVG viewBox clips the excess.
    const overhang = outerHalfWidth * 1.5;
    const outer = {
      x: cfg.edge === 'left' ? -overhang : width + overhang,
      y: height * cfg.edgeY,
    };
    const inner = toScreen(cfg.anchor);
    const innerHalfWidth = Math.max(baseInnerWidth * cfg.widthScale, 1.5);

    const dx = inner.x - outer.x;
    const dy = inner.y - outer.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = len * 0.12 * cfg.bendSign;
    const geo = flowGeometry(outer, inner, bend);

    const group = document.querySelector(`.flow--${keyword}`);
    const bodyPath = group.querySelector('.flow-body');
    const highlightPath = group.querySelector('.flow-highlight');

    bodyPath.setAttribute('d', buildWedgePath(geo, outer, inner, outerHalfWidth, innerHalfWidth));
    highlightPath.setAttribute(
      'd',
      buildWedgePath(geo, outer, inner, outerHalfWidth * 0.35, innerHalfWidth * 0.6)
    );

    const gradient = document.querySelector(`#grad-${keyword}`);
    gradient.setAttribute('x1', outer.x);
    gradient.setAttribute('y1', outer.y);
    gradient.setAttribute('x2', inner.x);
    gradient.setAttribute('y2', inner.y);

    // Pin the keyword pill directly ON its flow line (centered on the
    // centerline, like the design reference), midway between the screen
    // edge and the flower (t: 0 = screen edge, 1 = flower piece center).
    const btn = document.querySelector(`.keyword[data-keyword="${keyword}"]`);
    const t = 0.45;
    const pos = flowPointAt(geo, outer, inner, t);
    const x = Math.min(
      Math.max(pos.x, btn.offsetWidth / 2 + 6),
      width - btn.offsetWidth / 2 - 6
    );
    btn.style.left = `${x}px`;
    btn.style.top = `${pos.y}px`;
  });
}

const resizeObserver = new ResizeObserver(() => updateFlows());
resizeObserver.observe(stage);
updateFlows();
