// render.js — draws the whole kitchen, food, chef, tickets and HUD on canvas.
// One job: every pixel the player sees, in one place, from the state.

import { CANVAS_H, CANVAS_W, ITEMS, PALETTE, PLAY_BOTTOM, PLAY_TOP, STATIONS, TIMING } from './config.js';
import { nearestStation, plateCompletesRecipe } from './stations.js';

// ---------- tiny canvas helpers ----------
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 700) {
  ctx.font = weight + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function textOutline(ctx, s, x, y, size, color, outline, align = 'center', weight = 800) {
  ctx.font = weight + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 6);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// ---------- food icons: drawn appetisingly, no image files ----------
export function drawFood(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 20; // unit scale
  switch (id) {
    case 'nasi-mentah': {
      ctx.fillStyle = '#d9b380';
      rr(ctx, -14 * u, -6 * u, 28 * u, 20 * u, 5 * u);
      ctx.fill();
      ctx.fillStyle = '#f7ead1';
      ctx.beginPath(); ctx.ellipse(0, -6 * u, 12 * u, 5 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc((-8 + i * 4) * u, (-8 + (i % 2) * 3) * u, 1.6 * u, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case 'nasi-matang': {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(0, 4 * u, 17 * u, 11 * u, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#d8cdb4';
      ctx.lineWidth = 1.5 * u;
      ctx.beginPath(); ctx.ellipse(0, 4 * u, 17 * u, 11 * u, 0, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#f1e6c8';
      ctx.beginPath(); ctx.ellipse(0, 4 * u, 17 * u, 3 * u, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-6 * u, -4 * u, 3 * u, 0, Math.PI * 2); ctx.arc(3 * u, -7 * u, 3.4 * u, 0, Math.PI * 2); ctx.arc(8 * u, -2 * u, 2.6 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ayam-mentah': {
      ctx.fillStyle = '#f2a0a8';
      ctx.beginPath(); ctx.ellipse(0, 2 * u, 15 * u, 11 * u, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e87f8b';
      ctx.beginPath(); ctx.ellipse(-3 * u, 0, 8 * u, 5 * u, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.arc(12 * u, -8 * u, 3.4 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ayam-potong': {
      ctx.fillStyle = '#f2a0a8';
      for (const [dx, dy] of [[-7, 2], [2, -3], [8, 4]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, 6.5 * u, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#e87f8b';
      ctx.beginPath(); ctx.arc(-7 * u, 2 * u, 3 * u, 0, Math.PI * 2); ctx.arc(8 * u, 4 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'ayam-goreng': {
      ctx.fillStyle = '#c97b1e';
      ctx.beginPath(); ctx.ellipse(0, 2 * u, 15 * u, 11 * u, -0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8a83c';
      ctx.beginPath(); ctx.ellipse(-2 * u, 0, 10 * u, 7 * u, -0.25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5426';
      ctx.beginPath(); ctx.arc(-8 * u, -2 * u, 1.8 * u, 0, Math.PI * 2); ctx.arc(2 * u, 4 * u, 1.8 * u, 0, Math.PI * 2); ctx.arc(6 * u, -4 * u, 1.5 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.arc(13 * u, -9 * u, 3.2 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'telur-mentah': {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.ellipse(0, 0, 11 * u, 14 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8dcc0';
      ctx.beginPath(); ctx.ellipse(0, 3 * u, 8 * u, 10 * u, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'telur-dadar': {
      ctx.fillStyle = '#e8a83c';
      ctx.beginPath(); ctx.ellipse(0, 2 * u, 17 * u, 10 * u, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#f7cf5a';
      ctx.beginPath(); ctx.ellipse(0, 1 * u, 14 * u, 7 * u, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c97b1e';
      ctx.beginPath(); ctx.arc(-6 * u, -1 * u, 1.6 * u, 0, Math.PI * 2); ctx.arc(5 * u, -3 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'sayur-mentah': {
      ctx.fillStyle = '#2e9e5b';
      ctx.beginPath(); ctx.arc(0, 2 * u, 13 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#57c785';
      ctx.beginPath(); ctx.arc(-4 * u, -2 * u, 8 * u, 0, Math.PI * 2); ctx.arc(5 * u, -3 * u, 6 * u, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1e7a44';
      ctx.lineWidth = 1.6 * u;
      ctx.beginPath(); ctx.moveTo(-6 * u, -6 * u); ctx.quadraticCurveTo(0, 2 * u, 6 * u, -6 * u); ctx.stroke();
      break;
    }
    case 'sayur-potong': {
      ctx.fillStyle = '#2e9e5b';
      for (const [dx, dy, r] of [[-8, 3, 5], [0, -4, 5.5], [8, 3, 5], [-2, 6, 4.5]]) {
        ctx.beginPath(); ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#7ed491';
      ctx.beginPath(); ctx.arc(-8 * u, 3 * u, 2 * u, 0, Math.PI * 2); ctx.arc(0, -4 * u, 2 * u, 0, Math.PI * 2); ctx.arc(8 * u, 3 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'sambal': {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.ellipse(0, 6 * u, 14 * u, 7 * u, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#d92632';
      ctx.beginPath(); ctx.ellipse(0, 4 * u, 13 * u, 8 * u, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#f0555f';
      ctx.beginPath(); ctx.arc(-4 * u, -1 * u, 4 * u, 0, Math.PI * 2); ctx.arc(5 * u, 0, 3 * u, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e9e5b';
      ctx.beginPath(); ctx.arc(2 * u, 2 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'hangus': {
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath(); ctx.ellipse(0, 3 * u, 14 * u, 9 * u, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#555';
      ctx.beginPath(); ctx.arc(-5 * u, -2 * u, 2.4 * u, 0, Math.PI * 2); ctx.arc(4 * u, -3 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default:
      ctx.fillStyle = '#999';
      ctx.beginPath(); ctx.arc(0, 0, 10 * u, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------- kitchen ----------
function drawFloor(ctx) {
  const tile = 64;
  for (let y = PLAY_TOP; y < PLAY_BOTTOM; y += tile) {
    for (let x = 0; x < CANVAS_W; x += tile) {
      const even = ((x / tile) + (y / tile)) % 2 === 0;
      ctx.fillStyle = even ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(0, PLAY_TOP, CANVAS_W, 6);
}

function drawStationSign(ctx, x, y, label) {
  ctx.fillStyle = PALETTE.woodDark;
  rr(ctx, x - 62, y - 15, 124, 30, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.wood;
  rr(ctx, x - 58, y - 11, 116, 22, 6);
  ctx.fill();
  text(ctx, label, x, y + 1, 15, '#fff8e7');
}

function drawCrates(ctx, state, nearId, t) {
  for (const c of STATIONS.crates) {
    const near = nearId === c.id;
    ctx.fillStyle = near ? '#e8b06a' : PALETTE.wood;
    rr(ctx, c.x, c.y, c.w, c.h, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 4;
    rr(ctx, c.x, c.y, c.w, c.h, 10);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(138,84,38,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(c.x + 6, c.y + 30); ctx.lineTo(c.x + c.w - 6, c.y + 30); ctx.stroke();
    drawFood(ctx, c.item, c.x + c.w / 2, c.y + 30, 26);
    text(ctx, c.label, c.x + c.w / 2, c.y + c.h - 16, 16, '#fff8e7');
    if (near) {
      ctx.strokeStyle = '#f2b705';
      ctx.lineWidth = 4;
      rr(ctx, c.x - 3, c.y - 3, c.w + 6, c.h + 6, 12);
      ctx.stroke();
    }
  }
}

function drawStove(ctx, state, nearId, t) {
  const s = STATIONS.stove;
  const near = nearId === 'stove';
  ctx.fillStyle = PALETTE.steelDark;
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.fillStyle = '#3d4c55';
  rr(ctx, s.x + 8, s.y + 8, s.w - 16, s.h - 16, 8);
  ctx.fill();
  // highlight BEFORE the sign, so its top edge never strikes through the label
  if (near) {
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 4;
    rr(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 14);
    ctx.stroke();
  }
  drawStationSign(ctx, s.x + s.w / 2, s.y - 2, 'KOMPOR');
  state.burners.forEach((b, i) => {
    const burner = s.burners[i];
    // burner ring
    ctx.fillStyle = '#1c2730';
    ctx.beginPath(); ctx.arc(burner.x, burner.y, burner.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c3a44';
    ctx.beginPath(); ctx.arc(burner.x, burner.y, burner.r - 8, 0, Math.PI * 2); ctx.fill();
    if (b.state === 'cooking') {
      // flickering flame
      const fl = 0.7 + 0.3 * Math.sin(t * 14 + i * 2);
      ctx.fillStyle = 'rgba(245,158,11,' + (0.55 * fl) + ')';
      ctx.beginPath(); ctx.arc(burner.x, burner.y, burner.r - 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(217,38,50,' + (0.4 * fl) + ')';
      ctx.beginPath(); ctx.arc(burner.x, burner.y, burner.r - 16, 0, Math.PI * 2); ctx.fill();
    }
    if (b.item) drawFood(ctx, b.item, burner.x, burner.y, 34);
    if (b.state === 'cooking') {
      const p = b.progress;
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(burner.x, burner.y, burner.r + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = p > 0.8 ? '#f59e0b' : '#2e9e5b';
      ctx.beginPath(); ctx.arc(burner.x, burner.y, burner.r + 8, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    }
    if (b.state === 'done') {
      textOutline(ctx, 'MATANG!', burner.x, burner.y - burner.r - 16, 15, '#7ed491', '#17324a');
    }
    if (b.state === 'burnt') {
      textOutline(ctx, 'HANGUS!', burner.x, burner.y - burner.r - 16, 15, '#ff6b6b', '#17324a');
    }
  });
}

function drawBoard(ctx, state, nearId, t) {
  const b = STATIONS.board;
  const near = nearId === 'board';
  ctx.fillStyle = '#e8c48d';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#b98a4e';
  ctx.lineWidth = 4;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  // highlight BEFORE the sign, so its top edge never strikes through the label
  if (near) {
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 4;
    rr(ctx, b.x - 3, b.y - 3, b.w + 6, b.h + 6, 14);
    ctx.stroke();
  }
  drawStationSign(ctx, b.x + b.w / 2, b.y - 2, 'TALENAN');
  // knife
  ctx.save();
  ctx.translate(b.x + b.w - 52, b.y + 34);
  ctx.rotate(0.5);
  ctx.fillStyle = '#cfd8dc';
  rr(ctx, -26, -5, 40, 10, 4);
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  rr(ctx, 14, -4, 18, 8, 3);
  ctx.fill();
  ctx.restore();
  if (state.board.item) drawFood(ctx, state.board.item, b.cx, b.cy, 36);
  if (state.board.state === 'chopping') {
    const p = state.board.progress;
    ctx.fillStyle = 'rgba(23,50,74,0.85)';
    rr(ctx, b.cx - 70, b.cy - 52, 140, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#f2b705';
    rr(ctx, b.cx - 66, b.cy - 48, 132 * Math.min(1, p), 6, 3);
    ctx.fill();
    text(ctx, 'TAHAN E — CINCANG!', b.cx, b.cy + 58, 14, '#17324a');
  } else if (state.board.state === 'done') {
    textOutline(ctx, 'SIAP DIAMBIL!', b.cx, b.cy + 58, 14, '#7ed491', '#17324a');
  }
}

function drawPlate(ctx, x, y, items, scale) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(x, y, 52 * scale, 34 * scale, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8cdb4';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x, y, 52 * scale, 34 * scale, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f1e6c8';
  ctx.beginPath(); ctx.ellipse(x, y, 38 * scale, 24 * scale, 0, 0, Math.PI * 2); ctx.fill();
  const spots = [-30, 0, 30];
  items.forEach((id, i) => {
    ctx.fillStyle = 'rgba(23,50,74,0.12)';
    ctx.beginPath(); ctx.ellipse(x + spots[i] * scale, y + 6 * scale, 17 * scale, 7 * scale, 0, 0, Math.PI * 2); ctx.fill();
    drawFood(ctx, id, x + spots[i] * scale, y - 2 * scale, 26 * scale);
  });
  for (let i = items.length; i < 3; i++) {
    ctx.strokeStyle = 'rgba(23,50,74,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + spots[i] * scale, y - 2 * scale, 13 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawAssembly(ctx, state, nearId, t) {
  const a = STATIONS.assembly;
  const near = nearId === 'assembly';
  ctx.fillStyle = PALETTE.woodDark;
  rr(ctx, a.x, a.y, a.w, a.h, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, a.x + 8, a.y + 8, a.w - 16, a.h - 16, 8);
  ctx.fill();
  // highlight BEFORE the sign, so its top edge never strikes through the label
  if (near) {
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 4;
    rr(ctx, a.x - 3, a.y - 3, a.w + 6, a.h + 6, 14);
    ctx.stroke();
  }
  drawStationSign(ctx, a.x + a.w / 2, a.y - 2, 'MEJA RAKIT');
  // bigger plate (1.35x) so the mid-assembly dish reads clearly as the hero
  drawPlate(ctx, a.plateX, a.plateY, state.plate, 1.35);
  const complete = plateCompletesRecipe(state.plate);
  if (complete) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    ctx.strokeStyle = 'rgba(46,158,91,' + pulse + ')';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(a.plateX, a.plateY, 84, 57, 0, 0, Math.PI * 2); ctx.stroke();
    textOutline(ctx, 'SIAP DISAJIKAN!', a.plateX, a.plateY + 66, 16, '#2e9e5b', '#fff8e7');
  }
}

function drawWindow(ctx, state, nearId, t) {
  const w = STATIONS.window;
  const near = nearId === 'window';
  // striped mini-awning
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE.red : '#fff8e7';
    ctx.fillRect(w.x + i * 30.5, w.y - 26, 30.5, 26);
  }
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, w.x, w.y, w.w, w.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 5;
  rr(ctx, w.x, w.y, w.w, w.h, 10);
  ctx.stroke();
  // highlight BEFORE the sign, so its top edge never strikes through the label
  if (near) {
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 4;
    rr(ctx, w.x - 3, w.y - 3, w.w + 6, w.h + 6, 12);
    ctx.stroke();
  }
  drawStationSign(ctx, w.x + w.w / 2, w.y + 22, 'JENDELA SAJI');
  // service bell
  ctx.fillStyle = '#f2b705';
  ctx.beginPath(); ctx.arc(w.x + 34, w.y + 66, 14, Math.PI, 0); ctx.fill();
  ctx.fillRect(w.x + 20, w.y + 66, 28, 5);
  ctx.fillStyle = '#8a5426';
  ctx.fillRect(w.x + 31, w.y + 52, 6, 8);
  if (state.windowPlate) {
    drawPlate(ctx, w.plateX, w.plateY, state.windowPlate, 0.85);
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    ctx.strokeStyle = 'rgba(242,183,5,' + pulse + ')';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(w.plateX, w.plateY, 56, 38, 0, 0, Math.PI * 2); ctx.stroke();
    textOutline(ctx, 'SIAP DIANTAR!', w.plateX, w.plateY - 52, 15, '#f2b705', '#17324a');
  } else {
    text(ctx, '— sajikan di sini —', w.plateX, w.plateY, 15, '#8a97a0');
  }
}

function drawTrash(ctx, state, nearId) {
  const tr = STATIONS.trash;
  const near = nearId === 'trash';
  ctx.fillStyle = PALETTE.steelDark;
  rr(ctx, tr.x, tr.y, tr.w, tr.h, 12);
  ctx.fill();
  // highlight BEFORE the sign, so its top edge never strikes through the label
  if (near) {
    ctx.strokeStyle = '#f2b705';
    ctx.lineWidth = 4;
    rr(ctx, tr.x - 3, tr.y - 3, tr.w + 6, tr.h + 6, 14);
    ctx.stroke();
  }
  drawStationSign(ctx, tr.x + tr.w / 2, tr.y - 2, 'TONG SAMPAH');
  // bin
  ctx.fillStyle = '#5b6b76';
  rr(ctx, tr.cx - 42, tr.cy - 42, 84, 84, 10);
  ctx.fill();
  ctx.fillStyle = '#7b8b95';
  rr(ctx, tr.cx - 48, tr.cy - 52, 96, 16, 8);
  ctx.fill();
  ctx.strokeStyle = '#46565f';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(tr.cx + i * 22, tr.cy - 30); ctx.lineTo(tr.cx + i * 22, tr.cy + 32); ctx.stroke();
  }
}

// ---------- prep board: fills the bare strip between stove and assembly ----------
// A small round wooden board with chopped veg + a bowl of sambal, sitting on the
// floor in the gap (x 520..640). Decor only — the chef walks past it, never on it
// in the staged shots; drawn under the chef like any floor prop.
function drawPrepBoard(ctx) {
  const cx = 580;
  const cy = 190;
  // soft shadow so it sits on the floor
  ctx.fillStyle = 'rgba(23,50,74,0.18)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 6, 50, 34, 0, 0, Math.PI * 2); ctx.fill();
  // round wooden board
  ctx.fillStyle = '#d99a5b';
  ctx.beginPath(); ctx.ellipse(cx, cy, 48, 33, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5426';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(cx, cy, 48, 33, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#e8c48d';
  ctx.beginPath(); ctx.ellipse(cx, cy, 40, 26, 0, 0, Math.PI * 2); ctx.fill();
  // chopped veg on the left half, small bowl of sambal on the right
  drawFood(ctx, 'sayur-potong', cx - 16, cy - 2, 20);
  drawFood(ctx, 'sambal', cx + 18, cy + 4, 18);
}

// ---------- chef ----------
function drawChef(ctx, chef, carried, t) {
  const bob = chef.moving ? Math.sin(chef.walkPhase * 10) * 3 : Math.sin(t * 2) * 1.2;
  const x = chef.x;
  const y = chef.y + bob * 0.3;
  // shadow
  ctx.fillStyle = 'rgba(23,50,74,0.25)';
  ctx.beginPath(); ctx.ellipse(x, chef.y + 26, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // legs
  ctx.fillStyle = '#17324a';
  const step = chef.moving ? Math.sin(chef.walkPhase * 10) * 6 : 0;
  ctx.fillRect(x - 14, y + 8 + step * 0.4, 11, 18);
  ctx.fillRect(x + 3, y + 8 - step * 0.4, 11, 18);
  // body: teal shirt + white apron
  ctx.fillStyle = '#0f766e';
  rr(ctx, x - 22, y - 12, 44, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  rr(ctx, x - 16, y - 6, 32, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#d92632';
  ctx.fillRect(x - 16, y - 6, 32, 4);
  // arms
  ctx.fillStyle = '#0f766e';
  ctx.beginPath(); ctx.arc(x - 24, y + 2, 8, 0, Math.PI * 2); ctx.arc(x + 24, y + 2, 8, 0, Math.PI * 2); ctx.fill();
  // head
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(x, y - 26, 19, 0, Math.PI * 2); ctx.fill();
  // chef hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(x - 10, y - 40, 9, 0, Math.PI * 2); ctx.arc(x, y - 44, 11, 0, Math.PI * 2); ctx.arc(x + 10, y - 40, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 17, y - 42, 34, 8);
  // face
  const look = chef.dir * 3;
  ctx.fillStyle = '#22303c';
  ctx.beginPath(); ctx.arc(x - 7 + look, y - 26, 2.4, 0, Math.PI * 2); ctx.arc(x + 7 + look, y - 26, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#22303c';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x + look, y - 20, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // carried item above the head
  if (carried) {
    const cy = y - 78;
    ctx.fillStyle = 'rgba(255,248,231,0.9)';
    ctx.beginPath(); ctx.ellipse(x, cy + 12, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (typeof carried === 'object' && carried.plate) {
      drawPlate(ctx, x, cy + 4, carried.items, 0.55);
    } else {
      drawFood(ctx, carried, x, cy, 30);
    }
    // raised arms
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x - 20, y - 4); ctx.lineTo(x - 14, cy + 16); ctx.moveTo(x + 20, y - 4); ctx.lineTo(x + 14, cy + 16); ctx.stroke();
  }
}

// ---------- particles & floaters ----------
function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    if (p.kind === 'steam') {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * a) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'confetti') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 6);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(-4, -2.5, 8, 5);
      ctx.restore();
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  for (const f of state.floaters) {
    const a = Math.max(0, Math.min(1, f.life / (f.maxLife * 0.5)));
    ctx.globalAlpha = a;
    textOutline(ctx, f.text, f.x, f.y, 24, f.color, '#17324a');
    ctx.globalAlpha = 1;
  }
}

// ---------- HUD ----------
function drawAwning(ctx) {
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE.red : '#fff8e7';
    ctx.fillRect(i * 80, 0, 80, 26);
  }
  ctx.fillStyle = PALETTE.redDark;
  for (let i = 0; i < 16; i++) {
    ctx.beginPath(); ctx.arc(i * 80 + 40, 26, 12, 0, Math.PI); ctx.fill();
  }
}

function drawTickets(ctx, state, t) {
  for (let i = 0; i < TIMING.maxOrders; i++) {
    const x = 12 + i * 140;
    const y = 34;
    const w = 132;
    const h = 66;
    ctx.fillStyle = 'rgba(23,50,74,0.35)';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    const o = state.orders[i];
    if (!o) {
      text(ctx, '— kosong —', x + w / 2, y + h / 2, 13, 'rgba(255,248,231,0.55)');
      continue;
    }
    const frac = Math.max(0, o.patience / o.maxPatience);
    const urgent = o.patience <= 10;
    const pulse = urgent ? 0.75 + 0.25 * Math.sin(t * 8) : 1;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#fff8e7';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = o.recipe.color;
    rr(ctx, x, y, 8, h, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    // name
    let size = 12.5;
    ctx.font = '700 ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
    while (ctx.measureText(o.recipe.name).width > 112 && size > 9) {
      size -= 0.5;
      ctx.font = '700 ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
    }
    text(ctx, o.recipe.name, x + w / 2 + 2, y + 12, size, PALETTE.navy, 'center', 700);
    // component icons
    o.recipe.components.forEach((c, ci) => {
      const itemId = { nasi: 'nasi-matang', ayam: 'ayam-goreng', telur: 'telur-dadar', sayur: 'sayur-potong', sambal: 'sambal' }[c];
      const cx = x + 30 + ci * 38 + (o.recipe.components.length === 2 ? 19 : 0);
      drawFood(ctx, itemId, cx, y + 34, 22);
    });
    // patience bar (left) + seconds (right, same row, never under the icons)
    const barColor = frac > 0.5 ? '#2e9e5b' : frac > 0.25 ? '#f59e0b' : '#d92632';
    ctx.fillStyle = 'rgba(23,50,74,0.2)';
    rr(ctx, x + 10, y + h - 13, w - 46, 7, 3);
    ctx.fill();
    ctx.fillStyle = barColor;
    rr(ctx, x + 10, y + h - 13, (w - 46) * frac, 7, 3);
    ctx.fill();
    text(ctx, Math.ceil(o.patience) + ' dtk', x + w - 8, y + h - 10, 11, urgent ? '#d92632' : '#5b6b76', 'right', 700);
  }
}

function drawTimerCoins(ctx, state, t) {
  // shift timer
  const s = Math.max(0, Math.ceil(state.timeLeft));
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  const low = state.timeLeft <= 30;
  ctx.fillStyle = 'rgba(23,50,74,0.45)';
  rr(ctx, 596, 34, 124, 66, 10);
  ctx.fill();
  text(ctx, 'SHIFT', 658, 46, 11, '#f2b705');
  text(ctx, mm + ':' + ss, 658, 74, 34, low ? '#ff6b6b' : '#fff8e7', 'center', 800);
  // coins
  ctx.fillStyle = 'rgba(23,50,74,0.45)';
  rr(ctx, 732, 34, 150, 66, 10);
  ctx.fill();
  ctx.fillStyle = '#f2b705';
  ctx.beginPath(); ctx.arc(762, 67, 17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a6d00';
  ctx.beginPath(); ctx.arc(762, 67, 12, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'Rp', 762, 67, 13, '#f2b705', 'center', 800);
  text(ctx, String(state.coins), 786, 67, 28, '#fff8e7', 'left', 800);
  // hearts
  for (let i = 0; i < 3; i++) {
    const hx = 920 + i * 34;
    const hy = 67;
    ctx.fillStyle = i < state.hearts ? '#d92632' : 'rgba(255,248,231,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 10);
    ctx.bezierCurveTo(hx - 16, hy - 4, hx - 8, hy - 16, hx, hy - 6);
    ctx.bezierCurveTo(hx + 8, hy - 16, hx + 16, hy - 4, hx, hy + 10);
    ctx.fill();
  }
  // combo
  if (state.combo >= 2) {
    const pulse = 1 + 0.08 * Math.sin(t * 6);
    ctx.save();
    ctx.translate(1120, 67);
    ctx.scale(pulse, pulse);
    textOutline(ctx, 'KOMBO x' + state.combo, 0, 0, 22, '#f2b705', '#17324a');
    ctx.restore();
  } else {
    text(ctx, 'KOMBO x' + state.combo, 1120, 67, 16, 'rgba(255,248,231,0.6)');
  }
  // rush banner (always visible while rushing; it pulses, never blinks off)
  if (state.rush && state.timeLeft > 0) {
    ctx.globalAlpha = 0.82 + 0.18 * Math.sin(t * 6);
    ctx.fillStyle = 'rgba(217,38,50,0.92)';
    rr(ctx, 470, 116, 340, 30, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    text(ctx, 'RUSH HOUR! Pesanan makin cepat!', 640, 131, 16, '#fff8e7');
  }
}

function drawBottomBar(ctx, state) {
  ctx.fillStyle = PALETTE.navy;
  ctx.fillRect(0, PLAY_BOTTOM, CANVAS_W, CANVAS_H - PLAY_BOTTOM);
  text(ctx, 'WASD / Panah: gerak   •   E / Spasi: ambil • taruh • tahan E: cincang   •   Klik stasiun: jalan ke sana   •   P: jeda   •   M: musik', 16, 684, 15, '#cfe3e0', 'left', 600);
  const carried = state.carried;
  if (carried) {
    const label = typeof carried === 'object' && carried.plate
      ? 'Piring (' + carried.items.map((id) => ITEMS[id].short).join(' + ') + ')'
      : ITEMS[carried].name;
    text(ctx, 'DIBAWA: ' + label, CANVAS_W - 16, 684, 16, '#f2b705', 'right', 800);
  } else {
    text(ctx, 'Tangan kosong', CANVAS_W - 16, 684, 16, 'rgba(255,248,231,0.55)', 'right', 600);
  }
  if (state.hintT > 0) {
    ctx.globalAlpha = Math.min(1, state.hintT);
    textOutline(ctx, state.hint, CANVAS_W / 2, PLAY_BOTTOM - 16, 18, '#fff8e7', '#17324a');
    ctx.globalAlpha = 1;
  }
}

// ---------- overlays ----------
function dim(ctx, alpha) {
  ctx.fillStyle = 'rgba(10,25,35,' + alpha + ')';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawTitle(ctx, t) {
  dim(ctx, 0.55);
  textOutline(ctx, 'DAPUR KILAT', CANVAS_W / 2, 150, 84, '#f2b705', '#a81c26');
  text(ctx, 'Warung cepat saji — masak, rakit, sajikan sebelum pelanggan kabur!', CANVAS_W / 2, 210, 22, '#fff8e7');
  ctx.fillStyle = 'rgba(255,248,231,0.96)';
  rr(ctx, 340, 250, 600, 240, 16);
  ctx.fill();
  text(ctx, 'CARA MAIN', 640, 278, 22, '#17324a');
  const lines = [
    '1. Ambil bahan dari peti di kiri.',
    '2. Masak di KOMPOR, cincang di TALENAN (tahan E).',
    '3. Rakit hidangan di MEJA RAKIT sesuai tiket pesanan.',
    '4. Bawa piring jadi ke JENDELA SAJI. Tip besar kalau cepat!',
    'Shift 180 detik, 3 nyawa. Jangan sampai hangus!',
    '45 detik terakhir: RUSH HOUR — pesanan makin cepat!',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 312 + i * 28, 16, '#22303c', 'center', 600));
  const blink = Math.sin(t * 4) > -0.3;
  if (blink) textOutline(ctx, 'TEKAN ENTER / KLIK UNTUK MULAI', CANVAS_W / 2, 540, 26, '#ffffff', '#17324a');
  text(ctx, 'WASD / panah gerak  •  E / Spasi interaksi  •  klik stasiun untuk jalan ke sana', CANVAS_W / 2, 580, 16, '#cfe3e0');
}

function drawStars(ctx, x, y, n, size) {
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * (size * 1.3);
    const filled = i < n;
    ctx.fillStyle = filled ? '#f2b705' : 'rgba(255,248,231,0.25)';
    ctx.strokeStyle = '#8a6d00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? size : size * 0.45;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const px = sx + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawEnd(ctx, state) {
  dim(ctx, 0.62);
  const failed = state.endReason === 'hearts';
  textOutline(ctx, failed ? 'WARUNG TUTUP!' : 'SHIFT SELESAI!', CANVAS_W / 2, 130, 64, failed ? '#ff6b6b' : '#f2b705', '#17324a');
  text(ctx, failed ? 'Tiga pelanggan kabur kecewa. Coba lagi, chef!' : 'Kerja bagus, chef! Ini hasil shiftmu:', CANVAS_W / 2, 185, 21, '#fff8e7');
  drawStars(ctx, CANVAS_W / 2, 250, state.stars, 34);
  ctx.fillStyle = 'rgba(255,248,231,0.96)';
  rr(ctx, 420, 310, 440, 190, 16);
  ctx.fill();
  const rows = [
    ['Hidangan disajikan', String(state.dishes)],
    ['Koin didapat', 'Rp ' + state.coins],
    ['Kombo terbaik', 'x' + state.bestCombo],
    ['Pesanan salah', String(state.wrong)],
  ];
  rows.forEach(([k, v], i) => {
    text(ctx, k, 450, 340 + i * 38, 19, '#5b6b76', 'left', 600);
    text(ctx, v, 830, 340 + i * 38, 19, '#17324a', 'right', 800);
  });
  textOutline(ctx, 'TEKAN R UNTUK MAIN LAGI', CANVAS_W / 2, 560, 26, '#ffffff', '#17324a');
}

function drawPause(ctx) {
  dim(ctx, 0.55);
  textOutline(ctx, 'JEDA', CANVAS_W / 2, 300, 72, '#fff8e7', '#17324a');
  text(ctx, 'P / Esc untuk lanjut  •  M untuk musik nyala / mati', CANVAS_W / 2, 370, 20, '#cfe3e0');
}

// ---------- frame ----------
export function drawFrame(ctx, state, t) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  // background
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  drawFloor(ctx);
  drawPrepBoard(ctx);
  const near = state.screen === 'playing' ? nearestStation(state) : null;
  const nearId = near ? near.id : null;
  drawCrates(ctx, state, nearId, t);
  drawStove(ctx, state, nearId, t);
  drawBoard(ctx, state, nearId, t);
  drawAssembly(ctx, state, nearId, t);
  drawWindow(ctx, state, nearId, t);
  drawTrash(ctx, state, nearId);
  if (state.screen === 'playing' || state.screen === 'paused') drawChef(ctx, state.chef, state.carried, t);
  drawParticles(ctx, state);
  // HUD on top
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(0, 30, CANVAS_W, 78);
  drawAwning(ctx);
  drawTickets(ctx, state, t);
  drawTimerCoins(ctx, state, t);
  drawBottomBar(ctx, state);
  // interaction prompt bubble (upper-right of the chef, clear of the stations)
  if (near && state.screen === 'playing') {
    const pulse = 1 + 0.06 * Math.sin(t * 6);
    ctx.save();
    ctx.translate(Math.min(state.chef.x + 46, CANVAS_W - 34), state.chef.y - 34);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#f2b705';
    rr(ctx, -16, -16, 32, 32, 8);
    ctx.fill();
    ctx.strokeStyle = '#17324a';
    ctx.lineWidth = 3;
    rr(ctx, -16, -16, 32, 32, 8);
    ctx.stroke();
    text(ctx, 'E', 0, 1, 20, '#17324a', 'center', 800);
    ctx.restore();
  }
  if (state.screen === 'title') drawTitle(ctx, t);
  if (state.screen === 'paused') drawPause(ctx);
  if (state.screen === 'end') drawEnd(ctx, state);
  if (state.flash > 0) {
    ctx.fillStyle = state.flashColor;
    ctx.globalAlpha = state.flash * 0.3;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
