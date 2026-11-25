// stations.js — interactions: pickup, chop, cook, assemble, serve, trash.
// One job: what happens when the chef presses or holds E at each station.

import { COMPONENT_ITEM, ITEMS, RECIPES, STATIONS, TIMING } from './config.js';
import { findMatchingOrder, servePayout } from './orders.js';
import { addFloater, addParticles, addSteam, showHint } from './world.js';

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// all stations with their interact points, for nearest-station lookup
export function allStations() {
  const list = STATIONS.crates.map((c) => ({ id: c.id, ix: c.ix, iy: c.iy, range: 120 }));
  list.push({ id: 'stove', ix: STATIONS.stove.ix, iy: STATIONS.stove.iy, range: 130 });
  list.push({ id: 'board', ix: STATIONS.board.ix, iy: STATIONS.board.iy, range: 130 });
  list.push({ id: 'assembly', ix: STATIONS.assembly.ix, iy: STATIONS.assembly.iy, range: 130 });
  list.push({ id: 'window', ix: STATIONS.window.ix, iy: STATIONS.window.iy, range: 130 });
  list.push({ id: 'trash', ix: STATIONS.trash.ix, iy: STATIONS.trash.iy, range: 130 });
  return list;
}

export function nearestStation(state) {
  const chef = state.chef;
  let best = null;
  let bestD = Infinity;
  for (const s of allStations()) {
    const d = dist(chef.x, chef.y, s.ix, s.iy);
    if (d < s.range && d < bestD) { best = s; bestD = d; }
  }
  return best;
}

// which station rect (if any) a mouse click lands on
export function stationAtPoint(x, y) {
  for (const c of STATIONS.crates) {
    if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return { id: c.id, ix: c.ix, iy: c.iy };
  }
  const rects = [
    { id: 'stove', r: STATIONS.stove },
    { id: 'board', r: STATIONS.board },
    { id: 'assembly', r: STATIONS.assembly },
    { id: 'window', r: STATIONS.window },
    { id: 'trash', r: STATIONS.trash },
  ];
  for (const { id, r } of rects) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return { id, ix: r.ix, iy: r.iy };
    }
  }
  return null;
}

function nearestBurner(state) {
  const chef = state.chef;
  let best = 0;
  let bestD = Infinity;
  STATIONS.stove.burners.forEach((b, i) => {
    const d = dist(chef.x, chef.y, b.x, b.y);
    if (d < bestD) { best = i; bestD = d; }
  });
  return best;
}

export function plateCompletesRecipe(plate) {
  const got = new Set(plate.map((id) => ITEMS[id].component));
  return RECIPES.find((r) => r.components.length === got.size && r.components.every((c) => got.has(c))) || null;
}

function isPlate(carried) {
  return carried && typeof carried === 'object' && carried.plate;
}

