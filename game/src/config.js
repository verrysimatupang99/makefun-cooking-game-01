// config.js — recipes, station layout, timings and palette for Dapur Kilat.
// One job: every number and name the rest of the game reads lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// ---- palette: warm warung, cream tile, teal walls, wooden counters ----
export const PALETTE = {
  wall: '#0f766e',
  wallDark: '#0b5e57',
  floorA: '#f7ead1',
  floorB: '#f1dcb8',
  wood: '#b4713a',
  woodDark: '#8a5426',
  woodLight: '#d99a5b',
  cream: '#fff8e7',
  navy: '#17324a',
  mustard: '#f2b705',
  red: '#d92632',
  redDark: '#a81c26',
  green: '#2e9e5b',
  amber: '#f59e0b',
  ink: '#22303c',
  steel: '#9fb3bd',
  steelDark: '#6b7f8a',
};

// ---- timings (seconds) ----
export const TIMING = {
  shiftLength: 180,
  rushStart: 45, // last 45s of the shift
  spawnMin: 12,
  spawnMax: 18,
  spawnRushMin: 8,
  spawnRushMax: 12,
  patienceMin: 45,
  patienceMax: 60,
  cookRice: 6,
  cookChicken: 5,
  cookEgg: 5,
  chopTime: 2.5,
  burnAfterDone: 9,
  chefSpeed: 270,
  maxOrders: 4,
  basePay: 20,
  maxTip: 15,
  comboStep: 0.25,
  comboCap: 2.0,
};

// ---- items: raw, processed and burnt ----
export const ITEMS = {
  'nasi-mentah': { name: 'Beras', short: 'Beras', kind: 'raw', cooksTo: 'nasi-matang', cookTime: TIMING.cookRice },
  'nasi-matang': { name: 'Nasi Matang', short: 'Nasi', kind: 'food', component: 'nasi' },
  'ayam-mentah': { name: 'Ayam Mentah', short: 'Ayam', kind: 'raw', chopsTo: 'ayam-potong', chopTime: TIMING.chopTime },
  'ayam-potong': { name: 'Ayam Potong', short: 'Ayam Pt.', kind: 'raw', cooksTo: 'ayam-goreng', cookTime: TIMING.cookChicken },
  'ayam-goreng': { name: 'Ayam Goreng', short: 'Ayam Grg', kind: 'food', component: 'ayam' },
  'telur-mentah': { name: 'Telur', short: 'Telur', kind: 'raw', cooksTo: 'telur-dadar', cookTime: TIMING.cookEgg },
  'telur-dadar': { name: 'Telur Dadar', short: 'Dadar', kind: 'food', component: 'telur' },
  'sayur-mentah': { name: 'Sayur', short: 'Sayur', kind: 'raw', chopsTo: 'sayur-potong', chopTime: TIMING.chopTime },
  'sayur-potong': { name: 'Sayur Potong', short: 'Sayur Pt.', kind: 'food', component: 'sayur' },
  sambal: { name: 'Sambal', short: 'Sambal', kind: 'food', component: 'sambal' },
  hangus: { name: 'Hangus!', short: 'Hangus', kind: 'burnt' },
};

// ---- recipes: what each ticket asks for ----
export const RECIPES = [
  { id: 'geprek', name: 'Nasi Ayam Geprek', components: ['nasi', 'ayam', 'sambal'], color: '#d92632' },
  { id: 'dadar', name: 'Nasi Telur Dadar', components: ['nasi', 'telur'], color: '#f2b705' },
  { id: 'geprek-sayur', name: 'Ayam Geprek Sayur', components: ['ayam', 'sayur', 'sambal'], color: '#2e9e5b' },
  { id: 'campur', name: 'Nasi Campur Kilat', components: ['nasi', 'telur', 'sayur'], color: '#0f766e' },
];

// component id -> the finished item id that fills it
export const COMPONENT_ITEM = {
  nasi: 'nasi-matang',
  ayam: 'ayam-goreng',
  telur: 'telur-dadar',
  sayur: 'sayur-potong',
  sambal: 'sambal',
};

// ---- station layout (play area y 108..648) ----
export const STATIONS = {
  crates: [
    { id: 'crate-nasi', item: 'nasi-mentah', label: 'NASI', x: 16, y: 120, w: 134, h: 88, ix: 158, iy: 164 },
    { id: 'crate-ayam', item: 'ayam-mentah', label: 'AYAM', x: 16, y: 216, w: 134, h: 88, ix: 158, iy: 260 },
    { id: 'crate-telur', item: 'telur-mentah', label: 'TELUR', x: 16, y: 312, w: 134, h: 88, ix: 158, iy: 356 },
    { id: 'crate-sayur', item: 'sayur-mentah', label: 'SAYUR', x: 16, y: 408, w: 134, h: 88, ix: 158, iy: 452 },
    { id: 'crate-sambal', item: 'sambal', label: 'SAMBAL', x: 16, y: 504, w: 134, h: 88, ix: 158, iy: 548 },
  ],
  stove: { id: 'stove', label: 'KOMPOR', x: 240, y: 150, w: 280, h: 150, burners: [{ x: 310, y: 225, r: 52 }, { x: 450, y: 225, r: 52 }], ix: 380, iy: 318 },
  board: { id: 'board', label: 'TALENAN', x: 240, y: 380, w: 280, h: 140, cx: 380, cy: 450, ix: 380, iy: 538 },
  assembly: { id: 'assembly', label: 'MEJA RAKIT', x: 640, y: 200, w: 340, h: 180, plateX: 810, plateY: 290, ix: 810, iy: 398 },
  window: { id: 'window', label: 'JENDELA SAJI', x: 1020, y: 130, w: 244, h: 200, plateX: 1142, plateY: 250, ix: 1142, iy: 348 },
  trash: { id: 'trash', label: 'TONG SAMPAH', x: 1020, y: 400, w: 244, h: 140, cx: 1142, cy: 470, ix: 1142, iy: 558 },
};

// solid rectangles the chef cannot walk through (counters, stove, crates)
export const SOLIDS = [
  { x: 16, y: 120, w: 134, h: 472 }, // crate wall
  { x: 240, y: 150, w: 280, h: 150 }, // stove
  { x: 240, y: 380, w: 280, h: 140 }, // chopping board
  { x: 640, y: 200, w: 340, h: 180 }, // assembly counter
  { x: 1020, y: 130, w: 244, h: 200 }, // serving window counter
  { x: 1020, y: 400, w: 244, h: 140 }, // trash
];

export const PLAY_TOP = 108;
export const PLAY_BOTTOM = 648;
export const INTERACT_RANGE = 120;
export const CHEF_R = 24;
