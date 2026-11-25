// shots.js — deterministic staged states for the ?shot= screenshots.
// One job: build the exact frozen scene each screenshot name asks for.

import { RECIPES } from './config.js';
import { makeOrder } from './orders.js';
import { addSteam } from './world.js';

function stagedOrder(recipeId, patience, maxPatience) {
  const o = makeOrder(false);
  o.recipe = RECIPES.find((r) => r.id === recipeId);
  o.patience = patience;
  o.maxPatience = maxPatience;
  return o;
}

export function applyShot(state, shot) {
  state.shotMode = shot;
  if (shot === 'start') {
    state.screen = 'title';
    return;
  }

  if (shot === 'cover') {
    // MID-PLAY cover: 3 tickets (one amber, ~12s left), plate mid-assembly,
    // a finished dish at the window, timer 1:24, 145 coins, chef carrying sambal.
    state.screen = 'playing';
    state.timeLeft = 84;
    state.elapsed = 96;
    state.coins = 145;
    state.combo = 3;
    state.bestCombo = 3;
    state.dishes = 5;
    state.hearts = 3;
    state.orders = [
      stagedOrder('geprek', 12, 50),
      stagedOrder('dadar', 38, 55),
      stagedOrder('campur', 50, 60),
    ];
    state.plate = ['nasi-matang', 'ayam-goreng']; // sambal slot still empty
    state.windowPlate = ['nasi-matang', 'ayam-goreng', 'sambal'];
    state.windowPlateT = 999;
    state.chef.x = 880;
    state.chef.y = 440;
    state.chef.tx = 880;
    state.chef.ty = 440;
    state.chef.dir = -1;
    state.carried = 'sambal';
    state.burners[0] = { item: 'nasi-mentah', progress: 0.6, state: 'cooking', cookTime: 6, burnT: 0 };
    state.burners[1] = { item: null, progress: 0, state: 'empty', burnT: 0 };
    state.board = { item: 'sayur-potong', progress: 0, state: 'done' };
    for (let i = 0; i < 6; i++) addSteam(state, 310, 200);
    return;
  }

  if (shot === 'rush') {
    // RUSH HOUR: 4 tickets, one red timer, steam everywhere, chef at the stove.
    state.screen = 'playing';
    state.timeLeft = 38;
    state.elapsed = 142;
    state.coins = 210;
    state.combo = 4;
    state.bestCombo = 4;
    state.dishes = 9;
    state.hearts = 2;
    state.rush = true;
    state.rushFlash = 999;
    state.orders = [
      stagedOrder('geprek-sayur', 8, 50),
      stagedOrder('geprek', 22, 55),
      stagedOrder('dadar', 41, 60),
      stagedOrder('campur', 47, 58),
    ];
    state.plate = ['nasi-matang'];
    state.windowPlate = null;
    state.chef.x = 380;
    state.chef.y = 350;
    state.chef.tx = 380;
    state.chef.ty = 350;
    state.chef.dir = 1;
    state.carried = 'ayam-mentah';
    state.burners[0] = { item: 'ayam-potong', progress: 0.7, state: 'cooking', cookTime: 5, burnT: 0 };
    state.burners[1] = { item: 'nasi-mentah', progress: 0.35, state: 'cooking', cookTime: 6, burnT: 0 };
    state.board = { item: 'sayur-mentah', progress: 0.5, state: 'chopping' };
    for (let i = 0; i < 8; i++) { addSteam(state, 310, 200); addSteam(state, 450, 200); }
    return;
  }

  if (shot === 'end') {
    // SHIFT SUMMARY: 3 stars, stats, restart prompt.
    state.screen = 'end';
    state.endReason = 'time';
    state.timeLeft = 0;
    state.elapsed = 180;
    state.coins = 312;
    state.combo = 0;
    state.bestCombo = 5;
    state.dishes = 14;
    state.served = 14;
    state.wrong = 1;
    state.hearts = 2;
    state.stars = 3;
    state.orders = [];
    return;
  }
}
