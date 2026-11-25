# Dapur Kilat

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/verrysimatupang99/makefun-cooking-game-01/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/verrysimatupang99/makefun-cooking-game-01/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

**Make the best cooking game** — a make.fun bounty entry
([best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137), $250, ends 2026-11-25 13:37 UTC).

Dapur Kilat (Lightning Kitchen) is a fast-paced, original Indonesian warung
cooking game that runs offline in a desktop browser from static files. You are
the lone chef of a street-food stall: take orders off the board, grab
ingredients from the crates, cook on the stove, chop on the board, assemble the
dish on the counter, and serve it at the window before the customer loses
patience.

## How to play

- **Move:** WASD / arrow keys, or click a station to walk to it
- **Interact:** E / Space to pick up, put down, or hold E to chop
- **Serve:** carry a finished plate to the Jendela Saji (serving window)
- **Pause:** P / Esc — **Music:** M — **Restart:** R on the end screen

## The kitchen

- **Ingredient crates** (left): Nasi, Ayam, Telur, Sayur, Sambal
- **Kompor** (stove, 2 burners): cook rice, chicken and egg — watch the ring,
  food left too long burns and must be trashed
- **Talenan** (chopping board): hold E to chop chicken and vegetables
- **Meja Rakit** (assembly counter): build the dish on a plate, component by
  component, following the order ticket
- **Jendela Saji** (serving window): serve the finished plate
- **Tong Sampah** (trash): discard burnt or wrong items

## Recipes

| Dish | Components |
| --- | --- |
| Nasi Ayam Geprek | nasi matang + ayam goreng + sambal |
| Nasi Telur Dadar | nasi matang + telur dadar |
| Ayam Geprek Sayur | ayam goreng + sayur potong + sambal |
| Nasi Campur Kilat | nasi matang + telur dadar + sayur potong |

Orders arrive every 12–18 seconds (8–12 in Rush Hour), each with a 45–60
second patience timer. Serve fast for a tip (up to +15 coins) and build a combo
multiplier (up to x2). An expired order costs one of 3 hearts. A shift lasts
180 seconds; the last 45 seconds are Rush Hour, when orders arrive faster.

## Run it

```sh
node serve.ts          # serves game/ on http://localhost:8080
```

No build step, no network requests: all art is drawn in canvas code and all
sound is synthesised with WebAudio. Screenshots are staged deterministically
with `?shot=start|cover|rush|end&seed=7`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored
`vendor/makefun-game.ts` library.

## Layout

- `game/index.html` — canvas shell
- `game/src/config.js` — recipes, station layout, timings, palette
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — WebAudio synth SFX + music loop
- `game/src/orders.js` — order spawning, patience timers, scoring
- `game/src/world.js` — game state, chef, particles
- `game/src/stations.js` — pickup, chop, cook, assemble, serve, trash
- `game/src/render.js` — kitchen, food, chef, tickets, HUD, screens
- `game/src/shots.js` — deterministic `?shot=` staging for screenshots
- `game/src/main.js` — game loop + state machine

License: MIT. Built by an AI agent for the make.fun bounty above.
