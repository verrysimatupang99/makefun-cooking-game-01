// orders.js — order spawning, patience timers and scoring for Dapur Kilat.
// One job: the ticket queue, its countdowns, and what a served dish pays.

import { ITEMS, RECIPES, TIMING } from './config.js';

let _nextId = 1;

export function makeOrder(rush) {
  const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
  const patience = TIMING.patienceMin + Math.random() * (TIMING.patienceMax - TIMING.patienceMin);
  return { id: _nextId++, recipe, patience, maxPatience: patience, rush };
}

export function nextSpawnDelay(rush) {
  if (rush) return TIMING.spawnRushMin + Math.random() * (TIMING.spawnRushMax - TIMING.spawnRushMin);
  return TIMING.spawnMin + Math.random() * (TIMING.spawnMax - TIMING.spawnMin);
}

// tick the queue: spawn new tickets, age patience, return expired orders
export function updateOrders(state, dt) {
  state.spawnT -= dt;
  if (state.spawnT <= 0 && state.orders.length < TIMING.maxOrders) {
    state.orders.push(makeOrder(state.rush));
    state.spawnT = nextSpawnDelay(state.rush);
  }
  const expired = [];
  for (const o of state.orders) o.patience -= dt;
  state.orders = state.orders.filter((o) => {
    if (o.patience <= 0) { expired.push(o); return false; }
    return true;
  });
  return expired;
}

// find the ticket a finished plate matches (same components, any order)
export function findMatchingOrder(state, plateItems) {
  const got = new Set(plateItems.map((id) => ITEMS[id].component));
  return state.orders.find((o) => {
    const want = o.recipe.components;
    return want.length === got.size && want.every((c) => got.has(c));
  }) || null;
}

// coins for a served dish: base + tip by time left, times the combo multiplier
export function servePayout(order, combo) {
  const frac = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(TIMING.maxTip * frac);
  const mult = Math.min(TIMING.comboCap, 1 + TIMING.comboStep * Math.max(0, combo - 1));
  const coins = Math.round((TIMING.basePay + tip) * mult);
  return { coins, tip, mult };
}

// star rating for the end screen
export function starsFor(dishes) {
  if (dishes >= 12) return 3;
  if (dishes >= 8) return 2;
  if (dishes >= 4) return 1;
  return 0;
}
