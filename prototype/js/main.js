import {
  HEX_SIZE,
  hexKey,
  hexToPixel,
  pixelToHex,
  drawHex,
  getNeighbors,
} from './hex.js';
import {
  createInitialState,
  MODULE_TYPES,
  placeModule,
  extendH2,
  tradeWithEarth,
  computeStats,
  gameTick,
  getPlaceableHexes,
  H2_EXTEND_COST,
} from './game.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let state = createInitialState();
let hoverHex = null;
let toastTimer = null;
let particles = [];

const OFFSET = { x: canvas.width / 2, y: canvas.height / 2 };

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function spawnParticles(q, r, color) {
  const { x, y } = hexToPixel(q, r);
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x + OFFSET.x,
      y: y + OFFSET.y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3 - 1,
      life: 40,
      color,
    });
  }
}

function updateUI() {
  const stats = computeStats(state);
  const set = (id, text, cls = '') => {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = cls;
  };

  set('stat-buoyancy', stats.buoyancy.toFixed(1));
  set('stat-mass', stats.mass.toFixed(1));
  set('stat-net', (stats.netLift >= 0 ? '+' : '') + stats.netLift.toFixed(1),
    stats.netLift >= 0 ? 'positive' : 'negative');
  set('stat-power', `${stats.powerGen.toFixed(0)} / ${stats.powerUse.toFixed(0)} (${stats.powerNet >= 0 ? '+' : ''}${stats.powerNet.toFixed(0)})`,
    stats.powerNet >= 0 ? 'positive' : 'negative');
  set('stat-wind', stats.windLoad.toFixed(0), stats.windLoad > 12 ? 'warning' : '');
  set('stat-corrosion', (stats.corrosion / state.modules.size).toFixed(1) + '%',
    stats.corrosion / state.modules.size > 30 ? 'warning' : '');

  set('res-h2so4', state.resources.h2so4.toFixed(1));
  set('res-h2', state.resources.h2.toFixed(1));
  set('res-sulfur', state.resources.sulfur.toFixed(1));
  set('res-credits', state.resources.credits.toFixed(0));

  document.getElementById('tick-counter').textContent = `Tick ${state.tick}`;

  const sel = state.selectedHex;
  const info = document.getElementById('selected-info');
  const extendBtn = document.getElementById('btn-extend-h2');
  if (sel && state.modules.has(sel)) {
    const mod = state.modules.get(sel);
    const def = MODULE_TYPES[mod.type];
    info.textContent = `${def.name} at (${sel})\nH₂ layers: ${mod.h2Layers} | Corrosion: ${mod.corrosion.toFixed(0)}%`;
    extendBtn.disabled = state.resources.h2 < H2_EXTEND_COST || mod.h2Layers >= 4;
  } else {
    info.textContent = 'Click a module to select.';
    extendBtn.disabled = true;
  }
}

function buildButtons() {
  const container = document.getElementById('build-buttons');
  container.innerHTML = '';
  for (const type of ['isru', 'solar', 'h2cell']) {
    const def = MODULE_TYPES[type];
    const btn = document.createElement('button');
    btn.className = 'build-btn' + (state.selectedBuild === type ? ' active' : '');
    btn.innerHTML = `<span class="swatch" style="background:${def.color}"></span><span><strong>${def.name}</strong><br><small>${formatCost(def.cost)}</small></span>`;
    btn.addEventListener('click', () => {
      state = { ...state, selectedBuild: type };
      buildButtons();
    });
    container.appendChild(btn);
  }
}

function formatCost(cost) {
  return Object.entries(cost).map(([k, v]) => `${v} ${k.toUpperCase()}`).join(', ');
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Venus sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#3d2010');
  grad.addColorStop(0.5, '#2a1510');
  grad.addColorStop(1, '#1a0e0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cloud wisps
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#f0883e';
    ctx.beginPath();
    ctx.ellipse(
      100 + i * 130 + Math.sin(state.tick * 0.05 + i) * 20,
      80 + i * 90,
      120, 30, 0, 0, Math.PI * 2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const placeable = getPlaceableHexes(state);
  const visible = new Set([...state.modules.keys(), ...placeable]);

  // Expand visible for hover ring
  if (hoverHex) visible.add(hexKey(hoverHex.q, hoverHex.r));

  for (const key of visible) {
    const [q, r] = key.split(',').map(Number);
    const { x, y } = hexToPixel(q, r);
    const cx = x + OFFSET.x;
    const cy = y + OFFSET.y;

    const mod = state.modules.get(key);
    const isPlaceable = placeable.has(key);
    const isHover = hoverHex && hoverHex.q === q && hoverHex.r === r;
    const isSelected = state.selectedHex === key;

    if (mod) {
      const def = MODULE_TYPES[mod.type];
      drawHex(ctx, cx, cy, HEX_SIZE - 2, def.color + '55', def.color, isSelected ? 3 : 1.5);

      // H2 envelope rings
      for (let layer = 1; layer < mod.h2Layers; layer++) {
        drawHex(ctx, cx, cy - layer * 4, HEX_SIZE - 6 - layer * 2, null, '#a371f788', 1);
      }

      // Corrosion overlay
      if (mod.corrosion > 20) {
        ctx.globalAlpha = mod.corrosion / 200;
        drawHex(ctx, cx, cy, HEX_SIZE - 4, '#f8514966', null);
        ctx.globalAlpha = 1;
      }

      // Label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const abbrev = { core: 'CORE', isru: 'ISRU', solar: 'SOL', h2cell: 'H₂' };
      ctx.fillText(abbrev[mod.type] || mod.type, cx, cy);
    } else if (isPlaceable) {
      const fill = isHover ? '#39d4d433' : '#ffffff08';
      const stroke = isHover ? '#39d4d4' : '#ffffff22';
      drawHex(ctx, cx, cy, HEX_SIZE - 4, fill, stroke, isHover ? 2 : 1);
      if (isHover) {
        ctx.fillStyle = '#39d4d4';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', cx, cy);
      }
    }
  }

  // Particles
  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return p.life > 0;
  });

  updateUI();
}

function canvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX - OFFSET.x,
    y: (e.clientY - rect.top) * scaleY - OFFSET.y,
  };
}

canvas.addEventListener('mousemove', (e) => {
  const { x, y } = canvasCoords(e);
  hoverHex = pixelToHex(x, y);
  draw();
});

canvas.addEventListener('mouseleave', () => {
  hoverHex = null;
  draw();
});

canvas.addEventListener('click', (e) => {
  const { x, y } = canvasCoords(e);
  const { q, r } = pixelToHex(x, y);
  const key = hexKey(q, r);

  if (state.modules.has(key)) {
    state = { ...state, selectedHex: key };
    draw();
    return;
  }

  const result = placeModule(state, q, r);
  if (result.ok) {
    state = result.state;
    spawnParticles(q, r, MODULE_TYPES[state.selectedBuild].color);
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-extend-h2').addEventListener('click', () => {
  if (!state.selectedHex) return;
  const result = extendH2(state, state.selectedHex);
  if (result.ok) {
    state = result.state;
    const [q, r] = state.selectedHex.split(',').map(Number);
    spawnParticles(q, r, '#a371f7');
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-trade').addEventListener('click', () => {
  const result = tradeWithEarth(state);
  if (result.ok) {
    state = result.state;
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
  draw();
});

setInterval(() => {
  state = gameTick(state);
  if (state.lastEvents?.length) {
    showToast(state.lastEvents[state.lastEvents.length - 1]);
  }
  draw();
}, 1000);

buildButtons();
draw();
