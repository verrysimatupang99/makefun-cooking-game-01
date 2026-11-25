// world.js — game state for Dapur Kilat: chef, stations, particles, timers.
// One job: own the mutable state and the small helpers that move it.

import { CANVAS_W, CHEF_R, PLAY_BOTTOM, PLAY_TOP, SOLIDS, TIMING } from './config.js';
import { nextSpawnDelay } from './orders.js';

export function createGame() {
  return {
    screen: 'title', // title | playing | paused | end
    timeLeft: TIMING.shiftLength,
    elapsed: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    dishes: 0,
    served: 0,
    wrong: 0,
    hearts: 3,
    chef: { x: 640, y: 560, tx: 640, ty: 560, dir: 1, moving: false, walkPhase: 0, pendingStation: null },
    carried: null, // item id string, or { plate: true, items: [...] }
    burners: [
      { item: null, progress: 0, state: 'empty', burnT: 0 },
      { item: null, progress: 0, state: 'empty', burnT: 0 },
    ],
    board: { item: null, progress: 0, state: 'empty' },
    plate: [], // finished item ids sitting on the assembly counter
    windowPlate: null, // a finished dish displayed at the serving window
    orders: [],
    spawnT: 6,
    particles: [],
    floaters: [],
    shake: 0,
    flash: 0,
    flashColor: '#d92632',
    rush: false,
    rushFlash: 0,
    endReason: null, // 'time' | 'hearts'
    stars: 0,
    muted: false,
    shotMode: null,
    shotT: 0,
    hint: '',
    hintT: 0,
  };
}

export function resetGame(state) {
  const fresh = createGame();
  fresh.screen = 'playing';
  fresh.spawnT = nextSpawnDelay(false);
  Object.assign(state, fresh);
}

export function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color: color || '#f2b705', life: 1.4, maxLife: 1.4 });
}

export function addParticles(state, x, y, n, color, kind) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 20 + Math.random() * 70;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 30,
      life: 0.5 + Math.random() * 0.7,
      maxLife: 1.2,
      size: 2 + Math.random() * 4,
      color,
      kind: kind || 'spark',
    });
  }
}

export function addSteam(state, x, y) {
  state.particles.push({
    x: x + (Math.random() - 0.5) * 24, y,
    vx: (Math.random() - 0.5) * 8, vy: -28 - Math.random() * 18,
    life: 0.9 + Math.random() * 0.6, maxLife: 1.5,
    size: 5 + Math.random() * 7, color: 'rgba(255,255,255,0.55)', kind: 'steam',
  });
}

export function updateParticles(state, dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'steam') { p.vy -= 12 * dt; p.size += 6 * dt; }
    if (p.kind === 'spark') p.vy += 140 * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floaters) { f.y -= 34 * dt; f.life -= dt; }
  state.floaters = state.floaters.filter((f) => f.life > 0);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 2.2);
  if (state.hintT > 0) state.hintT -= dt;
  if (state.rushFlash > 0) state.rushFlash -= dt;
}

export function showHint(state, text) {
  state.hint = text;
  state.hintT = 2.2;
}

// keep the chef inside the play area and push them out of solid counters
export function collideChef(chef) {
  chef.x = Math.max(20 + CHEF_R, Math.min(CANVAS_W - 20 - CHEF_R, chef.x));
  chef.y = Math.max(PLAY_TOP + 8 + CHEF_R, Math.min(PLAY_BOTTOM - CHEF_R, chef.y));
  for (const s of SOLIDS) {
    const cx = Math.max(s.x, Math.min(chef.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(chef.y, s.y + s.h));
    const dx = chef.x - cx;
    const dy = chef.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < CHEF_R * CHEF_R && d2 > 0.001) {
      const d = Math.sqrt(d2);
      chef.x = cx + (dx / d) * CHEF_R;
      chef.y = cy + (dy / d) * CHEF_R;
    } else if (d2 <= 0.001) {
      chef.y = s.y + s.h + CHEF_R;
    }
  }
}

export function carriedLabel(carried) {
  if (!carried) return null;
  if (typeof carried === 'object' && carried.plate) return 'Piring: ' + carried.items.length + ' isi';
  return carried;
}
