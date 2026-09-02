/** Axial hex coordinate utilities (flat-top). */

export const HEX_SIZE = 36;

/** Circumradius used for drawing — matches hexToPixel layout. */
export const HEX_DRAW_RADIUS = HEX_SIZE;

const SQRT3 = Math.sqrt(3);

export function hexKey(q, r) {
  return `${q},${r}`;
}

export function parseKey(key) {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function hexToPixel(q, r) {
  const x = HEX_SIZE * (3 / 2) * q;
  const y = HEX_SIZE * (SQRT3 / 2 * q + SQRT3 * r);
  return { x, y };
}

export function pixelToHex(px, py) {
  const q = (2 / 3 * px) / HEX_SIZE;
  const r = (-1 / 3 * px + SQRT3 / 3 * py) / HEX_SIZE;
  return axialRound(q, r);
}

function axialRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

export const NEIGHBORS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function getNeighbors(q, r) {
  return NEIGHBORS.map((d) => ({ q: q + d.q, r: r + d.r }));
}

/** Flat-top hex: first vertex at 30° (matches pointInHex / axial layout). */
const FLAT_TOP_ANGLE_OFFSET = Math.PI / 6;

export function drawHex(ctx, cx, cy, size, fill, stroke, lineWidth = 2) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + FLAT_TOP_ANGLE_OFFSET;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function pointInHex(px, py, cx, cy, size) {
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  const halfH = (SQRT3 / 2) * size;
  if (dx > size || dy > halfH) return false;
  return halfH * size - halfH * dx - (size / 2) * dy >= 0;
}

/**
 * Find the hex key under a pixel, using the same center + radius as drawHex.
 * @param {number} px x in hex layout space (canvas coords minus offset)
 * @param {number} py y in hex layout space
 * @param {Iterable<string>} keys candidate hex keys to test
 * @returns {{ q: number, r: number, key: string } | null}
 */
export function hexAtPixel(px, py, keys) {
  let best = null;
  let bestDist = Infinity;
  for (const key of keys) {
    const { q, r } = parseKey(key);
    const { x, y } = hexToPixel(q, r);
    if (!pointInHex(px, py, x, y, HEX_DRAW_RADIUS)) continue;
    const dist = (px - x) ** 2 + (py - y) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = { q, r, key };
    }
  }
  return best;
}
