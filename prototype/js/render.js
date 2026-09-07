import { drawHex, HEX_DRAW_RADIUS } from './hex.js';

/** Pre-allocated mist motes — updated in-place each frame. */
const MIST_COUNT = 28;
const mistMotes = Array.from({ length: MIST_COUNT }, (_, i) => ({
  x: Math.random(),
  y: Math.random(),
  speed: 0.00008 + Math.random() * 0.00012,
  size: 0.8 + Math.random() * 1.6,
  alpha: 0.04 + Math.random() * 0.06,
  phase: Math.random() * Math.PI * 2,
}));

function parseHexColor(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgba(hex, a) {
  const { r, g, b } = parseHexColor(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function lighten(hex, amount) {
  const { r, g, b } = parseHexColor(hex);
  const mix = (c) => Math.min(255, Math.round(c + (255 - c) * amount));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

/**
 * Layered Venus sky: radial haze, depth gradient, drifting cloud bands.
 */
export function drawVenusSky(ctx, w, h, tick = 0) {
  const t = tick * 0.02;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#4a2818');
  skyGrad.addColorStop(0.22, '#3d2018');
  skyGrad.addColorStop(0.55, '#2a1512');
  skyGrad.addColorStop(1, '#120a0c');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  const haze = ctx.createRadialGradient(w * 0.5, h * 0.28, 0, w * 0.5, h * 0.35, w * 0.72);
  haze.addColorStop(0, 'rgba(240, 140, 60, 0.28)');
  haze.addColorStop(0.45, 'rgba(200, 90, 40, 0.12)');
  haze.addColorStop(1, 'rgba(80, 30, 20, 0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, w, h);

  const tealHaze = ctx.createRadialGradient(w * 0.82, h * 0.65, 0, w * 0.82, h * 0.65, w * 0.45);
  tealHaze.addColorStop(0, 'rgba(46, 196, 176, 0.06)');
  tealHaze.addColorStop(1, 'rgba(46, 196, 176, 0)');
  ctx.fillStyle = tealHaze;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  for (let band = 0; band < 6; band++) {
    const drift = Math.sin(t * 0.4 + band * 1.1) * 18 + Math.cos(t * 0.25 + band) * 8;
    const yBase = h * (0.12 + band * 0.14) + drift * 0.3;
    const alpha = 0.035 + (band % 3) * 0.012;
    ctx.fillStyle = band % 2 === 0
      ? `rgba(255, 170, 90, ${alpha})`
      : `rgba(180, 120, 100, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.ellipse(
      w * 0.5 + drift,
      yBase,
      w * (0.55 + band * 0.04),
      22 + band * 4,
      0, 0, Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();

  const horizon = ctx.createLinearGradient(0, h * 0.7, 0, h);
  horizon.addColorStop(0, 'rgba(20, 12, 14, 0)');
  horizon.addColorStop(1, 'rgba(8, 4, 6, 0.55)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, w, h);
}

/** Sparse drifting mist motes — cheap per-frame update. */
export function drawMistMotes(ctx, w, h, tick = 0) {
  const t = tick * 0.015;
  ctx.save();
  for (let i = 0; i < MIST_COUNT; i++) {
    const m = mistMotes[i];
    m.x += m.speed;
    if (m.x > 1.05) m.x = -0.05;
    const px = m.x * w;
    const py = m.y * h + Math.sin(t + m.phase) * 6;
    ctx.globalAlpha = m.alpha * (0.7 + 0.3 * Math.sin(t * 0.8 + m.phase));
    ctx.fillStyle = i % 3 === 0 ? '#ffd4a8' : '#c8e8e0';
    ctx.beginPath();
    ctx.arc(px, py, m.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Soft inner vignette framing the floating continent viewport. */
export function drawViewportVignette(ctx, w, h) {
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.48, w * 0.18, w * 0.5, h * 0.48, w * 0.58);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.75, 'rgba(0,0,0,0.08)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function drawHexGlow(ctx, cx, cy, size, color, blur = 12, alpha = 0.35) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.globalAlpha = alpha;
  drawHex(ctx, cx, cy, size - 1, color, null);
  ctx.restore();
}

function drawHexRimLight(ctx, cx, cy, size, baseColor) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = lighten(baseColor, 0.55);
  ctx.lineWidth = 1.5;
  drawHex(ctx, cx, cy, size - 3, null, lighten(baseColor, 0.55), 1.5);
  ctx.restore();
}

/** Occupied module hex with fill, rim light, and optional selection ring. */
export function drawModuleHex(ctx, cx, cy, def, isSelected) {
  const color = def.color;
  const fill = rgba(color, 0.38);
  const stroke = rgba(color, 0.85);
  const lw = isSelected ? 2.5 : 1.5;

  if (isSelected) {
    drawHexGlow(ctx, cx, cy, HEX_DRAW_RADIUS + 4, color, 16, 0.45);
    ctx.save();
    ctx.strokeStyle = rgba(color, 0.5);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    drawHex(ctx, cx, cy, HEX_DRAW_RADIUS + 6, null, rgba(color, 0.5), 1);
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawHex(ctx, cx, cy, HEX_DRAW_RADIUS, fill, stroke, lw);
  drawHexRimLight(ctx, cx, cy, HEX_DRAW_RADIUS, color);

  const innerGrad = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy, HEX_DRAW_RADIUS);
  innerGrad.addColorStop(0, rgba('#ffffff', 0.12));
  innerGrad.addColorStop(0.6, rgba(color, 0.08));
  innerGrad.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = innerGrad;
  drawHex(ctx, cx, cy, HEX_DRAW_RADIUS - 2, innerGrad, null);
}

/** Stacked H₂ cell layers above the base hex. */
export function drawH2Layers(ctx, cx, cy, layers) {
  for (let layer = 1; layer < layers; layer++) {
    const offsetY = layer * 5;
    const shrink = layer * 2;
    const layerColor = '#a371f7';
    ctx.save();
    ctx.globalAlpha = 0.55 - layer * 0.08;
    drawHex(
      ctx, cx, cy - offsetY, HEX_DRAW_RADIUS - 4 - shrink,
      rgba(layerColor, 0.25),
      rgba(layerColor, 0.7),
      1,
    );
    ctx.globalAlpha = 0.2;
    drawHexGlow(ctx, cx, cy - offsetY, HEX_DRAW_RADIUS - 4 - shrink, layerColor, 8, 0.3);
    ctx.restore();
  }
}

/** Corrosion tint and subtle scar marks on a module. */
export function drawCorrosionOverlay(ctx, cx, cy, corrosion) {
  if (corrosion <= 8) return;
  const intensity = Math.min(1, corrosion / 100);
  ctx.save();
  ctx.globalAlpha = intensity * 0.35;
  drawHex(ctx, cx, cy, HEX_DRAW_RADIUS, rgba('#f85149', 0.4), null);
  ctx.globalAlpha = intensity * 0.5;
  ctx.strokeStyle = rgba('#8b2020', 0.6);
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI / 3) * i + 0.4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
    ctx.lineTo(cx + Math.cos(angle) * (HEX_DRAW_RADIUS - 6), cy + Math.sin(angle) * (HEX_DRAW_RADIUS - 6));
    ctx.stroke();
  }
  ctx.restore();
}

/** Empty / placeable hex with polished build-mode affordance. */
export function drawPlaceableHex(ctx, cx, cy, { inBuildMode, isHover }) {
  if (inBuildMode) {
    drawHexGlow(ctx, cx, cy, HEX_DRAW_RADIUS, '#48d4d4', isHover ? 14 : 10, isHover ? 0.4 : 0.25);
    drawHex(
      ctx, cx, cy, HEX_DRAW_RADIUS,
      rgba('#48d4d4', isHover ? 0.22 : 0.12),
      rgba('#48d4d4', isHover ? 0.95 : 0.65),
      isHover ? 2 : 1.5,
    );
  } else if (isHover) {
    drawHex(
      ctx, cx, cy, HEX_DRAW_RADIUS,
      rgba('#48d4d4', 0.1),
      rgba('#48d4d4', 0.45),
      1,
    );
  } else {
    drawHex(
      ctx, cx, cy, HEX_DRAW_RADIUS,
      rgba('#ffffff', 0.03),
      rgba('#ffffff', 0.1),
      0.75,
    );
  }
}

function drawBuildPreviewPlus(ctx, cx, cy, inBuildMode, isHover) {
  if (!inBuildMode && !isHover) return;
  ctx.save();
  ctx.fillStyle = inBuildMode ? rgba('#48d4d4', 0.85) : rgba('#48d4d4', 0.55);
  ctx.font = inBuildMode ? 'bold 18px sans-serif' : '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', cx, cy + 1);
  ctx.restore();
}

/** Canvas-drawn module iconography — instantly distinguishable types. */
export function drawModuleIcon(ctx, cx, cy, type, color) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = HEX_DRAW_RADIUS * 0.42;
  const ink = lighten(color, 0.7);
  ctx.strokeStyle = ink;
  ctx.fillStyle = rgba(color, 0.85);
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'core': {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba('#1a1008', 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.35);
        ctx.lineTo(Math.cos(a) * s * 0.75, Math.sin(a) * s * 0.75);
        ctx.stroke();
      }
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'intake': {
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.15);
      ctx.lineTo(0, s * 0.55);
      ctx.lineTo(s * 0.6, -s * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.22, -s * 0.55);
        ctx.lineTo(i * s * 0.22, -s * 0.2);
        ctx.stroke();
      }
      break;
    }
    case 'isru': {
      ctx.strokeRect(-s * 0.5, -s * 0.45, s, s * 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.22, Math.sin(a) * s * 0.22);
        ctx.lineTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(s * 0.5, 0);
      ctx.lineTo(s * 0.75, 0);
      ctx.moveTo(-s * 0.5, s * 0.2);
      ctx.lineTo(-s * 0.75, s * 0.35);
      ctx.stroke();
      break;
    }
    case 'solar': {
      const pw = s * 0.22;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          ctx.fillRect(
            -s * 0.55 + col * (pw + 2),
            -s * 0.5 + row * (pw + 2),
            pw, pw,
          );
        }
      }
      ctx.strokeStyle = ink;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.75 + i * 0.18;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85 - s * 0.1);
        ctx.lineTo(Math.cos(a) * s * 1.05, Math.sin(a) * s * 1.05 - s * 0.1);
        ctx.stroke();
      }
      break;
    }
    case 'h2cell': {
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.15, s * 0.45, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, s * 0.4);
      ctx.lineTo(0, s * 0.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, s * 0.65);
      ctx.lineTo(s * 0.15, s * 0.65);
      ctx.stroke();
      break;
    }
    case 'electrolyzer': {
      ctx.strokeRect(-s * 0.55, -s * 0.35, s * 1.1, s * 0.7);
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, s * 0.35);
      ctx.lineTo(-s * 0.35, s * 0.55);
      ctx.moveTo(s * 0.35, s * 0.35);
      ctx.lineTo(s * 0.35, s * 0.55);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const y = -s * 0.2 + i * s * 0.2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.45, y);
        ctx.lineTo(s * 0.45, y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(-s * 0.15, -s * 0.55, s * 0.12, 0, Math.PI * 2);
      ctx.arc(s * 0.15, -s * 0.55, s * 0.12, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    default:
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type.slice(0, 4).toUpperCase(), 0, 0);
  }
  ctx.restore();
}

/** Full occupied hex render pass. */
export function drawOccupiedHex(ctx, cx, cy, mod, def, isSelected) {
  drawModuleHex(ctx, cx, cy, def, isSelected);
  if (mod.type === 'h2cell') {
    drawH2Layers(ctx, cx, cy, mod.h2Layers);
  }
  drawCorrosionOverlay(ctx, cx, cy, mod.corrosion ?? 0);
  drawModuleIcon(ctx, cx, cy, mod.type, def.color);
}

/** Full empty / placeable hex render pass. */
export function drawEmptyHex(ctx, cx, cy, opts) {
  drawPlaceableHex(ctx, cx, cy, opts);
  drawBuildPreviewPlus(ctx, cx, cy, opts.inBuildMode, opts.isHover);
}
