// input.js — keyboard + mouse input for Dapur Kilat.
// One job: turn raw DOM events into a clean per-frame input snapshot.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.justPressed = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;
    this.onFirstGesture = null;
    this._gestured = false;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.justPressed.add(e.code);
      this._gesture();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); });

    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
      this.mouse.clicked = true;
      this.mouse.clickX = this.mouse.x;
      this.mouse.clickY = this.mouse.y;
      this._gesture();
    });
  }

  _gesture() {
    if (!this._gestured) {
      this._gestured = true;
      if (this.onFirstGesture) this.onFirstGesture();
    }
  }

  // movement vector from WASD / arrow keys, normalised
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
    return { x, y };
  }

  interactHeld() {
    return this.keys.has('KeyE') || this.keys.has('Space');
  }

  pressed(code) {
    return this.justPressed.has(code);
  }

  anyConfirm() {
    return this.pressed('Enter') || this.pressed('NumpadEnter') || this.mouse.clicked;
  }

  // call at the end of each frame so justPressed / clicked are single-frame edges
  endFrame() {
    this.justPressed.clear();
    this.mouse.clicked = false;
  }
}
