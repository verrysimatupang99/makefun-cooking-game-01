// main.js — game loop and state machine for Dapur Kilat.
// One job: wire input, audio, orders, stations and rendering into a playable game.
// Screens: title -> playing -> paused -> end. ?shot=start|cover|rush|end stages
// a frozen deterministic scene for screenshots.

import { CANVAS_H, CANVAS_W, TIMING } from './config.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { createGame, resetGame, updateParticles, collideChef, addFloater, addSteam } from './world.js';
import { updateOrders, starsFor } from './orders.js';
import { pressInteract, holdInteract, updateCooking, nearestStation, stationAtPoint } from './stations.js';
import { drawFrame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const audio = new AudioEngine();
input.onFirstGesture = () => audio.unlock();

// deterministic randomness when ?seed= is given (screenshots)
const params = new URLSearchParams(window.location.search);
const seedParam = params.get('seed');
if (seedParam !== null) {
  let s = (parseInt(seedParam, 10) || 7) >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const state = createGame();
const shot = params.get('shot');
if (shot) applyShot(state, shot);

// debug / playtest hook: inspect and drive the game from automated tests
window.__dapur = { state, audio, resetGame, pressInteract };

function endShift(reason) {
  state.screen = 'end';
  state.endReason = reason;
  state.stars = starsFor(state.dishes);
  audio.setSizzle(false);
  if (reason === 'hearts') audio.heartLost();
}

function moveChef(dt) {
  const chef = state.chef;
  const mv = input.moveVector();
  let moving = false;
  if (mv.x !== 0 || mv.y !== 0) {
    chef.x += mv.x * TIMING.chefSpeed * dt;
    chef.y += mv.y * TIMING.chefSpeed * dt;
    chef.tx = chef.x;
    chef.ty = chef.y;
    chef.pendingStation = null;
    if (mv.x !== 0) chef.dir = mv.x > 0 ? 1 : -1;
    moving = true;
  } else if (Math.hypot(chef.tx - chef.x, chef.ty - chef.y) > 6) {
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const d = Math.hypot(dx, dy);
    const step = Math.min(d, TIMING.chefSpeed * dt);
    chef.x += (dx / d) * step;
    chef.y += (dy / d) * step;
    if (dx !== 0) chef.dir = dx > 0 ? 1 : -1;
    moving = true;
    if (Math.hypot(chef.tx - chef.x, chef.ty - chef.y) <= 6) {
      chef.tx = chef.x;
      chef.ty = chef.y;
      if (chef.pendingStation) {
        chef.pendingStation = null;
        pressInteract(state, audio);
      }
    }
  }
  chef.moving = moving;
  if (moving) chef.walkPhase += dt;
  collideChef(chef);
}

function updatePlaying(dt) {
  // shift clock
  state.timeLeft -= dt;
  state.elapsed += dt;
  if (!state.rush && state.timeLeft <= TIMING.rushStart) {
    state.rush = true;
    state.rushFlash = 3;
    audio.rush();
    addFloater(state, CANVAS_W / 2, 200, 'RUSH HOUR!', '#d92632');
  }
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endShift('time');
    return;
  }

  // orders
  const expired = updateOrders(state, dt);
  for (const o of expired) {
    state.hearts--;
    state.combo = 0;
    state.shake = 14;
    state.flash = 0.8;
    state.flashColor = '#d92632';
    audio.heartLost();
    addFloater(state, CANVAS_W / 2, 220, 'PESANAN ' + o.recipe.name.toUpperCase() + ' KADALUWARSA!', '#d92632');
    if (state.hearts <= 0) { endShift('hearts'); return; }
  }

  // cooking + sizzle
  updateCooking(state, dt, audio);
  const anyCooking = state.burners.some((b) => b.state === 'cooking');
  audio.setSizzle(anyCooking);

  // movement + clicks
  if (input.mouse.clicked) {
    const st = stationAtPoint(input.mouse.clickX, input.mouse.clickY);
    if (st) {
      state.chef.tx = st.ix;
      state.chef.ty = st.iy;
      state.chef.pendingStation = st.id;
    } else {
      state.chef.tx = input.mouse.clickX;
      state.chef.ty = Math.max(140, Math.min(640, input.mouse.clickY));
      state.chef.pendingStation = null;
    }
  }
  moveChef(dt);

  // interactions
  if (input.pressed('KeyE') || input.pressed('Space')) pressInteract(state, audio);
  if (input.interactHeld()) holdInteract(state, dt, audio);

  // pause / music
  if (input.pressed('KeyP') || input.pressed('Escape')) {
    state.screen = 'paused';
    audio.setSizzle(false);
  }
  if (input.pressed('KeyM')) {
    state.muted = !audio.toggleMusic();
  }
}

let last = performance.now();
let steamT = 0;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  const t = now / 1000;

  if (state.shotMode) {
    // frozen staged scene: only particles animate, steam keeps rising
    steamT -= dt;
    if (steamT <= 0) {
      steamT = 0.35;
      for (const b of state.burners) {
        if (b.state === 'cooking') {
          const burner = [310, 450][state.burners.indexOf(b)];
          addSteam(state, burner, 200);
        }
      }
    }
    updateParticles(state, dt);
  } else if (state.screen === 'title') {
    if (input.anyConfirm()) {
      resetGame(state);
      audio.unlock();
    }
  } else if (state.screen === 'playing') {
    updatePlaying(dt);
  } else if (state.screen === 'paused') {
    if (input.pressed('KeyP') || input.pressed('Escape')) state.screen = 'playing';
    if (input.pressed('KeyM')) state.muted = !audio.toggleMusic();
  } else if (state.screen === 'end') {
    if (input.pressed('KeyR') || input.pressed('Enter')) resetGame(state);
  }

  drawFrame(ctx, state, t);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