// ---- the E press ----
export function pressInteract(state, audio) {
  const st = nearestStation(state);
  if (!st) return;
  const chef = state.chef;

  if (st.id.startsWith('crate-')) {
    const crate = STATIONS.crates.find((c) => c.id === st.id);
    if (state.carried) { audio.error(); showHint(state, 'Tangan penuh! Taruh / buang dulu.'); return; }
    state.carried = crate.item;
    audio.pickup();
    addParticles(state, crate.ix, crate.iy, 6, '#f2b705', 'spark');
    return;
  }

  if (st.id === 'stove') {
    const bi = nearestBurner(state);
    const b = state.burners[bi];
    const burner = STATIONS.stove.burners[bi];
    if (b.state === 'empty') {
      if (!state.carried || isPlate(state.carried)) { audio.error(); showHint(state, 'Bawa bahan mentah ke kompor!'); return; }
      const def = ITEMS[state.carried];
      if (!def || !def.cooksTo) { audio.error(); showHint(state, 'Bahan ini tidak dimasak di kompor.'); return; }
      b.item = state.carried;
      b.progress = 0;
      b.state = 'cooking';
      b.cookTime = def.cookTime;
      state.carried = null;
      audio.place();
      addSteam(state, burner.x, burner.y - 20);
      return;
    }
    if (b.state === 'cooking') { showHint(state, 'Masih dimasak... tunggu sampai matang!'); return; }
    // done or burnt: pick it up
    if (state.carried) { audio.error(); showHint(state, 'Tangan penuh!'); return; }
    state.carried = b.item;
    b.item = null;
    b.progress = 0;
    b.burnT = 0;
    b.state = 'empty';
    audio.pickup();
    return;
  }

  if (st.id === 'board') {
    const bd = state.board;
    if (bd.state === 'empty') {
      if (!state.carried || isPlate(state.carried)) { audio.error(); showHint(state, 'Bawa ayam / sayur ke talenan!'); return; }
      const def = ITEMS[state.carried];
      if (!def || !def.chopsTo) { audio.error(); showHint(state, 'Bahan ini tidak dicincang.'); return; }
      bd.item = state.carried;
      bd.progress = 0;
      bd.state = 'chopping';
      state.carried = null;
      audio.place();
      return;
    }
    if (bd.state === 'chopping') { showHint(state, 'Tahan E untuk mencincang!'); return; }
    if (bd.state === 'done') {
      if (state.carried) { audio.error(); showHint(state, 'Tangan penuh!'); return; }
      state.carried = bd.item;
      bd.item = null;
      bd.progress = 0;
      bd.state = 'empty';
      audio.pickup();
      return;
    }
    return;
  }

  if (st.id === 'assembly') {
    if (!state.carried) {
      if (state.plate.length === 0) { showHint(state, 'Piring kosong. Taruh masakan di sini!'); return; }
      state.carried = { plate: true, items: state.plate };
      state.plate = [];
      audio.pickup();
      return;
    }
    if (isPlate(state.carried)) { audio.error(); showHint(state, 'Piring sudah di tangan — sajikan di jendela!'); return; }
    const def = ITEMS[state.carried];
    if (!def || def.kind !== 'food') { audio.error(); showHint(state, 'Masak / cincang dulu sampai jadi!'); return; }
    if (state.plate.length >= 3) { audio.error(); showHint(state, 'Piring penuh (maks 3)!'); return; }
    if (state.plate.some((id) => ITEMS[id].component === def.component)) {
      audio.error();
      showHint(state, 'Sudah ada ' + def.name + ' di piring!');
      return;
    }
    state.plate.push(state.carried);
    state.carried = null;
    audio.place();
    addParticles(state, STATIONS.assembly.plateX, STATIONS.assembly.plateY, 8, '#2e9e5b', 'spark');
    const done = plateCompletesRecipe(state.plate);
    if (done) {
      audio.cookDone();
      addFloater(state, STATIONS.assembly.plateX, STATIONS.assembly.plateY - 60, done.name + ' SIAP!', '#2e9e5b');
    }
    return;
  }

  if (st.id === 'window') {
    if (!state.carried || !isPlate(state.carried)) {
      audio.error();
      showHint(state, 'Bawa piring yang sudah lengkap ke jendela saji!');
      return;
    }
    const plateItems = state.carried.items;
    const order = findMatchingOrder(state, plateItems);
    if (!order) {
      state.wrong++;
      state.combo = 0;
      state.carried = null;
      audio.error();
      state.shake = 10;
      addFloater(state, STATIONS.window.plateX, STATIONS.window.plateY - 50, 'SALAH PESANAN!', '#d92632');
      showHint(state, 'Tidak ada pesanan yang cocok — piring dibuang!');
      return;
    }
    state.combo++;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const pay = servePayout(order, state.combo);
    state.coins += pay.coins;
    state.dishes++;
    state.served++;
    state.orders = state.orders.filter((o) => o.id !== order.id);
    state.windowPlate = plateItems.slice();
    state.windowPlateT = 1.4;
    state.carried = null;
    audio.ding();
    audio.coin();
    addParticles(state, STATIONS.window.plateX, STATIONS.window.plateY, 26, '#f2b705', 'confetti');
    addFloater(state, STATIONS.window.plateX, STATIONS.window.plateY - 50, '+' + pay.coins + ' koin' + (pay.tip > 0 ? ' (tip +' + pay.tip + ')' : ''), '#f2b705');
    if (state.combo >= 2) addFloater(state, chef.x, chef.y - 60, 'KOMBO x' + state.combo + '!', '#f2b705');
    return;
  }

  if (st.id === 'trash') {
    if (!state.carried) { showHint(state, 'Tidak ada yang dibuang.'); return; }
    state.carried = null;
    audio.place();
    addFloater(state, STATIONS.trash.cx, STATIONS.trash.cy - 60, 'Dibuang', '#9fb3bd');
  }
}

// ---- holding E: chopping on the board ----
let _chopSfxT = 0;
export function holdInteract(state, dt, audio) {
  const st = nearestStation(state);
  if (!st || st.id !== 'board') return;
  const bd = state.board;
  if (bd.state !== 'chopping') return;
  const def = ITEMS[bd.item];
  bd.progress += dt / (def.chopTime || TIMING.chopTime);
  _chopSfxT -= dt;
  if (_chopSfxT <= 0) { audio.chop(); _chopSfxT = 0.32; }
  addParticles(state, STATIONS.board.cx, STATIONS.board.cy, 1, '#8a5426', 'spark');
  if (bd.progress >= 1) {
    bd.item = def.chopsTo;
    bd.progress = 0;
    bd.state = 'done';
    audio.chopDone();
    addFloater(state, STATIONS.board.cx, STATIONS.board.cy - 60, ITEMS[bd.item].name + ' siap!', '#2e9e5b');
  }
}

// ---- cooking timers on the burners ----
export function updateCooking(state, dt, audio) {
  state.burners.forEach((b, i) => {
    const burner = STATIONS.stove.burners[i];
    if (b.state === 'cooking') {
      b.progress += dt / (b.cookTime || 6);
      if (Math.random() < dt * 6) addSteam(state, burner.x, burner.y - 24);
      if (b.progress >= 1) {
        b.item = ITEMS[b.item].cooksTo;
        b.progress = 1;
        b.state = 'done';
        b.burnT = 0;
        audio.cookDone();
        addFloater(state, burner.x, burner.y - 70, ITEMS[b.item].name + ' MATANG!', '#2e9e5b');
      }
    } else if (b.state === 'done') {
      b.burnT += dt;
      if (Math.random() < dt * 3) addSteam(state, burner.x, burner.y - 24);
      if (b.burnT >= TIMING.burnAfterDone) {
        b.item = 'hangus';
        b.state = 'burnt';
        audio.burn();
        state.shake = 12;
        state.flash = 0.7;
        state.flashColor = '#d92632';
        addFloater(state, burner.x, burner.y - 70, 'HANGUS! Buang ke tong sampah.', '#d92632');
      }
    }
  });
  if (state.windowPlateT > 0) {
    state.windowPlateT -= dt;
    if (state.windowPlateT <= 0) state.windowPlate = null;
  }
}
