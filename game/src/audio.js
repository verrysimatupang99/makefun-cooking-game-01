// audio.js — WebAudio synth SFX + a quiet music loop for Dapur Kilat.
// One job: every sound is synthesised in code; no audio files, no network.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sizzleNodes = null;
    this.musicOn = true;
    this.musicTimer = null;
    this._musicStep = 0;
    this._unlocked = false;
  }

  // called on the first user gesture (keyboard / mouse)
  unlock() {
    if (this._unlocked) return;
    this._unlocked = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      if (this.musicOn) this._startMusic();
    } catch (_) { /* audio is optional; the game plays silent */ }
  }

  toggleMusic() {
    this.musicOn = !this.musicOn;
    if (!this.ctx) return this.musicOn;
    if (this.musicOn) this._startMusic();
    else this._stopMusic();
    return this.musicOn;
  }

  _tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  _noise(dur, vol, filterFreq, when = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  pickup() { this._tone(520, 0.09, 'sine', 0.25, 0, 780); }
  place() { this._noise(0.07, 0.3, 900); this._tone(220, 0.08, 'triangle', 0.2, 0, 160); }
  chop() { this._noise(0.06, 0.5, 1400); this._tone(140, 0.07, 'square', 0.18, 0, 90); }
  chopDone() { this._tone(660, 0.1, 'triangle', 0.25); this._tone(990, 0.14, 'triangle', 0.2, 0.08); }
  cookDone() { this._tone(880, 0.12, 'sine', 0.25); this._tone(1174, 0.16, 'sine', 0.22, 0.1); }
  ding() { this._tone(1318, 0.35, 'sine', 0.3); this._tone(1760, 0.4, 'sine', 0.22, 0.05); }
  coin() { this._tone(988, 0.08, 'square', 0.12); this._tone(1319, 0.22, 'square', 0.12, 0.07); }
  error() { this._tone(160, 0.22, 'sawtooth', 0.22, 0, 110); }
  burn() { this._tone(440, 0.16, 'square', 0.2, 0, 330); this._tone(440, 0.16, 'square', 0.2, 0.2, 330); }
  heartLost() { this._tone(392, 0.25, 'triangle', 0.25, 0, 196); this._tone(262, 0.4, 'triangle', 0.25, 0.2, 131); }
  rush() { this._tone(523, 0.12, 'square', 0.18); this._tone(659, 0.12, 'square', 0.18, 0.12); this._tone(784, 0.2, 'square', 0.2, 0.24); }

  // looping frying sizzle while any burner is cooking
  setSizzle(on) {
    if (!this.ctx) return;
    if (on && !this.sizzleNodes) {
      const len = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 3200;
      const g = this.ctx.createGain();
      g.gain.value = 0.035;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
      this.sizzleNodes = { src, g };
    } else if (!on && this.sizzleNodes) {
      try { this.sizzleNodes.src.stop(); } catch (_) {}
      this.sizzleNodes = null;
    }
  }

  // quiet cheerful loop: pentatonic plucks over a soft bass, scheduled ahead
  _startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const melody = [523, 659, 784, 880, 784, 659, 587, 659, 698, 784, 880, 1047, 880, 784, 659, 587];
    const bass = [131, 131, 175, 196, 175, 131, 98, 131, 147, 175, 196, 262, 196, 175, 147, 131];
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.musicOn) return;
      const i = this._musicStep % 16;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = melody[i];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 0.4);
      if (i % 4 === 0) {
        const b = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        b.type = 'sine';
        b.frequency.value = bass[i];
        bg.gain.setValueAtTime(0.0001, t);
        bg.gain.exponentialRampToValueAtTime(0.07, t + 0.03);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        b.connect(bg);
        bg.connect(this.master);
        b.start(t);
        b.stop(t + 0.75);
      }
      this._musicStep++;
    }, 210);
  }

  _stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}
