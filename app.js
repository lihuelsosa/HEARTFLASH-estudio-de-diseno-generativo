// ─── VECTORHEART GENERATIVE DESIGN ENGINE v3.0 ──────────────────────────────
(function () {
  'use strict';

  // ── SvgContext ─────────────────────────────────────────────────────────────
  class SvgContext {
    constructor(w, h) {
      this.width = w;
      this.height = h;
      this.elements = [];
      this.overlayElements = [];
      this.defs = [];
      this.clipCounter = 0;
      this.isDrawingOverlay = false;
      this.state = {
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        globalAlpha: 1,
        font: '10px sans-serif',
        textAlign: 'left',
        lineDash: null,
        clipPathId: null,
        matrix: [1, 0, 0, 1, 0, 0]
      };
      this.states = [];
      this.currentPath = null;
    }

    get fillStyle() { return this.state.fillStyle; }
    set fillStyle(val) { this.state.fillStyle = val; }

    get strokeStyle() { return this.state.strokeStyle; }
    set strokeStyle(val) { this.state.strokeStyle = val; }

    get lineWidth() { return this.state.lineWidth; }
    set lineWidth(val) { this.state.lineWidth = val; }

    get globalAlpha() { return this.state.globalAlpha; }
    set globalAlpha(val) { this.state.globalAlpha = val; }

    get font() { return this.state.font; }
    set font(val) { this.state.font = val; }

    get textAlign() { return this.state.textAlign; }
    set textAlign(val) { this.state.textAlign = val; }

    clearRect(x, y, w, h) {
      this.elements = [];
      this.overlayElements = [];
      this.defs = [];
      this.currentPath = null;
      this.clipCounter = 0;
      this.isDrawingOverlay = false;
      this.state = {
        fillStyle: '#000000',
        strokeStyle: '#000000',
        lineWidth: 1,
        globalAlpha: 1,
        font: '10px sans-serif',
        textAlign: 'left',
        lineDash: null,
        clipPathId: null,
        matrix: [1, 0, 0, 1, 0, 0]
      };
      this.states = [];
    }

    beginPath() {
      // Short-circuit if element budget already reached
      if (this.elements.length + this.overlayElements.length >= drawPerf.elementBudget) {
        this.currentPath = null;
      } else {
        this.currentPath = '';
      }
    }

    moveTo(x, y) {
      if (this.currentPath === null) this.beginPath();
      if (this.currentPath === null) return;
      if (this.currentPath.length > drawPerf.pathBudget) return;
      this.currentPath += ` M ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    lineTo(x, y) {
      if (this.currentPath === null) this.beginPath();
      if (this.currentPath === null) return;
      if (this.currentPath.length > drawPerf.pathBudget) return;
      this.currentPath += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    quadraticCurveTo(cpx, cpy, x, y) {
      if (this.currentPath === null) this.beginPath();
      if (this.currentPath === null) return;
      this.currentPath += ` Q ${cpx.toFixed(1)} ${cpy.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
    }

    closePath() {
      if (this.currentPath) {
        this.currentPath += ' Z';
      }
    }

    setLineDash(dash) {
      this.state.lineDash = dash;
    }

    _getAttrs(fill, stroke) {
      const attrs = [];
      if (fill) {
        attrs.push(`fill="${this.state.fillStyle}"`);
      } else {
        attrs.push('fill="none"');
      }
      if (stroke) {
        attrs.push(`stroke="${this.state.strokeStyle}"`);
        attrs.push(`stroke-width="${this.state.lineWidth.toFixed(2)}"`);
        if (this.state.lineDash && this.state.lineDash.length > 0) {
          attrs.push(`stroke-dasharray="${this.state.lineDash.join(',')}"`);
        }
      } else {
        attrs.push('stroke="none"');
      }
      if (this.state.globalAlpha < 1) {
        attrs.push(`opacity="${this.state.globalAlpha.toFixed(3)}"`);
      }
      if (this.state.clipPathId) {
        attrs.push(`clip-path="url(#${this.state.clipPathId})"`);
      }
      const m = this.state.matrix;
      const isIdentity = Math.abs(m[0] - 1) < 1e-5 && Math.abs(m[1]) < 1e-5 && Math.abs(m[2]) < 1e-5 && Math.abs(m[3] - 1) < 1e-5 && Math.abs(m[4]) < 1e-5 && Math.abs(m[5]) < 1e-5;
      if (!isIdentity) {
        attrs.push(`transform="matrix(${m[0].toFixed(5)},${m[1].toFixed(5)},${m[2].toFixed(5)},${m[3].toFixed(5)},${m[4].toFixed(2)},${m[5].toFixed(2)})"`);
      }
      return attrs.join(' ');
    }

    stroke() {
      if (this.currentPath) {
        if (this.elements.length + this.overlayElements.length >= drawPerf.elementBudget) return;
        const pathNode = `<path d="${this.currentPath}" ${this._getAttrs(false, true)} />`;
        if (this.isDrawingOverlay) {
          this.overlayElements.push(pathNode);
        } else {
          this.elements.push(pathNode);
        }
      }
    }

    fill() {
      if (this.currentPath) {
        if (this.elements.length + this.overlayElements.length >= drawPerf.elementBudget) return;
        const pathNode = `<path d="${this.currentPath}" ${this._getAttrs(true, false)} />`;
        if (this.isDrawingOverlay) {
          this.overlayElements.push(pathNode);
        } else {
          this.elements.push(pathNode);
        }
      }
    }

    rect(x, y, w, h) {
      let nx = x;
      let ny = y;
      let nw = w;
      let nh = h;
      if (nw < 0) { nx += nw; nw = -nw; }
      if (nh < 0) { ny += nh; nh = -nh; }
      this.moveTo(nx, ny);
      this.lineTo(nx + nw, ny);
      this.lineTo(nx + nw, ny + nh);
      this.lineTo(nx, ny + nh);
      this.closePath();
    }

    fillRect(x, y, w, h) {
      let nx = x;
      let ny = y;
      let nw = w;
      let nh = h;
      if (nw < 0) { nx += nw; nw = -nw; }
      if (nh < 0) { ny += nh; nh = -nh; }
      if (nw <= 0 || nh <= 0) return;

      let fill = this.state.fillStyle;
      if (fill && typeof fill === 'object' && fill.isVignette) {
        const rectNode = `<rect x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" width="${nw.toFixed(1)}" height="${nh.toFixed(1)}" fill="url(#vignette-grad)" pointer-events="none" />`;
        if (this.isDrawingOverlay) {
          this.overlayElements.push(rectNode);
        } else {
          this.elements.push(rectNode);
        }
        return;
      }
      const rectNode = `<rect x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" width="${nw.toFixed(1)}" height="${nh.toFixed(1)}" ${this._getAttrs(true, false)} />`;
      if (this.isDrawingOverlay) {
        this.overlayElements.push(rectNode);
      } else {
        this.elements.push(rectNode);
      }
    }

    strokeRect(x, y, w, h) {
      let nx = x;
      let ny = y;
      let nw = w;
      let nh = h;
      if (nw < 0) { nx += nw; nw = -nw; }
      if (nh < 0) { ny += nh; nh = -nh; }
      if (nw <= 0 || nh <= 0) return;

      const rectNode = `<rect x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" width="${nw.toFixed(1)}" height="${nh.toFixed(1)}" ${this._getAttrs(false, true)} />`;
      if (this.isDrawingOverlay) {
        this.overlayElements.push(rectNode);
      } else {
        this.elements.push(rectNode);
      }
    }

    arc(x, y, r, startAngle, endAngle, anticlockwise = false) {
      if (this.currentPath === null) this.beginPath();
      if (this.currentPath === null) return;
      if (this.currentPath.length > drawPerf.pathBudget) return;
      const startX = x + r * Math.cos(startAngle);
      const startY = y + r * Math.sin(startAngle);
      const endX = x + r * Math.cos(endAngle);
      const endY = y + r * Math.sin(endAngle);

      if (this.currentPath === '') {
        this.moveTo(startX, startY);
      } else {
        this.lineTo(startX, startY);
      }

      const isFullCircle = Math.abs(endAngle - startAngle) >= 2 * Math.PI - 0.001;
      if (isFullCircle) {
        const mx = x + r * Math.cos(startAngle + Math.PI);
        const my = y + r * Math.sin(startAngle + Math.PI);
        this.currentPath += ` A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 1 ${mx.toFixed(1)} ${my.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 1 1 ${startX.toFixed(1)} ${startY.toFixed(1)}`;
      } else {
        let diff = endAngle - startAngle;
        if (anticlockwise) {
          if (diff > 0) diff -= Math.PI * 2;
        } else {
          if (diff < 0) diff += Math.PI * 2;
        }
        const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;
        const sweepFlag = anticlockwise ? 0 : 1;
        this.currentPath += ` A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${largeArcFlag} ${sweepFlag} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
      }
    }

    fillText(text, x, y) {
      if (this.elements.length + this.overlayElements.length >= drawPerf.elementBudget) return;
      const textStr = text !== undefined && text !== null ? String(text) : '';
      const escapedText = textStr
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      let anchor = 'start';
      if (this.state.textAlign === 'center') anchor = 'middle';
      else if (this.state.textAlign === 'right') anchor = 'end';

      let fontSize = '10px';
      let fontFamily = 'monospace';
      let fontWeight = 'normal';
      const sizeMatch = this.state.font.match(/([\d\.]+(?:px|pt|em|rem|%))/);
      if (sizeMatch) {
        fontSize = sizeMatch[1];
        const idx = this.state.font.indexOf(fontSize);
        fontWeight = this.state.font.substring(0, idx).trim() || 'normal';
        fontFamily = this.state.font.substring(idx + fontSize.length).trim();
      } else {
        fontFamily = this.state.font;
      }

      const textNode = `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${anchor}" ${this._getAttrs(true, false)}>${escapedText}</text>`;
      if (this.isDrawingOverlay) {
        this.overlayElements.push(textNode);
      } else {
        this.elements.push(textNode);
      }
    }

    clip() {
      if (this.currentPath) {
        const clipId = `clip-${this.clipCounter++}`;
        const m = this.state.matrix;
        const transformAttr = `matrix(${m[0].toFixed(5)},${m[1].toFixed(5)},${m[2].toFixed(5)},${m[3].toFixed(5)},${m[4].toFixed(2)},${m[5].toFixed(2)})`;
        this.defs.push(`<clipPath id="${clipId}"><path d="${this.currentPath}" transform="${transformAttr}" /></clipPath>`);
        this.state.clipPathId = clipId;
      }
    }

    save() {
      this.states.push(JSON.parse(JSON.stringify(this.state)));
    }

    restore() {
      if (this.states.length > 0) {
        this.state = this.states.pop();
      }
    }

    translate(x, y) {
      const m = this.state.matrix;
      m[4] = m[0] * x + m[2] * y + m[4];
      m[5] = m[1] * x + m[3] * y + m[5];
    }

    scale(sx, sy) {
      const m = this.state.matrix;
      m[0] *= sx;
      m[1] *= sx;
      m[2] *= sy;
      m[3] *= sy;
    }

    rotate(angle) {
      const m = this.state.matrix;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const a = m[0], b = m[1], c_val = m[2], d_val = m[3];
      m[0] = a * c + c_val * s;
      m[1] = b * c + d_val * s;
      m[2] = -a * s + c_val * c;
      m[3] = -b * s + d_val * c;
    }

    createRadialGradient() {
      return { isVignette: true, addColorStop: () => {} };
    }

    getImageData() {
      return { data: new Uint8ClampedArray(4) };
    }
    putImageData() {}
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const state = {
    isBatchUpdating: false,
    mode: 'vectorheart', palette: 'mono', bg: 'dark',
    detail: 20, complexity: 5, density: 3, weight: 0, chaos: 0, textAmount: 0,
    customText: '', customFont: "'Share Tech Mono', monospace", customFontWeight: '400', customTextAmount: 0,
    customTextSize: 20, customTextOpacity: 70, customTextColor: 'auto',
    animDetail: false, animWeight: false, animChaos: false, animText: false,
    animCustomDensity: false, animCustomSize: false, animSeed: false, animPalette: false, animBg: false, animMode: false,
    animEffects: false,
    currentAnimSpeed: 15,
    lfoUiSpeedBucket: 15,
    animAmountDetail: 100, animAmountWeight: 100, animAmountChaos: 100, animAmountText: 100,
    animAmountCustomDensity: 100, animAmountCustomSize: 100, animAmountSeed: 100, animAmountPalette: 100, animAmountBg: 100, animAmountMode: 100,
    animAmountEffects: 100,
    effectsIntensity: 1.0,
    fadeDuration: 3,
    symmetry: 'none',
    vignette: false, grain: false, scanlines: false,
    chromatic: false, glitch: false, static: false,
    animating: false, animFrame: null, animTime: 0,
    lastSeedChange: 0, elementCount: 0, fps: 60, lastFrameTime: 0,
    seed: Math.floor(Math.random() * 99999999),
    hasGenerated: true,
    animWave: 'triangle',
    activeTab: 0,
    lfos: [
      { wave: 'sine',     rate: 8  },
      { wave: 'triangle', rate: 6  },
      { wave: 'square',   rate: 10 },
    ],
    liveLfoRates: [8, 6, 10],
    patches: {
      detail:        [null, null, null, null, null, null],
      weight:        [null, null, null, null, null, null],
      chaos:         [null, null, null, null, null, null],
      text:          [null, null, null, null, null, null],
      customDensity: [null, null, null, null, null, null],
      customSize:    [null, null, null, null, null, null],
      lfo1Rate:      [null, null, null, null, null, null],
      lfo2Rate:      [null, null, null, null, null, null],
      lfo3Rate:      [null, null, null, null, null, null],
      effects:       [null, null, null, null, null, null],
      seed:          [null, null, null, null, null, null],
      palette:       [null, null, null, null, null, null],
      bg:            [null, null, null, null, null, null],
      mode:          [null, null, null, null, null, null],
    },
    blockLocks: {
      mode: false,
      params: false,
      text: false,
      symmetry: false,
      palette: false,
      bg: false,
      effects: false,
      lfo: false,
      audio: false
    },
    // Audio-reactivity scaffold (implementation can be plugged in without reshaping state)
    audioRx: {
      enabled: false,
      source: 'mic',
      deviceId: 'default',
      lowAmount: 55,
      midAmount: 45,
      highAmount: 35,
      masterSend: 100,
      smooth: 0.82,
      level: 0,
      lowLevel: 0,
      midLevel: 0,
      highLevel: 0,
      ready: false
    },
  };

  const LFO_SOURCE_COUNT = 3;
  const BAND_SOURCE_COUNT = 3;
  const MOD_SOURCE_COUNT = LFO_SOURCE_COUNT + BAND_SOURCE_COUNT;

  // Keep patch matrix shape stable if old states only had 3 sources.
  Object.keys(state.patches).forEach(dest => {
    while (state.patches[dest].length < MOD_SOURCE_COUNT) state.patches[dest].push(null);
    if (state.patches[dest].length > MOD_SOURCE_COUNT) state.patches[dest].length = MOD_SOURCE_COUNT;
  });

  const BLOCK_DEFS = {
    mode: { lfoTargets: ['mode'], patchDests: ['mode'] },
    params: { lfoTargets: ['detail', 'weight', 'chaos', 'text'], patchDests: ['detail', 'weight', 'chaos', 'text'] },
    text: { lfoTargets: ['text', 'customDensity', 'customSize'], patchDests: ['customDensity', 'customSize'] },
    symmetry: { lfoTargets: [], patchDests: [] },
    palette: { lfoTargets: ['palette'], patchDests: ['palette'] },
    bg: { lfoTargets: ['bg'], patchDests: ['bg'] },
    effects: { lfoTargets: ['effects'], patchDests: ['effects'] },
    lfo: { lfoTargets: ['lfo1Rate', 'lfo2Rate', 'lfo3Rate'], patchDests: ['lfo1Rate', 'lfo2Rate', 'lfo3Rate'] },
    audio: { lfoTargets: [], patchDests: [] }
  };

  const DEST_TO_BLOCK_KEY = {};
  Object.entries(BLOCK_DEFS).forEach(([blockKey, def]) => {
    def.patchDests.forEach(dest => { DEST_TO_BLOCK_KEY[dest] = blockKey; });
  });

  const LOCK_BUTTON_META = [
    { blockKey: 'mode', label: 'MODO' },
    { blockKey: 'params', label: 'PARÁMETROS' },
    { blockKey: 'text', label: 'TEXTO' },
    { blockKey: 'symmetry', label: 'SIMETRÍA' },
    { blockKey: 'palette', label: 'PALETA' },
    { blockKey: 'bg', label: 'FONDO' },
    { blockKey: 'effects', label: 'EFECTOS' },
    { blockKey: 'lfo', label: 'MOD LFO' },
    { blockKey: 'audio', label: 'AUDIO' }
  ];

  function isBlockLocked(blockKey) {
    return !!state.blockLocks[blockKey];
  }

  function getDestBlockKey(destKey) {
    return DEST_TO_BLOCK_KEY[destKey] || null;
  }

  function setBlockLock(blockKey, locked) {
    state.blockLocks[blockKey] = !!locked;
    syncBlockLockUi();
  }

  const customFontDataUrls = [];
  const audioRxRuntime = {
    ctx: null,
    analyser: null,
    sourceNode: null,
    stream: null,
    rawStream: null,
    timeData: null,
    freqData: null,
    lowPeak: 0,
    midPeak: 0,
    highPeak: 0,
  };

  // ── Adaptive frame budget ─────────────────────────────────────────────────
  // Tracks rolling-average draw time and adjusts complexity to target 60 FPS.
  // Budgets are only enforced during animation; static draws always use max.
  const drawPerf = {
    rollingMs: 12,
    maxPasses: 3,
    elementBudget: 1500,
    pathBudget: 10000,
    grainOctaves: 4,
  };

  // Bases for organic parameter modulation (oscillating around active slider settings)
  const animBases = {
    detail: 50,
    weight: 0,
    chaos: 0,
    textAmount: 0,
    customTextAmount: 0,
    customTextSize: 20,
    seed: state.seed,
    paletteIdx: 0,
    bgIdx: 0,
    modeIdx: 0
  };

  const MIDI_MAPPINGS_STORAGE_KEY = 'heartflash-midi-mappings-v1';
  const MIDI_MAPPABLE_SELECTOR = 'input[type="range"], input[type="number"], input[type="checkbox"], select, .lfo-wave-btn, .patch-port, .lfo-rate-slider, .depth-slider, button[id^="btn-"]';
  const midiLearn = {
    access: null,
    armed: false,
    targetKey: null,
    mappings: {},
    requesting: null,
    lastButtonTrigger: {},
  };

  function setFooterInfo(msg) {
    const footer = document.getElementById('footer-info');
    if (footer) footer.textContent = msg;
  }

  function loadMidiMappings() {
    try {
      const raw = localStorage.getItem(MIDI_MAPPINGS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveMidiMappings() {
    try {
      localStorage.setItem(MIDI_MAPPINGS_STORAGE_KEY, JSON.stringify(midiLearn.mappings));
    } catch (_) {
      // Ignore storage write failures.
    }
  }

  function getMidiControlKey(el) {
    if (!el) return null;
    if (el.id) return `id:${el.id}`;
    if (el.matches('.lfo-rate-slider[data-lfo]')) return `lfo-rate:${el.dataset.lfo}`;
    if (el.matches('.depth-slider[data-dest][data-lfo]')) return `depth:${el.dataset.dest}:${el.dataset.lfo}`;
    if (el.matches('.patch-port[data-dest][data-lfo]')) return `patch-port:${el.dataset.dest}:${el.dataset.lfo}`;
    if (el.matches('.lfo-wave-btn[data-lfo][data-wave]')) return `lfo-wave:${el.dataset.lfo}:${el.dataset.wave}`;
    return null;
  }

  function resolveMidiControlByKey(key) {
    if (!key) return null;
    if (key.startsWith('id:')) return document.getElementById(key.slice(3));
    if (key.startsWith('lfo-rate:')) {
      const idx = key.split(':')[1];
      return document.querySelector(`.lfo-rate-slider[data-lfo="${idx}"]`);
    }
    if (key.startsWith('depth:')) {
      const [, dest, lfoIdx] = key.split(':');
      return document.querySelector(`.depth-slider[data-dest="${dest}"][data-lfo="${lfoIdx}"]`);
    }
    if (key.startsWith('patch-port:')) {
      const [, dest, lfoIdx] = key.split(':');
      return document.querySelector(`.patch-port[data-dest="${dest}"][data-lfo="${lfoIdx}"]`);
    }
    if (key.startsWith('lfo-wave:')) {
      const [, lfoIdx, wave] = key.split(':');
      return document.querySelector(`.lfo-wave-btn[data-lfo="${lfoIdx}"][data-wave="${wave}"]`);
    }
    return null;
  }

  function clearMidiTargetMarker() {
    document.querySelectorAll('.midi-learn-target').forEach(el => el.classList.remove('midi-learn-target'));
  }

  function setMidiTargetByElement(el) {
    const key = getMidiControlKey(el);
    if (!key) return;
    midiLearn.targetKey = key;
    clearMidiTargetMarker();
    const target = resolveMidiControlByKey(key) || el;
    target.classList.add('midi-learn-target');
    setFooterInfo(`MIDI LEARN::CONTROL ${key.toUpperCase()} · MOVÉ UN KNOB`);
  }

  function updateMidiLearnButton() {
    const btn = document.getElementById('btn-midi-learn');
    if (!btn) return;
    const supported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
    btn.disabled = !supported;
    btn.classList.toggle('active', midiLearn.armed);
    btn.title = supported ? 'Activar MIDI Learn' : 'Web MIDI no disponible en este navegador';
  }

  function setMidiLearnArmed(active) {
    midiLearn.armed = !!active;
    document.body.classList.toggle('midi-learning', midiLearn.armed);
    if (!midiLearn.armed) {
      midiLearn.targetKey = null;
      clearMidiTargetMarker();
    }
    updateMidiLearnButton();
  }

  function quantizeToStep(value, min, step) {
    if (!Number.isFinite(step) || step <= 0) return value;
    const steps = Math.round((value - min) / step);
    return min + steps * step;
  }

  function dispatchControlEvents(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function applyMidiValueToControl(key, normalizedValue, sourceKey) {
    const control = resolveMidiControlByKey(key);
    if (!control) return;
    const t = Math.max(0, Math.min(1, normalizedValue));

    if (control.matches('input[type="range"], input[type="number"]')) {
      const min = Number(control.min);
      const max = Number(control.max);
      const lo = Number.isFinite(min) ? min : 0;
      const hi = Number.isFinite(max) ? max : 100;
      const step = Number(control.step);
      let nextValue = lo + (hi - lo) * t;
      nextValue = quantizeToStep(nextValue, lo, step);
      nextValue = Math.max(lo, Math.min(hi, nextValue));
      if (Number(control.value) !== nextValue) {
        control.value = String(nextValue);
        dispatchControlEvents(control);
      }
      return;
    }

    if (control.matches('select')) {
      const maxIndex = Math.max(0, control.options.length - 1);
      const nextIndex = Math.round(t * maxIndex);
      if (control.selectedIndex !== nextIndex) {
        control.selectedIndex = nextIndex;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    if (control.matches('input[type="checkbox"]')) {
      const nextChecked = t >= 0.5;
      if (control.checked !== nextChecked) {
        control.checked = nextChecked;
        control.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }

    if (control.tagName === 'BUTTON') {
      if (t < 0.5) return;
      const now = performance.now();
      const gateKey = `${sourceKey}|${key}`;
      const last = midiLearn.lastButtonTrigger[gateKey] || 0;
      if (now - last < 180) return;
      midiLearn.lastButtonTrigger[gateKey] = now;
      control.click();
    }
  }

  function parseMidiMessage(messageEvent) {
    const [status = 0, data1 = 0, data2 = 0] = messageEvent.data || [];
    const type = status & 0xf0;
    const channel = status & 0x0f;
    if (type === 0xb0) {
      return { sourceKey: `cc:${channel}:${data1}`, normalized: data2 / 127 };
    }
    if (type === 0x90 || type === 0x80) {
      const normalized = type === 0x80 ? 0 : data2 / 127;
      return { sourceKey: `note:${channel}:${data1}`, normalized };
    }
    return null;
  }

  function onMidiMessage(messageEvent) {
    const parsed = parseMidiMessage(messageEvent);
    if (!parsed) return;
    const { sourceKey, normalized } = parsed;

    if (midiLearn.armed && midiLearn.targetKey) {
      midiLearn.mappings[sourceKey] = midiLearn.targetKey;
      saveMidiMappings();
      setFooterInfo(`MIDI MAP::${sourceKey.toUpperCase()} -> ${midiLearn.targetKey.toUpperCase()}`);
      setMidiLearnArmed(false);
    }

    const mappedKey = midiLearn.mappings[sourceKey];
    if (mappedKey) applyMidiValueToControl(mappedKey, normalized, sourceKey);
  }

  function bindMidiInputs(access) {
    access.inputs.forEach(input => {
      input.onmidimessage = onMidiMessage;
    });
  }

  function ensureMidiAccess() {
    if (midiLearn.access) return Promise.resolve(true);
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) return Promise.resolve(false);
    if (midiLearn.requesting) return midiLearn.requesting;

    midiLearn.requesting = navigator.requestMIDIAccess({ sysex: false })
      .then(access => {
        midiLearn.access = access;
        bindMidiInputs(access);
        access.onstatechange = () => bindMidiInputs(access);
        return true;
      })
      .catch(err => {
        console.warn('MIDI access denied/unavailable:', err);
        setFooterInfo('MIDI::SIN ACCESO (REVISÁ PERMISOS DEL NAVEGADOR)');
        return false;
      })
      .finally(() => {
        midiLearn.requesting = null;
        updateMidiLearnButton();
      });

    return midiLearn.requesting;
  }

  function initMidiLearn() {
    midiLearn.mappings = loadMidiMappings();
    updateMidiLearnButton();

    document.addEventListener('click', (event) => {
      if (!midiLearn.armed) return;
      const candidate = event.target.closest(MIDI_MAPPABLE_SELECTOR);
      if (!candidate) return;
      if (candidate.id === 'btn-midi-learn') return;
      setMidiTargetByElement(candidate);
    });

    const midiBtn = document.getElementById('btn-midi-learn');
    if (!midiBtn) return;
    midiBtn.addEventListener('click', () => {
      if (midiLearn.armed) {
        setMidiLearnArmed(false);
        setFooterInfo('MIDI LEARN::OFF');
        return;
      }
      ensureMidiAccess().then(ok => {
        if (!ok) return;
        setMidiLearnArmed(true);
        setFooterInfo('MIDI LEARN::ON · ELEGÍ UN CONTROL');
      });
    });
  }

  // ── Canvas & SVG ───────────────────────────────────────────────────────────
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');
  // Off-screen context is our custom SvgContext
  const offCanvas = { width: 1280, height: 720 };
  const offCtx = new SvgContext(1280, 720);
  let fadeActive = false, fadeProgress = 0, fadeStart = 0;

  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    // clientWidth/Height include padding; subtract it to get the visual content area
    const cs = getComputedStyle(wrapper);
    const maxW = wrapper.clientWidth  - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const maxH = wrapper.clientHeight - parseFloat(cs.paddingTop)  - parseFloat(cs.paddingBottom);
    let w = maxW, h = maxH;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.floor(w * dpr), H = Math.floor(h * dpr);
    canvas.width = W; canvas.height = H;
    canvas.style.width  = Math.floor(w) + 'px';
    canvas.style.height = Math.floor(h) + 'px';
    const svgEl = document.getElementById('main-svg');
    if (svgEl) {
      svgEl.style.width  = Math.floor(w) + 'px';
      svgEl.style.height = Math.floor(h) + 'px';
    }
    offCanvas.width = W; offCanvas.height = H;
    offCtx.width = W; offCtx.height = H;
    document.getElementById('canvas-res').textContent = `${W} × ${H}`;



    if (!state.animating) draw(0, false, true);
  }

  // Zoom and pan removed — composition system handles visual structure

  // ── Seeded RNG ─────────────────────────────────────────────────────────────
  let rngState = 0;
  function seedRng(s) { rngState = (s >>> 0) || 1; }
  function rng() {
    rngState ^= rngState << 13; rngState ^= rngState >> 17; rngState ^= rngState << 5;
    return (rngState >>> 0) / 4294967296;
  }

  function updateAudioRxUi() {
    const toggle = document.getElementById('btn-audio-rx');
    const meterFill = document.getElementById('audio-rx-meter-fill');
    const lowFill = document.getElementById('audio-band-low-fill');
    const midFill = document.getElementById('audio-band-mid-fill');
    const highFill = document.getElementById('audio-band-high-fill');
    const masterSendVal = document.getElementById('audio-master-send-val');
    const smoothVal = document.getElementById('audio-smooth-val');
    const sourceSelect = document.getElementById('audio-source-select');
    const deviceSelect = document.getElementById('audio-device-select');

    if (toggle) {
      const on = state.audioRx.enabled && state.audioRx.ready;
      toggle.classList.toggle('active', on);
      toggle.textContent = on ? 'AUDIO RX::ON' : 'AUDIO RX::OFF';
    }
    if (sourceSelect && sourceSelect.value !== state.audioRx.source) sourceSelect.value = state.audioRx.source;
    if (deviceSelect) {
      deviceSelect.style.display = 'block';
      deviceSelect.disabled = false;
      if (state.audioRx.deviceId && deviceSelect.value !== state.audioRx.deviceId) {
        const hasOption = Array.from(deviceSelect.options).some(opt => opt.value === state.audioRx.deviceId);
        if (hasOption) deviceSelect.value = state.audioRx.deviceId;
      }
    }
    if (meterFill) meterFill.style.width = `${Math.round(Math.max(0, Math.min(1, state.audioRx.level)) * 100)}%`;
    if (lowFill) lowFill.style.width = `${Math.round(Math.max(0, Math.min(1, state.audioRx.lowLevel)) * 100)}%`;
    if (midFill) midFill.style.width = `${Math.round(Math.max(0, Math.min(1, state.audioRx.midLevel)) * 100)}%`;
    if (highFill) highFill.style.width = `${Math.round(Math.max(0, Math.min(1, state.audioRx.highLevel)) * 100)}%`;
    if (masterSendVal) masterSendVal.textContent = `${Math.round(state.audioRx.masterSend)}`;
    if (smoothVal) smoothVal.textContent = `${Math.round(state.audioRx.smooth * 100)}`;
    updateAudioPatchIndicators();
  }

  function pickPreferredAudioInput(devices, mode) {
    if (!devices.length) return 'default';
    if (mode === 'linein') {
      // Match true line-in/aux hardware — explicitly exclude loopback/stereo-mix devices
      const loopRegex = /(stereo mix|what u hear|loopback|mezcla estereo|monitor of)/i;
      const lineRegex = /(line.?in|aux|entrada de l[ií]nea|line\s+input|analog)/i;
      const match = devices.find(d =>
        d.kind === 'audioinput' &&
        lineRegex.test(d.label || '') &&
        !loopRegex.test(d.label || '')
      );
      if (match) return match.deviceId;
    }
    const def = devices.find(d => d.deviceId === 'default');
    return (def && def.deviceId) || devices[0].deviceId || 'default';
  }

  async function refreshAudioInputDevices() {
    const deviceSelect = document.getElementById('audio-device-select');
    if (!deviceSelect || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter(d => d.kind === 'audioinput');
      const prev = state.audioRx.deviceId || 'default';
      deviceSelect.innerHTML = '';
      if (!inputs.length) {
        const opt = document.createElement('option');
        opt.value = 'default';
        opt.textContent = 'SISTEMA (DEFAULT)';
        deviceSelect.appendChild(opt);
        state.audioRx.deviceId = 'default';
        updateAudioRxUi();
        return;
      }

      inputs.forEach((dev, idx) => {
        const opt = document.createElement('option');
        opt.value = dev.deviceId || `dev-${idx}`;
        const label = (dev.label || '').trim();
        opt.textContent = label || `ENTRADA ${idx + 1}`;
        deviceSelect.appendChild(opt);
      });

      const preferred = prev !== 'default' ? prev : pickPreferredAudioInput(inputs, state.audioRx.source);
      const hasPreferred = Array.from(deviceSelect.options).some(opt => opt.value === preferred);
      state.audioRx.deviceId = hasPreferred ? preferred : (deviceSelect.options[0]?.value || 'default');
      deviceSelect.value = state.audioRx.deviceId;
    } catch (err) {
      // Keep existing selection when enumeration is blocked.
    }
    updateAudioRxUi();
  }

  async function tryLoopbackInputDevice(preferredDeviceId = null) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return null;
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (preferredDeviceId && preferredDeviceId !== 'default') {
      const selected = devices.find(d => d.kind === 'audioinput' && d.deviceId === preferredDeviceId);
      if (selected) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: selected.deviceId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        });
        return { stream, rawStream: stream, sourceLabel: 'LOOPBACK DEVICE' };
      }
    }

    const loopRegex = /(stereo mix|what u hear|loopback|mezcla estereo|monitor)/i;
    const loopInput = devices.find(d => d.kind === 'audioinput' && loopRegex.test(d.label || ''));
    if (!loopInput) return null;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: { exact: loopInput.deviceId },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      }
    });
    return { stream, rawStream: stream, sourceLabel: 'LOOPBACK INPUT' };
  }

  async function createAudioStreamForSource() {
    if (!navigator.mediaDevices) throw new Error('NO_MEDIA_DEVICES');

    if (state.audioRx.source === 'loopback') {
      // ── 1. Try the user-selected device directly (may be a virtual cable) ──
      const selId = state.audioRx.deviceId;
      if (selId && selId !== 'default') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: selId },
              echoCancellation: false, noiseSuppression: false, autoGainControl: false,
            }
          });
          return { stream, rawStream: stream, sourceLabel: 'LOOPBACK DEVICE' };
        } catch(e) { /* continue */ }
      }

      // ── 2. Request audio permission so device labels become readable, then
      //       look for Stereo Mix / What U Hear / virtual cable ──────────────
      let permStream = null;
      try {
        permStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch(e) { /* permission denied — labels stay empty */ }

      const loopInput = await tryLoopbackInputDevice(null);
      if (permStream) permStream.getTracks().forEach(t => t.stop());
      if (loopInput) return loopInput;

      // ── 3. getDisplayMedia fallback (current tab + system audio) ──────────
      if (navigator.mediaDevices.getDisplayMedia) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            preferCurrentTab: true,
            selfBrowserSurface: 'include',
            surfaceSwitching: 'exclude',
            systemAudio: 'include',
            video: { frameRate: 1 },
            audio: {
              echoCancellation: false, noiseSuppression: false,
              autoGainControl: false, suppressLocalAudioPlayback: false,
            }
          });
          const tracks = displayStream.getAudioTracks();
          if (tracks.length) {
            return { stream: new MediaStream([tracks[0]]), rawStream: displayStream, sourceLabel: 'LOOPBACK DISPLAY' };
          }
          displayStream.getTracks().forEach(t => t.stop());
        } catch(err) { /* user cancelled dialog */ }
      }

      throw new Error('LOOPBACK_NO_AUDIO_TRACK');
    }

    const tuneForLine = state.audioRx.source === 'linein';
    const loopExclude = /(stereo mix|what u hear|loopback|mezcla estereo|monitor of)/i;

    // For MIC and LINE-IN: enumerate devices (request permission first so labels are visible),
    // then pick the right device excluding loopback-type inputs.
    {
      // Request permission to reveal device labels
      let permStream = null;
      try {
        permStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permStream.getTracks().forEach(t => t.stop());
      } catch(e) { throw e; }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const inputs = allDevices.filter(d => d.kind === 'audioinput' && !loopExclude.test(d.label || ''));

      if (!inputs.length) {
        throw new Error(tuneForLine ? 'NO_LINE_INPUT_FOUND' : 'NO_MIC_FOUND');
      }

      // Prefer the user-selected device if it's non-loopback, otherwise take first non-loopback
      const selId = state.audioRx.deviceId;
      const target = (selId && selId !== 'default' && inputs.some(d => d.deviceId === selId))
        ? selId
        : inputs[0].deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: target },
          echoCancellation: !tuneForLine,
          noiseSuppression: !tuneForLine,
          autoGainControl: !tuneForLine,
        }
      });
      // Update state so the dropdown reflects the actual device in use
      state.audioRx.deviceId = target;
      return { stream, rawStream: stream, sourceLabel: tuneForLine ? 'LINE-IN' : 'MIC' };
    }
  }

  // RMS energy over a frequency range — more perceptually accurate than linear mean.
  // Weights each bin equally in power (v²), then takes the root for amplitude.
  function getBandRms(freqData, fromBin, toBin) {
    if (!freqData || !freqData.length) return 0;
    const a = Math.max(0, Math.min(freqData.length - 1, fromBin));
    const b = Math.max(0, Math.min(freqData.length - 1, toBin));
    if (b < a) return 0;
    let sumSq = 0;
    let count = 0;
    for (let i = a; i <= b; i++) {
      const v = freqData[i] / 255;
      sumSq += v * v;
      count++;
    }
    return count ? Math.sqrt(sumSq / count) : 0;
  }

  async function enableAudioReactiveInput() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      document.getElementById('footer-info').textContent = 'AUDIO RX::NO DISPONIBLE';
      return;
    }
    try {
      if (!audioRxRuntime.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioRxRuntime.ctx = new AudioCtx();
      }
      if (audioRxRuntime.ctx.state === 'suspended') await audioRxRuntime.ctx.resume();

      if (audioRxRuntime.sourceNode) {
        audioRxRuntime.sourceNode.disconnect();
        audioRxRuntime.sourceNode = null;
      }
      if (audioRxRuntime.stream) {
        audioRxRuntime.stream.getTracks().forEach(t => t.stop());
        audioRxRuntime.stream = null;
      }
      if (audioRxRuntime.rawStream && audioRxRuntime.rawStream !== audioRxRuntime.stream) {
        audioRxRuntime.rawStream.getTracks().forEach(t => t.stop());
        audioRxRuntime.rawStream = null;
      }

      const streamPack = await createAudioStreamForSource();
      audioRxRuntime.stream = streamPack.stream;
      audioRxRuntime.rawStream = streamPack.rawStream;

      audioRxRuntime.sourceNode = audioRxRuntime.ctx.createMediaStreamSource(audioRxRuntime.stream);
      audioRxRuntime.analyser = audioRxRuntime.ctx.createAnalyser();
      audioRxRuntime.analyser.fftSize = 4096;   // higher resolution for low-freq accuracy
      audioRxRuntime.analyser.smoothingTimeConstant = 0; // all smoothing done in JS
      audioRxRuntime.sourceNode.connect(audioRxRuntime.analyser);
      audioRxRuntime.timeData = new Uint8Array(audioRxRuntime.analyser.fftSize);
      audioRxRuntime.freqData = new Uint8Array(audioRxRuntime.analyser.frequencyBinCount);
      audioRxRuntime.lowPeak = 0;
      audioRxRuntime.midPeak = 0;
      audioRxRuntime.highPeak = 0;

      state.audioRx.enabled = true;
      state.audioRx.ready = true;
      document.getElementById('footer-info').textContent = `AUDIO RX::${streamPack.sourceLabel || 'ON'}`;
    } catch (err) {
      state.audioRx.enabled = false;
      state.audioRx.ready = false;
      const msg = String(err && err.message || '');
      if (msg.includes('NO_AUDIO_TRACK')) {
        document.getElementById('footer-info').textContent = 'LOOPBACK::INSTALÁ VB-CABLE O HABILITÁ STEREO MIX — O ACEPTAR EL DIALOG DE AUDIO DEL TAB';
      } else if (msg.includes('NO_MIC_FOUND')) {
        document.getElementById('footer-info').textContent = 'MIC::NO SE DETECTÓ MICRÓFONO (SOLO DISPOSITIVOS LOOPBACK DISPONIBLES)';
      } else if (msg.includes('NO_LINE_INPUT_FOUND')) {
        document.getElementById('footer-info').textContent = 'LINE-IN::NO SE DETECTÓ ENTRADA DE LÍNEA';
      } else {
        document.getElementById('footer-info').textContent = 'AUDIO RX::PERMISO DENEGADO';
      }
    }
    updateAudioRxUi();
  }

  function disableAudioReactiveInput() {
    state.audioRx.enabled = false;
    state.audioRx.ready = false;
    state.audioRx.level = 0;
    if (audioRxRuntime.sourceNode) {
      audioRxRuntime.sourceNode.disconnect();
      audioRxRuntime.sourceNode = null;
    }
    if (audioRxRuntime.stream) {
      audioRxRuntime.stream.getTracks().forEach(t => t.stop());
      audioRxRuntime.stream = null;
    }
    if (audioRxRuntime.rawStream && audioRxRuntime.rawStream !== audioRxRuntime.stream) {
      audioRxRuntime.rawStream.getTracks().forEach(t => t.stop());
      audioRxRuntime.rawStream = null;
    }
    audioRxRuntime.analyser = null;
    audioRxRuntime.timeData = null;
    audioRxRuntime.freqData = null;
    audioRxRuntime.lowPeak = 0;
    audioRxRuntime.midPeak = 0;
    audioRxRuntime.highPeak = 0;
    state.audioRx.lowLevel = 0;
    state.audioRx.midLevel = 0;
    state.audioRx.highLevel = 0;
    updateAudioRxUi();
  }

  function sampleAudioReactiveLevel() {
    if (state.audioRx.enabled && state.audioRx.ready && audioRxRuntime.analyser && audioRxRuntime.timeData) {
      // analyser.smoothingTimeConstant is fixed at 0; all smoothing is controlled here in JS
      audioRxRuntime.analyser.getByteTimeDomainData(audioRxRuntime.timeData);
      if (audioRxRuntime.freqData) audioRxRuntime.analyser.getByteFrequencyData(audioRxRuntime.freqData);

      // ── Overall level: time-domain RMS ───────────────────────────────────
      let sumSq = 0;
      for (let i = 0; i < audioRxRuntime.timeData.length; i++) {
        const v = (audioRxRuntime.timeData[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / audioRxRuntime.timeData.length);
      const boosted = Math.min(1, rms * 3.5);

      // ── Band RMS with musical frequency ranges ────────────────────────────
      const sampleRate = (audioRxRuntime.ctx && audioRxRuntime.ctx.sampleRate) || 48000;
      const fftSize = (audioRxRuntime.analyser && audioRxRuntime.analyser.fftSize) || 4096;
      const binHz = sampleRate / fftSize;
      // LOW  45–250 Hz  (trim sub-rumble from open mics)
      // MID  250–4000 Hz (vocals, instruments, presence)
      // HIGH 4000–16000 Hz (air, brilliance, hi-hats)
      const lowRaw  = getBandRms(audioRxRuntime.freqData, Math.max(1, Math.floor(45   / binHz)), Math.floor(250   / binHz));
      const midRaw  = getBandRms(audioRxRuntime.freqData, Math.floor(250  / binHz), Math.floor(4000  / binHz));
      const highRaw = getBandRms(audioRxRuntime.freqData, Math.floor(4000 / binHz), Math.floor(16000 / binHz));

      // ── Per-band adaptive peak tracking (slow decay ≈ 3 s @ 60 fps) ──────
      // Normalises each band to its recent maximum so all bands stay active
      // even with spectrally unbalanced sources (e.g. bass-heavy music).
      const PEAK_DECAY  = 0.9983;
      const LOW_NOISE_FLOOR  = 0.03;
      const MID_NOISE_FLOOR  = 0.018;
      const HIGH_NOISE_FLOOR = 0.015;
      const lowSignal  = Math.max(0, lowRaw  - LOW_NOISE_FLOOR);
      const midSignal  = Math.max(0, midRaw  - MID_NOISE_FLOOR);
      const highSignal = Math.max(0, highRaw - HIGH_NOISE_FLOOR);
      audioRxRuntime.lowPeak  = Math.max(lowSignal,  (audioRxRuntime.lowPeak  || LOW_NOISE_FLOOR)  * PEAK_DECAY);
      audioRxRuntime.midPeak  = Math.max(midSignal,  (audioRxRuntime.midPeak  || MID_NOISE_FLOOR)  * PEAK_DECAY);
      audioRxRuntime.highPeak = Math.max(highSignal, (audioRxRuntime.highPeak || HIGH_NOISE_FLOOR) * PEAK_DECAY);

      // Blend: 65% adaptive-normalised + 35% absolute so quiet sources don't
      // inflate to 100% — keeps a natural dynamic feel.
      const lowNorm  = lowSignal  > 0 ? Math.min(1, lowSignal  / Math.max(LOW_NOISE_FLOOR,  audioRxRuntime.lowPeak))  : 0;
      const midNorm  = midSignal  > 0 ? Math.min(1, midSignal  / Math.max(MID_NOISE_FLOOR,  audioRxRuntime.midPeak))  : 0;
      const highNorm = highSignal > 0 ? Math.min(1, highSignal / Math.max(HIGH_NOISE_FLOOR, audioRxRuntime.highPeak)) : 0;
      const lowVal   = Math.min(1, 0.65 * lowNorm  + 0.35 * Math.min(1, lowSignal  * 4.0));
      const midVal   = Math.min(1, 0.65 * midNorm  + 0.35 * Math.min(1, midSignal * 4.5));
      const highVal  = Math.min(1, 0.65 * highNorm + 0.35 * Math.min(1, highSignal * 6.0));

      // ── JS exponential smoothing (single layer — no double-smoothing) ─────
      const smooth = Math.max(0, Math.min(0.98, state.audioRx.smooth));
      const master = Math.max(0, state.audioRx.masterSend) / 100;
      state.audioRx.level     = (state.audioRx.level     * smooth + boosted * (1 - smooth)) * master;
      state.audioRx.lowLevel  = (state.audioRx.lowLevel  * smooth + lowVal  * (1 - smooth)) * master;
      state.audioRx.midLevel  = (state.audioRx.midLevel  * smooth + midVal  * (1 - smooth)) * master;
      state.audioRx.highLevel = (state.audioRx.highLevel * smooth + highVal * (1 - smooth)) * master;
    } else {
      state.audioRx.level     *= 0.9;
      state.audioRx.lowLevel  *= 0.9;
      state.audioRx.midLevel  *= 0.9;
      state.audioRx.highLevel *= 0.9;
    }
    updateAudioRxUi();
  }

  function updateAudioPatchIndicators() {
    // no-op kept to avoid call-site churn; can host future patch indicator refreshes
  }
  function rngRange(a, b) { return a + rng() * (b - a); }
  function rngInt(a, b) { return Math.floor(rngRange(a, b + 1)); }
  function rngPick(arr) { return arr[Math.floor(rng() * arr.length)]; }

  // ── Value Noise ────────────────────────────────────────────────────────────
  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function lerpN(a, b, t) { return a + (b - a) * t; }
  function pseudoRnd(x, y) {
    // Fast, sin-less integer hash (coercing coordinates to 32-bit integers)
    let h = Math.imul(x | 0, 0x85ebca6b) ^ Math.imul(y | 0, 0xc2b2ae35);
    h = Math.imul(h ^ (h >>> 15), 0x7feb352d);
    h = h ^ (h >>> 13);
    return (h & 0x7fffffff) / 2147483648;
  }
  function valueNoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = smoothstep(xf), v = smoothstep(yf);
    return lerpN(
      lerpN(pseudoRnd(xi, yi), pseudoRnd(xi + 1, yi), u),
      lerpN(pseudoRnd(xi, yi + 1), pseudoRnd(xi + 1, yi + 1), u), v
    );
  }

  // ── Color Palettes ─────────────────────────────────────────────────────────
  const PALETTES = {
    mono:      { bg_light:'#e8eaf0', bg_dark:'#16161e', bg_paper:'#f0ede6', bg_black:'#080808', colors:['#1e2030','#2e3248','#3e4260','#505578','#6a708c'], accent:'#1e2030', thin:'#8090b044' },
    cyber:     { bg_light:'#e0f8ff', bg_dark:'#04080f', bg_paper:'#f0faff', bg_black:'#020610', colors:['#00eeff','#ff00ee','#0080ff','#8000ff','#00ff80','#ff8800'], accent:'#00eeff', thin:'#ff00ee44' },
    neon:      { bg_light:'#e0ffe4', bg_dark:'#040f04', bg_paper:'#f0fff2', bg_black:'#020802', colors:['#00ff44','#00ffcc','#44ff00','#88ff00','#00ee88','#ccff00'], accent:'#00ff44', thin:'#00ff4433' },
    blood:     { bg_light:'#ffe8e8', bg_dark:'#120404', bg_paper:'#fff2f0', bg_black:'#0a0202', colors:['#cc0000','#ff2200','#880011','#ff4400','#cc4422','#ff6644'], accent:'#ff2200', thin:'#cc000044' },
    ice:       { bg_light:'#eef4ff', bg_dark:'#04080e', bg_paper:'#f5f8ff', bg_black:'#030610', colors:['#88aaff','#aaccff','#6688ee','#99bbff','#cce8ff','#ddeeff'], accent:'#88aaff', thin:'#88aaff44' },
    gold:      { bg_light:'#fff8e8', bg_dark:'#120e00', bg_paper:'#fffaf0', bg_black:'#0a0800', colors:['#cc8800','#ffaa00','#ff6600','#ffd000','#886600','#ffcc44'], accent:'#ffaa00', thin:'#cc880044' },
    vaporwave: { bg_light:'#fff0ff', bg_dark:'#0a0414', bg_paper:'#fff8fe', bg_black:'#080210', colors:['#ff6ec7','#a78bfa','#38bdf8','#fb7185','#c084fc','#67e8f9'], accent:'#ff6ec7', thin:'#a78bfa44' },
    matrix:    { bg_light:'#e8ffe8', bg_dark:'#000a00', bg_paper:'#f0fff0', bg_black:'#000400', colors:['#00ff00','#00cc00','#00ff66','#44ff44','#00aa00','#88ff88'], accent:'#00ff00', thin:'#00ff0033' },
    rust:      { bg_light:'#fff4ec', bg_dark:'#120800', bg_paper:'#fffaf5', bg_black:'#0c0400', colors:['#c74a00','#e8603a','#a03010','#f08050','#804020','#e8a060'], accent:'#c74a00', thin:'#c74a0044' },
    gundam:    { bg_light:'#e8f0e0', bg_dark:'#060a06', bg_paper:'#f0f4e8', bg_black:'#020402', colors:['#4cd964','#ffcc00','#ff8c00','#00e5ff','#b8ff3c','#ffffff'], accent:'#ffcc00', thin:'#4cd96444' },
    evangelion:{ bg_light:'#f4efff', bg_dark:'#09020f', bg_paper:'#fbf7ff', bg_black:'#040008', colors:['#7a35ff','#b05cff','#66ff33','#ff3b30','#ff9f0a','#ffffff'], accent:'#ff3b30', thin:'#7a35ff55' },
    sunset:    { bg_light:'#fff0e8', bg_dark:'#120806', bg_paper:'#fdf5f0', bg_black:'#0c0402', colors:['#ff6b35','#f7c59f','#ff4d6d','#c9184a','#ff8fa3','#ffd166'], accent:'#ff6b35', thin:'#ff6b3544' },
    ocean:     { bg_light:'#e8f4ff', bg_dark:'#020810', bg_paper:'#f0f8ff', bg_black:'#010610', colors:['#0077b6','#00b4d8','#90e0ef','#023e8a','#48cae4','#caf0f8'], accent:'#00b4d8', thin:'#0077b644' },
    forest:    { bg_light:'#eaf5ea', bg_dark:'#040c04', bg_paper:'#f4faf4', bg_black:'#020802', colors:['#2d6a4f','#40916c','#52b788','#74c69d','#b7e4c7','#d8f3dc'], accent:'#40916c', thin:'#2d6a4f44' },
    nordic:    { bg_light:'#eceff4', bg_dark:'#2e3440', bg_paper:'#e5e9f0', bg_black:'#1c2028', colors:['#88c0d0','#81a1c1','#5e81ac','#b48ead','#a3be8c','#ebcb8b'], accent:'#88c0d0', thin:'#5e81ac44' },
    sakura:    { bg_light:'#fff0f5', bg_dark:'#160610', bg_paper:'#fff5f8', bg_black:'#0e0408', colors:['#ff85a1','#ffc2d1','#ffb3c1','#ff758f','#c77dff','#e040fb'], accent:'#ff85a1', thin:'#ff85a133' },
    lava:      { bg_light:'#fff0e0', bg_dark:'#0c0200', bg_paper:'#fff5ec', bg_black:'#080100', colors:['#ff4500','#ff6a00','#ff8c00','#ffd000','#cc2200','#ff2200'], accent:'#ff4500', thin:'#ff450044' },
    synthwave: { bg_light:'#f0e8ff', bg_dark:'#07020f', bg_paper:'#f8f4ff', bg_black:'#050010', colors:['#f72585','#7209b7','#3a0ca3','#4361ee','#4cc9f0','#b5179e'], accent:'#f72585', thin:'#7209b744' },
    toxic:     { bg_light:'#f4ffe8', bg_dark:'#030800', bg_paper:'#f8fff0', bg_black:'#020600', colors:['#aaff00','#ccff00','#88ff44','#ffff00','#66ff00','#33ff00'], accent:'#aaff00', thin:'#aaff0044' },
  };

  // Fixed bg overrides for new bg modes (palette-independent)
  const BG_FIXED = {
    midnight: '#070d1a', sepia: '#f2e2c0',
    violet:   '#1a0835', jade:  '#041c0c',
    wine:     '#280810', steel: '#081228',
    copper:   '#2a1406', slate: '#101826'
  };

  function getPalette() { return PALETTES[state.palette]; }
  function getBgColor() { return BG_FIXED[state.bg] ?? getPalette()[`bg_${state.bg}`]; }
  function getColors() { return getPalette().colors; }
  function getAccent() { return getPalette().accent; }
  function getThin() { return getPalette().thin; }
  function lw(base = 1) { return base * (state.weight * 0.28 + 0.3) * (offCanvas.width / 1280); }
  function lf(base = 8) { return Math.max(11, Math.floor(base * (offCanvas.width / 1280))); }

  // ── HUD Strings ────────────────────────────────────────────────────────────
  const HUD_TEXTS = [
    'SYSTEM ONLINE','INITIALIZING','PROCESS::OK','DATA STREAM','VECTOR::LOCK',
    'SYNC ACTIVE','GATE::OPEN','LINK EST.','I AM THE GATEKEEPER','DAEMON ACTIVE',
    'NULL::VOID','STATUS::NOMINAL','// OVERRIDE','ENGAGE','TARGET ACQUIRED',
    'SUBSYS::OK','NODE ACTIVE','>>> EXEC','ACCESS::GRANTED','PROTOCOL::7F',
    'SIGNAL LOST','REROUTING','BUFFER::CLEAR','SEQUENCE A','LOOPBACK',
    'MODULE::[02]','TRACE::ACTIVE','CORE::BREACH','SYS FAILURE','REBOOT NOW',
  ];
  const TECH_STRINGS = [
    '0xFF3A2D','0x00000001','3.14159265','1337::{CORE}','SYS_FLAG_01',
    'ERR::404','CLK::8MHz','IRQ_HANDLER','1001 0110','ADDR::7E4F',
    'PKT::/dev/null','::STANDBY','[HEARTBEAT]','---//---',':::::::::',
    '>>> 00FF','gates::gatekeeping','/usr/daemon','PROC_ID::[97]',
    '01001100','FREQ::440Hz','PHASE::+90°','AMP::0.84',
  ];
  const SYMBOLS = ['◈','◆','◇','⬡','⬢','▲','△','▶','◎','⊞','✦','⊕','⊗','⊘','◉','⌬','∿','⊶','⋮','⁂'];

  // ─────────────────────────────────────────────────────────────────────────
  //  COMPOSITION SYSTEM
  // ─────────────────────────────────────────────────────────────────────────

  let comp = null;

  function buildComposition(W, H) {
    const archetypes = [
      'rule-of-thirds',
      'golden-ratio',
      'centered',
      'diagonal',
      'radial',
      'panoramic',
      'columnar',
      'l-shape',
      't-shape',
      'extreme-asymmetric'
    ];
    const archetype = rngPick(archetypes);

    const thirdX = [W * 0.33, W * 0.67];
    const thirdY = [H * 0.33, H * 0.67];
    const thirds = [];
    for (const x of thirdX) for (const y of thirdY) thirds.push({ x, y });

    let focalPoints = [];
    let supportPoints = [];
    let quietZones = [];

    if (archetype === 'rule-of-thirds') {
      const pf = rngPick(thirds);
      focalPoints.push({ x: pf.x, y: pf.y, r: Math.min(W, H) * rngRange(0.12, 0.22) });
      for (const t of thirds) {
        if (t.x !== pf.x || t.y !== pf.y) {
          if (rng() < 0.55) {
            supportPoints.push({ x: t.x, y: t.y, r: Math.min(W, H) * rngRange(0.07, 0.14) });
          }
        }
      }
      const qx = pf.x < W / 2 ? W * 0.55 : 0;
      const qy = pf.y < H / 2 ? H * 0.55 : 0;
      quietZones.push({ x: qx, y: qy, w: W * 0.38, h: H * 0.38 });
    } else if (archetype === 'golden-ratio') {
      const phiX = [W * 0.382, W * 0.618];
      const phiY = [H * 0.382, H * 0.618];
      const phis = [];
      for (const x of phiX) for (const y of phiY) phis.push({ x, y });
      const pf = rngPick(phis);
      focalPoints.push({ x: pf.x, y: pf.y, r: Math.min(W, H) * 0.18 });
      for (const p of phis) {
        if (p.x !== pf.x || p.y !== pf.y) {
          if (rng() < 0.55) {
            supportPoints.push({ x: p.x, y: p.y, r: Math.min(W, H) * 0.11 });
          }
        }
      }
      const qx = pf.x < W / 2 ? W * 0.618 : 0;
      const qy = pf.y < H / 2 ? H * 0.618 : 0;
      quietZones.push({ x: qx, y: qy, w: W * 0.382, h: H * 0.382 });
    } else if (archetype === 'centered') {
      focalPoints.push({ x: W * 0.5, y: H * 0.5, r: Math.min(W, H) * 0.24 });
      const numSupports = rngPick([2, 3, 4]);
      const baseAng = rng() * Math.PI * 2;
      const dist = Math.min(W, H) * 0.2;
      for (let i = 0; i < numSupports; i++) {
        const ang = baseAng + (i * Math.PI * 2) / numSupports;
        supportPoints.push({
          x: W * 0.5 + Math.cos(ang) * dist,
          y: H * 0.5 + Math.sin(ang) * dist,
          r: Math.min(W, H) * 0.08
        });
      }
      const cornerSize = 0.22;
      quietZones.push({ x: 0, y: 0, w: W * cornerSize, h: H * cornerSize });
      quietZones.push({ x: W * (1 - cornerSize), y: 0, w: W * cornerSize, h: H * cornerSize });
      quietZones.push({ x: 0, y: H * (1 - cornerSize), w: W * cornerSize, h: H * cornerSize });
      quietZones.push({ x: W * (1 - cornerSize), y: H * (1 - cornerSize), w: W * cornerSize, h: H * cornerSize });
    } else if (archetype === 'diagonal') {
      const flip = rng() < 0.5;
      focalPoints.push({ x: flip ? W * 0.25 : W * 0.75, y: flip ? H * 0.25 : H * 0.75, r: Math.min(W, H) * 0.18 });
      supportPoints.push({ x: W * 0.5, y: H * 0.5, r: Math.min(W, H) * 0.08 });
      supportPoints.push({ x: flip ? W * 0.75 : W * 0.25, y: flip ? H * 0.75 : H * 0.25, r: Math.min(W, H) * 0.12 });
      quietZones.push({ x: 0, y: flip ? H * 0.55 : 0, w: W * 0.32, h: H * 0.38 });
      quietZones.push({ x: W * 0.68, y: flip ? 0 : H * 0.55, w: W * 0.32, h: H * 0.38 });
    } else if (archetype === 'radial') {
      focalPoints.push({ x: W * 0.5, y: H * 0.5, r: Math.min(W, H) * 0.2 });
      const baseAngle = rng() * Math.PI * 2;
      const r1 = Math.min(W, H) * 0.28;
      for (let i = 0; i < 3; i++) {
        const ang = baseAngle + (i * Math.PI * 2) / 3;
        supportPoints.push({
          x: W * 0.5 + Math.cos(ang) * r1,
          y: H * 0.5 + Math.sin(ang) * r1,
          r: Math.min(W, H) * 0.09
        });
      }
      if (state.complexity > 6) {
        const r2 = Math.min(W, H) * 0.4;
        for (let i = 0; i < 2; i++) {
          const ang = baseAngle + Math.PI / 3 + (i * Math.PI);
          supportPoints.push({
            x: W * 0.5 + Math.cos(ang) * r2,
            y: H * 0.5 + Math.sin(ang) * r2,
            r: Math.min(W, H) * 0.06
          });
        }
      }
    } else if (archetype === 'panoramic') {
      const yVal = rngPick([H * 0.382, H * 0.5, H * 0.618]);
      focalPoints.push({ x: W * 0.5, y: yVal, r: Math.min(W, H) * 0.18 });
      supportPoints.push({ x: W * 0.18, y: yVal, r: Math.min(W, H) * 0.11 });
      supportPoints.push({ x: W * 0.82, y: yVal, r: Math.min(W, H) * 0.11 });
      if (rng() < 0.5) {
        supportPoints.push({ x: W * 0.34, y: yVal, r: Math.min(W, H) * 0.08 });
        supportPoints.push({ x: W * 0.66, y: yVal, r: Math.min(W, H) * 0.08 });
      }
      if (yVal > H * 0.45 && yVal < H * 0.55) {
        quietZones.push({ x: 0, y: 0, w: W, h: H * 0.22 });
        quietZones.push({ x: 0, y: H * 0.78, w: W, h: H * 0.22 });
      } else if (yVal <= H * 0.45) {
        quietZones.push({ x: 0, y: H * 0.55, w: W, h: H * 0.38 });
      } else {
        quietZones.push({ x: 0, y: 0, w: W, h: H * 0.38 });
      }
    } else if (archetype === 'columnar') {
      const xVal = rngPick([W * 0.382, W * 0.5, W * 0.618]);
      focalPoints.push({ x: xVal, y: H * 0.5, r: Math.min(W, H) * 0.18 });
      supportPoints.push({ x: xVal, y: H * 0.18, r: Math.min(W, H) * 0.11 });
      supportPoints.push({ x: xVal, y: H * 0.82, r: Math.min(W, H) * 0.11 });
      if (rng() < 0.5) {
        supportPoints.push({ x: xVal, y: H * 0.34, r: Math.min(W, H) * 0.08 });
        supportPoints.push({ x: xVal, y: H * 0.66, r: Math.min(W, H) * 0.08 });
      }
      if (xVal > W * 0.45 && xVal < W * 0.55) {
        quietZones.push({ x: 0, y: 0, w: W * 0.22, h: H });
        quietZones.push({ x: W * 0.78, y: 0, w: W * 0.22, h: H });
      } else if (xVal <= W * 0.45) {
        quietZones.push({ x: W * 0.55, y: 0, w: W * 0.38, h: H });
      } else {
        quietZones.push({ x: 0, y: 0, w: W * 0.38, h: H });
      }
    } else if (archetype === 'l-shape') {
      const corner = rngInt(0, 4);
      let fx, fy, sx1, sy1, sx2, sy2;
      const ox = W * 0.25, oy = H * 0.25;
      const px = W * 0.75, py = H * 0.75;
      if (corner === 0) {
        fx = ox; fy = oy; sx1 = ox; sy1 = py; sx2 = px; sy2 = oy;
      } else if (corner === 1) {
        fx = px; fy = oy; sx1 = px; sy1 = py; sx2 = ox; sy2 = oy;
      } else if (corner === 2) {
        fx = ox; fy = py; sx1 = ox; sy1 = oy; sx2 = px; sy2 = py;
      } else {
        fx = px; fy = py; sx1 = px; sy1 = oy; sx2 = ox; sy2 = py;
      }
      focalPoints.push({ x: fx, y: fy, r: Math.min(W, H) * 0.18 });
      supportPoints.push({ x: sx1, y: sy1, r: Math.min(W, H) * 0.12 });
      supportPoints.push({ x: sx2, y: sy2, r: Math.min(W, H) * 0.12 });
      const qx = fx < W / 2 ? W * 0.45 : 0;
      const qy = fy < H / 2 ? H * 0.45 : 0;
      quietZones.push({ x: qx, y: qy, w: W * 0.5, h: H * 0.5 });
    } else if (archetype === 't-shape') {
      const orientation = rngInt(0, 4);
      let fx, fy, sx1, sy1, sx2, sy2;
      const ox = W * 0.25, oy = H * 0.25;
      const cx = W * 0.5, cy = H * 0.5;
      const px = W * 0.75, py = H * 0.75;
      if (orientation === 0) {
        fx = cx; fy = oy; sx1 = ox; sy1 = oy; sx2 = px; sy2 = oy;
        supportPoints.push({ x: cx, y: py, r: Math.min(W, H) * 0.12 });
      } else if (orientation === 1) {
        fx = cx; fy = py; sx1 = ox; sy1 = py; sx2 = px; sy2 = py;
        supportPoints.push({ x: cx, y: oy, r: Math.min(W, H) * 0.12 });
      } else if (orientation === 2) {
        fx = ox; fy = cy; sx1 = ox; sy1 = oy; sx2 = ox; sy2 = py;
        supportPoints.push({ x: px, y: cy, r: Math.min(W, H) * 0.12 });
      } else {
        fx = px; fy = cy; sx1 = px; sy1 = oy; sx2 = px; sy2 = py;
        supportPoints.push({ x: ox, y: cy, r: Math.min(W, H) * 0.12 });
      }
      focalPoints.push({ x: fx, y: fy, r: Math.min(W, H) * 0.18 });
      supportPoints.push({ x: sx1, y: sy1, r: Math.min(W, H) * 0.11 });
      supportPoints.push({ x: sx2, y: sy2, r: Math.min(W, H) * 0.11 });
      if (orientation === 0) {
        quietZones.push({ x: 0, y: cy, w: W * 0.35, h: H * 0.45 });
        quietZones.push({ x: W * 0.65, y: cy, w: W * 0.35, h: H * 0.45 });
      } else if (orientation === 1) {
        quietZones.push({ x: 0, y: 0, w: W * 0.35, h: H * 0.45 });
        quietZones.push({ x: W * 0.65, y: 0, w: W * 0.35, h: H * 0.45 });
      } else if (orientation === 2) {
        quietZones.push({ x: cx, y: 0, w: W * 0.45, h: H * 0.35 });
        quietZones.push({ x: cx, y: H * 0.65, w: W * 0.45, h: H * 0.35 });
      } else {
        quietZones.push({ x: 0, y: 0, w: W * 0.45, h: H * 0.35 });
        quietZones.push({ x: 0, y: H * 0.65, w: W * 0.45, h: H * 0.35 });
      }
    } else {
      const corner = rngInt(0, 4);
      let fx, fy, sx1, sy1, sx2, sy2;
      let qx, qy, qw, qh;
      if (corner === 0) {
        fx = W * 0.18; fy = H * 0.18; sx1 = W * 0.28; sy1 = H * 0.12; sx2 = W * 0.12; sy2 = H * 0.28;
        qx = W * 0.35; qy = 0; qw = W * 0.65; qh = H;
        quietZones.push({ x: 0, y: H * 0.35, w: W * 0.35, h: H * 0.65 });
      } else if (corner === 1) {
        fx = W * 0.82; fy = H * 0.18; sx1 = W * 0.72; sy1 = H * 0.12; sx2 = W * 0.88; sy2 = H * 0.28;
        qx = 0; qy = 0; qw = W * 0.65; qh = H;
        quietZones.push({ x: W * 0.65, y: H * 0.35, w: W * 0.35, h: H * 0.65 });
      } else if (corner === 2) {
        fx = W * 0.18; fy = H * 0.82; sx1 = W * 0.28; sy1 = H * 0.88; sx2 = W * 0.12; sy2 = H * 0.72;
        qx = W * 0.35; qy = 0; qw = W * 0.65; qh = H;
        quietZones.push({ x: 0, y: 0, w: W * 0.35, h: H * 0.65 });
      } else {
        fx = W * 0.82; fy = H * 0.82; sx1 = W * 0.72; sy1 = H * 0.88; sx2 = W * 0.88; sy2 = H * 0.72;
        qx = 0; qy = 0; qw = W * 0.65; qh = H;
        quietZones.push({ x: W * 0.65, y: 0, w: W * 0.35, h: H * 0.65 });
      }
      focalPoints.push({ x: fx, y: fy, r: Math.min(W, H) * 0.16 });
      supportPoints.push({ x: sx1, y: sy1, r: Math.min(W, H) * 0.08 });
      supportPoints.push({ x: sx2, y: sy2, r: Math.min(W, H) * 0.08 });
      quietZones.push({ x: qx, y: qy, w: qw, h: qh });
    }

    function densityAt(x, y) {
      let d = 0.25;
      for (const qz of quietZones) {
        if (x >= qz.x && x <= qz.x + qz.w && y >= qz.y && y <= qz.y + qz.h) d *= 0.25;
      }
      for (const sp of supportPoints) {
        const dist = Math.hypot(x - sp.x, y - sp.y);
        d = Math.max(d, 0.5 * Math.max(0, 1 - dist / (sp.r * 2)));
      }
      for (const fp of focalPoints) {
        const dist = Math.hypot(x - fp.x, y - fp.y);
        d = Math.max(d, Math.max(0, 1 - dist / (fp.r * 1.5)));
      }
      return Math.min(1, d);
    }

    function focalPos() {
      const fp = rngPick(focalPoints);
      const a = rng() * Math.PI * 2;
      // Snap to center at chaos=0, disperses as chaos increases
      const maxR = fp.r * (state.chaos / 100.0);
      const r = rng() * maxR;
      return { x: fp.x + Math.cos(a) * r, y: fp.y + Math.sin(a) * r };
    }

    function supportPos() {
      if (supportPoints.length === 0) return focalPos();
      const sp = rngPick(supportPoints);
      const a = rng() * Math.PI * 2;
      // Snap to center at chaos=0, disperses as chaos increases
      const maxR = sp.r * (state.chaos / 100.0);
      const r = rng() * maxR;
      return { x: sp.x + Math.cos(a) * r, y: sp.y + Math.sin(a) * r };
    }

    function bgPos() {
      let x = 0, y = 0;
      for (let attempt = 0; attempt < 8; attempt++) {
        x = rngRange(0, W); y = rngRange(0, H);
        const inFocal = focalPoints.some(fp => Math.hypot(x - fp.x, y - fp.y) < fp.r * 0.6);
        if (!inFocal) break;
      }
      // Snap to 12x12 grid intersections when chaos is low
      const gridSnapFactor = Math.max(0, 1 - state.chaos / 40.0);
      if (gridSnapFactor > 0) {
        const gridX = W / 12;
        const gridY = H / 12;
        const snappedX = Math.round(x / gridX) * gridX;
        const snappedY = Math.round(y / gridY) * gridY;
        x = x + (snappedX - x) * gridSnapFactor;
        y = y + (snappedY - y) * gridSnapFactor;
      }
      return { x, y };
    }

    function posOpacity(x, y, baseMin, baseMax) {
      if (baseMin === undefined) baseMin = 0.15;
      if (baseMax === undefined) baseMax = 0.9;
      const d = densityAt(x, y);
      return baseMin + (baseMax - baseMin) * d;
    }

    const anchors = [];
    const f0 = focalPoints[0] || { x: W * 0.5, y: H * 0.5, r: Math.min(W, H) * 0.2 };
    anchors.push({
      id: 0,
      x: f0.x,
      y: f0.y,
      r: f0.r,
      type: 'focal',
      angle: rngPick([0, Math.PI / 4, -Math.PI / 4, Math.PI / 6, -Math.PI / 6, Math.PI / 2]),
      connections: []
    });

    const numSupport = Math.max(2, supportPoints.length);
    for (let i = 0; i < numSupport; i++) {
      let sp = supportPoints[i];
      if (!sp) {
        const dist = Math.min(W, H) * 0.28;
        const angle = anchors[0].angle + (i === 0 ? Math.PI * 0.75 : -Math.PI * 0.75);
        sp = {
          x: f0.x + Math.cos(angle) * dist,
          y: f0.y + Math.sin(angle) * dist,
          r: f0.r * 0.65
        };
      }
      anchors.push({
        id: i + 1,
        x: sp.x,
        y: sp.y,
        r: sp.r,
        type: 'support',
        angle: rngPick([0, Math.PI / 4, -Math.PI / 4, Math.PI / 6, -Math.PI / 6, Math.PI / 2]),
        connections: [0]
      });
      anchors[0].connections.push(i + 1);
    }

    return { archetype, focalPoints, supportPoints, quietZones, densityAt, focalPos, supportPos, bgPos, posOpacity, W, H, anchors };
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DRAW MODES (all draw to offCtx)
  // ─────────────────────────────────────────────────────────────────────────

  function drawVectorheart(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const cFactor = state.chaos / 30.0;

    // 1. Structural Lines & Guide Grid (Continuity and Alignment)
    if (!isDetailPass) {
      // Connect anchors (Continuity)
      offCtx.strokeStyle = getThin(); offCtx.lineWidth = lw(0.6); offCtx.globalAlpha = 0.5;
      for (let a = 1; a < c.anchors.length; a++) {
        const start = c.anchors[a];
        const end = c.anchors[start.connections[0] || 0];
        
        offCtx.beginPath();
        offCtx.moveTo(start.x, start.y);
        offCtx.lineTo(end.x, end.y);
        offCtx.stroke();

        // Draw structural ticks on connection line midpoint
        if (state.complexity > 5) {
          const mx = (start.x + end.x) / 2;
          const my = (start.y + end.y) / 2;
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const len = Math.hypot(dx, dy);
          if (len > 0) {
            const nx = -dy / len * lw(8);
            const ny = dx / len * lw(8);
            offCtx.beginPath();
            offCtx.moveTo(mx - nx, my - ny);
            offCtx.lineTo(mx + nx, my + ny);
            offCtx.stroke();
          }
        }
      }

      // Draw horizontal/vertical construct lines passing through anchors (Alignment)
      offCtx.strokeStyle = getThin(); offCtx.lineWidth = lw(0.3); offCtx.globalAlpha = 0.15 * Math.max(0.1, 1 - cFactor);
      for (const anchor of c.anchors) {
        offCtx.beginPath(); offCtx.moveTo(0, anchor.y); offCtx.lineTo(W, anchor.y); offCtx.stroke();
        offCtx.beginPath(); offCtx.moveTo(anchor.x, 0); offCtx.lineTo(anchor.x, H); offCtx.stroke();
      }
    }

    // 2. Component Assemblies (Proximity, Closure, Hierarchy)
    for (let i = 0; i < c.anchors.length; i++) {
      const anchor = c.anchors[i];
      const scale = i === 0 ? 1.0 : i === 1 ? 0.618 : 0.45;
      
      const pos = { x: anchor.x, y: anchor.y };
      // Jitter/displacement increases with chaos
      const driftX = (rng() - 0.5) * cFactor * 60;
      const driftY = (rng() - 0.5) * cFactor * 60;
      pos.x += driftX;
      pos.y += driftY;

      // Base sizes scaled hierarchically
      const w = rngRange(W * 0.12, W * 0.28) * scale;
      const h = rngRange(H * 0.1, H * 0.22) * scale;
      let angle = anchor.angle;
      angle += (rng() - 0.5) * cFactor * 0.5;

      offCtx.save();
      offCtx.translate(pos.x, pos.y);
      offCtx.rotate(angle + Math.sin(t * 0.8 + i) * 0.05);
      offCtx.fillStyle = rngPick(colors);
      offCtx.globalAlpha = c.posOpacity(pos.x, pos.y, 0.4, 1.0);

      let skew = rngRange(-w * 0.2, w * 0.2);
      skew *= cFactor; // 0 skew when chaos is 0

      // Procedural mecha-shield formula parameters
      const numVertices = rngInt(3, 8);
      const splitAngle = rngRange(0, Math.PI * 2);
      const splitOffset = rngRange(lw(3), lw(10)) * cFactor;
      const modAmp1 = rngRange(0.05, 0.22);
      const modAmp2 = rngRange(0.05, 0.22);
      const freq1 = rngInt(2, 6);
      const freq2 = rngInt(2, 6);

      const drawShapePath = (ctx, sw, sh, sk) => {
        ctx.beginPath();
        const pts = [];
        const baseR = Math.min(sw, sh) * 0.55;
        
        // Generate vertices using polar coordinate modulation formula
        for (let j = 0; j < numVertices; j++) {
          const theta = (j / numVertices) * Math.PI * 2;
          const r = baseR * (1 + modAmp1 * Math.cos(freq1 * theta) + modAmp2 * Math.sin(freq2 * theta));
          // Apply aspect ratio scale and skew
          const px = Math.cos(theta) * r * (sw / (baseR * 2));
          const py = Math.sin(theta) * r * (sh / (baseR * 2));
          pts.push({ x: px, y: py });
        }

        const splitCos = Math.cos(splitAngle);
        const splitSin = Math.sin(splitAngle);

        pts.forEach((pt, idx) => {
          // Split-plate mecha armor displacement using vector dot product projection
          const dot = pt.x * splitCos + pt.y * splitSin;
          const dx = dot >= 0 ? splitCos * splitOffset : -splitCos * splitOffset;
          const dy = dot >= 0 ? splitSin * splitOffset : -splitSin * splitOffset;

          const x = pt.x + dx + sk * (pt.y / sh);
          const y = pt.y + dy;
          idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
      };

      // Draw main shape
      drawShapePath(offCtx, w, h, skew);
      offCtx.fill();

      // Complexity details: draw multiple outline offset frames inside main shape
      const numOutlines = Math.floor(state.complexity / 8);
      for (let o = 1; o <= numOutlines; o++) {
        offCtx.save();
        offCtx.strokeStyle = rngPick(colors); offCtx.lineWidth = lw(0.5);
        const outlineScale = 1.0 - o * 0.15;
        offCtx.scale(outlineScale, outlineScale);
        drawShapePath(offCtx, w, h, skew);
        offCtx.stroke();
        offCtx.restore();
      }

      // Draw Crop Marks (Brackets) enclosing the assembly (Closure)
      if (state.complexity > 4) {
        offCtx.strokeStyle = rngPick(colors);
        offCtx.lineWidth = lw(0.8);
        offCtx.globalAlpha = 0.6 * (1 - cFactor * 0.5);
        const padX = w * 0.62, padY = h * 0.62;
        const bs = lw(6); // Bracket size
        
        // Top-left
        offCtx.beginPath(); offCtx.moveTo(-padX + bs, -padY); offCtx.lineTo(-padX, -padY); offCtx.lineTo(-padX, -padY + bs); offCtx.stroke();
        // Top-right
        offCtx.beginPath(); offCtx.moveTo(padX - bs, -padY); offCtx.lineTo(padX, -padY); offCtx.lineTo(padX, -padY + bs); offCtx.stroke();
        // Bottom-left
        offCtx.beginPath(); offCtx.moveTo(-padX + bs, padY); offCtx.lineTo(-padX, padY); offCtx.lineTo(-padX, padY - bs); offCtx.stroke();
        // Bottom-right
        offCtx.beginPath(); offCtx.moveTo(padX - bs, padY); offCtx.lineTo(padX, padY); offCtx.lineTo(padX, padY - bs); offCtx.stroke();
      }

      // Draw Leader Line & Telemetry Text (Proximity)
      if (state.complexity > 6 && state.textAmount > 0) {
        offCtx.save();
        const labelCol = rngPick(colors);
        offCtx.strokeStyle = labelCol; offCtx.fillStyle = labelCol;
        offCtx.lineWidth = lw(0.5);
        offCtx.globalAlpha = 0.7 * (1 - cFactor * 0.4);
        
        const startX = w * 0.62, startY = -h * 0.62;
        const lineLen = w * 0.35;
        const elbowX = startX + lineLen * 0.5, elbowY = startY - lineLen * 0.5;
        const endX = elbowX + lineLen;

        offCtx.beginPath();
        offCtx.moveTo(startX, startY);
        offCtx.lineTo(elbowX, elbowY);
        offCtx.lineTo(endX, elbowY);
        offCtx.stroke();

        offCtx.font = `${lf(8)}px monospace`;
        offCtx.textAlign = 'left';
        let txt = `SYS_ALIGN::A0${anchor.id}`;
        if (rng() < cFactor) txt = `SYS_ERR::A0${anchor.id}`;
        offCtx.fillText(txt, elbowX + lw(2), elbowY - lw(2));
        offCtx.restore();
      }

      // Echo shape (Similarity & Rhythm) - draws a smaller, aligned duplicate nearby
      const echoScale = 0.618;
      const echoDist = anchor.r * 0.7 * scale;
      const ex = Math.cos(anchor.angle) * echoDist * (1.0 - cFactor * 0.25);
      const ey = Math.sin(anchor.angle) * echoDist * (1.0 - cFactor * 0.25);
      
      offCtx.save();
      offCtx.translate(ex, ey);
      offCtx.rotate(Math.PI / 6 * (1 - cFactor) + Math.sin(t * 1.1 + i) * 0.04);
      offCtx.fillStyle = rngPick(colors);
      offCtx.globalAlpha = c.posOpacity(pos.x + ex, pos.y + ey, 0.3, 0.7);
      const ew = w * echoScale, eh = h * echoScale;
      offCtx.beginPath();
      offCtx.moveTo(-ew / 2 + skew * echoScale, -eh / 2);
      offCtx.lineTo(ew / 2 + skew * echoScale, -eh / 2);
      offCtx.lineTo(ew / 2, eh / 2);
      offCtx.lineTo(-ew / 2, eh / 2);
      offCtx.closePath();
      offCtx.fill();
      offCtx.restore();

      offCtx.restore();
      state.elementCount += 2;
    }

    // 3. Technical Lines originating from anchors (Continuation)
    const numLines = isDetailPass
      ? rngInt(2, 4 + Math.floor(state.density * 0.3))
      : rngInt(4 + state.density, 8 + state.density * 1.0);
    for (let i = 0; i < numLines; i++) {
      const anchor = c.anchors[i % c.anchors.length];
      const start = { x: anchor.x, y: anchor.y };
      const len = rngRange(W * 0.1, W * 0.45);
      let angle = anchor.angle + rngPick([0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4, Math.PI]);
      angle += (rng() - 0.5) * cFactor * 0.2;

      const x2 = start.x + Math.cos(angle) * len;
      const y2 = start.y + Math.sin(angle) * len;

      offCtx.strokeStyle = rngPick(colors);
      offCtx.lineWidth = lw(0.5);
      offCtx.globalAlpha = c.posOpacity(start.x, start.y, 0.2, 0.7);

      offCtx.beginPath();
      offCtx.moveTo(start.x, start.y);
      offCtx.lineTo(x2, y2);
      offCtx.stroke();

      if (state.complexity > 8) {
        offCtx.save();
        offCtx.strokeStyle = offCtx.strokeStyle; offCtx.lineWidth = lw(0.4); offCtx.globalAlpha = 0.5;
        offCtx.beginPath();
        const tickSize = lw(3);
        offCtx.moveTo(x2 - tickSize, y2); offCtx.lineTo(x2 + tickSize, y2);
        offCtx.moveTo(x2, y2 - tickSize); offCtx.lineTo(x2, y2 + tickSize);
        offCtx.stroke();
        offCtx.restore();
      }
      state.elementCount++;
    }

    // 4. Accent tabs - aligned near support anchors
    if (state.complexity > 5) {
      const numTabs = isDetailPass ? 1 : 2;
      for (let i = 0; i < numTabs; i++) {
        const anchor = c.anchors[(i + 1) % c.anchors.length];
        offCtx.save();
        offCtx.translate(anchor.x, anchor.y);
        offCtx.rotate(anchor.angle + (rng() - 0.5) * cFactor * 0.2);
        offCtx.fillStyle = rngPick(colors);
        offCtx.globalAlpha = 0.4 * (1 - cFactor * 0.3);
        offCtx.fillRect(anchor.r * 0.8, -lw(4), lw(16), lw(8));
        offCtx.restore();
        state.elementCount++;
      }
    }

    if (!isDetailPass) {
      if (state.complexity > 8) drawCornerElements(W, H, colors);
      if (state.complexity > 6) drawSmallOrnaments(W, H, colors, state.complexity);
      drawHudTexts(W, H, t);
      if (state.complexity > 11) drawCheckPatterns(W, H, colors);
    }
  }

  function drawCircuit(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const grid = Math.floor(rngRange(20, 55));
    const cFactor = state.chaos / 30.0;

    // 1. Connection Traces & System Bus (Continuity & Continuation)
    if (!isDetailPass) {
      for (let a = 1; a < c.anchors.length; a++) {
        const start = c.anchors[a];
        const end = c.anchors[start.connections[0] || 0];
        
        let sx = Math.round(start.x / grid) * grid;
        let sy = Math.round(start.y / grid) * grid;
        let ex = Math.round(end.x / grid) * grid;
        let ey = Math.round(end.y / grid) * grid;

        const col = rngPick(colors);
        offCtx.strokeStyle = col;
        offCtx.lineWidth = lw(0.8);
        offCtx.globalAlpha = 0.8;

        // System Bus: Draw 3 parallel copper traces connecting support to focal
        const numTracks = 3;
        const trackSpacing = lw(4);

        for (let tr = 0; tr < numTracks; tr++) {
          const offset = (tr - (numTracks - 1) / 2) * trackSpacing;
          offCtx.beginPath();
          
          let cx = sx + offset;
          let cy = sy + offset;
          let targetX = ex + offset;
          let targetY = ey + offset;

          offCtx.moveTo(cx, cy);

          // Rectilinear walk (90-degree corners at Chaos = 0)
          let mx = cx;
          let my = cy;

          if (rng() < 0.5) {
            mx = targetX;
            if (rng() < cFactor) mx += (rng() - 0.5) * grid * 1.5;
            offCtx.lineTo(mx, my);
          } else {
            my = targetY;
            if (rng() < cFactor) my += (rng() - 0.5) * grid * 1.5;
            offCtx.lineTo(mx, my);
          }

          // Add jitter/skew with chaos
          let finalX = targetX;
          let finalY = targetY;
          if (rng() < cFactor * 0.4) {
            finalX += (rng() - 0.5) * grid;
            finalY += (rng() - 0.5) * grid;
          }
          offCtx.lineTo(finalX, finalY);
          offCtx.stroke();

          // Place via dots at the elbows of the bus
          if (state.complexity > 5) {
            offCtx.fillStyle = col;
            offCtx.beginPath();
            offCtx.arc(mx, my, lw(1.5), 0, Math.PI * 2);
            offCtx.fill();
          }
        }
      }
    }

    // 2. IC Chips placed on anchors (Proximity & Hierarchy)
    for (let i = 0; i < c.anchors.length; i++) {
      const anchor = c.anchors[i];
      const scale = i === 0 ? 1.0 : i === 1 ? 0.618 : 0.45;
      
      const cx = Math.round(anchor.x / grid) * grid;
      const cy = Math.round(anchor.y / grid) * grid;
      const cw = Math.round(rngInt(5, 9) * scale) * grid;
      const ch = Math.round(rngInt(4, 7) * scale) * grid;

      offCtx.save();
      offCtx.translate(cx, cy);
      offCtx.rotate((rng() - 0.5) * cFactor * 0.3);
      offCtx.translate((rng() - 0.5) * cFactor * 20, (rng() - 0.5) * cFactor * 20);

      const chipStyle = rngPick(['radial-processor', 'rectangular-ic', 'square-mcu']);
      const color = rngPick(colors);
      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(1.5);
      offCtx.globalAlpha = c.posOpacity(cx, cy, 0.5, 1.0);

      // Draw procedural silicon wafer subdivision layout (Binary Space Partitioning)
      offCtx.strokeRect(-cw / 2, -ch / 2, cw, ch);
      
      const drawSiliconWafer = (x, y, w, h, depth) => {
        // Bail out early if element budget is full
        if (offCtx.elements.length + offCtx.overlayElements.length >= drawPerf.elementBudget) return;
        // Stop condition based on size and randomness
        if (depth > 2 || w < grid * 1.6 || h < grid * 1.6 || (depth > 0 && rng() < 0.25)) {
          // Draw cell content: either a grid of pads, a circuit bus, or trace lines
          const cellStyle = rngPick(['pads', 'bus', 'inner-border']);
          offCtx.save();
          offCtx.strokeStyle = color;
          offCtx.lineWidth = lw(0.4);
          offCtx.globalAlpha = 0.55 * (1 - cFactor * 0.4);
          
          if (cellStyle === 'pads' && w >= grid && h >= grid) {
            // Draw BGA pad matrix in this cell
            const padCols = Math.max(2, Math.floor(w / lw(8.5)));
            const padRows = Math.max(2, Math.floor(h / lw(8.5)));
            offCtx.fillStyle = color;
            offCtx.globalAlpha *= 0.65;
            for (let cVal = 1; cVal < padCols; cVal++) {
              for (let rVal = 1; rVal < padRows; rVal++) {
                const px = x + (cVal / padCols) * w;
                const py = y + (rVal / padRows) * h;
                offCtx.beginPath();
                offCtx.arc(px, py, lw(0.8), 0, Math.PI * 2);
                offCtx.fill();
              }
            }
          } else if (cellStyle === 'bus') {
            // Draw 2 to 4 parallel bus traces
            const numT = rngInt(2, 4);
            const spacing = lw(3);
            const horizontal = w > h;
            for (let tIdx = 0; tIdx < numT; tIdx++) {
              const offset = (tIdx + 0.5) * (horizontal ? h : w) / numT;
              offCtx.beginPath();
              if (horizontal) {
                offCtx.moveTo(x, y + offset);
                offCtx.lineTo(x + w, y + offset);
              } else {
                offCtx.moveTo(x + offset, y);
                offCtx.lineTo(x + offset, y + h);
              }
              offCtx.stroke();
            }
          } else {
            // Inner outline frame
            const inset = lw(3);
            if (w > inset * 2 && h > inset * 2) {
              offCtx.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
            }
          }
          offCtx.restore();
          return;
        }

        // Split direction: split longer dimension
        const horizontalSplit = w > h;
        const ratio = rngRange(0.38, 0.62);
        if (horizontalSplit) {
          const w1 = w * ratio;
          const w2 = w - w1;
          // Draw boundary cut line
          offCtx.beginPath();
          offCtx.moveTo(x + w1, y);
          offCtx.lineTo(x + w1, y + h);
          offCtx.stroke();
          drawSiliconWafer(x, y, w1, h, depth + 1);
          drawSiliconWafer(x + w1, y, w2, h, depth + 1);
        } else {
          const h1 = h * ratio;
          const h2 = h - h1;
          // Draw boundary cut line
          offCtx.beginPath();
          offCtx.moveTo(x, y + h1);
          offCtx.lineTo(x + w, y + h1);
          offCtx.stroke();
          drawSiliconWafer(x, y, w, h1, depth + 1);
          drawSiliconWafer(x, y + h1, w, h2, depth + 1);
        }
      };

      drawSiliconWafer(-cw / 2, -ch / 2, cw, ch, 0);

      // Draw pins along the boundary borders
      const pins = Math.floor(state.complexity * 0.45 * scale);
      if (pins > 0) {
        offCtx.save();
        offCtx.strokeStyle = color;
        offCtx.lineWidth = lw(0.65);
        for (let p = 0; p < pins; p++) {
          const px = -cw / 2 + (p + 0.5) * (cw / (pins + 0.5));
          offCtx.beginPath();
          offCtx.moveTo(px, -ch / 2);
          offCtx.lineTo(px, -ch / 2 - grid * 0.35);
          offCtx.moveTo(px, ch / 2);
          offCtx.lineTo(px, ch / 2 + grid * 0.35);
          offCtx.stroke();
        }
        offCtx.restore();
      }

      // 3. Label and internal details (ordered alignment)
      if (state.complexity > 6) {
        if (chipStyle !== 'radial-processor') {
          offCtx.save();
          offCtx.lineWidth = lw(0.35);
          offCtx.globalAlpha = 0.3 * (1 - cFactor * 0.5);
          const tracks = Math.min(5, Math.floor(state.complexity * 0.4));
          for (let rVal = 1; rVal <= tracks; rVal++) {
            offCtx.beginPath();
            offCtx.moveTo(-cw / 2 + cw * 0.12, -ch / 2 + ch * rVal / (tracks + 1));
            offCtx.lineTo(-cw / 2 + cw * (0.2 + rng() * 0.5), -ch / 2 + ch * rVal / (tracks + 1));
            offCtx.stroke();
          }
          offCtx.restore();
        }
        
        if (state.textAmount > 0) {
          offCtx.save();
          offCtx.fillStyle = color; 
          offCtx.globalAlpha = 0.85;
          offCtx.font = `${lf(Math.max(7, 8 * scale))}px monospace`; 
          offCtx.textAlign = 'center';
          let label = rngPick(['CPU','DSP','CLK','RAM','ROM','SYS','U-01','IC-12']);
          if (rng() < cFactor) label = 'ERR?';
          offCtx.fillText(label, 0, lf(2));
          offCtx.restore();
        }

        if (state.complexity > 16 && chipStyle !== 'radial-processor') {
          offCtx.strokeStyle = color; offCtx.lineWidth = lw(0.4);
          offCtx.strokeRect(-cw / 2.4, -ch / 2.4, cw / 1.2, ch / 1.2);
        }
      }

      offCtx.restore();
      offCtx.globalAlpha = 1;
      state.elementCount++;
    }

    // 3. Grid traces in background (ordered alignment at Chaos = 0)
    const numTraces = isDetailPass
      ? rngInt(1, 3 + Math.floor(state.density * 0.3))
      : rngInt(4 + state.density, 10 + state.density * 0.8);
    for (let i = 0; i < numTraces; i++) {
      const anchor = c.anchors[i % c.anchors.length];
      let x = Math.round(anchor.x / grid) * grid;
      let y = Math.round(anchor.y / grid) * grid;
      
      offCtx.strokeStyle = rngPick(colors);
      offCtx.lineWidth = lw(0.5);
      offCtx.globalAlpha = 0.3 * (1 - cFactor * 0.5);
      offCtx.beginPath();
      offCtx.moveTo(x, y);

      const len = rngInt(2, 6) * grid;
      const dir = rngInt(0, 3);
      if (dir === 0) x += len;
      else if (dir === 1) y -= len;
      else if (dir === 2) x -= len;
      else y += len;

      offCtx.lineTo(x, y);
      offCtx.stroke();

      offCtx.fillStyle = offCtx.strokeStyle;
      offCtx.beginPath();
      offCtx.arc(x, y, lw(1.5), 0, Math.PI * 2);
      offCtx.fill();
      state.elementCount++;
    }

    if (!isDetailPass) {
      drawHudTexts(W, H, t);
      if (state.complexity > 8) drawCornerElements(W, H, colors);
    }
  }

  function drawHud(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const cFactor = state.chaos / 30.0;

    // 1. Data bridges between anchors (Continuity)
    if (!isDetailPass) {
      offCtx.strokeStyle = rngPick(colors);
      offCtx.lineWidth = lw(0.8);
      offCtx.globalAlpha = 0.65;
      for (let a = 1; a < c.anchors.length; a++) {
        const start = c.anchors[a];
        const end = c.anchors[start.connections[0] || 0];
        
        let sx = start.x;
        let sy = start.y;
        let ex = end.x;
        let ey = end.y;

        offCtx.beginPath();
        offCtx.moveTo(sx, sy);
        
        if (rng() < 0.5) {
          offCtx.lineTo(ex, sy);
        } else {
          offCtx.lineTo(sx, ey);
        }
        offCtx.lineTo(ex, ey);
        offCtx.stroke();

        offCtx.fillStyle = offCtx.strokeStyle;
        offCtx.beginPath();
        offCtx.arc(sx, sy, lw(2), 0, Math.PI * 2);
        offCtx.arc(ex, ey, lw(2), 0, Math.PI * 2);
        offCtx.fill();
      }
    }

    // 2. HUD Cards & Reticles per anchor (Proximity, Closure, Hierarchy)
    for (let i = 0; i < c.anchors.length; i++) {
      const anchor = c.anchors[i];
      const scale = i === 0 ? 1.0 : i === 1 ? 0.618 : 0.45;

      const pos = { x: anchor.x, y: anchor.y };
      const driftX = (rng() - 0.5) * cFactor * 50;
      const driftY = (rng() - 0.5) * cFactor * 50;
      pos.x += driftX;
      pos.y += driftY;

      const w = rngRange(W * 0.16, W * 0.32) * scale;
      const h = rngRange(H * 0.12, H * 0.24) * scale;
      const color = rngPick(colors);

      offCtx.save();
      offCtx.translate(pos.x, pos.y);
      offCtx.rotate((rng() - 0.5) * cFactor * 0.2);

      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(0.8);
      offCtx.globalAlpha = c.posOpacity(pos.x, pos.y, 0.4, 0.95);

      const cut = h * 0.15;
      const dx = -w / 2, dy = -h / 2;
      // Draw backdrop panel box
      offCtx.fillStyle = color;
      offCtx.globalAlpha = 0.04 * (1 - cFactor * 0.5);
      offCtx.fillRect(dx, dy, w, h);

      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(0.8);
      offCtx.globalAlpha = c.posOpacity(pos.x, pos.y, 0.4, 0.95);

      // Draw angled outer tech frame
      offCtx.beginPath();
      offCtx.moveTo(dx + cut, dy);
      offCtx.lineTo(dx + w, dy);
      offCtx.lineTo(dx + w, dy + h - cut);
      offCtx.lineTo(dx + w - cut, dy + h);
      offCtx.lineTo(dx, dy + h);
      offCtx.lineTo(dx, dy + cut);
      offCtx.closePath();
      offCtx.stroke();

      // 1. Polar Vernier scale ring
      const rScale = Math.min(w, h) * 0.38;
      offCtx.beginPath();
      offCtx.arc(0, -h * 0.06, rScale, 0, Math.PI * 2);
      offCtx.stroke();

      const numTicks = 24 + (i % 2 === 0 ? 12 : 24);
      offCtx.save();
      offCtx.lineWidth = lw(0.5);
      offCtx.globalAlpha *= 0.7;
      offCtx.beginPath();
      for (let tIdx = 0; tIdx < numTicks; tIdx++) {
        // Logarithmic spiral angle distribution modulated by time
        const angle = Math.log(tIdx + 1) * (Math.PI * 2 / Math.log(numTicks + 1)) + t * 0.06 * (i % 2 === 0 ? 1 : -1);
        const tickLen = tIdx % 4 === 0 ? lw(5.5) : lw(3);
        offCtx.moveTo(Math.cos(angle) * rScale, -h * 0.06 + Math.sin(angle) * rScale);
        offCtx.lineTo(Math.cos(angle) * (rScale - tickLen), -h * 0.06 + Math.sin(angle) * (rScale - tickLen));
      }
      offCtx.stroke();
      offCtx.restore();

      // 2. Generative Fourier Oscilloscope screen inside the card
      const scopeW = w * 0.55;
      const scopeH = h * 0.3;
      const scopeX = dx + w * 0.22;
      const scopeY = dy + h * 0.42;

      offCtx.save();
      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(0.6);
      offCtx.globalAlpha = 0.65 * (1 - cFactor * 0.35);
      offCtx.strokeRect(scopeX, scopeY, scopeW, scopeH);

      // Grid backing inside oscilloscope
      offCtx.lineWidth = lw(0.25);
      offCtx.globalAlpha *= 0.3;
      offCtx.beginPath();
      for (let gx = scopeX + scopeW / 4; gx < scopeX + scopeW; gx += scopeW / 4) {
        offCtx.moveTo(gx, scopeY); offCtx.lineTo(gx, scopeY + scopeH);
      }
      for (let gy = scopeY + scopeH / 4; gy < scopeY + scopeH; gy += scopeH / 4) {
        offCtx.moveTo(scopeX, gy); offCtx.lineTo(scopeX + scopeW, gy);
      }
      offCtx.stroke();

      // Damped harmonic waveform signal trace
      offCtx.lineWidth = lw(0.9);
      offCtx.globalAlpha = 0.85;
      offCtx.beginPath();
      const waveFreq1 = 3.2 + (i % 3) * 1.5;
      const waveFreq2 = 7.8 + (i % 2) * 2.1;
      for (let sx = 0; sx <= scopeW; sx += lw(2)) {
        const pct = sx / scopeW;
        // Damped Fourier combination waveform
        const wave = 0.38 * Math.sin(pct * Math.PI * waveFreq1 + t * 0.9) + 
                     0.16 * Math.cos(pct * Math.PI * waveFreq2 - t * 1.6);
        const damp = Math.exp(-pct * 1.1);
        const sy = scopeY + scopeH * 0.5 + wave * damp * (scopeH * 0.75);
        sx === 0 ? offCtx.moveTo(scopeX + sx, sy) : offCtx.lineTo(scopeX + sx, sy);
      }
      offCtx.stroke();
      offCtx.restore();

      if (state.complexity > 10) {
        offCtx.strokeStyle = color;
        offCtx.lineWidth = lw(1.2);
        offCtx.globalAlpha = 0.5;
        const bs = lw(5);
        offCtx.beginPath(); offCtx.moveTo(dx + cut + bs, dy); offCtx.lineTo(dx + cut, dy); offCtx.lineTo(dx, dy + cut); offCtx.lineTo(dx, dy + cut + bs); offCtx.stroke();
        offCtx.beginPath(); offCtx.moveTo(dx + w, dy + h - cut - bs); offCtx.lineTo(dx + w, dy + h - cut); offCtx.lineTo(dx + w - cut, dy + h); offCtx.lineTo(dx + w - cut - bs, dy + h); offCtx.stroke();
      }

      offCtx.globalAlpha = c.posOpacity(pos.x, pos.y, 0.6, 1.0);
      
      if (state.complexity > 4 && state.textAmount > 0) {
        offCtx.fillStyle = color;
        offCtx.font = `bold ${lf(Math.max(7, 9 * scale))}px monospace`;
        offCtx.textAlign = 'left';
        let title = rngPick(['SYS_LOCK','TELEMETRY','NAV_LINK','CORE_DEC','SIGNAL_V','AUX_FLOW']);
        if (rng() < cFactor) title = 'ERR_CORRUPT';
        offCtx.fillText(title, dx + cut + lw(4), dy + lf(10));
      }

      if (state.complexity > 5) {
        const barW = w * 0.75;
        const barH = lw(3);
        const barX = dx + w * 0.12;
        const barY = dy + h * 0.8;
        offCtx.fillStyle = color;
        offCtx.globalAlpha = 0.25;
        offCtx.fillRect(barX, barY, barW, barH);
        offCtx.globalAlpha = 0.8;
        const pct = 0.35 + 0.5 * Math.sin(t * 1.5 + i);
        offCtx.fillRect(barX, barY, barW * pct * (1 - cFactor * 0.3), barH);
      }

      if (state.complexity > 8 && state.textAmount > 1) {
        offCtx.fillStyle = color;
        offCtx.font = `${lf(Math.max(6, 7.5 * scale))}px monospace`;
        offCtx.textAlign = 'right';
        const txtX = dx + w * 0.9;
        const txtY1 = dy + h * 0.32;
        const txtY2 = dy + h * 0.52;

        let str1 = `VAL: ${(Math.sin(t * 0.8 + i) * 100 + 150).toFixed(1)}`;
        let str2 = `SYS: OK`;
        if (rng() < cFactor) {
          str1 = 'VAL: ERR';
          str2 = 'SYS: FAIL';
        }
        offCtx.fillText(str1, txtX, txtY1);
        offCtx.fillText(str2, txtX, txtY2);
      }

      const rx = 0, ry = 0;
      const r = Math.min(w, h) * 0.24;
      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(0.6);
      offCtx.globalAlpha = 0.8;

      if (state.complexity > 7) {
        offCtx.beginPath(); offCtx.arc(rx, ry, r, 0.2, Math.PI * 0.8); offCtx.stroke();
        offCtx.beginPath(); offCtx.arc(rx, ry, r, Math.PI + 0.2, Math.PI * 1.8); offCtx.stroke();
        
        offCtx.beginPath(); offCtx.arc(rx, ry, r * 0.5, 0, Math.PI * 2); offCtx.stroke();
        offCtx.beginPath();
        offCtx.moveTo(-r * 1.3, 0); offCtx.lineTo(-r * 0.35, 0);
        offCtx.moveTo(r * 0.35, 0); offCtx.lineTo(r * 1.3, 0);
        offCtx.moveTo(0, -r * 1.3); offCtx.lineTo(0, -r * 0.35);
        offCtx.moveTo(0, r * 0.35); offCtx.lineTo(0, r * 1.3);
        offCtx.stroke();
      } else {
        offCtx.beginPath(); offCtx.arc(rx, ry, r, 0, Math.PI * 2); offCtx.stroke();
        offCtx.beginPath();
        offCtx.moveTo(-r, 0); offCtx.lineTo(r, 0);
        offCtx.moveTo(0, -r); offCtx.lineTo(0, r);
        offCtx.stroke();
      }

      offCtx.restore();
      state.elementCount++;
    }

    if (!isDetailPass) {
      drawHudTexts(W, H, t);
      if (state.complexity > 8) drawCornerElements(W, H, colors);
    }
  }

  function drawGlitch(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const weightFactor = state.weight * 0.28 + 0.3;
    const cFactor = state.chaos / 30.0;
    const c = comp || buildComposition(W, H);

    // 1. Horizontal Glitch Scanline Bars aligned to anchor Y positions
    const numBars = isDetailPass
      ? rngInt(1, 2 + Math.floor(state.density * 0.3))
      : rngInt(3 + Math.floor(state.density * 0.3), 6 + Math.floor(state.density * 0.7));
    
    for (let i = 0; i < numBars; i++) {
      const anchor = c.anchors[i % c.anchors.length];
      const yDrift = (rng() - 0.5) * cFactor * H * 0.18 + Math.sin(t * 8 + i) * H * 0.015 * cFactor;
      const y = anchor.y + yDrift;
      const h = rngRange(1, H * 0.04) * weightFactor;
      const shift = (rng() - 0.5) * W * 0.08 * cFactor;

      offCtx.fillStyle = rngPick(colors); 
      offCtx.globalAlpha = rngRange(0.2, 0.7) * (1 - cFactor * 0.3);
      offCtx.fillRect(shift, y - h / 2, W, h); 
      offCtx.globalAlpha = 1; 
      state.elementCount++;
    }

    // 2. Vertical glitch lines
    if (state.complexity > 5) {
      const numLines = isDetailPass ? 0 : rngInt(1, 3);
      for (let i = 0; i < numLines; i++) {
        const anchor = c.anchors[i % c.anchors.length];
        const xDrift = (rng() - 0.5) * cFactor * W * 0.15;
        const x = anchor.x + xDrift;
        const w = rngRange(1, W * 0.018) * weightFactor;

        offCtx.fillStyle = rngPick(colors); 
        offCtx.globalAlpha = rngRange(0.08, 0.4) * (1 - cFactor * 0.4);
        offCtx.fillRect(x - w / 2, 0, w, H); 
        offCtx.globalAlpha = 1;
      }
    }

    // 3. Glitch Blocks clustered around anchors (Proximity)
    const numBlocks = isDetailPass
      ? rngInt(1, 3 + Math.floor(state.density * 0.2))
      : rngInt(3 + Math.floor(state.density * 0.4), 8 + Math.floor(state.density * 0.6));
    
    for (let i = 0; i < numBlocks; i++) {
      const anchor = c.anchors[i % c.anchors.length];
      const scale = i % c.anchors.length === 0 ? 1.0 : 0.618;
      
      const isStroke = rng() < 0.45;
      const col = rngPick(colors);
      
      const maxDriftX = W * 0.22 * cFactor;
      const maxDriftY = H * 0.18 * cFactor;
      const bx = anchor.x + (rng() - 0.5) * maxDriftX;
      const by = anchor.y + (rng() - 0.5) * maxDriftY;
      const bw = rngRange(W * 0.04, W * 0.18) * scale;
      const bh = rngRange(H * 0.02, H * 0.1) * scale;

      offCtx.globalAlpha = rngRange(0.2, 0.8) * (1 - cFactor * 0.35);

      // Generative logic: choose between bitwise XOR logic noise grid or signal square-wave signal failure
      const useBitwiseGrid = rng() < 0.55;
      
      if (useBitwiseGrid) {
        // 1. Bitwise logical XOR noise grid
        const cols = 8;
        const rows = 8;
        const cellW = bw / cols;
        const cellH = bh / rows;
        const divisor = 3 + (i % 3);
        const seedMod = state.seed % 100;
        
        offCtx.save();
        offCtx.fillStyle = col;
        if (isStroke) {
          offCtx.strokeStyle = col;
          offCtx.lineWidth = lw(0.5);
        }
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            // Bitwise XOR logic determines cell visibility
            if (((r ^ c ^ seedMod) + Math.floor(t * 0.45)) % divisor === 0) {
              const px = bx - bw / 2 + c * cellW;
              const py = by - bh / 2 + r * cellH;
              const jx = (rng() - 0.5) * cFactor * cellW * 0.45;
              const jy = (rng() - 0.5) * cFactor * cellH * 0.45;
              
              if (isStroke) {
                offCtx.strokeRect(px + jx, py + jy, cellW * 0.85, cellH * 0.85);
              } else {
                offCtx.fillRect(px + jx, py + jy, cellW * 0.85, cellH * 0.85);
              }
            }
          }
        }
        offCtx.restore();
      } else {
        // 2. Horizontal scanline square-wave signal failure
        offCtx.save();
        offCtx.strokeStyle = col;
        offCtx.lineWidth = lw(isStroke ? rngRange(0.8, 2.2) : 0.6);
        offCtx.globalAlpha = rngRange(0.4, 0.8) * (1 - cFactor * 0.3);
        offCtx.beginPath();
        const numSteps = 40;
        const stepX = bw / numSteps;
        const waveFreq = 4 + (i % 4) * 2;
        for (let s = 0; s <= numSteps; s++) {
          const x = bx - bw / 2 + s * stepX;
          // Square-wave modulation formula
          const sqWave = Math.sign(Math.sin(s * 0.3 * waveFreq + t * 4.5));
          const y = by + sqWave * bh * 0.35;
          s === 0 ? offCtx.moveTo(x, y) : offCtx.lineTo(x, y);
        }
        offCtx.stroke();
        offCtx.restore();
      }
      
      if (state.complexity > 10 && state.textAmount > 0) {
        offCtx.fillStyle = col; 
        offCtx.font = `${lf(8)}px monospace`; 
        offCtx.textAlign = 'left';
        let txt = rngPick(['ERR_GLITCH','X_MUTATED','SYS_BRK','00001011','DATA_CORRUPT','CORE_DUMP','OVERFLOW']);
        if (rng() < cFactor) txt = 'CORRUPTED';
        offCtx.fillText(txt, bx - bw/2, by - bh/2 - 2);
      }
      state.elementCount++;
    }

    if (!isDetailPass) {
      offCtx.strokeStyle = rngPick(colors); offCtx.lineWidth = lw(0.3); offCtx.globalAlpha = 0.15 * cFactor;
      for (let y = -H; y < H * 2; y += rngRange(15, 45)) { 
        offCtx.beginPath(); offCtx.moveTo(0, y); offCtx.lineTo(W, y + W * 0.05); offCtx.stroke(); 
      }
      offCtx.globalAlpha = 1;
      drawHudTexts(W, H, t);
    }
  }

  function drawBlueprint(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const grid = Math.floor(rngRange(28, 65));
    const cFactor = state.chaos / 30.0;
    const c = comp || buildComposition(W, H);

    // 1. Grid Background (snaps perfectly at Chaos = 0)
    if (!isDetailPass) {
      offCtx.strokeStyle = rngPick(colors); offCtx.lineWidth = lw(0.18); offCtx.globalAlpha = 0.15 * (1 - cFactor * 0.4);
      const gridJitterAmt = cFactor * 1.5;
      offCtx.beginPath();
      for (let x = 0; x < W; x += grid) {
        if (gridJitterAmt > 0) {
          const xOffStart = (rng() - 0.5) * gridJitterAmt * 15;
          const xOffEnd = (rng() - 0.5) * gridJitterAmt * 15;
          offCtx.moveTo(x + xOffStart, 0);
          offCtx.lineTo(x + xOffEnd, H);
        } else {
          offCtx.moveTo(x, 0);
          offCtx.lineTo(x, H);
        }
      }
      for (let y = 0; y < H; y += grid) {
        if (gridJitterAmt > 0) {
          const yOffStart = (rng() - 0.5) * gridJitterAmt * 15;
          const yOffEnd = (rng() - 0.5) * gridJitterAmt * 15;
          offCtx.moveTo(0, y + yOffStart);
          offCtx.lineTo(W, y + yOffEnd);
        } else {
          offCtx.moveTo(0, y);
          offCtx.lineTo(W, y);
        }
      }
      offCtx.stroke();
    }

    // 2. Technical Dimension Lines connecting anchors (Continuation)
    if (!isDetailPass) {
      offCtx.strokeStyle = rngPick(colors);
      offCtx.lineWidth = lw(0.6);
      offCtx.globalAlpha = 0.65;
      for (let a = 1; a < c.anchors.length; a++) {
        const start = c.anchors[a];
        const end = c.anchors[start.connections[0] || 0];

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
          offCtx.save();
          const px = -dy / dist * lw(12);
          const py = dx / dist * lw(12);

          offCtx.beginPath();
          offCtx.moveTo(start.x + px, start.y + py);
          offCtx.lineTo(start.x - px, start.y - py);
          offCtx.moveTo(end.x + px, end.y + py);
          offCtx.lineTo(end.x - px, end.y - py);
          offCtx.stroke();

          offCtx.beginPath();
          offCtx.moveTo(start.x, start.y);
          offCtx.lineTo(end.x, end.y);
          offCtx.stroke();

          const mx = (start.x + end.x) / 2;
          const my = (start.y + end.y) / 2;
          offCtx.fillStyle = offCtx.strokeStyle;
          offCtx.font = `${lf(8)}px monospace`;
          offCtx.textAlign = 'center';
          
          let distText = `D: ${dist.toFixed(1)}px`;
          if (rng() < cFactor) distText = `D: ERR`;
          
          offCtx.fillStyle = getBgColor();
          offCtx.fillRect(mx - lw(24), my - lw(6), lw(48), lw(12));
          offCtx.fillStyle = offCtx.strokeStyle; // Restore text color to matching stroke color
          offCtx.fillText(distText, mx, my + lw(3));
          offCtx.restore();
        }
      }
    }

    // 3. Blueprint Modules centered on anchors (Proximity, Closure, Hierarchy)
    for (let i = 0; i < c.anchors.length; i++) {
      const anchor = c.anchors[i];
      const scale = i === 0 ? 1.0 : i === 1 ? 0.618 : 0.45;

      const sx = Math.round(anchor.x / grid) * grid;
      const sy = Math.round(anchor.y / grid) * grid;
      const sw = Math.round(rngRange(4, 8) * scale) * grid;
      const sh = Math.round(rngRange(3, 6) * scale) * grid;

      const col = rngPick(colors);
      offCtx.strokeStyle = col;
      offCtx.lineWidth = lw(0.8);
      offCtx.globalAlpha = c.posOpacity(sx, sy, 0.5, 1.0);

      offCtx.save();
      const cx = sx;
      const cy = sy;
      offCtx.translate(cx, cy);
      offCtx.rotate((rng() - 0.5) * cFactor * 0.25 + t * 0.04);
      offCtx.translate((rng() - 0.5) * cFactor * 15, (rng() - 0.5) * cFactor * 15);

      // 1. Hypotrochoid / Epitrochoid spirograph equations representing mecha gear designs
      const R = Math.min(sw, sh) * 0.44;
      const rRatio = rngPick([0.4, 0.6, 0.75, 0.625, 0.8]);
      const rGear = R * rRatio;
      const penD = rGear * rngRange(0.45, 0.9);
      const isEpitrochoid = rng() < 0.5;

      offCtx.save();
      offCtx.lineWidth = lw(0.55);
      offCtx.beginPath();
      // Plot the spirograph curves procedurally
      const spiroSteps = 100 + Math.floor(state.complexity * 2);
      const totalRotations = rRatio === 0.4 ? 2 : rRatio === 0.6 ? 3 : rRatio === 0.8 ? 4 : 5;
      for (let s = 0; s <= spiroSteps; s++) {
        const theta = (s / spiroSteps) * Math.PI * 2 * totalRotations;
        let x, y;
        if (isEpitrochoid) {
          x = (R + rGear) * Math.cos(theta) - penD * Math.cos(((R + rGear) / rGear) * theta);
          y = (R + rGear) * Math.sin(theta) - penD * Math.sin(((R + rGear) / rGear) * theta);
        } else {
          x = (R - rGear) * Math.cos(theta) + penD * Math.cos(((R - rGear) / rGear) * theta);
          y = (R - rGear) * Math.sin(theta) - penD * Math.sin(((R - rGear) / rGear) * theta);
        }
        s === 0 ? offCtx.moveTo(x, y) : offCtx.lineTo(x, y);
      }
      offCtx.stroke();
      offCtx.restore();

      // 2. Concentric outer dimension ring
      offCtx.beginPath();
      offCtx.arc(0, 0, R * 1.25, 0, Math.PI * 2);
      offCtx.stroke();

      // 3. Vernier caliper markings along the outer ring
      const numCaliperTicks = 16 + (i % 3 === 0 ? 8 : 16);
      offCtx.save();
      offCtx.lineWidth = lw(0.4);
      offCtx.globalAlpha *= 0.5;
      offCtx.beginPath();
      for (let tIdx = 0; tIdx < numCaliperTicks; tIdx++) {
        const a = (tIdx / numCaliperTicks) * Math.PI * 2;
        offCtx.moveTo(Math.cos(a) * R * 1.25, Math.sin(a) * R * 1.25);
        offCtx.lineTo(Math.cos(a) * R * 1.34, Math.sin(a) * R * 1.34);
      }
      offCtx.stroke();
      offCtx.restore();

      // 4. Centered crosshair graticule lines
      offCtx.save();
      offCtx.lineWidth = lw(0.3);
      offCtx.globalAlpha *= 0.4;
      offCtx.beginPath();
      offCtx.moveTo(-sw * 0.7, 0); offCtx.lineTo(sw * 0.7, 0);
      offCtx.moveTo(0, -sh * 0.7); offCtx.lineTo(0, sh * 0.7);
      offCtx.stroke();
      offCtx.restore();

      if (state.complexity > 6 && state.textAmount > 0) {
        offCtx.fillStyle = col;
        offCtx.font = `${lf(Math.max(6, 8 * scale))}px monospace`;
        offCtx.textAlign = 'center';
        
        let label = `REF: A0${anchor.id} // SCALE 1:${(1 / scale).toFixed(2)}`;
        if (rng() < cFactor) label = 'REF: CORRUPT';
        offCtx.fillText(label, 0, -sh / 2 - lw(4));

        offCtx.textAlign = 'right';
        offCtx.fillText(`W: ${sw}px`, sw/2 - lw(2), sh/2 - lw(4));
        offCtx.fillText(`H: ${sh}px`, sw/2 - lw(2), sh/2 - lw(12));
      }

      if (state.complexity > 14) {
        const hatchSpacing = Math.max(8, 40 - state.complexity);
        offCtx.save();
        offCtx.globalAlpha = 0.15;
        offCtx.beginPath();
        offCtx.rect(-sw/2, -sh/2, sw, sh);
        offCtx.clip();
        for (let k = hatchSpacing - sw/2; k < sw/2 + sh/2; k += hatchSpacing) {
          offCtx.moveTo(k, -sh/2);
          offCtx.lineTo(k + sh, sh/2);
        }
        offCtx.stroke();
        offCtx.restore();
      }

      offCtx.restore();
      state.elementCount++;
    }

    if (!isDetailPass) {
      if (cFactor > 0) {
        offCtx.strokeStyle = rngPick(colors); offCtx.lineWidth = lw(0.25); offCtx.globalAlpha = 0.35 * cFactor;
        const numSketch = rngInt(2, 4 + Math.floor(cFactor * 10));
        for (let i = 0; i < numSketch; i++) {
          const anchor = c.anchors[i % c.anchors.length];
          const len = rngRange(W * 0.08, W * 0.28);
          const angle = rngPick([Math.PI/6, Math.PI/4, Math.PI*3/4, -Math.PI/4]) + (rng() - 0.5) * cFactor * 0.35;
          offCtx.beginPath();
          offCtx.moveTo(anchor.x, anchor.y);
          offCtx.lineTo(anchor.x + Math.cos(angle) * len, anchor.y + Math.sin(angle) * len);
          offCtx.stroke();
        }
      }
      
      drawHudTexts(W, H, t); drawCornerElements(W, H, colors);
    }
  }

  function drawChaos(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    
    const numEl = isDetailPass
      ? rngInt(5, Math.min(10 + state.density * 1.5, 18))
      : rngInt(12 + state.density * 2.5, Math.min(30 + state.density * 5, 35));
    const cFactor = state.chaos / 30.0;

    for (let i = 0; i < numEl; i++) {
      const anchor = c.anchors[i % c.anchors.length];
      
      let tech;
      if (anchor.id === 0) {
        tech = rngPick(['circles', 'arcs', 'gear']);
      } else if (anchor.id === 1) {
        tech = rngPick(['rects', 'lines', 'multipole-cross']);
      } else {
        tech = rngPick(['triangles', 'stars', 'shards']);
      }

      const color = rngPick(colors);
      offCtx.fillStyle = color; offCtx.strokeStyle = color;
      offCtx.globalAlpha = rngRange(0.15, 0.75) * (1 - cFactor * 0.35);

      const orbitR = rngRange(anchor.r * 0.3, anchor.r * 1.8) * (i % 2 === 0 ? 0.7 : 1.3);
      const orbitA = (i / numEl) * Math.PI * 6 + t * 0.08 * (i % 2 === 0 ? 1 : -1);
      
      let x = anchor.x + Math.cos(orbitA) * orbitR;
      let y = anchor.y + Math.sin(orbitA) * orbitR;

      const driftX = (rng() - 0.5) * W * 0.35 * cFactor;
      const driftY = (rng() - 0.5) * H * 0.35 * cFactor;
      x += driftX;
      y += driftY;

      const s = rngRange(W * 0.02, W * 0.07) * (anchor.id === 0 ? 1.2 : 0.7);
      offCtx.lineWidth = rng() < 0.5 ? lw(rngRange(0.4, 2)) : lw(rngRange(2, 6));

      // 1. Real-time Peter de Jong chaotic attractor path trace centered on anchor
      offCtx.save();
      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(0.4);
      offCtx.globalAlpha = 0.35 * (1 - cFactor * 0.3);
      offCtx.beginPath();
      
      const da = -2.24 + Math.sin(t * 0.05 + i) * 0.2;
      const db = 2.06 + Math.cos(t * 0.03 - i) * 0.15;
      const dc = 1.42 + Math.sin(t * 0.02 + i * 2) * 0.1;
      const dd = -2.63 + Math.cos(t * 0.04 - i * 2) * 0.2;
      
      let attX = 0.1, attY = 0.1;
      const attSteps = Math.min(150 + Math.floor(state.complexity * 4), 200);
      const attScale = orbitR * 0.45;
      for (let step = 0; step < attSteps; step++) {
        const nextX = Math.sin(da * attY) - Math.cos(db * attX);
        const nextY = Math.sin(dc * attX) - Math.cos(dd * attY);
        attX = nextX;
        attY = nextY;
        
        const px = anchor.x + attX * attScale + (rng() - 0.5) * cFactor * 8;
        const py = anchor.y + attY * attScale + (rng() - 0.5) * cFactor * 8;
        step === 0 ? offCtx.moveTo(px, py) : offCtx.lineTo(px, py);
      }
      offCtx.stroke();
      offCtx.restore();

      // 2. Real-time procedural Maurer Rose curve centered at orbit coordinates
      offCtx.save();
      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(0.55);
      offCtx.globalAlpha = 0.45 * (1 - cFactor * 0.35);
      offCtx.beginPath();
      
      const roseN = 2 + (i % 5); // petals factor
      const roseD = 29 + (i % 7) * 11; // degree step
      const roseR = s * 1.4;
      
      for (let theta = 0; theta <= 360; theta += 2) {
        const k = theta * roseD * Math.PI / 180;
        const r = roseR * Math.sin(roseN * k);
        const a = theta * Math.PI / 180 + t * 0.06;
        const px = x + r * Math.cos(a);
        const py = y + r * Math.sin(a);
        theta === 0 ? offCtx.moveTo(px, py) : offCtx.lineTo(px, py);
      }
      offCtx.stroke();
      offCtx.restore();
      offCtx.globalAlpha = 1; state.elementCount++;
    }
    if (!isDetailPass) {
      drawHudTexts(W, H, t);
    }
  }

  // ── FLOW FIELD (new) ────────────────────────────────────────────────────────
  function drawFlow(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const scale = 0.002 + state.complexity * 0.0008;
    const numParticles = isDetailPass ? 10 + state.density * 3 : 20 + state.density * 10;
    const steps = isDetailPass ? 10 + state.complexity : 15 + state.complexity * 2;
    const currentSpeed = (state.animating && typeof state.currentAnimSpeed === 'number') ? state.currentAnimSpeed : 15;
    const speed = (2.5 + state.chaos * 0.5) * (1 + (currentSpeed - 15) / 30);
    const cFactor = state.chaos / 30.0;

    const angleMultiplier = 6 + cFactor * 15;
    const ax0 = c.anchors[0].x;
    const ay0 = c.anchors[0].y;

    for (let p = 0; p < numParticles; p++) {
      let px, py;
      const emitter = c.anchors[1 + (p % (c.anchors.length - 1))];
      px = emitter.x + (rng() - 0.5) * emitter.r * 0.3;
      py = emitter.y + (rng() - 0.5) * emitter.r * 0.3;
      
      const color = rngPick(colors);
      const particleStyle = rngPick(['line', 'bubble', 'chevron-arrow', 'packet']);
      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(0.2 + rng() * 0.6);
      offCtx.globalAlpha = rngRange(0.2, 0.7);
      offCtx.beginPath(); offCtx.moveTo(px, py);
      
      // Real-time procedural vector field equation selection
      const fieldType = rngPick(['vortex', 'lorenz', 'trig_wave']);
      
      let lastVx = 0, lastVy = 0;
      for (let s = 0; s < steps; s++) {
        let vx = 0, vy = 0;
        
        if (fieldType === 'vortex') {
          // Vortex rotation field around anchors
          for (let k = 0; k < c.anchors.length; k++) {
            const dx = c.anchors[k].x - px;
            const dy = c.anchors[k].y - py;
            const dist = Math.hypot(dx, dy) + 1;
            const force = 1 / dist;
            // Radial attraction (closure) + tangent vortex rotation
            vx += (dx / dist) * 0.25 - (dy / dist) * 0.75 * force * 150;
            vy += (dy / dist) * 0.25 + (dx / dist) * 0.75 * force * 150;
          }
        } else if (fieldType === 'lorenz') {
          // Lorenz-inspired chaotic projection field equations
          const rx = (px - W / 2) * 0.05;
          const ry = (py - H / 2) * 0.05;
          const rz = 25 + Math.sin(t * 0.2) * 10;
          const sigma = 10;
          const rho = 28;
          const beta = 8/3;
          
          // Lorenz system coordinates derivatives
          const dxVal = sigma * (ry - rx);
          const dyVal = rx * (rho - rz) - ry;
          vx = dxVal * 1.5;
          vy = dyVal * 1.5;
        } else {
          // Trigonometric wave resonance field equations
          vx = Math.sin(px * scale * 5.0 + t * 0.5) * 1.5 + Math.cos(py * scale * 2.0 - t * 0.2);
          vy = Math.cos(px * scale * 2.0 - t * 0.3) * 1.5 + Math.sin(py * scale * 5.0 + t * 0.4);
        }
        
        // Blend with value noise for organic high-frequency turbulence
        const n = valueNoise(px * scale + t * 0.35, py * scale + t * 0.28);
        const noiseAngle = n * Math.PI * angleMultiplier + t * 1.8;
        const nx = Math.cos(noiseAngle);
        const ny = Math.sin(noiseAngle);
        
        vx = vx * Math.max(0, 1 - cFactor) + nx * cFactor;
        vy = vy * Math.max(0, 1 - cFactor) + ny * cFactor;
        
        const len = Math.hypot(vx, vy);
        if (len > 0) {
          vx /= len;
          vy /= len;
        }
        
        let stepSpeed = speed;
        stepSpeed *= (1 + (rng() - 0.5) * cFactor * 0.4);
        px += vx * stepSpeed;
        py += vy * stepSpeed;
        lastVx = vx;
        lastVy = vy;
        
        if (px < -20 || px > W + 20 || py < -20 || py > H + 20) break;
        offCtx.lineTo(px, py);
      }
      offCtx.stroke();
      
      offCtx.save();
      offCtx.globalAlpha = 0.85;
      if (particleStyle === 'bubble') {
        offCtx.beginPath(); offCtx.arc(px, py, lw(2.4), 0, Math.PI * 2); offCtx.stroke();
        offCtx.beginPath(); offCtx.arc(px, py, lw(0.8), 0, Math.PI * 2); offCtx.fillStyle = color; offCtx.fill();
      } else if (particleStyle === 'chevron-arrow') {
        const arrowSize = lw(5.5);
        const ang = Math.atan2(lastVy, lastVx);
        offCtx.translate(px, py);
        offCtx.rotate(ang);
        offCtx.beginPath();
        offCtx.moveTo(-arrowSize, -arrowSize * 0.6);
        offCtx.lineTo(0, 0);
        offCtx.lineTo(-arrowSize, arrowSize * 0.6);
        offCtx.stroke();
      } else if (particleStyle === 'packet') {
        const sq = lw(3);
        offCtx.fillStyle = color;
        offCtx.fillRect(px - sq/2, py - sq/2, sq, sq);
        if (state.complexity > 8 && rng() < 0.25) {
          offCtx.strokeStyle = color; offCtx.lineWidth = lw(0.3);
          offCtx.strokeRect(px - sq, py - sq, sq * 2, sq * 2);
        }
      }
      offCtx.restore();
      offCtx.globalAlpha = 1; state.elementCount++;
    }

    if (!isDetailPass) {
      if (state.complexity > 5) {
        const arrowGrid = Math.floor(W / (6 + state.complexity * 0.4));
        offCtx.strokeStyle = getAccent(); offCtx.lineWidth = lw(0.4); offCtx.globalAlpha = 0.22;
        offCtx.beginPath();
        for (let gx = arrowGrid; gx < W; gx += arrowGrid) {
          for (let gy = arrowGrid; gy < H; gy += arrowGrid) {
            const dx = ax0 - gx;
            const dy = ay0 - gy;
            const dist = Math.hypot(dx, dy);

            let ux = dist > 0 ? dx / dist : 0;
            let uy = dist > 0 ? dy / dist : 0;
            const sx = -uy;
            const sy = ux;
            
            let fx = ux * 0.7 + sx * 0.3;
            let fy = uy * 0.7 + sy * 0.3;

            const n = valueNoise(gx * scale, gy * scale);
            const noiseAngle = n * Math.PI * angleMultiplier;
            const nx = Math.cos(noiseAngle);
            const ny = Math.sin(noiseAngle);

            let vx = fx * Math.max(0, 1 - cFactor) + nx * cFactor;
            let vy = fy * Math.max(0, 1 - cFactor) + ny * cFactor;
            
            const len = Math.hypot(vx, vy);
            if (len > 0) {
              vx /= len;
              vy /= len;
            }

            const arrowLen = arrowGrid * 0.45;
            let ax = gx + (rng() - 0.5) * cFactor * 20;
            let ay = gy + (rng() - 0.5) * cFactor * 20;
            
            const endX = ax + vx * arrowLen;
            const endY = ay + vy * arrowLen;
            
            offCtx.moveTo(ax, ay);
            offCtx.lineTo(endX, endY);
            
            if (state.complexity > 14) {
              const arrowSize = lw(3);
              const angle = Math.atan2(vy, vx);
              offCtx.moveTo(endX, endY);
              offCtx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI/6), endY - arrowSize * Math.sin(angle - Math.PI/6));
              offCtx.moveTo(endX, endY);
              offCtx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI/6), endY - arrowSize * Math.sin(angle + Math.PI/6));
            }
          }
        }
        offCtx.stroke();
        offCtx.globalAlpha = 1;
      }
      drawHudTexts(W, H, t); drawCornerElements(W, H, colors);
    }
  }

  // ── SACRED GEOMETRY (new) ───────────────────────────────────────────────────
  function drawSacred(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const cFactor = state.chaos / 30.0;

    const ax0 = c.anchors[0].x;
    const ay0 = c.anchors[0].y;

    // 1. Crystalline Metatronic Network (Continuity & Alignment)
    if (!isDetailPass) {
      offCtx.strokeStyle = rngPick(colors);
      offCtx.lineWidth = lw(0.4);
      offCtx.globalAlpha = 0.35 * (1 - cFactor * 0.4);
      
      for (let i = 1; i < c.anchors.length; i++) {
        const start = c.anchors[i];
        const end = c.anchors[start.connections[0] || 0];
        
        offCtx.beginPath();
        offCtx.moveTo(start.x, start.y);
        offCtx.lineTo(end.x, end.y);
        offCtx.stroke();

        const steps = 6;
        for (let j = 0; j < steps; j++) {
          const a = (j / steps) * Math.PI * 2 + t * 0.05;
          offCtx.beginPath();
          offCtx.moveTo(start.x, start.y);
          offCtx.lineTo(start.x + Math.cos(a) * start.r * 1.5, start.y + Math.sin(a) * start.r * 1.5);
          offCtx.stroke();
        }
      }
    }

    // 2. Complex Sacred Geometry centered on Anchor 0 (Focal primary, Hierarchy)
    if (!isDetailPass) {
      const f0 = c.anchors[0];
      const fcx = f0.x + (rng() - 0.5) * cFactor * 40;
      const fcy = f0.y + (rng() - 0.5) * cFactor * 40;
      const r = f0.r * (0.85 + 0.15 * Math.sin(t * 0.5));
      
      const geomType = rngPick(['metatron', 'merkaba', 'sri-yantra', 'mandala-lattice']);
      const color = rngPick(colors);
      offCtx.strokeStyle = color; 
      offCtx.lineWidth = lw(0.6); 
      offCtx.globalAlpha = c.posOpacity(fcx, fcy, 0.5, 0.95);

      if (geomType === 'metatron') {
        // Metatron's Cube: 13 circles and all-to-all connection lines
        const nodes = [{ x: fcx, y: fcy }];
        const rot = t * 0.04;
        const dist = r * 0.65;
        // Inner ring of 6
        for (let i = 0; i < 6; i++) {
          const a = rot + (i * Math.PI * 2) / 6;
          nodes.push({ x: fcx + Math.cos(a) * dist, y: fcy + Math.sin(a) * dist });
        }
        // Outer ring of 6
        for (let i = 0; i < 6; i++) {
          const a = rot + (i * Math.PI * 2) / 6;
          nodes.push({ x: fcx + Math.cos(a) * dist * 2, y: fcy + Math.sin(a) * dist * 2 });
        }

        // Draw connecting blueprint lines (all-to-all)
        offCtx.save();
        offCtx.lineWidth = lw(0.3);
        offCtx.globalAlpha *= 0.6;
        offCtx.beginPath();
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            offCtx.moveTo(nodes[i].x, nodes[i].y);
            offCtx.lineTo(nodes[j].x, nodes[j].y);
          }
        }
        offCtx.stroke();
        offCtx.restore();

        // Draw circles at nodes
        const cr = dist * 0.48;
        nodes.forEach((node, idx) => {
          offCtx.beginPath();
          offCtx.arc(node.x, node.y, cr, 0, Math.PI * 2);
          offCtx.stroke();
          
          if (idx === 0) {
            // Concentric center rings
            offCtx.beginPath();
            offCtx.arc(node.x, node.y, cr * 0.5, 0, Math.PI * 2);
            offCtx.stroke();
          }
        });

        // Outer framing circle
        offCtx.beginPath();
        offCtx.arc(fcx, fcy, dist * 2 + cr, 0, Math.PI * 2);
        offCtx.stroke();

      } else if (geomType === 'merkaba') {
        // Merkaba / Nested Star Tetrahedron
        const rot = t * 0.05;
        const numLayers = 3;
        
        for (let layer = 0; layer < numLayers; layer++) {
          const lr = r * Math.pow(0.58, layer);
          const lRot = rot + (layer * Math.PI) / 6;
          
          // Draw hexagram (two overlapping triangles)
          for (const dir of [1, -1]) {
            offCtx.beginPath();
            for (let i = 0; i < 3; i++) {
              const a = lRot + (i * Math.PI * 2) / 3 + (dir === -1 ? Math.PI : 0);
              const px = fcx + Math.cos(a) * lr;
              const py = fcy + Math.sin(a) * lr;
              i === 0 ? offCtx.moveTo(px, py) : offCtx.lineTo(px, py);
            }
            offCtx.closePath();
            offCtx.stroke();
          }

          // Connecting spokes
          if (layer === 0) {
            offCtx.save();
            offCtx.lineWidth = lw(0.35);
            offCtx.globalAlpha *= 0.7;
            offCtx.beginPath();
            for (let i = 0; i < 12; i++) {
              const a = lRot + (i * Math.PI * 2) / 12;
              offCtx.moveTo(fcx, fcy);
              offCtx.lineTo(fcx + Math.cos(a) * lr, fcy + Math.sin(a) * lr);
            }
            offCtx.stroke();
            offCtx.restore();
          }
        }

        // Concentric bounding circles
        offCtx.beginPath();
        offCtx.arc(fcx, fcy, r, 0, Math.PI * 2);
        offCtx.stroke();
        offCtx.beginPath();
        offCtx.arc(fcx, fcy, r * 1.15, 0, Math.PI * 2);
        offCtx.stroke();

      } else if (geomType === 'sri-yantra') {
        // Sri Yantra: 9 interlocking triangles with vertical offsets
        const rot = t * 0.02; // slow drift
        offCtx.save();
        offCtx.translate(fcx, fcy);
        offCtx.rotate(rot);

        const offsetsY = [
          -0.25 * r, -0.1 * r, 0.15 * r, 0.3 * r,  // pointing down
          0.25 * r, 0.1 * r, -0.15 * r, -0.3 * r,  // pointing up
          -0.05 * r                                // outer down
        ];
        const triRadii = [
          0.7 * r, 0.8 * r, 0.65 * r, 0.5 * r,
          0.7 * r, 0.8 * r, 0.65 * r, 0.5 * r,
          0.9 * r
        ];
        const pointingUp = [
          false, false, false, false,
          true, true, true, true,
          false
        ];

        // Draw all 9 triangles
        for (let i = 0; i < 9; i++) {
          const ty = offsetsY[i];
          const tr = triRadii[i];
          const up = pointingUp[i];
          const startAngle = up ? -Math.PI / 2 : Math.PI / 2;

          offCtx.beginPath();
          for (let j = 0; j < 3; j++) {
            const a = startAngle + (j * Math.PI * 2) / 3;
            const px = Math.cos(a) * tr;
            const py = ty + Math.sin(a) * tr;
            j === 0 ? offCtx.moveTo(px, py) : offCtx.lineTo(px, py);
          }
          offCtx.closePath();
          offCtx.stroke();
        }

        // Central bindu dot
        offCtx.beginPath();
        offCtx.arc(0, 0, lw(2.5), 0, Math.PI * 2);
        offCtx.fillStyle = color;
        offCtx.fill();

        offCtx.restore();
        
        offCtx.beginPath();
        offCtx.arc(fcx, fcy, r * 1.05, 0, Math.PI * 2);
        offCtx.stroke();

        // Lotus petals
        const petals = 16;
        offCtx.save();
        offCtx.translate(fcx, fcy);
        offCtx.rotate(rot * -0.5);
        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2;
          const aNext = ((i + 1) / petals) * Math.PI * 2;
          const midA = (a + aNext) / 2;
          
          const p1x = Math.cos(a) * r * 1.05;
          const p1y = Math.sin(a) * r * 1.05;
          const p2x = Math.cos(aNext) * r * 1.05;
          const p2y = Math.sin(aNext) * r * 1.05;
          const pmx = Math.cos(midA) * r * 1.16;
          const pmy = Math.sin(midA) * r * 1.16;

          offCtx.beginPath();
          offCtx.moveTo(p1x, p1y);
          offCtx.quadraticCurveTo(pmx, pmy, p2x, p2y);
          offCtx.stroke();
        }
        offCtx.restore();

      } else {
        // mandala-lattice: Concentric rotating polygon lattice with diagonals
        const layers = [
          { sides: 8, r: r * 0.9, rot: t * 0.03 },
          { sides: 6, r: r * 0.65, rot: t * -0.04 },
          { sides: 4, r: r * 0.42, rot: t * 0.05 }
        ];

        layers.forEach((layer) => {
          const pts = [];
          for (let i = 0; i < layer.sides; i++) {
            const a = layer.rot + (i * Math.PI * 2) / layer.sides;
            pts.push({ x: fcx + Math.cos(a) * layer.r, y: fcy + Math.sin(a) * layer.r });
          }

          // Draw polygon outline
          offCtx.beginPath();
          pts.forEach((pt, idx) => {
            idx === 0 ? offCtx.moveTo(pt.x, pt.y) : offCtx.lineTo(pt.x, pt.y);
          });
          offCtx.closePath();
          offCtx.stroke();

          // Draw all diagonals
          offCtx.save();
          offCtx.lineWidth = lw(0.28);
          offCtx.globalAlpha *= 0.5;
          offCtx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
              offCtx.moveTo(pts[i].x, pts[i].y);
              offCtx.lineTo(pts[j].x, pts[j].y);
            }
          }
          offCtx.stroke();
          offCtx.restore();
        });

        // Bounding outer circles
        offCtx.beginPath();
        offCtx.arc(fcx, fcy, r, 0, Math.PI * 2);
        offCtx.stroke();
      }
      
      state.elementCount++;
    }

    // 3. Star Polygram centered on Anchor 1 (Proximity & Similarity)
    if (c.anchors.length > 1) {
      const a1 = c.anchors[1];
      const scx = a1.x + (rng() - 0.5) * cFactor * 30;
      const scy = a1.y + (rng() - 0.5) * cFactor * 30;
      const r1 = a1.r * 1.1;
      const r2 = r1 * 0.5;

      const points = 6 + Math.floor(state.complexity / 4);
      offCtx.strokeStyle = rngPick(colors);
      offCtx.lineWidth = lw(0.8);
      offCtx.globalAlpha = c.posOpacity(scx, scy, 0.45, 0.9);

      const rot = t * 0.08;
      offCtx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        let r = i % 2 === 0 ? r1 : r2;
        r *= (1 + (rng() - 0.5) * cFactor * 0.2);
        let a = (i / (points * 2)) * Math.PI * 2 + rot;
        const px = scx + Math.cos(a) * r;
        const py = scy + Math.sin(a) * r;
        i === 0 ? offCtx.moveTo(px, py) : offCtx.lineTo(px, py);
      }
      offCtx.closePath();
      offCtx.stroke();

      if (state.complexity > 8) {
        offCtx.lineWidth = lw(0.35); offCtx.globalAlpha *= 0.6;
        offCtx.beginPath();
        for (let i = 0; i < points; i++) {
          const a1_ang = (i / points) * Math.PI * 2 + rot;
          const a2_ang = ((i + 2) / points) * Math.PI * 2 + rot;
          offCtx.moveTo(scx + Math.cos(a1_ang) * r1, scy + Math.sin(a1_ang) * r1);
          offCtx.lineTo(scx + Math.cos(a2_ang) * r1, scy + Math.sin(a2_ang) * r1);
        }
        offCtx.stroke();
      }
      state.elementCount++;
    }

    // 4. Concentric Rings centered on Anchor 2 (Proximity & Similarity)
    if (c.anchors.length > 2) {
      const a2 = c.anchors[2];
      const ccx = a2.x + (rng() - 0.5) * cFactor * 30;
      const ccy = a2.y + (rng() - 0.5) * cFactor * 30;
      const maxR = a2.r * 1.25;

      const rings = Math.floor(2 + state.complexity * 0.4);
      offCtx.strokeStyle = rngPick(colors);
      offCtx.lineWidth = lw(0.5);
      offCtx.globalAlpha = c.posOpacity(ccx, ccy, 0.45, 0.95);

      for (let r = 1; r <= rings; r++) {
        offCtx.beginPath();
        offCtx.arc(ccx, ccy, maxR * r / rings, 0, Math.PI * 2);
        offCtx.stroke();
      }
      state.elementCount++;
    }

    // 5. Fibonacci Spiral centered on Anchor 0 (Golden Ratio & Continuation)
    if (!isDetailPass && state.complexity > 4) {
      const f0 = c.anchors[0];
      const spiralCx = f0.x;
      const spiralCy = f0.y;
      const sColor = rngPick(colors);
      
      offCtx.strokeStyle = sColor;
      offCtx.lineWidth = lw(1);
      offCtx.globalAlpha = 0.6;
      offCtx.beginPath();

      const phi = 1.618033988;
      const spiralPoints = 100 + state.complexity * 10;
      for (let i = 0; i < spiralPoints; i++) {
        const angle = i * 0.15 + t * 0.12;
        let r = 1.5 * Math.pow(phi, angle / (Math.PI * 2)) * (H * 0.015);
        r *= (1 + (rng() - 0.5) * cFactor * 0.15);
        let a = angle + (rng() - 0.5) * cFactor * 0.1;
        const px = spiralCx + Math.cos(a) * r;
        const py = spiralCy + Math.sin(a) * r;
        i === 0 ? offCtx.moveTo(px, py) : offCtx.lineTo(px, py);
      }
      offCtx.stroke();

      if (state.complexity > 8) {
        offCtx.strokeStyle = sColor;
        offCtx.lineWidth = lw(0.35);
        offCtx.globalAlpha = 0.22 * (1 - cFactor * 0.5);
        let boxSize = H * 0.015;
        let bx = spiralCx;
        let by = spiralCy;
        const directions = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
        const numBoxes = Math.min(8, Math.floor(4 + state.complexity / 5));
        for (let i = 0; i < numBoxes; i++) {
          const dir = directions[i % 4];
          offCtx.strokeRect(bx, by, boxSize * dir[0], boxSize * dir[1]);
          bx += boxSize * dir[0] * 0.5;
          by += boxSize * dir[1] * 0.5;
          boxSize *= phi;
        }
      }
      state.elementCount++;
    }

    if (!isDetailPass) {
      drawHudTexts(W, H, t);
    }
  }

  // ── GLYPH MODE (new) ────────────────────────────────────────────────────────
  function drawGlyph(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const cFactor = state.chaos / 30.0;

    let bigGlyphs, techGlyphs;
    const glyphSet = rngPick(['math', 'runes', 'system']);
    if (glyphSet === 'math') {
      bigGlyphs = ['∫','∮','∇','∂','Δ','Σ','Ω','Ψ','Λ','Ξ','Π','Φ','∞','Ø','λ','θ','π'];
      techGlyphs = ['dx','dy','f(x)','lim','∑','√','∂t','sin','cos','tan','log','e','±','≠','≈'];
    } else if (glyphSet === 'runes') {
      bigGlyphs = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᚿ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛟ','ᛝ'];
      techGlyphs = ['X','Y','Z','01','10','FF','00','A1','B2','C3','CD','EF','88','||','//'];
    } else {
      bigGlyphs = ['⬡','⬢','◈','◎','⊞','✦','⊕','⊗','⌬','∿','⊶','⁂','⊷','⋮'];
      techGlyphs = ['01','10','//','::','{}','[]','<>','>>','<<','/*','*/','&&','||','!=','=='];
    }

    // 1. Structural Vertical Coordinate Grid (Continuity & Alignment)
    if (!isDetailPass) {
      offCtx.strokeStyle = rngPick(colors);
      offCtx.lineWidth = lw(0.4);
      offCtx.globalAlpha = 0.25 * (1 - cFactor * 0.4);
      for (const anchor of c.anchors) {
        offCtx.beginPath();
        offCtx.moveTo(anchor.x, 0);
        offCtx.lineTo(anchor.x, H);
        offCtx.stroke();
      }
    }

    // 2. Glyph Assemblies (Hierarchy, Proximity, Similarity)
    for (let i = 0; i < c.anchors.length; i++) {
      const anchor = c.anchors[i];
      const scale = i === 0 ? 1.0 : i === 1 ? 0.618 : 0.45;

      const pos = { x: anchor.x, y: anchor.y };
      const driftX = (rng() - 0.5) * cFactor * 50;
      const driftY = (rng() - 0.5) * cFactor * 50;
      pos.x += driftX;
      pos.y += driftY;

      const size = rngRange(H * 0.08, H * 0.16) * scale;
      const color = rngPick(colors);

      offCtx.save();
      offCtx.translate(pos.x, pos.y);
      offCtx.rotate(t * 0.04 * (i % 2 === 0 ? 1 : -1) + (rng() - 0.5) * cFactor * 0.3);

      offCtx.globalAlpha = c.posOpacity(pos.x, pos.y, 0.45, 0.9);
      const glyphSeed = Math.floor(state.seed * 31 + i * 17 + (state.animating ? t * 0.05 : 0));
      
      // Draw procedural walked cyber-glyph
      offCtx.save();
      offCtx.strokeStyle = color;
      offCtx.lineWidth = lw(2.2 * scale);
      offCtx.lineCap = 'square';
      offCtx.lineJoin = 'miter';
      
      const points = [];
      const gs = size * 0.42;
      for (let gy = -1; gy <= 1; gy++) {
        for (let gx = -1; gx <= 1; gx++) {
          points.push({ x: gx * gs, y: gy * gs });
        }
      }
      
      let currentIdx = (glyphSeed % 9);
      offCtx.beginPath();
      offCtx.moveTo(points[currentIdx].x, points[currentIdx].y);
      
      const walkLength = 4 + (glyphSeed % 4);
      for (let w = 0; w < walkLength; w++) {
        const cx_g = currentIdx % 3;
        const cy_g = Math.floor(currentIdx / 3);
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx_g + dx;
            const ny = cy_g + dy;
            if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3) {
              neighbors.push(ny * 3 + nx);
            }
          }
        }
        if (neighbors.length > 0) {
          const nextIdx = neighbors[(glyphSeed + w * 7) % neighbors.length];
          currentIdx = nextIdx;
          offCtx.lineTo(points[currentIdx].x, points[currentIdx].y);
        }
      }
      offCtx.stroke();
      
      // Decorative elements inside the glyph cell
      if ((glyphSeed % 3) === 0) {
        offCtx.beginPath();
        offCtx.arc(0, 0, gs * 0.45, 0, Math.PI * 2);
        offCtx.stroke();
      } else if ((glyphSeed % 3) === 1) {
        offCtx.beginPath();
        offCtx.moveTo(-gs * 0.7, -gs * 0.7);
        offCtx.lineTo(gs * 0.7, gs * 0.7);
        offCtx.stroke();
      }
      offCtx.restore();

      if (state.complexity > 5) {
        offCtx.strokeStyle = color;
        offCtx.lineWidth = lw(0.6);
        offCtx.globalAlpha = 0.4 * (1 - cFactor * 0.4);
        offCtx.strokeRect(-size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
        
        if (state.complexity > 12) {
          offCtx.strokeRect(-size * 0.9, -size * 0.9, size * 1.8, size * 1.8);
        }
      }

      if (state.complexity > 7) {
        offCtx.save();
        const ringRot = t * 0.12 * (i % 2 === 0 ? 1 : -1);
        offCtx.rotate(ringRot);
        offCtx.font = `${lf(Math.max(6, 8 * scale))}px 'Share Tech Mono', monospace`;
        offCtx.fillStyle = color;
        offCtx.globalAlpha = 0.5 * (1 - cFactor * 0.5);
        const rad = size * 1.15;
        const numChars = 12;
        for (let k = 0; k < numChars; k++) {
          const charAngle = (k / numChars) * Math.PI * 2;
          const cx = Math.cos(charAngle) * rad;
          const cy = Math.sin(charAngle) * rad;
          offCtx.save();
          offCtx.translate(cx, cy);
          offCtx.rotate(charAngle + Math.PI / 2);
          offCtx.fillText(rngPick(techGlyphs), 0, 0);
          offCtx.restore();
        }
        offCtx.restore();
      }

      offCtx.restore();

      if (state.textAmount > 0 && !isDetailPass) {
        offCtx.save();
        offCtx.fillStyle = color;
        offCtx.globalAlpha = c.posOpacity(pos.x, pos.y, 0.4, 0.85);
        
        const colX = pos.x + size * 1.0;
        let colY = pos.y - size * 0.7;
        const spacing = lf(Math.max(8, 10 * scale));
        offCtx.font = `${lf(Math.max(7, 9 * scale))}px 'Share Tech Mono', monospace`;
        offCtx.textAlign = 'left';

        const lines = Math.floor(4 + state.complexity * 0.2);
        for (let l = 0; l < lines; l++) {
          let txt = rngPick([...HUD_TEXTS, ...TECH_STRINGS, ...techGlyphs]);
          if (rng() < cFactor) {
            let chars = txt.split('');
            for (let c = 0; c < chars.length; c++) {
              if (rng() < cFactor * 0.5) chars[c] = rngPick(['█', '░', '?', '#', 'Ø']);
            }
            txt = chars.join('');
          }
          
          let driftX = (rng() - 0.5) * cFactor * 24;
          let driftY = (rng() - 0.5) * cFactor * 12;
          offCtx.fillText(txt, colX + driftX, colY + driftY + l * spacing);
        }
        offCtx.restore();
      }

      state.elementCount++;
    }

    if (!isDetailPass) {
      if (state.complexity > 8) drawCornerElements(W, H, colors);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SHARED HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  function drawCornerElements(W, H, colors) {
    const size = Math.min(W, H) * 0.065;
    [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]].forEach(([cx,cy,sx,sy]) => {
      const color = rngPick(colors);
      offCtx.strokeStyle = color; offCtx.lineWidth = lw(1); offCtx.globalAlpha = rngRange(0.5, 1.0);
      offCtx.beginPath(); offCtx.moveTo(cx + sx * size, cy); offCtx.lineTo(cx, cy); offCtx.lineTo(cx, cy + sy * size); offCtx.stroke();
      offCtx.lineWidth = lw(0.4);
      offCtx.beginPath(); offCtx.moveTo(cx + sx * size * 0.5, cy); offCtx.lineTo(cx + sx * size * 0.5, cy + sy * size * 0.2); offCtx.stroke();
      offCtx.globalAlpha = 1; state.elementCount++;
    });
  }

  function drawSmallOrnaments(W, H, colors, complexity) {
    // Vertical tick groups
    for (let g = 0; g < rngInt(2, 4 + complexity); g++) {
      const gx = rngRange(W * 0.1, W * 0.9), gy = rngRange(H * 0.1, H * 0.9);
      const count = rngPick([2, 3, 4]), spacing = lw(5), height = rngRange(H * 0.02, H * 0.08);
      offCtx.strokeStyle = rngPick(colors); offCtx.lineWidth = lw(1); offCtx.globalAlpha = rngRange(0.5, 0.9);
      for (let l = 0; l < count; l++) { offCtx.beginPath(); offCtx.moveTo(gx + l * spacing, gy); offCtx.lineTo(gx + l * spacing, gy + height); offCtx.stroke(); }
      offCtx.globalAlpha = 1; state.elementCount++;
    }
    // Arrows
    for (let a = 0; a < rngInt(1, 4 + Math.floor(complexity / 2)); a++) {
      const ax = rngRange(W * 0.05, W * 0.95), ay = rngRange(H * 0.05, H * 0.95);
      const sz = rngRange(H * 0.01, H * 0.028), dir = rng() < 0.5 ? 1 : -1;
      offCtx.strokeStyle = rngPick(colors); offCtx.lineWidth = lw(1); offCtx.globalAlpha = rngRange(0.6, 1.0);
      const drawChev = (x, y) => { offCtx.beginPath(); offCtx.moveTo(x, y-sz); offCtx.lineTo(x+dir*sz, y); offCtx.lineTo(x, y+sz); offCtx.stroke(); };
      drawChev(ax, ay); if (rng() < 0.5) drawChev(ax + dir * sz * 1.6, ay);
      offCtx.globalAlpha = 1; state.elementCount++;
    }
    // Diamonds
    for (let d = 0; d < rngInt(1, 4 + Math.floor(complexity / 3)); d++) {
      const dx = rngRange(W * 0.05, W * 0.95), dy = rngRange(H * 0.05, H * 0.95), ds = rngRange(H * 0.01, H * 0.028);
      offCtx.fillStyle = rngPick(colors); offCtx.strokeStyle = rngPick(colors); offCtx.lineWidth = lw(0.8); offCtx.globalAlpha = rngRange(0.5, 0.9);
      offCtx.save(); offCtx.translate(dx, dy); offCtx.rotate(Math.PI / 4);
      rng() < 0.7 ? offCtx.fillRect(-ds, -ds, ds * 2, ds * 2) : offCtx.strokeRect(-ds, -ds, ds * 2, ds * 2);
      offCtx.restore(); offCtx.globalAlpha = 1; state.elementCount++;
    }
  }

  function drawHudTexts(W, H, t = 0) {
    if (state.textAmount === 0 && state.customTextAmount === 0) return;
    
    const wasDrawingOverlay = offCtx.isDrawingOverlay;
    offCtx.isDrawingOverlay = true;
    try {
      // 1. Draw regular HUD texts
      if (state.textAmount > 0) {
        const amount = state.textAmount;
        const fs = Math.max(11, Math.floor(W / 90));
        const sfs = Math.max(9, Math.floor(W / 120));
        const numLabels = rngInt(Math.floor(amount * 0.5), amount * 2);
        for (let i = 0; i < numLabels; i++) {
          offCtx.fillStyle = rngPick(getColors()); offCtx.globalAlpha = rngRange(0.25, 0.75);
          offCtx.font = `${rngPick([sfs, fs])}px 'Share Tech Mono', monospace`;
          let tx = rngRange(W * 0.01, W * 0.87);
          let ty = rngRange(H * 0.04, H * 0.96);
          // Snap to 12x12 grid when chaos is low
          const gridSnapFactor = Math.max(0, 1 - state.chaos / 40.0);
          if (gridSnapFactor > 0) {
            const snappedX = Math.round(tx / (W / 12)) * (W / 12);
            const snappedY = Math.round(ty / (H / 12)) * (H / 12);
            tx = tx + (snappedX - tx) * gridSnapFactor;
            ty = ty + (snappedY - ty) * gridSnapFactor;
          }
          offCtx.fillText(rngPick([...HUD_TEXTS, ...TECH_STRINGS]), tx, ty);
          offCtx.globalAlpha = 1; state.elementCount++;
        }
        if (amount > 3) {
          offCtx.font = `${Math.floor(fs * 1.6)}px 'Share Tech Mono', monospace`;
          for (let i = 0; i < rngInt(2, amount); i++) {
            offCtx.fillStyle = rngPick(getColors()); offCtx.globalAlpha = rngRange(0.4, 0.9);
            let tx = rngRange(W * 0.05, W * 0.9);
            let ty = rngRange(H * 0.05, H * 0.95);
            // Snap to 12x12 grid when chaos is low
            const gridSnapFactor = Math.max(0, 1 - state.chaos / 40.0);
            if (gridSnapFactor > 0) {
              const snappedX = Math.round(tx / (W / 12)) * (W / 12);
              const snappedY = Math.round(ty / (H / 12)) * (H / 12);
              tx = tx + (snappedX - tx) * gridSnapFactor;
              ty = ty + (snappedY - ty) * gridSnapFactor;
            }
            offCtx.fillText(rngPick(SYMBOLS), tx, ty);
            offCtx.globalAlpha = 1;
          }
        }
      }

      // 2. Draw custom HUD texts
      if (state.customTextAmount > 0 && state.customText) {
        const cAmount = state.customTextAmount;
        const numCustomLabels = rngInt(Math.floor(cAmount * 0.5), cAmount * 1.5);
        
        const txt = state.customText.toUpperCase();
        const fontName = state.customFont;
        const cFactor = state.chaos / 30.0;
        
        // Proportional font sizing based on 1280 base width
        const baseSize = state.customTextSize * (W / 1280);
        const customFs = baseSize;
        const customSfs = baseSize * 0.75;
        
        // Opacity scaling
        const maxOpacity = state.customTextOpacity / 100.0;
        
        for (let i = 0; i < numCustomLabels; i++) {
          if (state.customTextColor === 'auto') {
            offCtx.fillStyle = rngPick(getColors());
          } else if (state.customTextColor === 'pure-black') {
            offCtx.fillStyle = '#000000';
          } else if (state.customTextColor === 'white-out') {
            offCtx.fillStyle = '#ffffff';
          } else if (state.customTextColor === 'matrix-green') {
            offCtx.fillStyle = '#39ff14';
          } else if (state.customTextColor === 'neon-cyan') {
            offCtx.fillStyle = '#00f0ff';
          } else if (state.customTextColor === 'hot-pink') {
            offCtx.fillStyle = '#ff007f';
          } else if (state.customTextColor === 'acid-lime') {
            offCtx.fillStyle = '#ccff00';
          } else if (state.customTextColor === 'laser-purple') {
            offCtx.fillStyle = '#bd00ff';
          } else if (state.customTextColor === 'solar-orange') {
            offCtx.fillStyle = '#ff6c00';
          } else if (state.customTextColor === 'neon-yellow') {
            offCtx.fillStyle = '#ffff00';
          } else {
            offCtx.fillStyle = `url(#grad-${state.customTextColor})`;
          }
          offCtx.globalAlpha = rngRange(maxOpacity * 0.4, maxOpacity);
          offCtx.font = `${state.customFontWeight || '400'} ${rngPick([customSfs, customFs])}px ${fontName}`;
          
          let tx = rngRange(W * 0.01, W * 0.8);
          let ty = rngRange(H * 0.04, H * 0.96);
          // Snap to 12x12 grid when chaos is low
          const gridSnapFactor = Math.max(0, 1 - state.chaos / 40.0);
          if (gridSnapFactor > 0) {
            const snappedX = Math.round(tx / (W / 12)) * (W / 12);
            const snappedY = Math.round(ty / (H / 12)) * (H / 12);
            tx = tx + (snappedX - tx) * gridSnapFactor;
            ty = ty + (snappedY - ty) * gridSnapFactor;
          }
          
          offCtx.save();
          offCtx.translate(tx, ty);
          if (cFactor > 0.05) {
            offCtx.rotate((rng() - 0.5) * cFactor * 0.4);
          }
          offCtx.fillText(txt, 0, 0);
          offCtx.restore();
          offCtx.globalAlpha = 1; state.elementCount++;
        }
      }
    } finally {
      offCtx.isDrawingOverlay = wasDrawingOverlay;
    }
  }

  function drawCheckPatterns(W, H, colors) {
    for (let c = 0; c < rngInt(1, 4); c++) {
      const size = rngRange(3, 9), count = rngInt(2, 6);
      offCtx.fillStyle = rngPick(colors); offCtx.globalAlpha = rngRange(0.4, 0.9);
      const bx = rngRange(0, W * 0.9), by = rngRange(0, H * 0.9);
      for (let row = 0; row < count; row++) for (let col = 0; col < count; col++) if ((row+col)%2===0) offCtx.fillRect(bx + col*size, by + row*size, size, size);
      offCtx.globalAlpha = 1; state.elementCount++;
    }
  }

  function drawGlobalScaffold(W, H, colors) {
    if (!comp) return;
    const cFactor = state.chaos / 30.0;
    const thin = getThin();
    const margin = lw(20);

    // 1. Technical background dot grid
    const spacing = Math.floor(Math.min(W, H) / 24);
    offCtx.fillStyle = thin;
    offCtx.globalAlpha = 0.08 * Math.max(0, 1 - cFactor);
    if (offCtx.globalAlpha > 0.005) {
      offCtx.beginPath();
      for (let x = spacing; x < W; x += spacing) {
        for (let y = spacing; y < H; y += spacing) {
          offCtx.arc(x, y, lw(0.6), 0, Math.PI * 2);
        }
      }
      offCtx.fill();
    }

    // 2. Framing Border (Outer Box) with tiny corner marks
    offCtx.strokeStyle = thin;
    offCtx.lineWidth = lw(0.6);
    offCtx.globalAlpha = 0.28 * Math.max(0.1, 1 - cFactor * 0.5);
    offCtx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);

    // Corner crops for the outer box
    const cs = lw(5);
    [[margin, margin, 1, 1], [W - margin, margin, -1, 1], [margin, H - margin, 1, -1], [W - margin, H - margin, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      offCtx.beginPath();
      offCtx.moveTo(cx + sx * cs, cy);
      offCtx.lineTo(cx, cy);
      offCtx.lineTo(cx, cy + sy * cs);
      offCtx.stroke();
    });

    // 3. Horizontal and Vertical projection guides through anchors
    offCtx.save();
    offCtx.strokeStyle = thin;
    offCtx.lineWidth = lw(0.4);
    offCtx.globalAlpha = 0.22 * Math.max(0, 1 - cFactor * 0.7);
    offCtx.setLineDash([lw(3), lw(3)]);
    
    comp.anchors.forEach(anchor => {
      // Horizontal projection line
      offCtx.beginPath();
      offCtx.moveTo(margin, anchor.y);
      offCtx.lineTo(W - margin, anchor.y);
      offCtx.stroke();
      
      // Vertical projection line
      offCtx.beginPath();
      offCtx.moveTo(anchor.x, margin);
      offCtx.lineTo(anchor.x, H - margin);
      offCtx.stroke();
    });
    offCtx.restore();

    // 4. Border intersection readouts & tick marks
    offCtx.fillStyle = thin;
    offCtx.globalAlpha = 0.55 * Math.max(0.1, 1 - cFactor * 0.5);
    offCtx.font = `${lf(7)}px 'Share Tech Mono', monospace`;
    
    comp.anchors.forEach(anchor => {
      const rx = Math.round(anchor.x);
      const ry = Math.round(anchor.y);
      let labelX = `[A${anchor.id}_X:${rx}]`;
      let labelY = `[A${anchor.id}_Y:${ry}]`;
      
      const glitchText = (txt) => {
        if (cFactor > 0.05 && rng() < cFactor * 0.7) {
          return txt.split('').map(char => rng() < cFactor * 0.4 ? rngPick(['#', '?', '!', 'Ø', 'X', '█', '0']) : char).join('');
        }
        return txt;
      };

      // Top border readout
      offCtx.textAlign = 'center';
      offCtx.fillText(glitchText(labelX), anchor.x, margin - lw(4));
      
      // Bottom border readout
      offCtx.fillText(glitchText(labelX), anchor.x, H - margin + lw(9));

      // Left border readout
      offCtx.textAlign = 'right';
      offCtx.fillText(glitchText(labelY), margin - lw(4), anchor.y + lw(2.5));

      // Right border readout
      offCtx.textAlign = 'left';
      offCtx.fillText(glitchText(labelY), W - margin + lw(4), anchor.y + lw(2.5));
    });
    offCtx.globalAlpha = 1.0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  POST-PROCESSING
  // ─────────────────────────────────────────────────────────────────────────

  function applySymmetry(W, H) {
    // Handled natively in SVG rendering
  }

  function applyVignette(W, H) {
    // Handled natively in SVG rendering
  }

  function applyGrain(W, H) {
    // Handled natively in SVG rendering
  }

  function applyBorder(W, H) {
    // Handled natively in SVG rendering
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  GUNDAM MODE — military mecha targeting HUD
  // ─────────────────────────────────────────────────────────────────────────
  function drawGundam(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const acc = getAccent();
    const thin = getThin();
    const cFactor = state.chaos / 30.0;

    // 1. Tactical Hex Grid & Radar Sweep (Centered on Anchor 0)
    const isGridActive = state.complexity > 7;
    if (!isDetailPass && isGridActive) {
      offCtx.strokeStyle = thin;
      offCtx.lineWidth = lw(0.4);
      offCtx.globalAlpha = 0.22 * Math.max(0.1, 1 - cFactor);
      const hexR = Math.floor(rngRange(28, 48));
      const hexH = hexR * Math.sqrt(3);
      offCtx.beginPath();
      for (let row = -1; row < H / hexH + 1; row++) {
        for (let col = -1; col < W / (hexR * 1.5) + 1; col++) {
          const cx = col * hexR * 3 + (row % 2) * hexR * 1.5;
          const cy = row * hexH;
          for (let i = 0; i < 6; i++) {
            const a = Math.PI / 3 * i - Math.PI / 6;
            let px = cx + hexR * 0.9 * Math.cos(a) + (rng() - 0.5) * cFactor * 24;
            let py = cy + hexR * 0.9 * Math.sin(a) + (rng() - 0.5) * cFactor * 24;
            i === 0 ? offCtx.moveTo(px, py) : offCtx.lineTo(px, py);
          }
          offCtx.closePath();
        }
      }
      offCtx.stroke();
      offCtx.globalAlpha = 1.0;

      // Radar sweep centered on Anchor 0
      const cx0 = c.anchors[0].x, cy0 = c.anchors[0].y;
      const sweepAngle = (t * 1.2) % (Math.PI * 2);
      const sweepR = Math.min(W, H) * 0.42;
      offCtx.save();
      offCtx.beginPath();
      offCtx.moveTo(cx0, cy0);
      offCtx.arc(cx0, cy0, sweepR, sweepAngle - 0.6, sweepAngle);
      offCtx.closePath();
      offCtx.fillStyle = acc + '22';
      offCtx.fill();
      offCtx.restore();

      // Concentric sweep rings
      if (state.complexity > 8) {
        offCtx.strokeStyle = thin;
        offCtx.lineWidth = lw(0.5);
        offCtx.globalAlpha = 0.15;
        const numRadarRings = Math.min(4, Math.floor(state.complexity / 8));
        for (let r = 1; r <= numRadarRings; r++) {
          offCtx.beginPath();
          offCtx.arc(cx0, cy0, sweepR * (r / numRadarRings), 0, Math.PI * 2);
          offCtx.stroke();
        }
      }
    }

    // 2. Trajectory Vectors (Lock-On beams linking support anchors to Anchor 0)
    if (!isDetailPass && c.anchors.length > 1) {
      for (let a = 1; a < c.anchors.length; a++) {
        const start = c.anchors[a];
        const end = c.anchors[0];
        const col = rngPick(colors);
        offCtx.strokeStyle = col;
        offCtx.lineWidth = lw(0.8);
        offCtx.globalAlpha = 0.55 * Math.max(0.1, 1 - cFactor * 0.5);
        offCtx.setLineDash([lw(6), lw(4)]);

        const driftStartX = (rng() - 0.5) * cFactor * 40;
        const driftStartY = (rng() - 0.5) * cFactor * 40;
        const driftEndX = (rng() - 0.5) * cFactor * 40;
        const driftEndY = (rng() - 0.5) * cFactor * 40;

        offCtx.beginPath();
        offCtx.moveTo(start.x + driftStartX, start.y + driftStartY);
        offCtx.lineTo(end.x + driftEndX, end.y + driftEndY);
        offCtx.stroke();
        offCtx.setLineDash([]);

        // Lock-on indicators along trajectory
        if (state.complexity > 6) {
          const mx = (start.x + end.x) / 2 + (driftStartX + driftEndX) / 2;
          const my = (start.y + end.y) / 2 + (driftStartY + driftEndY) / 2;
          offCtx.save();
          offCtx.fillStyle = col;
          offCtx.font = `${lf(8)}px monospace`;
          offCtx.textAlign = 'center';
          offCtx.fillText('»» LOCK_ON ««', mx, my - lw(3));
          offCtx.restore();
        }
      }
    }

    // 3. Main Targeting Reticle Assemblies
    for (let i = 0; i < c.anchors.length; i++) {
      const anchor = c.anchors[i];
      const scale = i === 0 ? 1.0 : i === 1 ? 0.618 : 0.45;

      const pos = { x: anchor.x, y: anchor.y };
      const driftX = (rng() - 0.5) * cFactor * 45;
      const driftY = (rng() - 0.5) * cFactor * 45;
      pos.x += driftX;
      pos.y += driftY;

      const rSize = Math.min(W, H) * 0.12 * scale;
      const col = rngPick(colors);
      offCtx.strokeStyle = col;
      offCtx.fillStyle = col;
      offCtx.lineWidth = lw(1);

      // Save context for rotated reticle elements
      offCtx.save();
      offCtx.translate(pos.x, pos.y);

      // 1. Generative Lissajous targeting curves in the center
      offCtx.save();
      offCtx.strokeStyle = col;
      offCtx.lineWidth = lw(0.7);
      offCtx.globalAlpha = 0.8 * (1 - cFactor * 0.35);
      offCtx.beginPath();
      const lSteps = 80 + Math.floor(state.complexity * 1.5);
      const la = 3 + (i % 3);
      const lb = 2 + (i % 2) * 2;
      const lPhase = t * 0.15 + (i * Math.PI / 4);
      for (let s = 0; s <= lSteps; s++) {
        const theta = (s / lSteps) * Math.PI * 2;
        const x = Math.sin(la * theta + lPhase) * rSize * 0.42;
        const y = Math.sin(lb * theta) * rSize * 0.42;
        s === 0 ? offCtx.moveTo(x, y) : offCtx.lineTo(x, y);
      }
      offCtx.stroke();
      offCtx.restore();

      // 2. Outer sine-modulated radar targeting sweep ring
      offCtx.save();
      offCtx.rotate(t * 0.05 * (i % 2 === 0 ? 1 : -1));
      offCtx.strokeStyle = col;
      offCtx.lineWidth = lw(1);
      offCtx.globalAlpha = 0.85 * (1 - cFactor * 0.4);
      offCtx.beginPath();
      const numPoints = 120;
      const modFreq = 8 + (i % 4) * 4;
      const modAmp = 0.04 + 0.04 * cFactor;
      for (let pIdx = 0; pIdx <= numPoints; pIdx++) {
        const a = (pIdx / numPoints) * Math.PI * 2;
        const r = rSize * (1 + modAmp * Math.sin(modFreq * a));
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        pIdx === 0 ? offCtx.moveTo(px, py) : offCtx.lineTo(px, py);
      }
      offCtx.stroke();
      
      // Crosshair guide indicators with gap
      const gap = rSize * 0.22;
      offCtx.lineWidth = lw(1.2);
      offCtx.beginPath();
      offCtx.moveTo(-rSize * 1.3, 0); offCtx.lineTo(-gap, 0);
      offCtx.moveTo(gap, 0); offCtx.lineTo(rSize * 1.3, 0);
      offCtx.moveTo(0, -rSize * 1.3); offCtx.lineTo(0, -gap);
      offCtx.moveTo(0, gap); offCtx.lineTo(0, rSize * 1.3);
      offCtx.stroke();
      offCtx.restore();

      offCtx.restore(); // restore translate

      


      // 4. Diagnostic/Telemetry Panel Box adjacent to reticle
      if (state.complexity > 4) {
        const isLeft = (i === 2);
        const pw = 135 * scale;
        const ph = 85 * scale;
        const padX = rSize + lw(20);
        const padY = -ph * 0.5;
        
        const bx = pos.x + (isLeft ? -padX - pw : padX);
        const by = pos.y + padY;

        // Draw connecting leader line with 45-degree elbow
        offCtx.save();
        offCtx.strokeStyle = col;
        offCtx.lineWidth = lw(0.6);
        offCtx.globalAlpha = 0.65 * (1 - cFactor * 0.5);
        
        const lineStartX = pos.x + (isLeft ? -rSize : rSize);
        const lineStartY = pos.y;
        const elbowX = lineStartX + (isLeft ? -lw(10) : lw(10));
        const elbowY = pos.y - lw(10);
        const lineEndX = bx + (isLeft ? pw : 0);
        
        offCtx.beginPath();
        offCtx.moveTo(lineStartX, lineStartY);
        offCtx.lineTo(elbowX, elbowY);
        offCtx.lineTo(lineEndX, elbowY);
        offCtx.stroke();
        offCtx.restore();

        // Draw Diagnostic Box
        offCtx.save();
        offCtx.translate(bx + pw/2, by + ph/2);
        offCtx.rotate((rng() - 0.5) * cFactor * 0.15); // jitter/rotate panel with chaos
        offCtx.translate(-(bx + pw/2), -(by + ph/2));

        offCtx.fillStyle = colors[0] + '14'; // subtle solid backdrop
        offCtx.strokeStyle = col;
        offCtx.lineWidth = lw(0.8);
        offCtx.globalAlpha = 0.75 * (1 - cFactor * 0.4);
        offCtx.fillRect(bx, by, pw, ph);
        offCtx.strokeRect(bx, by, pw, ph);

        // Header tab
        offCtx.fillStyle = col;
        offCtx.globalAlpha = 0.85;
        offCtx.fillRect(bx, by, pw, lw(12));
        
        // Header Text
        offCtx.fillStyle = getBgColor();
        offCtx.font = `bold ${lf(Math.max(6, 8 * scale))}px monospace`;
        offCtx.textAlign = 'left';
        let titleTxt = isLeft ? `TGT_SUPPORT_02` : i === 0 ? `FOCAL_TARGET_00` : `TGT_SUPPORT_01`;
        if (rng() < cFactor * 0.5) titleTxt = 'SYSTEM_ERROR';
        offCtx.fillText(titleTxt, bx + lw(4), by + lw(9));

        // Details inside the box
        if (state.complexity > 7 && state.textAmount > 0) {
          offCtx.fillStyle = col;
          offCtx.font = `${lf(Math.max(6, 8 * scale))}px monospace`;
          offCtx.globalAlpha = 0.85;

          const lines = [`LOCK: ACQUIRED`, `DIST: ${Math.round(4521 * scale)}m`, `VEL: ${Math.round(284 * scale)}km/h`];
          lines.forEach((line, lineIdx) => {
            offCtx.fillText(line, bx + lw(6), by + lw(26) + lineIdx * lw(11));
          });

          // Small indicator bar
          const barW = pw * 0.8;
          const barH = lw(5);
          const barY = by + ph - lw(12);
          offCtx.strokeStyle = col;
          offCtx.strokeRect(bx + lw(6), barY, barW, barH);
          offCtx.fillRect(bx + lw(6), barY, barW * 0.65, barH);
        }
        offCtx.restore();
      }

      state.elementCount += 3;
    }

    // 5. Clean, aligned HUD status columns (Header / Footer margins)
    if (!isDetailPass && state.textAmount > 0) {
      offCtx.save();
      offCtx.font = `${lf(9)}px monospace`;
      offCtx.fillStyle = acc;
      offCtx.globalAlpha = 0.8 * (1 - cFactor * 0.6);
      
      const hudLines = [
        'MOBILE SUIT SYSTEM ONLINE',
        'GENERATOR OUTPUT: NOMINAL',
        'FIELD MOTOR: ACTIVE',
        'BEAM RIFLE: CHARGED',
        'SHIELD: 100%',
        'PROPELLANT: 87%',
        'MINOVSKY DENSITY: HIGH',
        'TARGETING COMPUTER: LOCK'
      ];
      
      const margin = lw(28);
      // Top Left Column
      offCtx.textAlign = 'left';
      for (let i = 0; i < Math.min(4, state.textAmount); i++) {
        let txt = hudLines[i];
        if (rng() < cFactor * 0.4) txt = '!! ' + txt + ' !!';
        offCtx.fillText(txt, margin, margin + i * lw(12));
      }
      
      // Top Right Column
      offCtx.textAlign = 'right';
      for (let i = 4; i < Math.min(8, 4 + state.textAmount); i++) {
        let txt = hudLines[i];
        if (rng() < cFactor * 0.4) txt = '!! ' + txt + ' !!';
        offCtx.fillText(txt, W - margin, margin + (i - 4) * lw(12));
      }
      offCtx.restore();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  VOLUMETRIC MODE — PSEUDO 3D WIREFRAME FORMS
  // ─────────────────────────────────────────────────────────────────────────
  function drawVolumetric(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const cFactor = state.chaos / 30.0;

    const rotateX = (p, a) => {
      const ca = Math.cos(a), sa = Math.sin(a);
      return { x: p.x, y: p.y * ca - p.z * sa, z: p.y * sa + p.z * ca };
    };
    const rotateY = (p, a) => {
      const ca = Math.cos(a), sa = Math.sin(a);
      return { x: p.x * ca + p.z * sa, y: p.y, z: -p.x * sa + p.z * ca };
    };

    const edgeList = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    const cubeCount = isDetailPass
      ? Math.max(2, Math.floor(state.detail * 0.03))
      : Math.max(4, Math.floor(state.detail * 0.08) + 2);

    const perspective = Math.max(180, Math.min(W, H) * 0.55);

    for (let i = 0; i < cubeCount; i++) {
      const anchor = c.anchors[i % c.anchors.length];
      const drift = isDetailPass ? 0.6 : 1;
      const ox = anchor.x + (rng() - 0.5) * W * 0.18 * cFactor * drift;
      const oy = anchor.y + (rng() - 0.5) * H * 0.16 * cFactor * drift;

      const size = rngRange(Math.min(W, H) * 0.045, Math.min(W, H) * 0.16) * (1 + state.weight * 0.006);
      const depth = rngRange(80, 340) + i * 26;
      const rx = (t * 0.34 + i * 0.61) * (rng() < 0.5 ? 1 : -1);
      const ry = t * 0.48 + i * 0.78;

      const verts = [
        { x: -size, y: -size, z: -size }, { x: size, y: -size, z: -size },
        { x: size, y: size, z: -size }, { x: -size, y: size, z: -size },
        { x: -size, y: -size, z: size }, { x: size, y: -size, z: size },
        { x: size, y: size, z: size }, { x: -size, y: size, z: size }
      ];

      const projected = verts.map(v => {
        let p = rotateX(v, rx);
        p = rotateY(p, ry);
        p.z += depth;
        const s = perspective / Math.max(80, p.z + perspective * 0.35);
        return { x: ox + p.x * s, y: oy + p.y * s, z: p.z, scale: s };
      });

      const lineCol = rngPick(colors);
      offCtx.strokeStyle = lineCol;
      offCtx.lineWidth = lw(0.65 + state.weight * 0.02);
      offCtx.globalAlpha = Math.max(0.2, 0.76 - i * 0.05) * (1 - cFactor * 0.18);

      edgeList.forEach(([a, b]) => {
        offCtx.beginPath();
        offCtx.moveTo(projected[a].x, projected[a].y);
        offCtx.lineTo(projected[b].x, projected[b].y);
        offCtx.stroke();
      });

      // Front-face tint helps sell the fake volume.
      offCtx.fillStyle = lineCol;
      offCtx.globalAlpha *= 0.14;
      offCtx.beginPath();
      offCtx.moveTo(projected[4].x, projected[4].y);
      offCtx.lineTo(projected[5].x, projected[5].y);
      offCtx.lineTo(projected[6].x, projected[6].y);
      offCtx.lineTo(projected[7].x, projected[7].y);
      offCtx.closePath();
      offCtx.fill();

      if (!isDetailPass && state.textAmount > 10 && i % 2 === 0) {
        offCtx.globalAlpha = 0.62;
        offCtx.fillStyle = lineCol;
        offCtx.font = `${lf(8)}px monospace`;
        offCtx.textAlign = 'left';
        offCtx.fillText(`Z:${Math.round(depth)} U:${Math.round(projected[0].scale * 100)}`, projected[6].x + lw(4), projected[6].y - lw(4));
      }

      state.elementCount += 1;
    }

    if (!isDetailPass && state.complexity > 8) {
      const gridStep = Math.max(28, Math.floor(Math.min(W, H) * 0.06));
      offCtx.strokeStyle = getThin();
      offCtx.lineWidth = lw(0.35);
      offCtx.globalAlpha = 0.22;
      for (let y = H * 0.5; y < H; y += gridStep) {
        const perspectiveShift = (y - H * 0.5) * 0.35;
        offCtx.beginPath();
        offCtx.moveTo(W * 0.5 - perspectiveShift, y);
        offCtx.lineTo(W * 0.5 + perspectiveShift, y);
        offCtx.stroke();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  EVANGELION MODE — NERV / AT Field HUD
  // ─────────────────────────────────────────────────────────────────────────
  function drawEvangelion(t = 0, isDetailPass = false) {
    const W = offCanvas.width, H = offCanvas.height;
    const colors = getColors();
    const c = comp || buildComposition(W, H);
    const acc = getAccent();
    const cFactor = state.chaos / 30.0;
    const thin = getThin();
    const evaPurple = '#7a35ff';
    const evaGreen = '#66ff33';
    const evaOrange = '#ff9f0a';
    const evaRed = '#ff3b30';

    const drawHexPath = (cx, cy, r, rot = 0) => {
      offCtx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = rot + (Math.PI / 3) * k;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        k === 0 ? offCtx.moveTo(x, y) : offCtx.lineTo(x, y);
      }
      offCtx.closePath();
    };

    // 1. AT-Field geometry core (sharp hex lattice + phase spokes)
    if (!isDetailPass && state.complexity > 4) {
      const cx0 = c.anchors[0].x;
      const cy0 = c.anchors[0].y;
      const minDim = Math.min(W, H);
      const baseR = minDim * 0.09;
      const layers = Math.min(10, 4 + Math.floor(state.complexity * 0.5));

      for (let j = 0; j < layers; j++) {
        const r = baseR + j * minDim * 0.028;
        const pulse = 1 + Math.sin(t * 1.7 + j * 0.8) * 0.02;
        const rot = t * 0.18 * (j % 2 === 0 ? 1 : -1) + j * 0.07;
        const color = j % 3 === 0 ? evaPurple : (j % 2 === 0 ? evaOrange : evaRed);

        offCtx.strokeStyle = color;
        offCtx.lineWidth = lw(j % 2 === 0 ? 1.1 : 0.8);
        offCtx.globalAlpha = Math.max(0.22, 0.72 - j * 0.07) * (1 - cFactor * 0.35);
        drawHexPath(cx0, cy0, r * pulse, rot);
        offCtx.stroke();

        if (state.complexity > 8 && j % 2 === 0) {
          offCtx.globalAlpha *= 0.55;
          drawHexPath(cx0, cy0, r * 0.84 * pulse, -rot * 0.55);
          offCtx.stroke();
        }
      }

      // Phase spokes + lock marks
      if (state.complexity > 6) {
        const spokeLen = baseR + layers * minDim * 0.028;
        offCtx.strokeStyle = evaGreen;
        offCtx.lineWidth = lw(0.7);
        offCtx.globalAlpha = 0.42 * (1 - cFactor * 0.3);
        for (let s = 0; s < 6; s++) {
          const a = t * 0.12 + s * (Math.PI / 3);
          const x = cx0 + Math.cos(a) * spokeLen;
          const y = cy0 + Math.sin(a) * spokeLen;
          offCtx.beginPath();
          offCtx.moveTo(cx0, cy0);
          offCtx.lineTo(x, y);
          offCtx.stroke();

          offCtx.beginPath();
          offCtx.arc(x, y, lw(2.2), 0, Math.PI * 2);
          offCtx.stroke();
        }
      }

      // Core fill plate
      offCtx.globalAlpha = 0.24;
      offCtx.fillStyle = '#8d4dff';
      drawHexPath(cx0, cy0, baseR * 0.72, t * 0.24);
      offCtx.fill();
      offCtx.globalAlpha = 1.0;
      state.elementCount += layers + 8;
    }

    // 2. Geofront tactical guides (cardinal rails + center cross)
    if (!isDetailPass && state.complexity > 5) {
      const cx0 = c.anchors[0].x;
      const cy0 = c.anchors[0].y;
      const rail = Math.min(W, H) * 0.32;

      offCtx.strokeStyle = thin;
      offCtx.lineWidth = lw(0.6);
      offCtx.globalAlpha = 0.45 * (1 - cFactor * 0.25);

      offCtx.beginPath();
      offCtx.moveTo(cx0 - rail, cy0);
      offCtx.lineTo(cx0 + rail, cy0);
      offCtx.moveTo(cx0, cy0 - rail);
      offCtx.lineTo(cx0, cy0 + rail);
      offCtx.stroke();

      const tickStep = rail / 4;
      for (let i = 1; i <= 4; i++) {
        const d = tickStep * i;
        offCtx.beginPath();
        offCtx.moveTo(cx0 - d, cy0 - lw(3));
        offCtx.lineTo(cx0 - d, cy0 + lw(3));
        offCtx.moveTo(cx0 + d, cy0 - lw(3));
        offCtx.lineTo(cx0 + d, cy0 + lw(3));
        offCtx.moveTo(cx0 - lw(3), cy0 - d);
        offCtx.lineTo(cx0 + lw(3), cy0 - d);
        offCtx.moveTo(cx0 - lw(3), cy0 + d);
        offCtx.lineTo(cx0 + lw(3), cy0 + d);
        offCtx.stroke();
      }
      state.elementCount += 6;
    }

    // 3. Cabling Conduits (System Connectivity)
    // Connect support anchors (Anchor 1, 2) to focal (Anchor 0) with orange bus lines
    if (!isDetailPass && c.anchors.length > 1) {
      for (let a = 1; a < c.anchors.length; a++) {
        const start = c.anchors[a];
        const end = c.anchors[0];
        
        offCtx.strokeStyle = '#ff6c00';
        offCtx.lineWidth = lw(0.85);
        offCtx.globalAlpha = 0.65 * (1 - cFactor * 0.5);

        // System cabling bus: 3 parallel lines
        const numCables = 3;
        const spacing = lw(4);

        for (let cb = 0; cb < numCables; cb++) {
          const offset = (cb - (numCables - 1) / 2) * spacing;
          offCtx.beginPath();
          
          let cx = start.x + offset;
          let cy = start.y + offset;
          let tx = end.x + offset;
          let ty = end.y + offset;
          
          offCtx.moveTo(cx, cy);

          // Rectilinear path (45 or 90 degree bends)
          let mx = cx;
          let my = cy;
          if (a % 2 === 0) {
            mx = tx;
            if (rng() < cFactor) mx += (rng() - 0.5) * 40;
            offCtx.lineTo(mx, my);
          } else {
            my = ty;
            if (rng() < cFactor) my += (rng() - 0.5) * 40;
            offCtx.lineTo(mx, my);
          }
          
          let finalX = tx;
          let finalY = ty;
          if (rng() < cFactor * 0.4) {
            finalX += (rng() - 0.5) * 30;
            finalY += (rng() - 0.5) * 30;
          }
          offCtx.lineTo(finalX, finalY);
          offCtx.stroke();
        }
      }
    }

    // 3. MAGI System Panels (Caspar, Balthasar, Melchior on anchors)
    const magiNames = ['MAGI-01 CASPAR', 'MAGI-02 BALTHASAR', 'MAGI-03 MELCHIOR'];
    for (let m = 0; m < c.anchors.length; m++) {
      const anchor = c.anchors[m];
      const scale = m === 0 ? 1.0 : m === 1 ? 0.618 : 0.45;

      const pos = { x: anchor.x, y: anchor.y };
      const driftX = (rng() - 0.5) * cFactor * 36;
      const driftY = (rng() - 0.5) * cFactor * 36;
      pos.x += driftX;
      pos.y += driftY;

      const panelW = (W * 0.18) * scale;
      const panelH = (H * 0.14) * scale;
      const px = pos.x - panelW / 2;
      const py = pos.y - panelH / 2;

      // MAGI Vote status
      let vote = 'SYNC NOMINAL';
      let col = evaPurple;
      if (state.chaos > 25 && rng() < cFactor * 0.6) {
        vote = rngPick(['SYNC BREAK', 'CRITICAL ERR', 'AT-LEAK', 'OVERLOAD']);
        col = evaRed;
      } else if (rng() < 0.2) {
        vote = rngPick(['REVIEWING', 'MAGI VOTE', 'PATTERN BLUE']);
        col = evaOrange;
      } else if (rng() < 0.25) {
        col = evaGreen;
      }

      offCtx.save();
      offCtx.translate(pos.x, pos.y);
      offCtx.rotate((rng() - 0.5) * cFactor * 0.12);

      // Generative MAGI node network
      offCtx.strokeStyle = col;
      offCtx.lineWidth = lw(0.85);
      offCtx.fillStyle = col + '0c';
      const pw2 = panelW * 0.5;
      const ph2 = panelH * 0.5;
      offCtx.strokeRect(-pw2, -ph2, panelW, panelH);
      offCtx.fillRect(-pw2, -ph2, panelW, panelH);

      // Procedural neural nodes (Melchior, Balthasar, Caspar sub-networks)
      const numNodes = 4 + (m % 3) * 2;
      const nodePts = [];
      for (let n = 0; n < numNodes; n++) {
        // Distribute nodes in a polar circle inside the panel
        const theta = (n / numNodes) * Math.PI * 2 + t * 0.02;
        const radius = Math.min(panelW, panelH) * (0.28 + 0.08 * Math.sin(t * 1.2 + n));
        nodePts.push({
          x: Math.cos(theta) * radius,
          y: Math.sin(theta) * radius,
          active: Math.sin(t * 1.8 + n) > -0.2
        });
      }

      // Draw connection lines using bezier paths to center node
      offCtx.save();
      offCtx.lineWidth = lw(0.45);
      offCtx.globalAlpha *= 0.65;
      offCtx.beginPath();
      for (let n = 0; n < numNodes; n++) {
        const pt = nodePts[n];
        offCtx.moveTo(pt.x, pt.y);
        offCtx.quadraticCurveTo(pt.x * 0.5 - pt.y * 0.2, pt.y * 0.5 + pt.x * 0.2, 0, 0);
        
        const nextPt = nodePts[(n + 1) % numNodes];
        offCtx.moveTo(pt.x, pt.y);
        offCtx.lineTo(nextPt.x, nextPt.y);
      }
      offCtx.stroke();
      offCtx.restore();

      // Draw nodes as glowing circles
      offCtx.save();
      for (let n = 0; n < numNodes; n++) {
        const pt = nodePts[n];
        offCtx.fillStyle = pt.active ? col : '#ff0044'; // Red if error, green if approved
        offCtx.globalAlpha = pt.active ? 0.8 : 0.4;
        offCtx.beginPath();
        offCtx.arc(pt.x, pt.y, lw(2.2), 0, Math.PI * 2);
        offCtx.fill();
      }
      offCtx.restore();

      // Panel Header & Content
      if (state.complexity > 4 && state.textAmount > 0) {
        offCtx.fillStyle = col;
        offCtx.textAlign = 'center';
        
        // System title
        offCtx.font = `bold ${lf(Math.max(6, 8 * scale))}px monospace`;
        let name = magiNames[m % magiNames.length];
        if (rng() < cFactor * 0.3) name = name.replace('MAGI', 'ERR_SYS');
        offCtx.fillText(name, 0, -ph2 * 0.3);

        // Vote state
        offCtx.font = `bold ${lf(Math.max(8, 11 * scale))}px monospace`;
        offCtx.fillText(vote, 0, ph2 * 0.4);
      }
      offCtx.restore();

      // 4. Telemetry Rails (procedural bars, not fixed)
      if (state.complexity > 5 && !isDetailPass) {
        const rails = 2 + (m % 2); // 2 or 3 rails per MAGI panel
        const baseRadius = Math.max(panelW, panelH) * 0.62;
        const orbitPhase = anchor.angle + t * 0.25 + m * 0.8;

        let syncVal = 0.68 + Math.sin(t * 1.5 + m) * 0.15;
        if (state.chaos > 40) syncVal += (rng() - 0.5) * cFactor;
        syncVal = Math.max(0.08, Math.min(1.9, syncVal));
        const isOverload = syncVal > 1.0;
        const mCol = isOverload ? evaRed : col;

        offCtx.save();
        offCtx.translate((rng() - 0.5) * cFactor * 10, (rng() - 0.5) * cFactor * 10);

        for (let rIdx = 0; rIdx < rails; rIdx++) {
          const a = orbitPhase + rIdx * (Math.PI * 2 / rails);
          const railX = pos.x + Math.cos(a) * baseRadius;
          const railY = pos.y + Math.sin(a) * baseRadius;
          const railLen = panelW * rngRange(0.45, 0.95);
          const railThick = lw(rngRange(6, 11));
          const chaosNorm = Math.min(1, state.chaos / 100);

          // Align rail orientation to anchor direction plus quantized offsets
          const dir = anchor.angle + rngPick([0, Math.PI / 6, -Math.PI / 6, Math.PI / 2]);
          const fillLen = Math.max(lw(2), Math.min(railLen - lw(2), (railLen - lw(2)) * Math.abs(syncVal)));
          const shapeRoll = rng();
          const isCurvedRail = chaosNorm > 0.10 && shapeRoll < (0.12 + chaosNorm * 0.50);
          const isBrokenRail = !isCurvedRail && chaosNorm > 0.20 && shapeRoll < (0.05 + chaosNorm * 0.70);

          offCtx.save();
          offCtx.translate(railX, railY);
          offCtx.rotate(dir);

          // Outer frame + interior fill: straight, curved or broken based on chaos
          offCtx.strokeStyle = mCol;
          offCtx.lineWidth = lw(0.75);
          offCtx.globalAlpha = 0.78 * (1 - cFactor * 0.35);

          if (isCurvedRail) {
            const bulge = railThick * rngRange(0.6, 1.5) * (rng() < 0.5 ? -1 : 1) * (0.35 + chaosNorm * 0.9);

            offCtx.beginPath();
            offCtx.moveTo(-railLen / 2, -railThick / 2);
            offCtx.quadraticCurveTo(0, -railThick / 2 + bulge, railLen / 2, -railThick / 2);
            offCtx.lineTo(railLen / 2, railThick / 2);
            offCtx.quadraticCurveTo(0, railThick / 2 + bulge, -railLen / 2, railThick / 2);
            offCtx.closePath();
            offCtx.stroke();

            offCtx.strokeStyle = mCol;
            offCtx.lineWidth = Math.max(lw(1.5), railThick - lw(2.2));
            offCtx.globalAlpha = isOverload ? 0.88 : 0.6;
            const fx1 = -railLen / 2 + lw(1.2);
            const fx2 = Math.min(railLen / 2 - lw(1.2), -railLen / 2 + fillLen);
            if (fx2 > fx1) {
              const midX = (fx1 + fx2) * 0.5;
              const curveLift = bulge * 0.72;
              offCtx.beginPath();
              offCtx.moveTo(fx1, 0);
              offCtx.quadraticCurveTo(midX, curveLift, fx2, 0);
              offCtx.stroke();
            }
          } else if (isBrokenRail) {
            const kinks = 3 + (rIdx % 3);
            const segGap = lw(1.2);
            const kinkAmp = railThick * (0.2 + chaosNorm * 0.45);
            const segLen = (railLen - segGap * (kinks - 1)) / kinks;

            offCtx.fillStyle = mCol;
            offCtx.globalAlpha = isOverload ? 0.88 : 0.6;
            let consumed = 0;
            for (let k = 0; k < kinks; k++) {
              const sx = -railLen / 2 + k * (segLen + segGap);
              const yOff = ((k % 2 === 0) ? -1 : 1) * kinkAmp;
              offCtx.globalAlpha = 0.74 * (1 - cFactor * 0.35);
              offCtx.strokeRect(sx, -railThick / 2 + yOff, segLen, railThick);

              const available = Math.max(0, fillLen - consumed);
              const fillW = Math.min(segLen - lw(1.4), available);
              if (fillW > 0) {
                offCtx.globalAlpha = isOverload ? 0.88 : 0.6;
                offCtx.fillRect(sx + lw(0.7), -railThick / 2 + yOff + lw(1), fillW, railThick - lw(2));
              }
              consumed += segLen + segGap;
            }
          } else {
            offCtx.strokeRect(-railLen / 2, -railThick / 2, railLen, railThick);

            const segs = 3 + (rIdx % 3);
            const segGap = lw(1.4);
            const segW = (fillLen - segGap * (segs - 1)) / segs;
            offCtx.fillStyle = mCol;
            offCtx.globalAlpha = isOverload ? 0.9 : 0.62;
            for (let s = 0; s < segs; s++) {
              const sx = -railLen / 2 + s * (segW + segGap) + lw(1);
              if (sx > -railLen / 2 + fillLen) break;
              const clampedW = Math.min(segW, (-railLen / 2 + fillLen) - sx);
              if (clampedW > 0) offCtx.fillRect(sx, -railThick / 2 + lw(1), clampedW, railThick - lw(2));
            }
          }

          // Rail end-caps
          offCtx.globalAlpha = 0.85;
          offCtx.beginPath();
          offCtx.moveTo(-railLen / 2, 0);
          offCtx.lineTo(-railLen / 2 - lw(4), 0);
          offCtx.moveTo(railLen / 2, 0);
          offCtx.lineTo(railLen / 2 + lw(4), 0);
          offCtx.stroke();

          offCtx.restore();
        }

        if (state.textAmount > 0) {
          offCtx.fillStyle = mCol;
          offCtx.globalAlpha = 0.95;
          offCtx.font = `${lf(Math.max(6, 8 * scale))}px monospace`;
          offCtx.textAlign = 'left';
          const rateText = isOverload ? `SYNC OVERFLOW: ${Math.floor(syncVal * 100)}%` : `SYNC RATE: ${Math.floor(syncVal * 100)}%`;
          offCtx.fillText(rateText, pos.x - panelW * 0.45, pos.y + panelH * 0.9);
        }

        offCtx.restore();
      }

      state.elementCount += 4;
    }

    // 5. NERV Warning Stripes (DANGER rails with variable layout)
    if (!isDetailPass && state.complexity > 7) {
      offCtx.save();
      const margin = lw(20);
      const stripeW = lw(14);
      const bandThin = lw(16);
      const bandThick = lw(24);
      const dangerPulse = 0.74 + 0.22 * Math.abs(Math.sin(t * 1.9));
      offCtx.strokeStyle = acc;
      offCtx.lineWidth = lw(1);

      const seedN = Math.abs(Math.sin(state.seed * 0.000017 + 1.7));
      const chaosShift = state.chaos > 70 ? (Math.floor(t * 0.35) % 2) : 0;
      const layoutVariant = (Math.floor(seedN * 7) + chaosShift) % 4;

      const drawDangerBand = (bx, by, bw, bh, orientation = 'horizontal', dir = 1) => {
        offCtx.save();
        offCtx.beginPath();
        offCtx.rect(bx, by, bw, bh);
        offCtx.clip();

        if (orientation === 'horizontal') {
          const slant = bh * 0.9 * dir;
          for (let sx = bx - bh; sx < bx + bw + bh; sx += stripeW * 2) {
            offCtx.fillStyle = rngPick([evaRed, evaOrange, '#1a0000']);
            offCtx.globalAlpha = dangerPulse * (1 - cFactor * 0.12);
            offCtx.beginPath();
            offCtx.moveTo(sx, by);
            offCtx.lineTo(sx + stripeW, by);
            offCtx.lineTo(sx + stripeW + slant, by + bh);
            offCtx.lineTo(sx + slant, by + bh);
            offCtx.closePath();
            offCtx.fill();
          }
        } else {
          const slant = bw * 0.35 * dir;
          for (let sy = by - bw; sy < by + bh + bw; sy += stripeW * 2) {
            offCtx.fillStyle = rngPick([evaRed, evaOrange, '#1a0000']);
            offCtx.globalAlpha = dangerPulse * (1 - cFactor * 0.12);
            offCtx.beginPath();
            offCtx.moveTo(bx, sy);
            offCtx.lineTo(bx + bw, sy + slant);
            offCtx.lineTo(bx + bw, sy + stripeW + slant);
            offCtx.lineTo(bx, sy + stripeW);
            offCtx.closePath();
            offCtx.fill();
          }
        }

        offCtx.restore();

        offCtx.globalAlpha = 0.96 * (1 - cFactor * 0.25);
        offCtx.strokeRect(bx, by, bw, bh);

        // Extra alarm edge to avoid bars disappearing into dark backgrounds.
        offCtx.globalAlpha = 0.55;
        offCtx.strokeStyle = evaRed;
        offCtx.beginPath();
        offCtx.moveTo(bx, by + bh);
        offCtx.lineTo(bx + bw, by + bh);
        offCtx.stroke();
        offCtx.strokeStyle = acc;

        if (state.complexity > 8) {
          offCtx.fillStyle = '#ffffff';
          offCtx.font = `bold ${lf(8)}px monospace`;
          offCtx.globalAlpha = state.textAmount > 0 ? 0.92 : 0.72;
          if (orientation === 'horizontal') {
            offCtx.textAlign = 'center';
            const hzText = state.textAmount > 0 ? 'DANGER // NO ENTRY // DANGER // NO ENTRY' : 'DANGER // NO ENTRY';
            offCtx.fillText(hzText, bx + bw * 0.5, by + bh * 0.72);
          } else {
            offCtx.save();
            offCtx.translate(bx + bw * 0.5, by + bh * 0.5);
            offCtx.rotate(-Math.PI / 2);
            offCtx.textAlign = 'center';
            const vtText = state.textAmount > 0 ? 'DANGER // NO ENTRY // DANGER' : 'DANGER';
            offCtx.fillText(vtText, 0, lf(3));
            offCtx.restore();
          }
        }
      };

      let dangerBands = 0;
      if (layoutVariant === 0) {
        drawDangerBand(margin, margin + lw(10), W - margin * 2, bandThin, 'horizontal', 1);
        drawDangerBand(margin, H - margin - bandThin - lw(10), W - margin * 2, bandThin, 'horizontal', -1);
        dangerBands = 2;
      } else if (layoutVariant === 1) {
        drawDangerBand(margin + lw(8), margin + lw(24), bandThin, H - (margin + lw(24)) * 2, 'vertical', 1);
        drawDangerBand(W - margin - bandThin - lw(8), margin + lw(24), bandThin, H - (margin + lw(24)) * 2, 'vertical', -1);
        dangerBands = 2;
      } else if (layoutVariant === 2) {
        drawDangerBand(margin + lw(6), margin + lw(10), W - margin * 2 - lw(12), bandThin, 'horizontal', -1);
        drawDangerBand(W - margin - bandThin, margin + lw(34), bandThin, H - margin * 2 - lw(68), 'vertical', 1);
        dangerBands = 2;
      } else {
        const y0 = H * 0.16;
        const y1 = H * 0.5 - bandThin * 0.5;
        const y2 = H * 0.84 - bandThin;
        drawDangerBand(margin + lw(10), y0, W - margin * 2 - lw(20), bandThin, 'horizontal', 1);
        drawDangerBand(margin + lw(28), y1, W - margin * 2 - lw(56), bandThick, 'horizontal', -1);
        drawDangerBand(margin + lw(10), y2, W - margin * 2 - lw(20), bandThin, 'horizontal', 1);
        dangerBands = 3;
      }

      offCtx.restore();
      state.elementCount += dangerBands;
    }

    // 6. Aligned Warning / Countdown text columns at side margins
    if (!isDetailPass && state.textAmount > 0) {
      offCtx.save();
      const evaLines = [
        'WARNING: AT FIELD DETECTED',
        'ANGEL APPROACH VECTOR: 270°',
        'ALERT LEVEL: 3',
        'EVANGELION UNIT-01 LAUNCH',
        'MAGI OVERRIDE: GRANTED',
        'PATTERN BLUE CONFIRMED',
        'SYNCHRONIZATION INITIATED',
        'A.T. FIELD: EXPANDING',
        'LCL PRESSURE: STABLE',
        'ENTRY PLUG LOCK: GREEN',
        'GEOFRONT SEAL: CLOSED',
        'TARGET CORE: TRACKING'
      ];
      
      const margin = lw(28);
      const startY = H * 0.15;
      
      offCtx.fillStyle = '#ff1100'; // red alarm
      offCtx.font = `bold ${lf(9)}px monospace`;
      offCtx.globalAlpha = 0.8 * (1 - cFactor * 0.6);
      
      // Left side warnings
      offCtx.textAlign = 'left';
      for (let i = 0; i < Math.min(4, state.textAmount); i++) {
        let txt = evaLines[i];
        if (rng() < cFactor * 0.4) txt = '!! ' + txt + ' !!';
        offCtx.fillText(txt, margin, startY + i * lw(12));
      }

      // Right side warnings
      offCtx.textAlign = 'right';
      for (let i = 4; i < Math.min(evaLines.length, 4 + state.textAmount); i++) {
        let txt = evaLines[i];
        if (rng() < cFactor * 0.4) txt = '!! ' + txt + ' !!';
        offCtx.fillText(txt, W - margin, startY + (i - 4) * lw(12));
      }
      
      offCtx.restore();
    }
  }

  function draw(t = 0, captureToGallery = false, isAutoResize = false) {
    if (!isAutoResize) {
      state.hasGenerated = true;
    }
    const W = canvas.width, H = canvas.height;
    if (!state.hasGenerated) {
      const svgEl = document.getElementById('main-svg');
      if (svgEl) {
        svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svgEl.innerHTML = `<rect width="100%" height="100%" fill="${getBgColor()}" />`;
      }
      document.getElementById('canvas-seed').textContent = `SEMILLA: --------`;
      const footerSeedEl = document.getElementById('footer-seed');
      if (footerSeedEl) footerSeedEl.textContent = `SEMILLA: --------`;
      document.getElementById('canvas-elements').textContent = `ELEMENTOS: 0`;
      document.getElementById('canvas-sym').textContent = `SIMETRÍA: NINGUNA`;
      return;
    }
    state.elementCount = 0;
    seedRng(state.seed);

    // Sync scanlines opacity
    const scanlinesEl = document.querySelector('.canvas-scanlines');
    if (scanlinesEl) {
      if (state.scanlines) {
        const osc = (0.7 + 0.3 * Math.sin(t * 0.15)) * state.effectsIntensity;
        scanlinesEl.style.opacity = Math.max(0, Math.min(1.0, osc));
      } else {
        scanlinesEl.style.opacity = '';
      }
    }

    // Build composition guide for this seed — all draw modes use this
    comp = buildComposition(W, H);
    const cFactor = state.chaos / 30.0;

    const oldDensity = state.density;
    const oldComplexity = state.complexity;

    // Shift/bias values towards the minimums using a non-linear quadratic curve
    const biasedDensity = Math.round(Math.pow(oldDensity / 20, 1.8) * 20);
    const biasedComplexity = Math.round(Math.pow(oldComplexity / 40, 1.8) * 40);

    // Clear offscreen SvgContext (actual canvas size)
    offCanvas.width = W; offCanvas.height = H;
    offCtx.width = W; offCtx.height = H;
    offCtx.clearRect(0, 0, W, H);
    offCtx.fillStyle = getBgColor(); offCtx.fillRect(0, 0, W, H);

    function runDrawMode(time, isDetailPass = false) {
      switch (state.mode) {
        case 'vectorheart': drawVectorheart(time, isDetailPass); break;
        case 'circuit':     drawCircuit(time, isDetailPass); break;
        case 'hud':         drawHud(time, isDetailPass); break;
        case 'glitch':      drawGlitch(time, isDetailPass); break;
        case 'blueprint':   drawBlueprint(time, isDetailPass); break;
        case 'chaos':       drawChaos(time, isDetailPass); break;
        case 'flow':        drawFlow(time, isDetailPass); break;
        case 'sacred':      drawSacred(time, isDetailPass); break;
        case 'glyph':       drawGlyph(time, isDetailPass); break;
        case 'volumetric':  drawVolumetric(time, isDetailPass); break;
        case 'gundam':      drawGundam(time, isDetailPass); break;
        case 'evangelion':  drawEvangelion(time, isDetailPass); break;
      }
    }

    // Global base pass — moderate density, seeds the composition layer
    state.density = Math.floor(biasedDensity * 0.55);
    state.complexity = Math.floor(biasedComplexity * 0.55);
    seedRng(state.seed);
    drawGlobalScaffold(W, H, getColors());
    runDrawMode(t, false);

    // Detail passes — same canvas, layered on top, varying crop/position
    // Each pass uses a sub-region of the composition (translate + clip to a cell)
    const passCap = state.animating ? drawPerf.maxPasses : 4;
    const numPasses = Math.min(Math.floor(biasedDensity * 0.3) + Math.floor(biasedComplexity * 0.3), passCap);
    for (let i = 0; i < numPasses; i++) {
      offCtx.save();
      seedRng(state.seed + i + 1);

      // Each detail pass covers a portion of the canvas (0.35–0.75 of W/H)
      // and is offset randomly — creates layered density without virtual space
      const cellW = W * rngRange(0.35, 0.75);
      const cellH = H * rngRange(0.35, 0.75);
      // Scale translation offset by cFactor so detail passes snap to exact anchors when Chaos = 0
      const ox = rngRange(-cellW * 0.3, W - cellW * 0.7) * cFactor;
      const oy = rngRange(-cellH * 0.3, H - cellH * 0.7) * cFactor;

      offCtx.translate(ox, oy);
      offCanvas.width = cellW; offCanvas.height = cellH;
      offCtx.width = cellW; offCtx.height = cellH;

      state.density = Math.min(100, Math.floor(biasedDensity * 0.7));
      state.complexity = Math.min(100, Math.floor(biasedComplexity * 0.7));

      runDrawMode(t, true);
      offCtx.restore();
    }

    // Restore to actual canvas dimensions
    offCanvas.width = W; offCanvas.height = H;
    offCtx.width = W; offCtx.height = H;
    state.density = oldDensity;
    state.complexity = oldComplexity;

    // Post-processing
    applySymmetry(W, H);
    applyGrain(W, H);
    applyVignette(W, H);
    applyBorder(W, H);

    // Inject generated SVG elements into our main SVG viewport container
    const svgEl = document.getElementById('main-svg');
    if (svgEl) {
      svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svgEl.style.cursor = 'default';
      
      // Dynamic noise film grain filter
      let grainFilter = '';
      if (state.grain) {
        const grainOpacity = (Math.max(10, state.chaos) * 0.00025 * state.effectsIntensity).toFixed(3);
        grainFilter = `
          <filter id="grain-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="${state.animating ? drawPerf.grainOctaves : 4}" result="noise" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${grainOpacity} 0" result="tintedNoise" />
            <feBlend mode="soft-light" in="SourceGraphic" in2="tintedNoise" />
          </filter>
        `;
      }
      
      // Dynamic chromatic aberration + glitch + static filter
      let fxFilter = '';
      if (state.chromatic || state.glitch || state.static) {
        fxFilter = `<filter id="dynamic-fx-filter" x="-20%" y="-20%" width="140%" height="140%">`;
        let currentIn = "SourceGraphic";
        
        if (state.glitch) {
          fxFilter += `
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.95" numOctaves="1" seed="${Math.floor(t * 73) % 9999}" result="glitchNoise" />
            <feColorMatrix type="matrix" in="glitchNoise" result="glitchCol" values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 99 0" />
            <feDisplacementMap in="${currentIn}" in2="glitchCol" scale="${(22 * state.effectsIntensity).toFixed(1)}" xChannelSelector="R" yChannelSelector="G" result="glitchDisplaced" />
          `;
          currentIn = "glitchDisplaced";
        }
        
        if (state.chromatic) {
          fxFilter += `
            <feOffset dx="${(3 * state.effectsIntensity).toFixed(2)}" dy="0" in="${currentIn}" result="redShift" />
            <feOffset dx="${(-3 * state.effectsIntensity).toFixed(2)}" dy="0" in="${currentIn}" result="blueShift" />
            <feColorMatrix type="matrix" in="redShift" result="redColor" values="
              1 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 ${(0.4 * state.effectsIntensity).toFixed(3)} 0" />
            <feColorMatrix type="matrix" in="blueShift" result="blueColor" values="
              0 0 0 0 0
              0 0 0 0 0
              0 0 1 0 0
              0 0 0 ${(0.4 * state.effectsIntensity).toFixed(3)} 0" />
            <feMerge result="chromaticMerged">
              <feMergeNode in="${currentIn}" />
              <feMergeNode in="redColor" />
              <feMergeNode in="blueColor" />
            </feMerge>
          `;
          currentIn = "chromaticMerged";
        }
        
        if (state.static) {
          fxFilter += `
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="${Math.floor(t * 137) % 9999}" result="staticNoise" />
            <feColorMatrix type="matrix" in="staticNoise" result="staticCol" values="
              0.33 0.33 0.33 0 0
              0.33 0.33 0.33 0 0
              0.33 0.33 0.33 0 0
              0 0 0 ${(0.08 * state.effectsIntensity).toFixed(3)} 0" />
            <feBlend mode="overlay" in="${currentIn}" in2="staticCol" result="staticBlended" />
          `;
          currentIn = "staticBlended";
        }
        fxFilter += `</filter>`;
      }
      
      // Vignette radial gradient definition
      const vignetteGrad = `
        <radialGradient id="vignette-grad" cx="50%" cy="50%" r="70%">
          <stop offset="40%" stop-color="black" stop-opacity="0" />
          <stop offset="100%" stop-color="black" stop-opacity="${(0.62 * state.effectsIntensity).toFixed(3)}" />
        </radialGradient>
      `;

      let customFontStyles = '';
      if (customFontDataUrls.length > 0) {
        customFontStyles = `
          <style type="text/css">
            ${customFontDataUrls.map(f => `
              @font-face {
                font-family: '${f.name}';
                src: url('${f.url}');
              }
            `).join('\n')}
          </style>
        `;
      }

      const textGradients = `
        <linearGradient id="grad-cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00ffff" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
        <linearGradient id="grad-neon-mint" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#39ff14" />
          <stop offset="100%" stop-color="#ffff00" />
        </linearGradient>
        <linearGradient id="grad-magenta-fade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff0044" />
          <stop offset="100%" stop-color="#e040fb" />
        </linearGradient>
        <linearGradient id="grad-golden-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffea00" />
          <stop offset="100%" stop-color="#ff9100" />
        </linearGradient>
        <linearGradient id="grad-blood-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff1744" />
          <stop offset="100%" stop-color="#500000" />
        </linearGradient>
        <linearGradient id="grad-cyber-sunset" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff6c00" />
          <stop offset="100%" stop-color="#ff007f" />
        </linearGradient>
        <linearGradient id="grad-toxic-waste" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ccff00" />
          <stop offset="100%" stop-color="#1b4d00" />
        </linearGradient>
        <linearGradient id="grad-deep-space" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#bd00ff" />
          <stop offset="100%" stop-color="#000033" />
        </linearGradient>
        <linearGradient id="grad-electric-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4b0082" />
          <stop offset="100%" stop-color="#00f0ff" />
        </linearGradient>
        <linearGradient id="grad-holo-foil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff99f0" />
          <stop offset="50%" stop-color="#a8ffed" />
          <stop offset="100%" stop-color="#f5fffa" />
        </linearGradient>
        <linearGradient id="grad-lava-lamp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff0000" />
          <stop offset="100%" stop-color="#ffaa00" />
        </linearGradient>
        <linearGradient id="grad-chrome-fade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8a9ba8" />
          <stop offset="50%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#486581" />
        </linearGradient>
        <linearGradient id="grad-carbon-metal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111111" />
          <stop offset="50%" stop-color="#333333" />
          <stop offset="100%" stop-color="#555555" />
        </linearGradient>
        <linearGradient id="grad-rainbow-fade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ff0000" />
          <stop offset="20%" stop-color="#ff00ff" />
          <stop offset="40%" stop-color="#0000ff" />
          <stop offset="60%" stop-color="#00ffff" />
          <stop offset="80%" stop-color="#00ff00" />
          <stop offset="100%" stop-color="#ffff00" />
        </linearGradient>
      `;

      const symmetryClipPaths = `
        <clipPath id="clip-symmetry-y"><rect x="0" y="0" width="${W/2}" height="${H}" /></clipPath>
        <clipPath id="clip-symmetry-x"><rect x="0" y="0" width="${W}" height="${H/2}" /></clipPath>
        <clipPath id="clip-symmetry-4way"><rect x="0" y="0" width="${W/2}" height="${H/2}" /></clipPath>
      `;

      // Collect all defs
      const allDefs = [
        vignetteGrad,
        grainFilter,
        fxFilter,
        textGradients,
        customFontStyles,
        symmetryClipPaths,
        ...offCtx.defs
      ].join('\n');

      // ── Partial DOM update ───────────────────────────────────────────────
      // Rebuild SVG skeleton only when structure changes (symmetry, effects,
      // grain, vignette, or canvas dimensions). Every frame only the inner
      // groups are updated, avoiding full HTML re-parse of defs + bg.
      const hasFx = state.chromatic || state.glitch || state.static;
      const needsRebuild = !svgEl._svgReady ||
        svgEl._lastSymmetry !== state.symmetry ||
        svgEl._lastHasFx    !== hasFx ||
        svgEl._lastGrain    !== !!state.grain ||
        svgEl._lastVignette !== !!state.vignette ||
        svgEl._lastW !== W  || svgEl._lastH !== H;

      if (needsRebuild) {
        const clipAttr =
          state.symmetry === 'mirror-y' ? 'clip-path="url(#clip-symmetry-y)"' :
          state.symmetry === 'mirror-x' ? 'clip-path="url(#clip-symmetry-x)"' :
          state.symmetry === '4way'     ? 'clip-path="url(#clip-symmetry-4way)"' : '';

        svgEl.innerHTML = `
          <defs id="svg-defs"></defs>
          <rect id="svg-bg" width="100%" height="100%" />
          <g id="render-group">
            <g id="prev-frame" opacity="0"></g>
            <g id="current-frame">
              <g id="scene-content" ${clipAttr}></g>
              <g id="symmetry-group"></g>
              <g id="overlay-group"></g>
            </g>
          </g>
          ${state.vignette ? '<rect id="svg-vignette" width="100%" height="100%" fill="url(#vignette-grad)" pointer-events="none" />' : ''}
        `;
        svgEl._svgReady   = true;
        svgEl._lastSymmetry = state.symmetry;
        svgEl._lastHasFx    = hasFx;
        svgEl._lastGrain    = !!state.grain;
        svgEl._lastVignette = !!state.vignette;
        svgEl._lastW = W; svgEl._lastH = H;
      }

      // Update per-frame attributes and content
      const filterAttrVal        = state.grain ? 'url(#grain-filter)' : '';
      const currentFilterAttrVal = hasFx ? 'url(#dynamic-fx-filter)' : '';

      svgEl.querySelector('#svg-defs').innerHTML = allDefs;
      svgEl.querySelector('#svg-bg').setAttribute('fill', getBgColor());
      svgEl.querySelector('#render-group').setAttribute('filter', filterAttrVal);
      svgEl.querySelector('#current-frame').setAttribute('filter', currentFilterAttrVal);

      // Build symmetry markup
      let symmetryMarkup = '';
      if (state.symmetry === 'mirror-y') {
        symmetryMarkup = `<use href="#scene-content" transform="translate(${W}, 0) scale(-1, 1)" opacity="1.0" />`;
      } else if (state.symmetry === 'mirror-x') {
        symmetryMarkup = `<use href="#scene-content" transform="translate(0, ${H}) scale(1, -1)" opacity="1.0" />`;
      } else if (state.symmetry === '4way') {
        symmetryMarkup = `<use href="#scene-content" transform="translate(${W}, 0) scale(-1, 1)" opacity="1.0" />
          <use href="#scene-content" transform="translate(0, ${H}) scale(1, -1)" opacity="1.0" />
          <use href="#scene-content" transform="translate(${W}, ${H}) scale(-1, -1)" opacity="1.0" />`;
      }

      // Update drawing groups (only these change every frame)
      svgEl.querySelector('#scene-content').innerHTML    = offCtx.elements.join('\n');
      svgEl.querySelector('#symmetry-group').innerHTML   = symmetryMarkup;
      svgEl.querySelector('#overlay-group').innerHTML    = offCtx.overlayElements.join('\n');

      // Prev-frame fade
      const prevFrameEl = svgEl.querySelector('#prev-frame');
      if (prevSvgContent && fadeAlpha > 0) {
        prevFrameEl.setAttribute('opacity', fadeAlpha.toFixed(3));
        prevFrameEl.innerHTML = `
          <g id="prev-scene-content">${prevSvgContent.scene}</g>
          <g id="prev-symmetry-group">${prevSvgContent.symmetry}</g>
          ${prevSvgContent.overlay ? `<g id="prev-overlay-group">${prevSvgContent.overlay}</g>` : ''}
        `;
      } else {
        prevFrameEl.setAttribute('opacity', '0');
        if (prevFrameEl.innerHTML !== '') prevFrameEl.innerHTML = '';
      }

      syncLiveOutputFrame();
    }

    // Info bar
    let symTxt = 'NINGUNA';
    if (state.symmetry === 'mirror-y') symTxt = 'ESPEJO Y';
    else if (state.symmetry === 'mirror-x') symTxt = 'ESPEJO X';
    else if (state.symmetry === '4way') symTxt = '4 DIRECCIONES';

    const seedStr = state.seed.toString().padStart(8, '0');
    document.getElementById('canvas-seed').textContent = `SEMILLA: ${seedStr}`;
    const footerSeedEl = document.getElementById('footer-seed');
    if (footerSeedEl) footerSeedEl.textContent = `SEMILLA: ${seedStr}`;
    document.getElementById('canvas-elements').textContent = `ELEMENTOS: ${state.elementCount}`;
    document.getElementById('canvas-sym').textContent = `SIMETRÍA: ${symTxt}`;

    if (captureToGallery) setTimeout(captureThumb, 0);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  GALLERY
  // ─────────────────────────────────────────────────────────────────────────

  const gallery = [];
  const MAX_GALLERY = 10;

  function captureThumb() {
    const svgEl = document.getElementById('main-svg');
    if (!svgEl) return;

    const svgString = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const tc = document.createElement('canvas');
      tc.width = 120; tc.height = 68;
      const tcCtx = tc.getContext('2d');
      tcCtx.fillStyle = getBgColor();
      tcCtx.fillRect(0, 0, 120, 68);
      tcCtx.drawImage(image, 0, 0, 120, 68);

      gallery.unshift({ seed: state.seed, dataUrl: tc.toDataURL('image/jpeg', 0.65), mode: state.mode, palette: state.palette });
      if (gallery.length > MAX_GALLERY) gallery.pop();
      renderGallery();

      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  }

  function renderGallery() {
    const strip = document.getElementById('gallery-strip');
    strip.innerHTML = '';
    if (gallery.length === 0) { strip.innerHTML = '<div class="gallery-empty">— genera un diseño para comenzar —</div>'; return; }
    gallery.forEach((item, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'gallery-thumb-wrap';
      const img = document.createElement('img');
      img.src = item.dataUrl; img.className = 'gallery-thumb' + (i === 0 ? ' active' : '');
      img.title = `${item.mode.toUpperCase()} · ${item.palette.toUpperCase()} · SEMILLA ${item.seed}`;
      img.addEventListener('click', () => {
        setSeedValue(item.seed, { syncInput: true, syncBase: true });
        state.mode = item.mode;
        state.palette = item.palette;
        const PALETTES = ['mono', 'cyber', 'neon', 'blood', 'ice', 'gold', 'vaporwave', 'matrix', 'rust', 'gundam', 'evangelion'];
        animBases.paletteIdx = PALETTES.indexOf(state.palette);
        if (animBases.paletteIdx === -1) animBases.paletteIdx = 0;
        const modeSelect = document.getElementById('mode-select');
        if (modeSelect) modeSelect.value = state.mode;
        document.querySelectorAll('.palette-btn').forEach(b => b.classList.toggle('active', b.dataset.palette === state.palette));
        document.getElementById('mode-badge').textContent = `MODO::${state.mode.toUpperCase()}`;
        document.getElementById('footer-info').textContent = `SEMILLA RESTAURADA ${state.seed}`;
        document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        img.classList.add('active');
        draw();
      });
      const label = document.createElement('div');
      label.className = 'gallery-thumb-label';
      label.textContent = `${item.mode.toUpperCase()} · ${item.palette.slice(0,4).toUpperCase()}`;
      wrap.appendChild(img); wrap.appendChild(label);
      strip.appendChild(wrap);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  FADE TRANSITION
  // ─────────────────────────────────────────────────────────────────────────

  let prevSvgContent = null;
  let fadeAlpha = 0, fadeStartTime = 0, fadeDurationMs = 500;

  function normalizeSeed(seed) {
    const n = Number(seed);
    if (!Number.isFinite(n)) return 0;
    return Math.floor(Math.abs(n)) % 99999999;
  }

  function setSeedValue(nextSeed, options = {}) {
    const { syncInput = true, syncBase = true } = options;
    const normalized = normalizeSeed(nextSeed);
    state.seed = normalized;
    if (syncBase) animBases.seed = normalized;
    if (syncInput) {
      const seedInput = document.getElementById('seed-input');
      if (seedInput) seedInput.value = String(normalized);
    }
    return normalized;
  }

  // Fade is always on during animation — slider controls duration
  // fadeDuration: 1 = fast (200ms), 10 = slow (2000ms)
  function triggerFade(newSeed) {
    const scene = document.getElementById('scene-content');
    const symGroup = document.getElementById('symmetry-group');
    const overlay = document.getElementById('overlay-group');
    if (scene && symGroup) {
      prevSvgContent = {
        scene: scene.innerHTML,
        symmetry: symGroup.innerHTML,
        overlay: overlay ? overlay.innerHTML : ''
      };
    }
    setSeedValue(newSeed, { syncInput: true, syncBase: true });
    draw(state.animTime);
    fadeAlpha = 1;
    fadeStartTime = performance.now();
    fadeDurationMs = 100 + state.fadeDuration * 190; // 290ms .. 2000ms
  }

  function applyFadeOverlay(timestamp) {
    if (!prevSvgContent) return;
    const elapsed = timestamp - fadeStartTime;
    fadeAlpha = Math.max(0, 1 - elapsed / fadeDurationMs);
    if (fadeAlpha <= 0) {
      prevSvgContent = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  VIDEO RECORDING
  // ─────────────────────────────────────────────────────────────────────────

  const recordingState = {
    isRecording: false,
    recorder: null,
    recordedBlobs: [],
    canvas: null,
    ctx: null,
    startTime: 0,
    duration: 10,
    mimeType: 'video/webm',
    extension: 'webm',
    includeAudio: false,
    audioDestNode: null,
    audioCompressor: null,
    audioNormGain: null
  };

  const liveOutputState = {
    popup: null,
    closeWatch: null,
    lastSvg: '',
    lastViewBox: '',
    lastSyncAt: 0
  };

  function updateLiveOutputButton() {
    const btn = document.getElementById('btn-live-output');
    if (!btn) return;
    const isOpen = !!(liveOutputState.popup && !liveOutputState.popup.closed);
    btn.classList.toggle('active', isOpen);
    btn.innerHTML = isOpen ? '<span>■</span>LIVE ON' : '<span>▣</span>LIVE';
    btn.title = isOpen ? 'Cerrar salida LIVE' : 'Abrir salida LIVE en otra pantalla';
  }

  function teardownLiveOutput(closePopup = false) {
    if (liveOutputState.closeWatch) {
      clearInterval(liveOutputState.closeWatch);
      liveOutputState.closeWatch = null;
    }
    if (closePopup && liveOutputState.popup && !liveOutputState.popup.closed) {
      try { liveOutputState.popup.close(); } catch (e) {}
    }
    liveOutputState.popup = null;
    liveOutputState.lastSvg = '';
    liveOutputState.lastViewBox = '';
    liveOutputState.lastSyncAt = 0;
    updateLiveOutputButton();
  }

  async function getLiveOutputWindowFeatures() {
    let left = window.screenX || 0;
    let top = window.screenY || 0;
    let width = window.screen.availWidth || 1280;
    let height = window.screen.availHeight || 720;

    if (typeof window.getScreenDetails === 'function') {
      try {
        const details = await window.getScreenDetails();
        const targetScreen = details.screens.find(scr => scr !== details.currentScreen) || details.screens[0];
        if (targetScreen) {
          left = targetScreen.availLeft ?? targetScreen.left ?? left;
          top = targetScreen.availTop ?? targetScreen.top ?? top;
          width = targetScreen.availWidth ?? targetScreen.width ?? width;
          height = targetScreen.availHeight ?? targetScreen.height ?? height;
        }
      } catch (e) {
        // Fall back to the current screen when window-placement permission isn't available.
      }
    }

    return `popup=yes,left=${Math.round(left)},top=${Math.round(top)},width=${Math.round(width)},height=${Math.round(height)},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`;
  }

  function syncLiveOutputFrame(force = false) {
    const popup = liveOutputState.popup;
    if (!popup || popup.closed) {
      teardownLiveOutput(false);
      return false;
    }

    const now = performance.now();
    const isFullscreen = !!popup.document.fullscreenElement;
    const minInterval = isFullscreen ? 75 : 16;
    if (!force && now - liveOutputState.lastSyncAt < minInterval) {
      return true;
    }

    const liveStage = popup.document.getElementById('live-stage');
    if (!liveStage) return false;

    const svgEl = document.getElementById('main-svg');
    if (!svgEl) return false;

    const viewBox = svgEl.getAttribute('viewBox') || '';
    const svgMarkup = svgEl.innerHTML;
    if (force || svgMarkup !== liveOutputState.lastSvg || viewBox !== liveOutputState.lastViewBox) {
      liveStage.innerHTML = `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${svgMarkup}</svg>`;
      const mirroredSvg = liveStage.firstElementChild;
      if (mirroredSvg) {
        mirroredSvg.style.width = '100vw';
        mirroredSvg.style.height = '100vh';
        mirroredSvg.style.display = 'block';
        mirroredSvg.style.background = '#000';
      }
      liveOutputState.lastSvg = svgMarkup;
      liveOutputState.lastViewBox = viewBox;
      liveOutputState.lastSyncAt = now;
    }

    const titleEl = popup.document.getElementById('live-title');
    if (titleEl) titleEl.textContent = `HEARTFLASH LIVE :: ${state.seed}`;

    updateLiveOutputButton();
    document.getElementById('footer-info').textContent = 'LIVE::SALIDA EXTERNA ACTIVA';
    return true;
  }

  async function toggleLiveOutput() {
    if (liveOutputState.popup && !liveOutputState.popup.closed) {
      teardownLiveOutput(true);
      document.getElementById('footer-info').textContent = 'LIVE::SALIDA CERRADA';
      return;
    }

    const features = await getLiveOutputWindowFeatures();
    const popup = window.open('live-view.html', 'heartflash-live', features);
    if (!popup) {
      document.getElementById('footer-info').textContent = 'LIVE::POPUP BLOQUEADO';
      return;
    }

    liveOutputState.popup = popup;
    updateLiveOutputButton();

    const tryAttach = () => {
      if (syncLiveOutputFrame(true)) return;
      setTimeout(tryAttach, 120);
    };

    if (popup.document && popup.document.readyState === 'complete') {
      tryAttach();
    } else {
      popup.addEventListener('load', tryAttach, { once: true });
    }

    if (liveOutputState.closeWatch) clearInterval(liveOutputState.closeWatch);
    liveOutputState.closeWatch = setInterval(() => {
      if (!liveOutputState.popup || liveOutputState.popup.closed) {
        teardownLiveOutput(false);
      }
    }, 1000);
  }

  function captureRecordingFrame() {
    if (!recordingState.isRecording || !recordingState.ctx) return;
    const svgEl = document.getElementById('main-svg');
    if (!svgEl) return;

    const w = recordingState.canvas.width;
    const h = recordingState.canvas.height;

    // Set width and height attributes on the SVG to matches output dimensions
    const oldW = svgEl.getAttribute('width');
    const oldH = svgEl.getAttribute('height');
    svgEl.setAttribute('width', w);
    svgEl.setAttribute('height', h);

    const svgString = new XMLSerializer().serializeToString(svgEl);

    // Restore attributes
    if (oldW !== null) svgEl.setAttribute('width', oldW); else svgEl.removeAttribute('width');
    if (oldH !== null) svgEl.setAttribute('height', oldH); else svgEl.removeAttribute('height');

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      recordingState.ctx.fillStyle = getBgColor();
      recordingState.ctx.fillRect(0, 0, w, h);
      recordingState.ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function startVideoRecording() {
    if (recordingState.isRecording) return;

    const svgEl = document.getElementById('main-svg');
    if (!svgEl) return;

    const durSelect = document.getElementById('record-duration-select');
    recordingState.duration = parseInt(durSelect ? durSelect.value : '10') || 10;

    // Resolution from select
    const resSelect = document.getElementById('record-resolution-select');
    const resMap = { '720': [1280, 720], '1080': [1920, 1080], '2k': [2560, 1440], '4k': [3840, 2160] };
    const [recW, recH] = resMap[resSelect ? resSelect.value : '1080'] || [1920, 1080];

    if (!recordingState.canvas) {
      recordingState.canvas = document.createElement('canvas');
    }
    recordingState.canvas.width = recW;
    recordingState.canvas.height = recH;
    recordingState.ctx = recordingState.canvas.getContext('2d');

    const stream = recordingState.canvas.captureStream(30); // 30 FPS
    recordingState.includeAudio = false;
    recordingState.audioDestNode = null;
    recordingState.audioCompressor = null;
    recordingState.audioNormGain = null;

    // Add normalized audio track only when AUDIO RX is explicitly ON.
    const hasAudioRxOn = !!(state.audioRx.enabled && state.audioRx.ready &&
      audioRxRuntime.ctx && audioRxRuntime.sourceNode);
    if (hasAudioRxOn) {
      try {
        const ctx = audioRxRuntime.ctx;

        // Dynamics compressor: gain-rides the signal so quiet audio comes up
        // and peaks never clip
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18;  // dB — start compressing here
        comp.knee.value       = 20;  // dB — soft knee
        comp.ratio.value      = 12;  // 12:1 — strong normalization
        comp.attack.value     = 0.003; // 3 ms
        comp.release.value    = 0.25;  // 250 ms

        // Makeup gain after compression
        const gain = ctx.createGain();
        gain.gain.value = 2.0;

        recordingState.audioDestNode    = ctx.createMediaStreamDestination();
        recordingState.audioCompressor  = comp;
        recordingState.audioNormGain    = gain;

        audioRxRuntime.sourceNode.connect(comp);
        comp.connect(gain);
        gain.connect(recordingState.audioDestNode);

        recordingState.audioDestNode.stream.getAudioTracks().forEach(t => stream.addTrack(t));
        recordingState.includeAudio = true;
      } catch(e) {
        console.warn('No se pudo agregar audio a la grabación:', e);
        recordingState.audioDestNode   = null;
        recordingState.audioCompressor = null;
        recordingState.audioNormGain   = null;
        recordingState.includeAudio    = false;
      }
    } else {
      // Defensive: make sure the recording stream remains silent when AUDIO RX is OFF.
      stream.getAudioTracks().forEach(t => stream.removeTrack(t));
    }

    const candidates = [
      { mime: 'video/x-matroska;codecs=avc1', ext: 'mkv' },
      { mime: 'video/x-matroska;codecs=h264', ext: 'mkv' },
      { mime: 'video/x-matroska;codecs=vp9', ext: 'mkv' },
      { mime: 'video/x-matroska', ext: 'mkv' },
      { mime: 'video/mp4;codecs=h264', ext: 'mp4' },
      { mime: 'video/mp4', ext: 'mp4' },
      { mime: 'video/webm;codecs=vp9', ext: 'webm' },
      { mime: 'video/webm;codecs=vp8', ext: 'webm' },
      { mime: 'video/webm', ext: 'webm' }
    ];

    recordingState.mimeType = 'video/webm';
    recordingState.extension = 'webm';

    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate.mime)) {
        recordingState.mimeType = candidate.mime;
        recordingState.extension = candidate.ext;
        break;
      }
    }

    // Force high bitrate (20 Mbps) for high quality recording
    const options = { 
      mimeType: recordingState.mimeType,
      videoBitsPerSecond: 20000000,
      ...(recordingState.includeAudio ? { audioBitsPerSecond: 192000 } : {})
    };

    recordingState.recordedBlobs = [];
    try {
      recordingState.recorder = new MediaRecorder(stream, options);
    } catch (e) {
      // Fallback without mimeType option
      try {
        recordingState.recorder = new MediaRecorder(stream, { videoBitsPerSecond: 20000000 });
        recordingState.mimeType = recordingState.recorder.mimeType || 'video/webm';
        recordingState.extension = recordingState.mimeType.includes('mp4') ? 'mp4' : 'webm';
      } catch (err) {
        alert('Tu navegador no soporta la grabación de video.');
        return;
      }
    }

    recordingState.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordingState.recordedBlobs.push(e.data);
      }
    };

    recordingState.recorder.onstop = () => {
      // Disconnect audio processing chain
      if (recordingState.includeAudio && recordingState.audioDestNode) {
        try { audioRxRuntime.sourceNode?.disconnect(recordingState.audioCompressor); } catch(e) {}
        try { recordingState.audioCompressor?.disconnect(); } catch(e) {}
        try { recordingState.audioNormGain?.disconnect(); } catch(e) {}
      }
      recordingState.audioDestNode   = null;
      recordingState.audioCompressor = null;
      recordingState.audioNormGain   = null;
      recordingState.includeAudio    = false;
      const blob = new Blob(recordingState.recordedBlobs, { type: recordingState.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vectorheart_${state.mode}_${state.seed}_anim.${recordingState.extension}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 150);

      recordingState.isRecording = false;

      const btn = document.getElementById('btn-record-video');
      const stopBtn = document.getElementById('btn-stop-recording');
      if (stopBtn) stopBtn.style.display = 'none';
      if (btn) {
        btn.classList.remove('recording');
        btn.innerHTML = '<span>●</span> GRABAR VIDEO';
        btn.style.borderColor = '#f04';
        btn.style.color = '#f04';
      }
      document.getElementById('footer-info').textContent = 'GRABACIÓN FINALIZADA — DESCARGADO';
    };

    if (!state.animating) {
      startAnimation();
    }

    recordingState.isRecording = true;
    recordingState.startTime = performance.now();
    recordingState.recorder.start();

    const btn = document.getElementById('btn-record-video');
    const stopBtn = document.getElementById('btn-stop-recording');
    if (btn) {
      btn.classList.add('recording');
      btn.style.borderColor = '';
      btn.style.color = '';
    }
    if (stopBtn) stopBtn.style.display = '';
    document.getElementById('footer-info').textContent = recordingState.includeAudio
      ? 'GRABACIÓN::VIDEO + AUDIO RX'
      : 'GRABACIÓN::VIDEO SIN AUDIO (AUDIO RX OFF)';

    const updateUI = () => {
      if (!recordingState.isRecording) return;
      const elapsed = (performance.now() - recordingState.startTime) / 1000;
      if (btn) {
        btn.innerHTML = `<span>●</span> GRABANDO [${elapsed.toFixed(1)}s / ${recordingState.duration}s]`;
      }
      if (elapsed >= recordingState.duration) {
        if (btn) btn.innerHTML = `<span>●</span> PROCESANDO...`;
        setTimeout(() => {
          if (recordingState.recorder && recordingState.recorder.state !== 'inactive') {
            recordingState.recorder.stop();
          }
        }, 500);
      } else {
        requestAnimationFrame(updateUI);
      }
    };
    requestAnimationFrame(updateUI);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  ANIMATION LOOP
  // ─────────────────────────────────────────────────────────────────────────

  function updateDrawPerf(currentFps) {
    // state.fps is already a smoothed rolling average — no second layer needed.
    // Fast drop response: if fps is well below current tier, adapt immediately.
    const avg = currentFps;
    if      (avg >= 57) { drawPerf.maxPasses = 4; drawPerf.elementBudget = 1500; drawPerf.pathBudget = 8000;  drawPerf.grainOctaves = 4; }
    else if (avg >= 54) { drawPerf.maxPasses = 3; drawPerf.elementBudget = 1200; drawPerf.pathBudget = 5000;  drawPerf.grainOctaves = 3; }
    else if (avg >= 48) { drawPerf.maxPasses = 2; drawPerf.elementBudget = 900;  drawPerf.pathBudget = 2500;  drawPerf.grainOctaves = 2; }
    else if (avg >= 38) { drawPerf.maxPasses = 1; drawPerf.elementBudget = 550;  drawPerf.pathBudget = 1500;  drawPerf.grainOctaves = 1; }
    else                { drawPerf.maxPasses = 0; drawPerf.elementBudget = 300;  drawPerf.pathBudget = 700;   drawPerf.grainOctaves = 1; }
  }

  function animLoop(timestamp) {
    if (!state.animating) return;

    // Helper for generating different wave shapes
    const getWaveValue = (time, speedFactor, offset, type) => {
      const x = time * speedFactor + offset;
      let p = (x / (2 * Math.PI)) % 1.0;
      if (p < 0) p += 1.0;

      switch (type) {
        case 'triangle':
          if (p < 0.25) return p * 4;
          if (p < 0.75) return 2 - p * 4;
          return p * 4 - 4;
        case 'sawtooth':
          return 2 * p - 1;
        case 'sawtooth-rev':
          return 1 - 2 * p;
        case 'square':
          return p < 0.5 ? 1 : -1;
        case 'random': {
          const cycle = Math.floor(x / (2 * Math.PI));
          const seed = cycle + Math.sin(offset) * 1000;
          const hash = Math.sin(seed) * 10000;
          return (hash - Math.floor(hash)) * 2 - 1;
        }
        case 'sine':
        default:
          return Math.sin(x);
      }
    };

    const delta = timestamp - state.lastFrameTime;
    if (delta > 0) state.fps = Math.round(1000 / delta * 0.25 + state.fps * 0.75);
    const fpsEl = document.getElementById('fps-counter');
    fpsEl.textContent = `${state.fps} FPS`;
    fpsEl.dataset.passes = drawPerf.maxPasses;
    fpsEl.dataset.elBudget = drawPerf.elementBudget;
    state.lastFrameTime = timestamp;
    const baseLfoRates = state.lfos.map(lfo => Math.max(1, Math.min(160, lfo.rate)));
    const preLfoVals = baseLfoRates.map((rate, i) =>
      getWaveValue(state.animTime, rate / 15, i * Math.PI * 0.666, state.lfos[i].wave)
    );
    const preLowDrive = Math.max(0, Math.min(1, state.audioRx.lowLevel)) * (state.audioRx.lowAmount / 100);
    const preMidDrive = Math.max(0, Math.min(1, state.audioRx.midLevel)) * (state.audioRx.midAmount / 100);
    const preHighDrive = Math.max(0, Math.min(1, state.audioRx.highLevel)) * (state.audioRx.highAmount / 100);
    const preBandVals = state.audioRx.enabled && state.audioRx.ready ? [preLowDrive, preMidDrive, preHighDrive] : [0, 0, 0];
    const preSourceVals = [...preLfoVals, ...preBandVals];

    const LFO_RATE_DEST_KEYS = ['lfo1Rate', 'lfo2Rate', 'lfo3Rate'];
    const effectiveRates = baseLfoRates.map((baseRate, targetIdx) => {
      const depths = state.patches[LFO_RATE_DEST_KEYS[targetIdx]];
      if (!depths || depths.every(v => v === null)) return baseRate;
      const modSum = depths.reduce((sum, depth, srcIdx) =>
        depth !== null ? sum + (preSourceVals[srcIdx] || 0) * (depth / 100) : sum, 0);
      return Math.max(1, Math.min(160, baseRate + modSum * 45));
    });

    state.liveLfoRates = effectiveRates;
    const avgLfoRate = (effectiveRates[0] + effectiveRates[1] + effectiveRates[2]) / 3;
    state.currentAnimSpeed = avgLfoRate;
    const speedBucket = Math.round(avgLfoRate * 4) / 4;
    if (state.lfoUiSpeedBucket !== speedBucket) {
      state.lfoUiSpeedBucket = speedBucket;
      [0, 1, 2].forEach(updateLfoJackStyle);
    }
    state.animTime += 0.016 * (avgLfoRate / 15);
    sampleAudioReactiveLevel();

    // Smooth modulation with deterministic LFOs (no animation chaos jitter)

    // ── Eurorack LFO modulation ──────────────────────────────────────────
    const lfoVals = state.lfos.map((lfo, i) =>
      getWaveValue(state.animTime, getEffectiveLfoRate(lfo.rate, i) / 15, i * Math.PI * 0.666, lfo.wave)
    );
    const lowDrive = Math.max(0, Math.min(1, state.audioRx.lowLevel)) * (state.audioRx.lowAmount / 100);
    const midDrive = Math.max(0, Math.min(1, state.audioRx.midLevel)) * (state.audioRx.midAmount / 100);
    const highDrive = Math.max(0, Math.min(1, state.audioRx.highLevel)) * (state.audioRx.highAmount / 100);
    const bandVals = state.audioRx.enabled && state.audioRx.ready ? [lowDrive, midDrive, highDrive] : [0, 0, 0];
    const sourceVals = [...lfoVals, ...bandVals];

    function getDestMod(destKey) {
      const blockKey = getDestBlockKey(destKey);
      return state.patches[destKey].reduce((sum, depth, i) =>
        depth !== null ? sum + (sourceVals[i] || 0) * (depth / 100) : sum, 0);
    }

    // Continuous destinations
    const CONT_DESTS = [
      { key: 'detail',        stateKey: 'detail',          base: 'detail',          range: 50, min: 0, max: 100, uiId: 'detail-val' },
      { key: 'weight',        stateKey: 'weight',           base: 'weight',          range: 50, min: 1, max: 100, uiId: 'weight-val' },
      { key: 'chaos',         stateKey: 'chaos',            base: 'chaos',           range: 50, min: 1, max: 100, uiId: 'chaos-val' },
      { key: 'text',          stateKey: 'textAmount',       base: 'textAmount',      range: 50, min: 0, max: 100, uiId: 'text-val' },
      { key: 'customDensity', stateKey: 'customTextAmount', base: 'customTextAmount', range: 50, min: 0, max: 100, uiId: 'custom-text-density-val' },
      { key: 'customSize',    stateKey: 'customTextSize',   base: 'customTextSize',   range: 73, min: 4, max: 150, uiId: 'custom-text-size-val' },
    ];
    for (const d of CONT_DESTS) {
      if (state.patches[d.key].every(v => v === null)) continue;
      const mod = getDestMod(d.key);
      const nextVal = Math.round(Math.max(d.min, Math.min(d.max, animBases[d.base] + d.range * mod)));
      state[d.stateKey] = nextVal;
      document.getElementById(d.uiId).textContent = nextVal;
    }
    if (state.patches.detail.some(v => v !== null)) {
      state.complexity = Math.round(state.detail * 40 / 100);
      state.density    = Math.round(state.detail * 15 / 100);
    }
    if (state.patches.effects.some(v => v !== null)) {
      state.effectsIntensity = Math.max(0, Math.min(2.0, 1.0 + getDestMod('effects')));
    } else {
      state.effectsIntensity = 1.0;
    }



    const t01 = (state.currentAnimSpeed - 1) / 33;
    let intervalMs = Math.round(1000 * Math.pow(0.1, t01));

    const needsTimedChange = ['seed','palette','bg','mode'].some(k => state.patches[k].some(v => v !== null));
    if (needsTimedChange && (timestamp - state.lastSeedChange >= intervalMs)) {
      state.lastSeedChange = timestamp;
      
      if (state.patches.seed.some(v => v !== null)) {
        const mod = Math.abs(getDestMod('seed'));
        if (mod > 0 && Math.random() < mod) {
          const randomWaveDrive = state.patches.seed.reduce((sum, depth, srcIdx) => {
            if (depth === null || srcIdx >= LFO_SOURCE_COUNT) return sum;
            if (state.lfos[srcIdx].wave !== 'random') return sum;
            const contribution = Math.abs((sourceVals[srcIdx] || 0) * (depth / 100));
            return sum + contribution;
          }, 0);

          // Random-wave LFOs need larger seed jumps to avoid repetitive results.
          const baseStep = Math.max(1, Math.round(4 + mod * 22));
          let seedStep = baseStep;
          if (randomWaveDrive > 0.001) {
            const boosted = Math.round(4000 + Math.min(1, randomWaveDrive) * 82000);
            const jitter = Math.floor(Math.random() * Math.max(256, Math.round(boosted * 0.6)));
            seedStep = Math.max(seedStep, boosted + jitter);
          }

          setSeedValue(animBases.seed + seedStep, { syncInput: true, syncBase: true });
        }
      }
      if (state.patches.palette.some(v => v !== null)) {
        const PALETTES = ['mono', 'cyber', 'neon', 'blood', 'ice', 'gold', 'vaporwave', 'matrix', 'rust', 'gundam', 'evangelion'];
        const offset = Math.round(5 * getDestMod('palette'));
        let targetIdx = (animBases.paletteIdx + offset) % PALETTES.length;
        if (targetIdx < 0) targetIdx += PALETTES.length;
        state.palette = PALETTES[targetIdx];
        document.querySelectorAll('.palette-btn').forEach(b => b.classList.toggle('active', b.dataset.palette === state.palette));
      }
      if (state.patches.bg.some(v => v !== null)) {
        const BACKGROUNDS = ['light', 'dark', 'paper', 'black', 'midnight', 'sepia', 'violet', 'jade', 'wine', 'steel', 'copper', 'slate'];
        const offset = Math.round(2 * getDestMod('bg'));
        let targetIdx = (animBases.bgIdx + offset) % BACKGROUNDS.length;
        if (targetIdx < 0) targetIdx += BACKGROUNDS.length;
        state.bg = BACKGROUNDS[targetIdx];
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.toggle('active', b.dataset.bg === state.bg));
      }
      if (state.patches.mode.some(v => v !== null)) {
        const MODES = ['vectorheart','circuit','hud','glitch','blueprint','chaos','flow','sacred','glyph','volumetric','gundam','evangelion'];
        const offset = Math.round(5 * getDestMod('mode'));
        let targetIdx = (animBases.modeIdx + offset) % MODES.length;
        if (targetIdx < 0) targetIdx += MODES.length;
        state.mode = MODES[targetIdx];
        const modeSelect = document.getElementById('mode-select');
        if (modeSelect) modeSelect.value = state.mode;
        document.getElementById('mode-badge').textContent = `MODO::${state.mode.toUpperCase()}`;
      }
      
      triggerFade(state.seed);
    } else {
      if (prevSvgContent) applyFadeOverlay(timestamp);
      const _t0 = performance.now();
      draw(state.animTime);
      updateDrawPerf(state.fps);  // state.fps already reflects total frame time (JS + browser render)
    }

    if (recordingState.isRecording) {
      captureRecordingFrame();
    }

    state.animFrame = requestAnimationFrame(animLoop);
  }

  function startAnimation() {
    animBases.detail = state.detail;
    animBases.weight = state.weight;
    animBases.chaos = state.chaos;
    animBases.textAmount = state.textAmount;
    animBases.customTextAmount = state.customTextAmount;
    animBases.customTextSize = state.customTextSize;
    animBases.seed = state.seed;

    const PALETTES = ['mono', 'cyber', 'neon', 'blood', 'ice', 'gold', 'vaporwave', 'matrix', 'rust', 'gundam', 'evangelion', 'sunset', 'ocean', 'forest', 'nordic', 'sakura', 'lava', 'synthwave', 'toxic'];
    animBases.paletteIdx = PALETTES.indexOf(state.palette);
    if (animBases.paletteIdx === -1) animBases.paletteIdx = 0;

    const BACKGROUNDS = ['light', 'dark', 'paper', 'black', 'midnight', 'sepia', 'violet', 'jade', 'wine', 'steel', 'copper', 'slate'];
    animBases.bgIdx = BACKGROUNDS.indexOf(state.bg);
    if (animBases.bgIdx === -1) animBases.bgIdx = 0;

    const MODES = ['vectorheart','circuit','hud','glitch','blueprint','chaos','flow','sacred','glyph','volumetric','gundam','evangelion'];
    animBases.modeIdx = MODES.indexOf(state.mode);
    if (animBases.modeIdx === -1) animBases.modeIdx = 0;

    state.animating = true; state.lastFrameTime = performance.now();
    document.getElementById('status-dot').style.background = '#f04';
    document.getElementById('status-dot').style.boxShadow = '0 0 8px #f04';
    state.animFrame = requestAnimationFrame(animLoop);
  }

  function syncSlidersToState() {
    const sliders = [
      { id: 'detail-slider', valId: 'detail-val', key: 'detail' },
      { id: 'weight-slider', valId: 'weight-val', key: 'weight' },
      { id: 'chaos-slider', valId: 'chaos-val', key: 'chaos' },
      { id: 'text-slider', valId: 'text-val', key: 'textAmount' },
      { id: 'custom-text-density-slider', valId: 'custom-text-density-val', key: 'customTextAmount' },
      { id: 'custom-text-size-slider', valId: 'custom-text-size-val', key: 'customTextSize' }
    ];
    sliders.forEach(s => {
      const slider = document.getElementById(s.id);
      const valEl = document.getElementById(s.valId);
      if (slider) slider.value = state[s.key];
      if (valEl) valEl.textContent = state[s.key];
    });

    const audioSliders = [
      { id: 'audio-low-amount-slider', valId: 'audio-low-amount-val', key: 'lowAmount' },
      { id: 'audio-mid-amount-slider', valId: 'audio-mid-amount-val', key: 'midAmount' },
      { id: 'audio-high-amount-slider', valId: 'audio-high-amount-val', key: 'highAmount' },
    ];
    audioSliders.forEach(s => {
      const slider = document.getElementById(s.id);
      const valEl = document.getElementById(s.valId);
      if (slider) slider.value = state.audioRx[s.key];
      if (valEl) valEl.textContent = state.audioRx[s.key];
    });
  }

  function stopAnimation() {
    state.animating = false; if (state.animFrame) cancelAnimationFrame(state.animFrame);
    document.getElementById('status-dot').style.background = '';
    document.getElementById('status-dot').style.boxShadow = '';
    syncSlidersToState();
  }

  // ── INIT: reset to minimal default state ─────────────────────────────────
  function applyInitState() {
    // Parameters
    state.mode        = 'vectorheart';
    state.palette     = 'mono';
    state.bg          = 'dark';
    state.detail      = 20;
    state.weight      = 0;
    state.chaos       = 0;
    state.textAmount  = 0;
    state.density     = 3;
    state.complexity  = 5;
    state.customTextAmount = 0;
    state.customTextSize   = 20;
    state.symmetry    = 'none';
    state.vignette    = false;
    state.grain       = false;
    state.scanlines   = false;
    state.chromatic   = false;
    state.glitch      = false;
    state.static      = false;
    setSeedValue(Math.floor(Math.random() * 99999999), { syncInput: false, syncBase: true });

    // LFOs: slow defaults
    state.lfos[0] = { wave: 'sine',     rate: 8  };
    state.lfos[1] = { wave: 'triangle', rate: 6  };
    state.lfos[2] = { wave: 'square',   rate: 10 };
    state.liveLfoRates = [8, 6, 10];

    // Clear all patches
    Object.keys(state.patches).forEach(dest => {
      state.patches[dest] = state.patches[dest].map(() => null);
    });

    // Audio: stop if running, reset controls
    if (state.audioRx.enabled) disableAudioReactiveInput();
    state.audioRx.source     = 'mic';
    state.audioRx.masterSend = 100;
    state.audioRx.smooth     = 0.82;

    // Sync animBases
    const _PALS = ['mono','cyber','neon','blood','ice','gold','vaporwave','matrix','rust','gundam','evangelion','sunset','ocean','forest','nordic','sakura','lava','synthwave','toxic'];
    const _BGS  = ['light','dark','paper','black','midnight','sepia','violet','jade','wine','steel','copper','slate'];
    animBases.detail           = state.detail;
    animBases.weight           = state.weight;
    animBases.chaos            = state.chaos;
    animBases.textAmount       = state.textAmount;
    animBases.customTextAmount = state.customTextAmount;
    animBases.customTextSize   = state.customTextSize;
    animBases.paletteIdx       = _PALS.indexOf(state.palette);
    animBases.bgIdx            = _BGS.indexOf(state.bg);
    animBases.modeIdx          = 0;

    // Sync all UI
    syncSlidersToState();
    renderPatchBay();
    syncBlockLockUi();

    document.querySelectorAll('.palette-btn').forEach(b => b.classList.toggle('active', b.dataset.palette === state.palette));
    document.querySelectorAll('.bg-btn').forEach(b => b.classList.toggle('active', b.dataset.bg === state.bg));
    document.querySelectorAll('.sym-btn').forEach(b => b.classList.toggle('active', b.dataset.sym === state.symmetry));

    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) modeSelect.value = state.mode;
    const modeBadge = document.getElementById('mode-badge');
    if (modeBadge) modeBadge.textContent = `MODO::${state.mode.toUpperCase()}`;

    ['vignette','grain','scanlines','chromatic','glitch','static'].forEach(fx => {
      const el = document.getElementById(`fx-${fx}`);
      if (el) el.checked = false;
    });
    document.querySelector('.canvas-scanlines')?.classList.add('hidden');

    document.getElementById('seed-input').value = state.seed;

    // Sync LFO rate sliders and wave buttons
    [0, 1, 2].forEach(i => {
      const rateSlider = document.querySelector(`.lfo-rate-slider[data-lfo="${i}"]`);
      const rateVal    = document.querySelector(`.lfo-rate-val[data-lfo="${i}"]`);
      if (rateSlider) rateSlider.value = state.lfos[i].rate;
      if (rateVal)    rateVal.textContent = state.lfos[i].rate;
      document.querySelectorAll(`.lfo-wave-btn[data-lfo="${i}"]`).forEach(b =>
        b.classList.toggle('active', b.dataset.wave === state.lfos[i].wave)
      );
      updateLfoJackStyle(i);
    });

    // Audio UI
    const audioSrc = document.getElementById('audio-source-select');
    if (audioSrc) audioSrc.value = state.audioRx.source;
    const masterSlider = document.getElementById('audio-master-send-slider');
    const masterVal    = document.getElementById('audio-master-send-val');
    if (masterSlider) masterSlider.value = state.audioRx.masterSend;
    if (masterVal)    masterVal.textContent = state.audioRx.masterSend;
    const smoothSlider = document.getElementById('audio-smooth-slider');
    const smoothVal    = document.getElementById('audio-smooth-val');
    if (smoothSlider) smoothSlider.value = Math.round(state.audioRx.smooth * 100);
    if (smoothVal)    smoothVal.textContent = Math.round(state.audioRx.smooth * 100);
    updateAudioRxUi();

    document.getElementById('footer-info').textContent = 'INIT::ESTADO MÍNIMO';
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PRESETS
  // ─────────────────────────────────────────────────────────────────────────

  const PRESETS = {
    razorwire:  { mode:'vectorheart', palette:'mono',      bg:'dark',  complexity:9, density:8, weight:5, chaos:4, textAmount:6, symmetry:'none'     },
    ghostdata:  { mode:'circuit',     palette:'cyber',     bg:'black', complexity:7, density:9, weight:2, chaos:6, textAmount:8, symmetry:'none'     },
    warzone:    { mode:'glitch',      palette:'blood',     bg:'dark',  complexity:6, density:8, weight:4, chaos:9, textAmount:7, symmetry:'mirror-x'  },
    deepfreeze: { mode:'blueprint',   palette:'ice',       bg:'light', complexity:9, density:5, weight:1, chaos:2, textAmount:3, symmetry:'4way'     },
    cosmos:     { mode:'sacred',      palette:'vaporwave', bg:'black', complexity:9, density:6, weight:1, chaos:3, textAmount:2, symmetry:'none'     },
    anarchy:    { mode:'chaos',       palette:'neon',      bg:'dark',  complexity:10,density:10,weight:6, chaos:10,textAmount:5, symmetry:'none'     },
    flowstate:  { mode:'flow',        palette:'gold',      bg:'dark',  complexity:7, density:8, weight:2, chaos:5, textAmount:2, symmetry:'mirror-y' },
    sanctum:    { mode:'sacred',      palette:'ice',       bg:'dark',  complexity:8, density:4, weight:1, chaos:2, textAmount:1, symmetry:'4way'     },
    fedforces:  { mode:'gundam',      palette:'gundam',    bg:'black', complexity:8, density:7, weight:2, chaos:4, textAmount:8, symmetry:'none'     },
    nerv:       { mode:'evangelion',  palette:'evangelion',bg:'black', complexity:7, density:6, weight:2, chaos:5, textAmount:9, symmetry:'none'     },
  };

  function applyPreset(name) {
    const p = PRESETS[name]; if (!p) return;
    state.isBatchUpdating = true;
    Object.assign(state, p);

    // Compute combined detail value and map back to internal complexity/density
    state.detail = Math.round((p.complexity + p.density) * 5);
    state.complexity = Math.round(state.detail * 40 / 100);
    state.density = Math.round(state.detail * 15 / 100);

    // Sync animBases with the new preset values
    animBases.detail = state.detail;
    animBases.weight = state.weight;
    animBases.chaos = state.chaos;
    animBases.textAmount = state.textAmount;

    const PALETTES = ['mono', 'cyber', 'neon', 'blood', 'ice', 'gold', 'vaporwave', 'matrix', 'rust', 'gundam', 'evangelion', 'sunset', 'ocean', 'forest', 'nordic', 'sakura', 'lava', 'synthwave', 'toxic'];
    animBases.paletteIdx = PALETTES.indexOf(state.palette);
    if (animBases.paletteIdx === -1) animBases.paletteIdx = 0;

    const BACKGROUNDS = ['light', 'dark', 'paper', 'black', 'midnight', 'sepia', 'violet', 'jade', 'wine', 'steel', 'copper', 'slate'];
    animBases.bgIdx = BACKGROUNDS.indexOf(state.bg);
    if (animBases.bgIdx === -1) animBases.bgIdx = 0;

    const MODES = ['vectorheart','circuit','hud','glitch','blueprint','chaos','flow','sacred','glyph','volumetric','gundam','evangelion'];
    animBases.modeIdx = MODES.indexOf(state.mode);
    if (animBases.modeIdx === -1) animBases.modeIdx = 0;

    // Sync UI
    ['detail','weight','chaos','textAmount'].forEach(k => {
      const slider = document.getElementById(k === 'textAmount' ? 'text-slider' : k + '-slider');
      if (slider) { 
        slider.value = state[k]; 
        document.getElementById(slider.id.replace('-slider','-val')).textContent = state[k]; 
      }
    });
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) modeSelect.value = state.mode;

    // Sync custom color dropdown UI
    const selectedSquare = document.getElementById('selected-color-square');
    if (selectedSquare) {
      selectedSquare.className = `color-square ${state.customTextColor}-square`;
    }
    const colorItems = document.querySelectorAll('.color-dropdown-item');
    colorItems.forEach(i => i.classList.toggle('active', i.dataset.value === state.customTextColor));
    document.querySelectorAll('.palette-btn').forEach(b => b.classList.toggle('active', b.dataset.palette === state.palette));
    document.querySelectorAll('.bg-btn').forEach(b => b.classList.toggle('active', b.dataset.bg === state.bg));
    document.querySelectorAll('.sym-btn').forEach(b => b.classList.toggle('active', b.dataset.sym === state.symmetry));
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.toggle('active', b.dataset.preset === name));
    document.getElementById('mode-badge').textContent = `MODO::${state.mode.toUpperCase()}`;
    document.getElementById('footer-info').textContent = `PREAJUSTE::${name.toUpperCase()}`;
    state.isBatchUpdating = false;
    if (!state.animating) draw(0, true);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  EXPORT AND DOWNLOAD HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  function downloadSVG() {
    const svgEl = document.getElementById('main-svg');
    if (!svgEl) return;
    let svgString = new XMLSerializer().serializeToString(svgEl);
    if (!svgString.startsWith('<?xml')) {
      svgString = '<?xml version="1.0" standalone="no"?>\r\n' + svgString;
    }
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `vectorheart_${state.mode}_${state.seed}.svg`;
    link.href = blobURL;
    link.click();
    URL.revokeObjectURL(blobURL);
  }

  function downloadPNGAtSize(targetLabel) {
    const svgEl = document.getElementById('main-svg');
    if (!svgEl) return;
    
    let targetMax = 1920;
    if (targetLabel === '2k') targetMax = 2560;
    else if (targetLabel === '4k') targetMax = 3840;
    
    const canvasAspect = canvas.width / canvas.height;
    let W, H;
    if (canvas.width >= canvas.height) {
      W = targetMax;
      H = Math.round(targetMax / canvasAspect);
    } else {
      H = targetMax;
      W = Math.round(targetMax * canvasAspect);
    }
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = W;
    tempCanvas.height = H;
    
    // Set width and height attributes on the SVG to match output dimensions
    const oldW = svgEl.getAttribute('width');
    const oldH = svgEl.getAttribute('height');
    svgEl.setAttribute('width', W);
    svgEl.setAttribute('height', H);

    const svgString = new XMLSerializer().serializeToString(svgEl);

    // Restore attributes
    if (oldW !== null) svgEl.setAttribute('width', oldW); else svgEl.removeAttribute('width');
    if (oldH !== null) svgEl.setAttribute('height', oldH); else svgEl.removeAttribute('height');
    
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const tcCtx = tempCanvas.getContext('2d');
      tcCtx.fillStyle = getBgColor();
      tcCtx.fillRect(0, 0, W, H);
      tcCtx.drawImage(image, 0, 0, W, H);
      
      const link = document.createElement('a');
      link.download = `vectorheart_${state.mode}_${state.seed}_${targetLabel}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
      
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  USER PRESETS (SAVE / LOAD / EXPORT / IMPORT)
  // ─────────────────────────────────────────────────────────────────────────

  const USER_PRESETS_STORAGE_KEY = 'heartflash-user-presets-v1';
  const USER_PRESETS_SEEDED_KEY = 'heartflash-user-presets-seeded-v1';
  const PRESET_PALETTES = ['mono', 'cyber', 'neon', 'blood', 'ice', 'gold', 'vaporwave', 'matrix', 'rust', 'gundam', 'evangelion', 'sunset', 'ocean', 'forest', 'nordic', 'sakura', 'lava', 'synthwave', 'toxic'];
  const PRESET_BACKGROUNDS = ['light', 'dark', 'paper', 'black', 'midnight', 'sepia', 'violet', 'jade', 'wine', 'steel', 'copper', 'slate'];
  const PRESET_MODES = ['vectorheart', 'circuit', 'hud', 'glitch', 'blueprint', 'chaos', 'flow', 'sacred', 'glyph', 'volumetric', 'gundam', 'evangelion'];
  const PRESET_SYMMETRY = ['none', 'mirror-y', 'mirror-x', '4way'];

  function loadUserPresets() {
    try {
      const raw = localStorage.getItem(USER_PRESETS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveUserPresets(presets) {
    try {
      localStorage.setItem(USER_PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (_) {
      // Ignore localStorage failures.
    }
  }

  function normalizePresetName(name) {
    if (!name) return '';
    return String(name).trim().replace(/\s+/g, ' ').slice(0, 42);
  }

  function clonePatchState(sourcePatches) {
    const out = {};
    Object.keys(state.patches).forEach(dest => {
      const src = Array.isArray(sourcePatches?.[dest]) ? sourcePatches[dest] : state.patches[dest];
      out[dest] = [];
      for (let i = 0; i < MOD_SOURCE_COUNT; i++) {
        out[dest][i] = src[i] == null ? null : Math.max(0, Math.min(100, Number(src[i]) || 0));
      }
    });
    return out;
  }

  function makeEmptyPresetPatches() {
    const patches = {};
    Object.keys(state.patches).forEach(dest => {
      patches[dest] = new Array(MOD_SOURCE_COUNT).fill(null);
    });
    return patches;
  }

  function setPresetPatch(patches, dest, src, depth) {
    if (!patches[dest] || src < 0 || src >= MOD_SOURCE_COUNT) return;
    patches[dest][src] = Math.max(0, Math.min(100, Number(depth) || 0));
  }

  function createModePreset(config) {
    const patches = makeEmptyPresetPatches();
    (config.patchList || []).forEach(([dest, src, depth]) => setPresetPatch(patches, dest, src, depth));
    return {
      version: 1,
      app: 'heartflash',
      savedAt: 'preloaded',
      state: {
        mode: config.mode,
        palette: config.palette,
        bg: config.bg,
        detail: config.detail,
        weight: config.weight,
        chaos: config.chaos,
        textAmount: config.textAmount,
        customText: config.customText || '',
        customFont: config.customFont || "'Share Tech Mono', monospace",
        customFontWeight: config.customFontWeight || '400',
        customTextAmount: config.customTextAmount ?? 10,
        customTextSize: config.customTextSize ?? 24,
        customTextOpacity: config.customTextOpacity ?? 65,
        customTextColor: config.customTextColor || 'auto',
        symmetry: config.symmetry || 'none',
        vignette: !!config.vignette,
        grain: !!config.grain,
        scanlines: !!config.scanlines,
        chromatic: !!config.chromatic,
        glitch: !!config.glitch,
        static: !!config.static,
        fadeDuration: config.fadeDuration ?? 4,
        seed: config.seed ?? Math.floor(Math.random() * 99999999),
        lfos: config.lfos || [
          { wave: 'sine', rate: 10 },
          { wave: 'triangle', rate: 7 },
          { wave: 'square', rate: 12 },
        ],
        audioRx: {
          source: 'mic',
          deviceId: 'default',
          lowAmount: 55,
          midAmount: 45,
          highAmount: 35,
          masterSend: 100,
          smooth: 0.82,
        },
        patches,
        patchGroups: {
          core: true,
          scene: true,
          lfo: true,
        },
      }
    };
  }

  function buildPreloadedModePresets() {
    return {
      'mode-vectorheart-prime': createModePreset({
        mode: 'vectorheart', palette: 'synthwave', bg: 'black', symmetry: 'mirror-y',
        detail: 58, weight: 22, chaos: 14, textAmount: 18, customTextAmount: 22, customTextSize: 34,
        customTextColor: 'holo-foil', grain: true, vignette: true,
        lfos: [{ wave: 'sine', rate: 12 }, { wave: 'triangle', rate: 7 }, { wave: 'random', rate: 16 }],
        patchList: [['detail', 0, 62], ['weight', 1, 54], ['effects', 2, 49], ['palette', 0, 41], ['seed', 2, 67], ['lfo3Rate', 1, 58]]
      }),
      'mode-circuit-gridflux': createModePreset({
        mode: 'circuit', palette: 'cyber', bg: 'midnight', symmetry: '4way',
        detail: 68, weight: 19, chaos: 26, textAmount: 36, customTextAmount: 12, customTextSize: 20,
        scanlines: true, grain: true,
        lfos: [{ wave: 'square', rate: 15 }, { wave: 'sawtooth', rate: 11 }, { wave: 'triangle', rate: 8 }],
        patchList: [['detail', 0, 55], ['chaos', 1, 61], ['text', 2, 46], ['lfo1Rate', 2, 52], ['bg', 1, 37], ['mode', 0, 28]]
      }),
      'mode-hud-command': createModePreset({
        mode: 'hud', palette: 'matrix', bg: 'dark', symmetry: 'none',
        detail: 52, weight: 14, chaos: 10, textAmount: 44, customTextAmount: 18, customTextSize: 26,
        customTextColor: 'matrix-green', scanlines: true,
        lfos: [{ wave: 'triangle', rate: 9 }, { wave: 'sine', rate: 6 }, { wave: 'random', rate: 14 }],
        patchList: [['text', 0, 70], ['customDensity', 1, 48], ['customSize', 2, 44], ['effects', 2, 33], ['seed', 2, 59], ['palette', 0, 24]]
      }),
      'mode-glitch-overdrive': createModePreset({
        mode: 'glitch', palette: 'blood', bg: 'black', symmetry: 'none',
        detail: 64, weight: 26, chaos: 79, textAmount: 22, customTextAmount: 16, customTextSize: 18,
        chromatic: true, glitch: true, static: true, grain: true,
        lfos: [{ wave: 'random', rate: 22 }, { wave: 'sawtooth', rate: 17 }, { wave: 'square', rate: 19 }],
        patchList: [['chaos', 0, 84], ['effects', 1, 69], ['seed', 0, 78], ['palette', 2, 52], ['mode', 0, 42], ['bg', 1, 36]]
      }),
      'mode-blueprint-lattice': createModePreset({
        mode: 'blueprint', palette: 'ocean', bg: 'paper', symmetry: 'mirror-x',
        detail: 72, weight: 9, chaos: 12, textAmount: 8, customTextAmount: 10, customTextSize: 22,
        vignette: true,
        lfos: [{ wave: 'sine', rate: 8 }, { wave: 'triangle', rate: 5 }, { wave: 'sine', rate: 11 }],
        patchList: [['detail', 0, 63], ['weight', 1, 33], ['lfo2Rate', 0, 51], ['palette', 2, 28], ['bg', 1, 22]]
      }),
      'mode-chaos-ritual': createModePreset({
        mode: 'chaos', palette: 'lava', bg: 'wine', symmetry: 'none',
        detail: 80, weight: 37, chaos: 88, textAmount: 14, customTextAmount: 8, customTextSize: 28,
        glitch: true, chromatic: true,
        lfos: [{ wave: 'random', rate: 24 }, { wave: 'random', rate: 18 }, { wave: 'sawtooth-rev', rate: 13 }],
        patchList: [['chaos', 0, 90], ['weight', 1, 66], ['seed', 0, 82], ['effects', 2, 63], ['mode', 1, 44], ['lfo1Rate', 2, 57]]
      }),
      'mode-flow-tide': createModePreset({
        mode: 'flow', palette: 'forest', bg: 'jade', symmetry: 'mirror-y',
        detail: 60, weight: 13, chaos: 22, textAmount: 6, customTextAmount: 12, customTextSize: 32,
        grain: true,
        lfos: [{ wave: 'sine', rate: 6 }, { wave: 'triangle', rate: 9 }, { wave: 'sine', rate: 4 }],
        patchList: [['detail', 0, 48], ['customSize', 1, 52], ['effects', 2, 31], ['palette', 1, 34], ['bg', 0, 29], ['lfo2Rate', 0, 46]]
      }),
      'mode-sacred-codex': createModePreset({
        mode: 'sacred', palette: 'gold', bg: 'sepia', symmetry: '4way',
        detail: 66, weight: 11, chaos: 9, textAmount: 18, customTextAmount: 14, customTextSize: 30,
        vignette: true, grain: true,
        lfos: [{ wave: 'triangle', rate: 5 }, { wave: 'sine', rate: 7 }, { wave: 'square', rate: 3 }],
        patchList: [['detail', 0, 58], ['text', 1, 36], ['customDensity', 2, 40], ['palette', 2, 27], ['seed', 2, 45]]
      }),
      'mode-glyph-archive': createModePreset({
        mode: 'glyph', palette: 'nordic', bg: 'steel', symmetry: 'none',
        detail: 57, weight: 16, chaos: 18, textAmount: 54, customTextAmount: 38, customTextSize: 24,
        customTextColor: 'cyan-glow', scanlines: true,
        lfos: [{ wave: 'square', rate: 8 }, { wave: 'random', rate: 12 }, { wave: 'triangle', rate: 6 }],
        patchList: [['text', 0, 76], ['customDensity', 1, 64], ['customSize', 2, 31], ['seed', 1, 61], ['mode', 2, 24]]
      }),
      'mode-volumetric-parallax': createModePreset({
        mode: 'volumetric', palette: 'ice', bg: 'midnight', symmetry: 'none',
        detail: 70, weight: 21, chaos: 24, textAmount: 24, customTextAmount: 14, customTextSize: 24,
        grain: true, chromatic: true,
        lfos: [{ wave: 'sine', rate: 11 }, { wave: 'triangle', rate: 9 }, { wave: 'sawtooth', rate: 7 }],
        patchList: [['detail', 0, 58], ['weight', 1, 52], ['chaos', 2, 41], ['mode', 0, 33], ['bg', 1, 27], ['lfo1Rate', 2, 49]]
      }),
      'mode-gundam-tactical': createModePreset({
        mode: 'gundam', palette: 'gundam', bg: 'black', symmetry: 'mirror-y',
        detail: 74, weight: 20, chaos: 34, textAmount: 20, customTextAmount: 15, customTextSize: 26,
        chromatic: true,
        lfos: [{ wave: 'sawtooth', rate: 14 }, { wave: 'square', rate: 10 }, { wave: 'random', rate: 9 }],
        patchList: [['detail', 0, 64], ['weight', 1, 49], ['effects', 2, 44], ['palette', 0, 39], ['seed', 2, 55], ['lfo1Rate', 1, 53]]
      }),
      'mode-evangelion-impact': createModePreset({
        mode: 'evangelion', palette: 'evangelion', bg: 'violet', symmetry: 'none',
        detail: 71, weight: 24, chaos: 47, textAmount: 28, customTextAmount: 19, customTextSize: 22,
        glitch: true, grain: true,
        lfos: [{ wave: 'triangle', rate: 13 }, { wave: 'random', rate: 15 }, { wave: 'square', rate: 11 }],
        patchList: [['detail', 0, 51], ['chaos', 1, 73], ['effects', 1, 58], ['seed', 1, 69], ['palette', 2, 35], ['bg', 2, 28]]
      }),
    };
  }

  function buildPresetSnapshot() {
    return {
      version: 1,
      app: 'heartflash',
      savedAt: new Date().toISOString(),
      state: {
        mode: state.mode,
        palette: state.palette,
        bg: state.bg,
        detail: state.detail,
        weight: state.weight,
        chaos: state.chaos,
        textAmount: state.textAmount,
        customText: state.customText,
        customFont: state.customFont,
        customFontWeight: state.customFontWeight,
        customTextAmount: state.customTextAmount,
        customTextSize: state.customTextSize,
        customTextOpacity: state.customTextOpacity,
        customTextColor: state.customTextColor,
        symmetry: state.symmetry,
        vignette: !!state.vignette,
        grain: !!state.grain,
        scanlines: !!state.scanlines,
        chromatic: !!state.chromatic,
        glitch: !!state.glitch,
        static: !!state.static,
        fadeDuration: state.fadeDuration,
        seed: state.seed,
        lfos: state.lfos.map(lfo => ({ wave: lfo.wave, rate: lfo.rate })),
        audioRx: {
          source: state.audioRx.source,
          deviceId: state.audioRx.deviceId,
          lowAmount: state.audioRx.lowAmount,
          midAmount: state.audioRx.midAmount,
          highAmount: state.audioRx.highAmount,
          masterSend: state.audioRx.masterSend,
          smooth: state.audioRx.smooth,
        },
        patches: clonePatchState(state.patches),
        patchGroups: {
          core: !!patchGroupState.core,
          scene: !!patchGroupState.scene,
          lfo: !!patchGroupState.lfo,
        },
        blockLocks: { ...state.blockLocks },
      }
    };
  }

  function getHeaderBlockKey(header) {
    if (header.closest('.section-mode')) return 'mode';
    if (header.closest('.section-params')) return 'params';
    if (header.closest('.section-text')) return 'text';
    if (header.closest('.section-symmetry')) return 'symmetry';
    if (header.closest('.section-palette')) return 'palette';
    if (header.closest('.section-bg')) return 'bg';
    if (header.closest('.section-effects')) return 'effects';
    if (header.closest('.section-anim')) {
      const txt = header.textContent.toUpperCase();
      if (txt.includes('MODULACIÓN AUDIO')) return 'audio';
      return 'lfo';
    }
    return null;
  }

  function ensureBlockLockControls() {
    document.querySelectorAll('.section-header, .top-section-header').forEach(header => {
      const blockKey = getHeaderBlockKey(header);
      if (!blockKey || !state.blockLocks.hasOwnProperty(blockKey) || header.dataset.lockUiReady === '1') return;

      const lockGroup = document.createElement('div');
      lockGroup.className = 'header-lock-group';

      const blockBtn = document.createElement('button');
      blockBtn.type = 'button';
      blockBtn.className = 'header-lock-btn block-lock';
      blockBtn.title = 'Bloquear bloque';
      blockBtn.textContent = '🔒';
      blockBtn.addEventListener('click', () => {
        setBlockLock(blockKey, !state.blockLocks[blockKey]);
      });

      lockGroup.appendChild(blockBtn);

      const inlineControls = Array.from(header.children).find(child => child !== lockGroup && child.style && child.style.marginLeft === 'auto');
      if (inlineControls) {
        header.insertBefore(lockGroup, inlineControls);
      } else {
        header.appendChild(lockGroup);
      }

      header.dataset.lockUiReady = '1';
    });
  }

  function syncBlockLockUi() {
    ensureBlockLockControls();
    document.querySelectorAll('.section-header, .top-section-header').forEach(header => {
      const blockKey = getHeaderBlockKey(header);
      if (!blockKey) return;
      const group = header.querySelector('.header-lock-group');
      if (!group) return;
      const blockBtn = group.querySelector('.block-lock');
      const blockLocked = !!state.blockLocks[blockKey];
      if (blockBtn) {
        blockBtn.classList.toggle('active', blockLocked);
        blockBtn.textContent = blockLocked ? '🔒' : '🔓';
        blockBtn.title = blockLocked ? 'Bloque bloqueado: click para desbloquear' : 'Bloquear bloque';
      }
    });
  }

  function syncUiFromState() {
    ensureBlockLockControls();
    syncSlidersToState();

    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) modeSelect.value = state.mode;
    const modeBadge = document.getElementById('mode-badge');
    if (modeBadge) modeBadge.textContent = `MODO::${state.mode.toUpperCase()}`;

    const customTextInput = document.getElementById('custom-text-input');
    if (customTextInput) customTextInput.value = state.customText || '';

    const fontSelect = document.getElementById('custom-font-select');
    if (fontSelect) fontSelect.value = state.customFont;
    updateWeightSelector();
    const weightSelect = document.getElementById('custom-weight-select');
    if (weightSelect) weightSelect.value = state.customFontWeight;

    const opacitySlider = document.getElementById('custom-text-opacity-slider');
    const opacityVal = document.getElementById('custom-text-opacity-val');
    if (opacitySlider) opacitySlider.value = String(state.customTextOpacity);
    if (opacityVal) opacityVal.textContent = String(state.customTextOpacity);

    const selectedSquare = document.getElementById('selected-color-square');
    if (selectedSquare) selectedSquare.className = `color-square ${state.customTextColor}-square`;
    document.querySelectorAll('.color-dropdown-item').forEach(item => {
      item.classList.toggle('active', item.dataset.value === state.customTextColor);
    });

    document.querySelectorAll('.palette-btn').forEach(b => b.classList.toggle('active', b.dataset.palette === state.palette));
    document.querySelectorAll('.bg-btn').forEach(b => b.classList.toggle('active', b.dataset.bg === state.bg));
    document.querySelectorAll('.sym-btn').forEach(b => b.classList.toggle('active', b.dataset.sym === state.symmetry));
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

    ['vignette', 'grain', 'scanlines', 'chromatic', 'glitch', 'static'].forEach(fx => {
      const el = document.getElementById(`fx-${fx}`);
      if (el) el.checked = !!state[fx];
    });
    document.querySelector('.canvas-scanlines')?.classList.toggle('hidden', !state.scanlines);

    const seedInput = document.getElementById('seed-input');
    if (seedInput) seedInput.value = String(state.seed);

    [0, 1, 2].forEach(i => {
      const rateSlider = document.querySelector(`.lfo-rate-slider[data-lfo="${i}"]`);
      const rateVal = document.querySelector(`.lfo-rate-val[data-lfo="${i}"]`);
      if (rateSlider) rateSlider.value = state.lfos[i].rate;
      if (rateVal) rateVal.textContent = state.lfos[i].rate;
      document.querySelectorAll(`.lfo-wave-btn[data-lfo="${i}"]`).forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wave === state.lfos[i].wave);
      });
      updateLfoJackStyle(i);
    });

    const sourceSelect = document.getElementById('audio-source-select');
    if (sourceSelect) sourceSelect.value = state.audioRx.source;
    const masterSlider = document.getElementById('audio-master-send-slider');
    if (masterSlider) masterSlider.value = String(Math.round(state.audioRx.masterSend));
    const smoothSlider = document.getElementById('audio-smooth-slider');
    if (smoothSlider) smoothSlider.value = String(Math.round(state.audioRx.smooth * 100));
    updateAudioRxUi();

    syncBlockLockUi();

    renderPatchBay();
  }

  function applyPresetSnapshot(payload, nameHint = 'PRESET') {
    const snap = payload && typeof payload === 'object' && payload.state ? payload.state : payload;
    if (!snap || typeof snap !== 'object') return false;

    state.isBatchUpdating = true;

    if (typeof snap.mode === 'string' && PRESET_MODES.includes(snap.mode)) state.mode = snap.mode;
    if (typeof snap.palette === 'string' && PRESET_PALETTES.includes(snap.palette)) state.palette = snap.palette;
    if (typeof snap.bg === 'string' && PRESET_BACKGROUNDS.includes(snap.bg)) state.bg = snap.bg;

    const clampNum = (v, min, max, fallback) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return fallback;
      return Math.max(min, Math.min(max, n));
    };

    state.detail = clampNum(snap.detail, 0, 100, state.detail);
    state.weight = clampNum(snap.weight, 0, 100, state.weight);
    state.chaos = clampNum(snap.chaos, 0, 100, state.chaos);
    state.textAmount = clampNum(snap.textAmount, 0, 100, state.textAmount);
    state.customTextAmount = clampNum(snap.customTextAmount, 0, 100, state.customTextAmount);
    state.customTextSize = clampNum(snap.customTextSize, 4, 150, state.customTextSize);
    state.customTextOpacity = clampNum(snap.customTextOpacity, 0, 100, state.customTextOpacity);
    state.fadeDuration = clampNum(snap.fadeDuration, 1, 10, state.fadeDuration);
    state.complexity = Math.round(state.detail * 40 / 100);
    state.density = Math.round(state.detail * 15 / 100);

    if (typeof snap.customText === 'string') state.customText = snap.customText;
    if (typeof snap.customFont === 'string') state.customFont = snap.customFont;
    if (typeof snap.customFontWeight === 'string') state.customFontWeight = snap.customFontWeight;
    if (typeof snap.customTextColor === 'string') state.customTextColor = snap.customTextColor;
    if (typeof snap.symmetry === 'string' && PRESET_SYMMETRY.includes(snap.symmetry)) state.symmetry = snap.symmetry;

    ['vignette', 'grain', 'scanlines', 'chromatic', 'glitch', 'static'].forEach(fx => {
      if (typeof snap[fx] === 'boolean') state[fx] = snap[fx];
    });

    if (Number.isFinite(Number(snap.seed))) {
      setSeedValue(Number(snap.seed), { syncInput: true, syncBase: true });
    }

    if (Array.isArray(snap.lfos)) {
      for (let i = 0; i < 3; i++) {
        const src = snap.lfos[i] || {};
        if (typeof src.wave === 'string') state.lfos[i].wave = src.wave;
        if (Number.isFinite(Number(src.rate))) state.lfos[i].rate = clampNum(src.rate, 1, 160, state.lfos[i].rate);
      }
    }

    if (snap.audioRx && typeof snap.audioRx === 'object') {
      const arx = snap.audioRx;
      if (typeof arx.source === 'string') state.audioRx.source = arx.source;
      if (typeof arx.deviceId === 'string') state.audioRx.deviceId = arx.deviceId;
      state.audioRx.lowAmount = clampNum(arx.lowAmount, 0, 100, state.audioRx.lowAmount);
      state.audioRx.midAmount = clampNum(arx.midAmount, 0, 100, state.audioRx.midAmount);
      state.audioRx.highAmount = clampNum(arx.highAmount, 0, 100, state.audioRx.highAmount);
      state.audioRx.masterSend = clampNum(arx.masterSend, 0, 150, state.audioRx.masterSend);
      state.audioRx.smooth = clampNum(arx.smooth, 0, 0.98, state.audioRx.smooth);
    }

    if (snap.patches && typeof snap.patches === 'object') {
      const normalized = clonePatchState(snap.patches);
      Object.keys(state.patches).forEach(dest => {
        state.patches[dest] = normalized[dest];
      });
    }

    if (snap.patchGroups && typeof snap.patchGroups === 'object') {
      if (typeof snap.patchGroups.core === 'boolean') patchGroupState.core = snap.patchGroups.core;
      if (typeof snap.patchGroups.scene === 'boolean') patchGroupState.scene = snap.patchGroups.scene;
      if (typeof snap.patchGroups.lfo === 'boolean') patchGroupState.lfo = snap.patchGroups.lfo;
    }

    if (snap.blockLocks && typeof snap.blockLocks === 'object') {
      Object.keys(state.blockLocks).forEach(key => {
        if (typeof snap.blockLocks[key] === 'boolean') state.blockLocks[key] = snap.blockLocks[key];
      });
    }

    animBases.detail = state.detail;
    animBases.weight = state.weight;
    animBases.chaos = state.chaos;
    animBases.textAmount = state.textAmount;
    animBases.customTextAmount = state.customTextAmount;
    animBases.customTextSize = state.customTextSize;
    animBases.seed = state.seed;
    animBases.paletteIdx = PRESET_PALETTES.indexOf(state.palette);
    if (animBases.paletteIdx === -1) animBases.paletteIdx = 0;
    animBases.bgIdx = PRESET_BACKGROUNDS.indexOf(state.bg);
    if (animBases.bgIdx === -1) animBases.bgIdx = 0;
    animBases.modeIdx = PRESET_MODES.indexOf(state.mode);
    if (animBases.modeIdx === -1) animBases.modeIdx = 0;

    state.isBatchUpdating = false;
    syncUiFromState();
    if (!state.animating) draw(0, true);
    setFooterInfo(`PRESET::CARGADO ${String(nameHint).toUpperCase()}`);
    return true;
  }

  function downloadJsonFile(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function initUserPresetControls() {
    const select = document.getElementById('preset-select');
    const btnSave = document.getElementById('btn-preset-save');
    const btnLoad = document.getElementById('btn-preset-load');
    const btnExport = document.getElementById('btn-preset-export');
    const btnImport = document.getElementById('btn-preset-import');
    const btnDelete = document.getElementById('btn-preset-delete');
    const importInput = document.getElementById('preset-import-file');
    if (!select || !btnSave || !btnLoad || !btnExport || !btnImport || !btnDelete || !importInput) return;

    let userPresets = loadUserPresets();
    try {
      const alreadySeeded = localStorage.getItem(USER_PRESETS_SEEDED_KEY) === '1';
      if (!alreadySeeded) {
        const preloaded = buildPreloadedModePresets();
        Object.keys(preloaded).forEach(name => {
          if (!userPresets[name]) userPresets[name] = preloaded[name];
        });
        saveUserPresets(userPresets);
        localStorage.setItem(USER_PRESETS_SEEDED_KEY, '1');
      }
    } catch (_) {
      // If localStorage is unavailable, continue with in-memory presets only.
    }

    const refreshSelect = (selected = '') => {
      const names = Object.keys(userPresets).sort((a, b) => a.localeCompare(b));
      select.innerHTML = '';
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '--';
      select.appendChild(placeholder);
      names.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name.toUpperCase();
        select.appendChild(opt);
      });
      if (selected && userPresets[selected]) select.value = selected;
    };

    refreshSelect();

    btnSave.addEventListener('click', () => {
      const seedPad = String(state.seed).padStart(8, '0').slice(-4);
      const suggested = select.value || `preset-${seedPad}`;
      const asked = window.prompt('Nombre del preset para guardar:', suggested);
      const name = normalizePresetName(asked);
      if (!name) return;
      userPresets[name] = buildPresetSnapshot();
      saveUserPresets(userPresets);
      refreshSelect(name);
      setFooterInfo(`PRESET::GUARDADO ${name.toUpperCase()}`);
    });

    btnLoad.addEventListener('click', () => {
      const name = select.value;
      if (!name || !userPresets[name]) {
        setFooterInfo('PRESET::SELECCIONA UNO PARA CARGAR');
        return;
      }
      applyPresetSnapshot(userPresets[name], name);
    });

    btnExport.addEventListener('click', () => {
      const name = select.value;
      if (!name || !userPresets[name]) {
        setFooterInfo('PRESET::SELECCIONA UNO PARA EXPORTAR');
        return;
      }
      downloadJsonFile(`heartflash_preset_${name}.json`, { name, ...userPresets[name] });
      setFooterInfo(`PRESET::EXPORTADO ${name.toUpperCase()}`);
    });

    btnImport.addEventListener('click', () => {
      importInput.click();
    });

    importInput.addEventListener('change', () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'));
          const candidateName = parsed?.name || file.name.replace(/\.json$/i, '');
          const name = normalizePresetName(candidateName) || `preset-${Date.now()}`;
          const payload = parsed?.state ? parsed : { state: parsed };
          if (!applyPresetSnapshot(payload, name)) {
            setFooterInfo('PRESET::JSON INVÁLIDO');
            return;
          }
          userPresets[name] = payload;
          saveUserPresets(userPresets);
          refreshSelect(name);
          setFooterInfo(`PRESET::IMPORTADO ${name.toUpperCase()}`);
        } catch (err) {
          console.error(err);
          setFooterInfo('PRESET::ERROR AL IMPORTAR JSON');
        } finally {
          importInput.value = '';
        }
      };
      reader.readAsText(file);
    });

    btnDelete.addEventListener('click', () => {
      const name = select.value;
      if (!name || !userPresets[name]) {
        setFooterInfo('PRESET::SELECCIONA UNO PARA BORRAR');
        return;
      }
      const ok = window.confirm(`Borrar preset "${name}"?`);
      if (!ok) return;
      delete userPresets[name];
      saveUserPresets(userPresets);
      refreshSelect('');
      setFooterInfo(`PRESET::BORRADO ${name.toUpperCase()}`);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  UI WIRING
  // ─────────────────────────────────────────────────────────────────────────

  function wireSlider(id, key, valId) {
    const slider = document.getElementById(id), valEl = document.getElementById(valId);
    if (!slider) return;
    slider.addEventListener('input', () => {
      const val = +slider.value;
      state[key] = val;
      
      // Map combined detail to internal complexity and density
      if (key === 'detail') {
        state.complexity = Math.round(val * 40 / 100);
        state.density = Math.round(val * 15 / 100);
      }
      
      valEl.textContent = slider.value;
      if (animBases.hasOwnProperty(key)) {
        animBases[key] = val;
      }
      if (!state.animating) draw();
    });
  }

  wireSlider('detail-slider',     'detail',     'detail-val');
  wireSlider('weight-slider',     'weight',     'weight-val');
  wireSlider('chaos-slider',      'chaos',      'chaos-val');
  wireSlider('text-slider',       'textAmount', 'text-val');
  wireSlider('custom-text-density-slider', 'customTextAmount', 'custom-text-density-val');
  wireSlider('custom-text-size-slider',    'customTextSize',   'custom-text-size-val');
  wireSlider('custom-text-opacity-slider', 'customTextOpacity', 'custom-text-opacity-val');

  // Custom text input
  const customTextInput = document.getElementById('custom-text-input');
  if (customTextInput) {
    customTextInput.addEventListener('input', e => {
      state.customText = e.target.value;
      if (!state.animating) draw();
    });
  }

  const FONT_WEIGHTS = {
    "'Share Tech Mono', monospace": [
      { value: '400', label: '400 - REGULAR' }
    ],
    "'Montserrat', sans-serif": [
      { value: '300', label: '300 - FINO' },
      { value: '400', label: '400 - REGULAR' },
      { value: '500', label: '500 - MEDIANO' },
      { value: '700', label: '700 - NEGRITA' },
      { value: '900', label: '900 - NEGRO' }
    ],
    "'Rajdhani', sans-serif": [
      { value: '300', label: '300 - FINO' },
      { value: '400', label: '400 - REGULAR' },
      { value: '500', label: '500 - MEDIANO' },
      { value: '700', label: '700 - NEGRITA' }
    ],
    "'Orbitron', sans-serif": [
      { value: '400', label: '400 - REGULAR' },
      { value: '500', label: '500 - MEDIANO' },
      { value: '700', label: '700 - NEGRITA' },
      { value: '900', label: '900 - NEGRO' }
    ],
    "'Syncopate', sans-serif": [
      { value: '400', label: '400 - REGULAR' },
      { value: '700', label: '700 - NEGRITA' }
    ],
    "'Space Mono', monospace": [
      { value: '400', label: '400 - REGULAR' },
      { value: '700', label: '700 - NEGRITA' }
    ],
    "'Chakra Petch', sans-serif": [
      { value: '300', label: '300 - FINO' },
      { value: '400', label: '400 - REGULAR' },
      { value: '500', label: '500 - MEDIANO' },
      { value: '700', label: '700 - NEGRITA' }
    ],
    "'Michroma', sans-serif": [
      { value: '400', label: '400 - REGULAR' }
    ],
    "'Syne', sans-serif": [
      { value: '400', label: '400 - REGULAR' },
      { value: '700', label: '700 - NEGRITA' },
      { value: '800', label: '800 - EXTRA NEGRITA' }
    ],
    "'Oxanium', sans-serif": [
      { value: '300', label: '300 - FINO' },
      { value: '400', label: '400 - REGULAR' },
      { value: '500', label: '500 - MEDIANO' },
      { value: '600', label: '600 - SEMI NEGRITA' },
      { value: '700', label: '700 - NEGRITA' },
      { value: '800', label: '800 - EXTRA NEGRITA' }
    ],
    "'Tektur', sans-serif": [
      { value: '400', label: '400 - REGULAR' },
      { value: '500', label: '500 - MEDIANO' },
      { value: '700', label: '700 - NEGRITA' },
      { value: '900', label: '900 - NEGRO' }
    ],
    "'Goldman', sans-serif": [
      { value: '400', label: '400 - REGULAR' },
      { value: '700', label: '700 - NEGRITA' }
    ],
    "'Righteous', sans-serif": [
      { value: '400', label: '400 - REGULAR' }
    ],
    "'Major Mono Display', monospace": [
      { value: '400', label: '400 - REGULAR' }
    ],
    "'Courier New', monospace": [
      { value: '400', label: '400 - REGULAR' },
      { value: '700', label: '700 - NEGRITA' }
    ],
    "Arial, sans-serif": [
      { value: '400', label: '400 - REGULAR' },
      { value: '700', label: '700 - NEGRITA' }
    ]
  };

  function updateWeightSelector() {
    const fontSelect = document.getElementById('custom-font-select');
    const weightSelect = document.getElementById('custom-weight-select');
    if (!fontSelect || !weightSelect) return;

    const selectedFont = fontSelect.value;
    const weights = FONT_WEIGHTS[selectedFont] || [
      { value: '400', label: '400 - REGULAR' },
      { value: '700', label: '700 - NEGRITA' }
    ];

    const currentWeight = state.customFontWeight;
    weightSelect.innerHTML = '';
    let selectedStillAvailable = false;

    weights.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.value;
      opt.textContent = w.label;
      if (w.value === currentWeight) {
        opt.selected = true;
        selectedStillAvailable = true;
      }
      weightSelect.appendChild(opt);
    });

    if (!selectedStillAvailable && weights.length > 0) {
      state.customFontWeight = weights[0].value;
      weightSelect.value = weights[0].value;
    }
  }

  function sortFontOptions() {
    const select = document.getElementById('custom-font-select');
    if (!select) return;
    const options = Array.from(select.options);
    const selectedVal = select.value;
    
    // Sort options alphabetically by textContent
    options.sort((a, b) => a.textContent.localeCompare(b.textContent));
    
    // Clear and re-add in sorted order
    select.innerHTML = '';
    options.forEach(opt => select.appendChild(opt));
    
    // Restore selected value
    select.value = selectedVal;
  }

  // Custom font select
  const customFontSelect = document.getElementById('custom-font-select');
  if (customFontSelect) {
    customFontSelect.addEventListener('change', e => {
      state.customFont = e.target.value;
      updateWeightSelector();
      if (!state.animating) draw();
    });
  }

  // Custom font weight select
  const customWeightSelect = document.getElementById('custom-weight-select');
  if (customWeightSelect) {
    customWeightSelect.addEventListener('change', e => {
      state.customFontWeight = e.target.value;
      if (!state.animating) draw();
    });
  }

  // Custom font file input load
  const customFontFileInput = document.getElementById('custom-font-file');
  if (customFontFileInput) {
    customFontFileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const arrayBuffer = evt.target.result;
        const fontName = 'user-font-' + Date.now();
        const fontFace = new FontFace(fontName, arrayBuffer);
        
        fontFace.load().then(loadedFace => {
          document.fonts.add(loadedFace);
          
          // Also convert to data URL to embed in SVGs
          const base64Reader = new FileReader();
          base64Reader.onload = function(bEvt) {
            const dataUrl = bEvt.target.result;
            customFontDataUrls.push({
              name: fontName,
              url: dataUrl
            });
            
            // Add option and select it
            const select = document.getElementById('custom-font-select');
            if (select) {
              const option = document.createElement('option');
              const displayName = file.name.substring(0, file.name.lastIndexOf('.')).toUpperCase();
              option.value = `'${fontName}', sans-serif`;
              option.textContent = displayName;
              select.appendChild(option);
              sortFontOptions();
              select.value = option.value;
              
              state.customFont = option.value;
              document.getElementById('footer-info').textContent = `FUENTE CARGADA: ${displayName}`;
              if (!state.animating) draw();
            }
          };
          base64Reader.readAsDataURL(file);
        }).catch(err => {
          console.error(err);
          alert('Error al cargar la fuente. Asegúrate de usar un archivo válido (.ttf, .otf, .woff).');
        });
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Custom text color dropdown selection
  // Custom text color dropdown logic
  const colorDropdownTrigger = document.getElementById('color-dropdown-trigger');
  const colorDropdownMenu = document.getElementById('color-dropdown-menu');
  const selectedColorSquare = document.getElementById('selected-color-square');

  if (colorDropdownTrigger && colorDropdownMenu) {
    colorDropdownTrigger.addEventListener('click', e => {
      e.stopPropagation();
      const isHidden = colorDropdownMenu.style.display === 'none';
      colorDropdownMenu.style.display = isHidden ? 'grid' : 'none';
      colorDropdownTrigger.classList.toggle('active', isHidden);
    });

    document.addEventListener('click', () => {
      colorDropdownMenu.style.display = 'none';
      colorDropdownTrigger.classList.remove('active');
    });

    const colorItems = document.querySelectorAll('.color-dropdown-item');
    colorItems.forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        const value = item.dataset.value;
        state.customTextColor = value;
        
        colorItems.forEach(i => i.classList.toggle('active', i.dataset.value === value));
        if (selectedColorSquare) {
          selectedColorSquare.className = `color-square ${value}-square`;
        }
        
        colorDropdownMenu.style.display = 'none';
        colorDropdownTrigger.classList.remove('active');
        
        if (!state.animating) draw();
      });
    });
  }

  // Mode selection dropdown
  const modeSelect = document.getElementById('mode-select');
  if (modeSelect) {
    modeSelect.addEventListener('change', () => {
      state.mode = modeSelect.value;

      // Sensible defaults for franchise-like modes so they don't look flat with MONO palette
      const modePaletteDefaults = { evangelion: 'evangelion', gundam: 'gundam', volumetric: 'ice' };
      const targetPalette = modePaletteDefaults[state.mode];
      if (targetPalette) {
        state.palette = targetPalette;
        document.querySelectorAll('.palette-btn').forEach(b => b.classList.toggle('active', b.dataset.palette === state.palette));
        const PALETTES = ['mono', 'cyber', 'neon', 'blood', 'ice', 'gold', 'vaporwave', 'matrix', 'rust', 'gundam', 'evangelion'];
        animBases.paletteIdx = PALETTES.indexOf(state.palette);
        if (animBases.paletteIdx === -1) animBases.paletteIdx = 0;

        // Darker background helps readability in these modes
        if (state.bg === 'light') {
          state.bg = 'black';
          document.querySelectorAll('.bg-btn').forEach(b => b.classList.toggle('active', b.dataset.bg === state.bg));
          const BACKGROUNDS = ['light', 'dark', 'paper', 'black', 'midnight', 'sepia', 'violet', 'jade', 'wine', 'steel', 'copper', 'slate'];
          animBases.bgIdx = BACKGROUNDS.indexOf(state.bg);
          if (animBases.bgIdx === -1) animBases.bgIdx = 0;
        }
      }

      document.getElementById('mode-badge').textContent = `MODO::${state.mode.toUpperCase()}`;
      document.getElementById('footer-info').textContent = `MODO::${state.mode.toUpperCase()}`;
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      if (!state.animating) draw(0, true);
    });
  }

  // Palette buttons
  document.querySelectorAll('.palette-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); state.palette = btn.dataset.palette;
    const PALETTES = ['mono', 'cyber', 'neon', 'blood', 'ice', 'gold', 'vaporwave', 'matrix', 'rust', 'gundam', 'evangelion'];
    animBases.paletteIdx = PALETTES.indexOf(state.palette);
    if (animBases.paletteIdx === -1) animBases.paletteIdx = 0;
    if (!state.animating) draw(0, true);
  }));

  // BG buttons
  document.querySelectorAll('.bg-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); state.bg = btn.dataset.bg;
    const BACKGROUNDS = ['light', 'dark', 'paper', 'black', 'midnight', 'sepia', 'violet', 'jade', 'wine', 'steel', 'copper', 'slate'];
    animBases.bgIdx = BACKGROUNDS.indexOf(state.bg);
    if (animBases.bgIdx === -1) animBases.bgIdx = 0;
    if (!state.animating) draw();
  }));

  // Symmetry buttons
  document.querySelectorAll('.sym-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.sym-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); state.symmetry = btn.dataset.sym; if (!state.animating) draw();
  }));

  // LFO wave buttons
  document.querySelectorAll('.lfo-wave-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lfoIdx = parseInt(btn.dataset.lfo);
      const wave = btn.dataset.wave;
      state.lfos[lfoIdx].wave = wave;
      document.querySelectorAll(`.lfo-wave-btn[data-lfo="${lfoIdx}"]`).forEach(b =>
        b.classList.toggle('active', b.dataset.wave === wave));
      updateLfoJackStyle(lfoIdx);
    });
  });

  // LFO rate sliders
  document.querySelectorAll('.lfo-rate-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const lfoIdx = parseInt(slider.dataset.lfo);
      const val = parseInt(slider.value);
      state.lfos[lfoIdx].rate = val;
      document.querySelector(`.lfo-rate-val[data-lfo="${lfoIdx}"]`).textContent = val;
      updateLfoJackStyle(lfoIdx);
    });
  });

  // Audio reactive controls
  const btnAudioRx = document.getElementById('btn-audio-rx');
  const audioMasterSendSlider = document.getElementById('audio-master-send-slider');
  const audioSmoothSlider = document.getElementById('audio-smooth-slider');
  const audioSourceSelect = document.getElementById('audio-source-select');
  const audioDeviceSelect = document.getElementById('audio-device-select');

  if (btnAudioRx) {
    btnAudioRx.addEventListener('click', async () => {
      if (state.audioRx.enabled) {
        disableAudioReactiveInput();
        document.getElementById('footer-info').textContent = 'AUDIO RX::OFF';
      } else {
        await enableAudioReactiveInput();
      }
    });
  }

  if (audioMasterSendSlider) {
    audioMasterSendSlider.value = String(Math.round(state.audioRx.masterSend));
    audioMasterSendSlider.addEventListener('input', () => {
      state.audioRx.masterSend = parseInt(audioMasterSendSlider.value, 10);
      updateAudioRxUi();
    });
  }

  if (audioSmoothSlider) {
    audioSmoothSlider.value = String(Math.round(state.audioRx.smooth * 100));
    audioSmoothSlider.addEventListener('input', () => {
      state.audioRx.smooth = Math.max(0, Math.min(0.98, parseInt(audioSmoothSlider.value, 10) / 100));
      updateAudioRxUi();
    });
  }

  if (audioSourceSelect) {
    audioSourceSelect.value = state.audioRx.source;
    audioSourceSelect.addEventListener('change', async () => {
      state.audioRx.source = audioSourceSelect.value;
      state.audioRx.deviceId = 'default'; // reset device so pickPreferredAudioInput re-selects for new source
      await refreshAudioInputDevices();
      updateAudioRxUi();
      if (state.audioRx.source === 'loopback' && !state.audioRx.enabled) {
        document.getElementById('footer-info').textContent = 'LOOPBACK::VB-CABLE/STEREO MIX O SELECCIONÁ DISPOSITIVO EN LISTA';
      }
      if (state.audioRx.enabled) {
        await enableAudioReactiveInput();
      }
    });
  }

  if (audioDeviceSelect) {
    audioDeviceSelect.addEventListener('change', async () => {
      state.audioRx.deviceId = audioDeviceSelect.value;
      updateAudioRxUi();
      if (state.audioRx.enabled && state.audioRx.source !== 'loopback') {
        await enableAudioReactiveInput();
      }
    });
  }

  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', () => {
      refreshAudioInputDevices();
    });
  }

  refreshAudioInputDevices();

  updateAudioRxUi();

  // Effect toggles
  document.getElementById('fx-vignette').addEventListener('change', e => { state.vignette = e.target.checked; if (!state.animating) draw(); });
  document.getElementById('fx-grain').addEventListener('change', e => { state.grain = e.target.checked; if (!state.animating) draw(); });
  document.getElementById('fx-scanlines').addEventListener('change', e => { document.querySelector('.canvas-scanlines').classList.toggle('hidden', !e.target.checked); });
  document.getElementById('fx-chromatic').addEventListener('change', e => { state.chromatic = e.target.checked; if (!state.animating) draw(); });
  document.getElementById('fx-glitch').addEventListener('change', e => { state.glitch = e.target.checked; if (!state.animating) draw(); });
  document.getElementById('fx-static').addEventListener('change', e => { state.static = e.target.checked; if (!state.animating) draw(); });

  // Randomize everything function
  const LFO_COLORS = ['#00e5ff', '#ff4f81', '#bf5af2'];
  const PATCH_GROUP_MAP = {
    detail: 'core',
    chaos: 'core',
    weight: 'core',
    effects: 'core',
    text: 'core',
    customDensity: 'core',
    customSize: 'core',
    lfo1Rate: 'lfo',
    lfo2Rate: 'lfo',
    lfo3Rate: 'lfo',
    palette: 'scene',
    bg: 'scene',
    seed: 'scene',
    mode: 'scene'
  };
  const patchGroupState = { core: true, scene: false, lfo: false };

  function ensureBandPatchPorts() {
    document.querySelectorAll('.patch-dest-row').forEach(row => {
      const dest = row.dataset.dest;
      const ports = row.querySelector('.patch-ports');
      if (!dest || !ports) return;
      for (let src = LFO_SOURCE_COUNT; src < MOD_SOURCE_COUNT; src++) {
        if (ports.querySelector(`.patch-port[data-lfo="${src}"]`)) continue;
        const btn = document.createElement('button');
        btn.className = 'patch-port';
        btn.dataset.lfo = String(src);
        btn.dataset.dest = dest;
        ports.appendChild(btn);
      }
    });
  }

  function updatePatchGroupUi() {
    const counts = { core: 0, scene: 0 };
    Object.entries(state.patches).forEach(([dest, depths]) => {
      const group = PATCH_GROUP_MAP[dest] || 'core';
      counts[group] += depths.filter(v => v !== null).length;
    });

    document.querySelectorAll('.patch-group').forEach(groupEl => {
      const group = groupEl.dataset.group;
      groupEl.classList.toggle('collapsed', !patchGroupState[group]);
    });

    document.querySelectorAll('.patch-group-toggle').forEach(btn => {
      const group = btn.dataset.group;
      if (!btn.dataset.baseLabel) btn.dataset.baseLabel = btn.textContent.trim();
      const count = counts[group] || 0;
      btn.classList.toggle('active', !!patchGroupState[group]);
      btn.textContent = `${btn.dataset.baseLabel}${count > 0 ? ` (${count})` : ''}`;
    });
  }

  function renderPatchBay() {
    document.querySelectorAll('.patch-port').forEach(port => {
      const lfoIdx = parseInt(port.dataset.lfo);
      const dest = port.dataset.dest;
      const depth = state.patches[dest][lfoIdx];
      port.className = 'patch-port' + (depth !== null ? ` patched-${lfoIdx}` : '');
    });
    document.querySelectorAll('.dest-depth').forEach(depthDiv => {
      const dest = depthDiv.dataset.dest;
      depthDiv.innerHTML = '';
      state.patches[dest].forEach((depth, lfoIdx) => {
        if (depth === null) return;
        const pct = depth + '%';
        const ctrl = document.createElement('div');
        ctrl.className = 'depth-ctrl';
        ctrl.dataset.lfo = lfoIdx;
        ctrl.dataset.dest = dest;
        ctrl.style.setProperty('--pct', pct);
        ctrl.innerHTML = `
          <span class="depth-lfo-dot"></span>
          <input type="range" class="depth-slider" min="0" max="100" value="${depth}" style="--pct:${pct}">
          <span class="depth-val">${depth}</span>
        `;
        const slider = ctrl.querySelector('.depth-slider');
        slider.addEventListener('input', e => {
          const v = parseInt(e.target.value);
          state.patches[dest][lfoIdx] = v;
          ctrl.style.setProperty('--pct', v + '%');
          slider.style.setProperty('--pct', v + '%');
          ctrl.querySelector('.depth-val').textContent = v;
        });
        depthDiv.appendChild(ctrl);
      });
    });
    // Update LFO jack glow
    [0, 1, 2].forEach(updateLfoJackStyle);
    updatePatchGroupUi();
  }

  function getEffectiveLfoRate(baseRate, lfoIdx) {
    if (state.animating && Array.isArray(state.liveLfoRates) && typeof state.liveLfoRates[lfoIdx] === 'number') {
      return Math.max(1, Math.min(160, state.liveLfoRates[lfoIdx]));
    }
    return Math.max(1, Math.min(160, baseRate));
  }

  function updateLfoJackStyle(lfoIdx) {
    const module = document.querySelector(`.lfo-module[data-lfo="${lfoIdx}"]`);
    if (!module) return;
    const hasPatches = Object.values(state.patches).some(p => p[lfoIdx] !== null);
    module.classList.toggle('has-patches', hasPatches);
    const effectiveRate = getEffectiveLfoRate(state.lfos[lfoIdx].rate, lfoIdx);
    const period = (Math.max(0.18, 2.0 / (effectiveRate / 15))).toFixed(2) + 's';
    module.style.setProperty('--lfo-period', period);
  }

  ensureBandPatchPorts();

  // Patch port click handler
  document.querySelectorAll('.patch-port').forEach(port => {
    port.addEventListener('click', () => {
      const lfoIdx = parseInt(port.dataset.lfo);
      const dest = port.dataset.dest;
      const group = PATCH_GROUP_MAP[dest] || 'core';
      if (state.patches[dest][lfoIdx] === null) {
        state.patches[dest][lfoIdx] = 80; // default depth
        patchGroupState[group] = true;
      } else {
        state.patches[dest][lfoIdx] = null;
        // Reset state value when fully unpatching this dest
        if (!state.animating && state.patches[dest].every(v => v === null)) {
          const baseMap = {
            detail: ['detail', 'detail'],
            weight: ['weight', 'weight'],
            chaos: ['chaos', 'chaos'],
            text: ['textAmount', 'textAmount'],
            customDensity: ['customTextAmount', 'customTextAmount'],
            customSize: ['customTextSize', 'customTextSize'],
            lfo1Rate: ['lfos', 0],
            lfo2Rate: ['lfos', 1],
            lfo3Rate: ['lfos', 2]
          };
          const keys = baseMap[dest];
          if (keys) {
            if (keys[0] === 'lfos') {
              const i = keys[1];
              const slider = document.querySelector(`.lfo-rate-slider[data-lfo="${i}"]`);
              if (slider) slider.value = state.lfos[i].rate;
              const valEl = document.querySelector(`.lfo-rate-val[data-lfo="${i}"]`);
              if (valEl) valEl.textContent = state.lfos[i].rate;
            } else {
              state[keys[0]] = animBases[keys[1]];
            }
          }
        }
      }
      renderPatchBay();
      if (!state.animating) draw();
    });
  });

  // Patch bay group toggles
  document.querySelectorAll('.patch-group-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      patchGroupState[group] = !patchGroupState[group];
      updatePatchGroupUi();
    });
  });

  // Initialize patch bay UI
  renderPatchBay();

  function randomizeEverything(intensityProfile = null, options = {}) {
    const useFade = !!options.useFade;
    const fallbackProfile = {
      key: 'medium',
      label: 'RND::MED',
      detail: [30, 75],
      weight: [0, 79],
      chaos: [0, 59],
      text: [0, 39],
      customDensity: [0, 25],
      customSize: [15, 74],
      customOpacity: [30, 80],
      speed: [10, 39],
      patches: [2, 4],
      cheapFxMax: 1
    };
    const profile = intensityProfile || fallbackProfile;
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    state.isBatchUpdating = true;
    // 1. Seed
    const nextSeed = profile.lockSeed ? state.seed : Math.floor(Math.random() * 99999999);
    if (useFade && state.animating) {
      triggerFade(nextSeed);
    } else {
      setSeedValue(nextSeed, { syncInput: true, syncBase: true });
    }

    // 2. Mode (soft random keeps current mode)
    const modes = ['vectorheart','circuit','hud','glitch','blueprint','chaos','flow','sacred','glyph','volumetric','gundam','evangelion'];
    if (!profile.lockMode && !isBlockLocked('mode')) {
      state.mode = modes[Math.floor(Math.random() * modes.length)];
    }
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) modeSelect.value = state.mode;
    const modeBadge = document.getElementById('mode-badge');
    if (modeBadge) modeBadge.textContent = `MODO::${state.mode.toUpperCase()}`;

    // 3. Symmetry
    const symmetries = ['none', 'mirror-y', 'mirror-x', '4way'];
    if (!profile.lockSymmetry && !isBlockLocked('symmetry')) {
      state.symmetry = symmetries[Math.floor(Math.random() * symmetries.length)];
    }
    document.querySelectorAll('.sym-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.sym === state.symmetry);
    });

    // 4. Palette
    const palettes = ['mono','cyber','neon','blood','ice','gold','vaporwave','matrix','rust','gundam','evangelion'];
    if (!profile.lockPalette && !isBlockLocked('palette')) {
      state.palette = palettes[Math.floor(Math.random() * palettes.length)];
    }
    document.querySelectorAll('.palette-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.palette === state.palette);
    });

    // 5. Background
    const bgs = ['light','dark','paper','black','midnight','sepia'];
    if (!profile.lockBg && !isBlockLocked('bg')) {
      state.bg = bgs[Math.floor(Math.random() * bgs.length)];
    }
    document.querySelectorAll('.bg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bg === state.bg);
    });

    // Helper to sync ranges and val labels
    const syncSlider = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
      const valEl = document.getElementById(id.replace('-slider', '-val'));
      if (valEl) valEl.textContent = val;
    };

    // 6. Parameters (Smart performance-balanced limits)
    if (!profile.lockMode && !isBlockLocked('params')) {
      const detailVal = Math.floor(Math.random() * (profile.detail[1] - profile.detail[0] + 1)) + profile.detail[0];
      const weightVal = Math.floor(Math.random() * (profile.weight[1] - profile.weight[0] + 1)) + profile.weight[0];
      const chaosVal = Math.floor(Math.random() * (profile.chaos[1] - profile.chaos[0] + 1)) + profile.chaos[0];
      const textAmountVal = Math.floor(Math.random() * (profile.text[1] - profile.text[0] + 1)) + profile.text[0];

      state.detail = detailVal;
      state.complexity = Math.round(detailVal * 40 / 100);
      state.density = Math.round(detailVal * 15 / 100);
      state.weight = weightVal;
      state.chaos = chaosVal;
      state.textAmount = textAmountVal;

      syncSlider('detail-slider', detailVal);
      syncSlider('weight-slider', weightVal);
      syncSlider('chaos-slider', chaosVal);
      syncSlider('text-slider', textAmountVal);
    }

    // 7. Custom Text settings (Performance safe)
    if (!isBlockLocked('text')) {
      const customTextAmountVal = Math.floor(Math.random() * (profile.customDensity[1] - profile.customDensity[0] + 1)) + profile.customDensity[0];
      const customTextSizeVal = Math.floor(Math.random() * (profile.customSize[1] - profile.customSize[0] + 1)) + profile.customSize[0];
      const customTextOpacityVal = Math.floor((Math.random() * (profile.customOpacity[1] - profile.customOpacity[0]) + profile.customOpacity[0]) / 5) * 5;

      state.customTextAmount = customTextAmountVal;
      state.customTextSize = customTextSizeVal;
      state.customTextOpacity = customTextOpacityVal;

      syncSlider('custom-text-density-slider', customTextAmountVal);
      syncSlider('custom-text-size-slider', customTextSizeVal);
      syncSlider('custom-text-opacity-slider', customTextOpacityVal);
    }

    const fonts = [
      "'Share Tech Mono', monospace",
      "'Montserrat', sans-serif",
      "'Rajdhani', sans-serif",
      "'Orbitron', sans-serif",
      "'Syncopate', sans-serif",
      "'Space Mono', monospace",
      "'Chakra Petch', sans-serif",
      "'Michroma', sans-serif",
      "'Syne', sans-serif",
      "'Oxanium', sans-serif",
      "'Tektur', sans-serif",
      "'Goldman', sans-serif",
      "'Righteous', sans-serif",
      "'Major Mono Display', monospace",
      "'Courier New', monospace",
      "Arial, sans-serif"
    ];
    if (!profile.lockTypography && !isBlockLocked('text')) {
      state.customFont = fonts[Math.floor(Math.random() * fonts.length)];
    }
    const fontSelect = document.getElementById('custom-font-select');
    if (fontSelect) fontSelect.value = state.customFont;

    // Custom Font Weight
    updateWeightSelector();
    const supportedWeights = FONT_WEIGHTS[state.customFont] || [
      { value: '400', label: '400 - REGULAR' },
      { value: '700', label: '700 - NEGRITA' }
    ];
    if (!profile.lockTypography && !isBlockLocked('text')) {
      const pickedWeight = supportedWeights[Math.floor(Math.random() * supportedWeights.length)].value;
      state.customFontWeight = pickedWeight;
    }
    const weightSelect = document.getElementById('custom-weight-select');
    if (weightSelect) weightSelect.value = state.customFontWeight;

    // Custom Color
    const colors = ['auto', 'pure-black', 'white-out', 'matrix-green', 'neon-cyan', 'hot-pink', 'acid-lime', 'laser-purple', 'solar-orange', 'neon-yellow', 'cyan-glow', 'neon-mint', 'magenta-fade', 'golden-shine', 'blood-red', 'cyber-sunset', 'toxic-waste', 'deep-space', 'electric-indigo', 'holo-foil', 'lava-lamp', 'chrome-fade', 'carbon-metal', 'rainbow-fade'];
    if (!profile.lockTextColor && !isBlockLocked('text')) {
      state.customTextColor = colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Sync Custom color trigger UI
    const selectedSquare = document.getElementById('selected-color-square');
    if (selectedSquare) {
      selectedSquare.className = `color-square ${state.customTextColor}-square`;
    }
    document.querySelectorAll('.color-dropdown-item').forEach(i => {
      i.classList.toggle('active', i.dataset.value === state.customTextColor);
    });

    // 8. Effects (Only lightweight effects in random to avoid GPU/CPU filter bottleneck)
    const effects = ['vignette', 'grain', 'scanlines', 'chromatic', 'glitch', 'static'];
    if (!isBlockLocked('effects')) {
      effects.forEach(fx => {
        state[fx] = false;
        const el = document.getElementById(`fx-${fx}`);
        if (el) el.checked = false;
      });

      // Only allow cheap effects in random (glitch/chromatic/static use expensive SVG filters)
      const cheapEffects = ['vignette', 'grain', 'scanlines'];
      const numActiveFx = Math.floor(Math.random() * (Math.max(0, profile.cheapFxMax) + 1));
      const shuffledFx = [...cheapEffects].sort(() => 0.5 - Math.random());
      for (let i = 0; i < numActiveFx; i++) {
        const fx = shuffledFx[i];
        state[fx] = true;
        const el = document.getElementById(`fx-${fx}`);
        if (el) el.checked = true;
      }

      // Scanlines canvas class sync
      const canvasScanlines = document.querySelector('.canvas-scanlines');
      if (canvasScanlines) {
        canvasScanlines.classList.toggle('hidden', !state.scanlines);
      }
    }

    // 9. Eurorack LFO settings
    const waves = ['sine', 'triangle', 'sawtooth', 'square', 'random'];
    if (!isBlockLocked('lfo')) {
      state.lfos.forEach((lfo, i) => {
        if (!profile.keepLfoWave) {
          lfo.wave = waves[Math.floor(Math.random() * waves.length)];
        }
        if (typeof profile.lfoRateJitter === 'number') {
          lfo.rate = clamp(lfo.rate + randInt(-profile.lfoRateJitter, profile.lfoRateJitter), 1, 100);
        } else {
          lfo.rate = Math.floor(Math.random() * 50) + 5;
        }
        const slider = document.querySelector(`.lfo-rate-slider[data-lfo="${i}"]`);
        if (slider) slider.value = lfo.rate;
        const valEl = document.querySelector(`.lfo-rate-val[data-lfo="${i}"]`);
        if (valEl) valEl.textContent = lfo.rate;
        document.querySelectorAll(`.lfo-wave-btn[data-lfo="${i}"]`).forEach(b =>
          b.classList.toggle('active', b.dataset.wave === lfo.wave));
      });
    }

    // Clear all patches, then randomly connect 2-4
    const allDests = Object.keys(state.patches);
    const allowedDests = allDests.filter(dest => {
      const blockKey = getDestBlockKey(dest);
      return blockKey ? !isBlockLocked(blockKey) : true;
    });
    if (profile.preservePatches) {
      const patchJitter = typeof profile.patchJitter === 'number' ? profile.patchJitter : 10;
      let hasAnyPatch = false;
      allowedDests.forEach(dest => {
        for (let l = 0; l < MOD_SOURCE_COUNT; l++) {
          const depth = state.patches[dest][l];
          if (depth === null) continue;
          hasAnyPatch = true;
          state.patches[dest][l] = clamp(depth + randInt(-patchJitter, patchJitter), 10, 100);
        }
      });
      if (!hasAnyPatch) {
        const d = allowedDests[Math.floor(Math.random() * allowedDests.length)];
        const l = Math.floor(Math.random() * MOD_SOURCE_COUNT);
        state.patches[d][l] = randInt(50, 80);
      }
    } else {
      allDests.forEach(k => { state.patches[k] = new Array(MOD_SOURCE_COUNT).fill(null); });
      const allCombos = [];
      for (let l = 0; l < MOD_SOURCE_COUNT; l++) for (const d of allowedDests) allCombos.push([l, d]);
      const shuffled = allCombos.sort(() => 0.5 - Math.random());
      const numPatches = Math.floor(Math.random() * (profile.patches[1] - profile.patches[0] + 1)) + profile.patches[0];
      for (let i = 0; i < numPatches; i++) {
        const [l, d] = shuffled[i];
        state.patches[d][l] = Math.floor(Math.random() * 60) + 40; // 40-100%
      }
    }
    if (profile.lockMode || isBlockLocked('mode')) {
      state.patches.mode = new Array(MOD_SOURCE_COUNT).fill(null);
    }
    renderPatchBay();

    // Sync animBases with the new randomized values
    animBases.detail = state.detail;
    animBases.weight = state.weight;
    animBases.chaos = state.chaos;
    animBases.textAmount = state.textAmount;
    animBases.customTextAmount = state.customTextAmount;
    animBases.customTextSize = state.customTextSize;
    animBases.seed = state.seed;

    const PALETTES = ['mono', 'cyber', 'neon', 'blood', 'ice', 'gold', 'vaporwave', 'matrix', 'rust', 'gundam', 'evangelion'];
    animBases.paletteIdx = PALETTES.indexOf(state.palette);
    if (animBases.paletteIdx === -1) animBases.paletteIdx = 0;

    const BACKGROUNDS = ['light', 'dark', 'paper', 'black', 'midnight', 'sepia', 'violet', 'jade', 'wine', 'steel', 'copper', 'slate'];
    animBases.bgIdx = BACKGROUNDS.indexOf(state.bg);
    if (animBases.bgIdx === -1) animBases.bgIdx = 0;

    const MODES = ['vectorheart','circuit','hud','glitch','blueprint','chaos','flow','sacred','glyph','volumetric','gundam','evangelion'];
    animBases.modeIdx = MODES.indexOf(state.mode);
    if (animBases.modeIdx === -1) animBases.modeIdx = 0;

    // Draw the new design!
    state.isBatchUpdating = false;
    draw(0, true);
    document.getElementById('footer-info').textContent = `RANDOMIZADO::${state.seed} (${profile.label})`;
  }

  // Global randomizer click event
  const btnRandomAll = document.getElementById('btn-random-all');
  const btnRandomLevel = document.getElementById('btn-random-level');
  const btnAutopilot = document.getElementById('btn-autopilot');
  const btnAutopilotLevel = document.getElementById('btn-autopilot-level');
  const RANDOM_LEVELS = [
    {
      key: 'soft',
      label: 'RND::SUAVE',
      lockMode: true,
      detail: [28, 58],
      weight: [0, 58],
      chaos: [0, 30],
      text: [0, 25],
      customDensity: [0, 14],
      customSize: [14, 54],
      customOpacity: [35, 75],
      speed: [8, 24],
      patches: [1, 3],
      cheapFxMax: 1
    },
    {
      key: 'medium',
      label: 'RND::MED',
      lockMode: false,
      detail: [30, 75],
      weight: [0, 79],
      chaos: [0, 59],
      text: [0, 39],
      customDensity: [0, 25],
      customSize: [15, 74],
      customOpacity: [30, 80],
      speed: [10, 39],
      patches: [2, 4],
      cheapFxMax: 1
    },
    {
      key: 'aggressive',
      label: 'RND::AGRO',
      lockMode: false,
      detail: [38, 85],
      weight: [10, 95],
      chaos: [10, 78],
      text: [8, 58],
      customDensity: [5, 34],
      customSize: [16, 95],
      customOpacity: [35, 90],
      speed: [18, 55],
      patches: [3, 5],
      cheapFxMax: 2
    }
  ];
  const AUTOPILOT_LEVELS = [
    { key: 'soft', label: 'AP::SUAVE', intervalMs: 5200 },
    { key: 'medium', label: 'AP::MED', intervalMs: 3800 },
    { key: 'aggressive', label: 'AP::AGRO', intervalMs: 2400 }
  ];
  const AUTOPILOT_SOFT_PROFILE = {
    key: 'ap-soft',
    label: 'AP::SUAVE',
    lockSeed: true,
    lockMode: true,
    lockSymmetry: true,
    lockPalette: true,
    lockBg: true,
    lockTypography: true,
    lockTextColor: true,
    detail: [46, 58],
    weight: [8, 24],
    chaos: [0, 14],
    text: [0, 10],
    customDensity: [0, 8],
    customSize: [16, 30],
    customOpacity: [60, 80],
    cheapFxMax: 0,
    patches: [1, 2],
    preservePatches: true,
    patchJitter: 8,
    keepLfoWave: true,
    lfoRateJitter: 3
  };
  let randomLevelIdx = 1;
  let autopilotLevelIdx = 1;
  let autopilotEnabled = false;
  let autopilotTimer = null;
  if (btnRandomAll) {
    let randomizeInProgress = false;
    let randomIconTimer = null;
    let randomizeCooldownUntil = 0;
    let autopilotTick = 0;

    const AUTOPILOT_MUTATION = {
      soft: {
        detailStep: 2,
        weightStep: 2,
        chaosStep: 2,
        textStep: 1,
        densityStep: 1,
        sizeStep: 1,
        opacityStep: 2,
        lfoRateStep: 1,
        lfoWaveChance: 0.02,
        paletteChance: 0.015,
        bgChance: 0.015,
        modeChance: 0.0,
        seedChance: 0.0,
        patchChangeChance: 0.12,
        effectToggleChance: 0.05,
        allowModeChange: false
      },
      medium: {
        detailStep: 4,
        weightStep: 4,
        chaosStep: 4,
        textStep: 3,
        densityStep: 2,
        sizeStep: 2,
        opacityStep: 4,
        lfoRateStep: 2,
        lfoWaveChance: 0.06,
        paletteChance: 0.05,
        bgChance: 0.05,
        modeChance: 0.03,
        seedChance: 0.02,
        patchChangeChance: 0.2,
        effectToggleChance: 0.09,
        allowModeChange: true
      },
      aggressive: {
        detailStep: 7,
        weightStep: 7,
        chaosStep: 7,
        textStep: 5,
        densityStep: 4,
        sizeStep: 4,
        opacityStep: 7,
        lfoRateStep: 4,
        lfoWaveChance: 0.12,
        paletteChance: 0.1,
        bgChance: 0.1,
        modeChance: 0.08,
        seedChance: 0.05,
        patchChangeChance: 0.34,
        effectToggleChance: 0.15,
        allowModeChange: true
      }
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

    const setSliderUi = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = String(value);
      const valEl = document.getElementById(id.replace('-slider', '-val'));
      if (valEl) valEl.textContent = String(value);
    };

    const syncModePaletteBgUi = () => {
      const modeSelect = document.getElementById('mode-select');
      if (modeSelect) modeSelect.value = state.mode;
      const modeBadge = document.getElementById('mode-badge');
      if (modeBadge) modeBadge.textContent = `MODO::${state.mode.toUpperCase()}`;
      document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.palette === state.palette);
      });
      document.querySelectorAll('.bg-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.bg === state.bg);
      });
      document.querySelectorAll('.sym-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sym === state.symmetry);
      });
    };

    const syncAnimBasesFromState = () => {
      animBases.detail = state.detail;
      animBases.weight = state.weight;
      animBases.chaos = state.chaos;
      animBases.textAmount = state.textAmount;
      animBases.customTextAmount = state.customTextAmount;
      animBases.customTextSize = state.customTextSize;
      animBases.seed = state.seed;
      animBases.paletteIdx = PRESET_PALETTES.indexOf(state.palette);
      if (animBases.paletteIdx === -1) animBases.paletteIdx = 0;
      animBases.bgIdx = PRESET_BACKGROUNDS.indexOf(state.bg);
      if (animBases.bgIdx === -1) animBases.bgIdx = 0;
      animBases.modeIdx = PRESET_MODES.indexOf(state.mode);
      if (animBases.modeIdx === -1) animBases.modeIdx = 0;
    };

    const runAutopilotStep = (levelKey) => {
      const profile = AUTOPILOT_MUTATION[levelKey] || AUTOPILOT_MUTATION.medium;
      const waves = ['sine', 'triangle', 'sawtooth', 'square', 'random'];
      autopilotTick += 1;

      state.isBatchUpdating = true;

      if (!isBlockLocked('params')) {
        state.detail = clamp(state.detail + randInt(-profile.detailStep, profile.detailStep), 0, 100);
        state.weight = clamp(state.weight + randInt(-profile.weightStep, profile.weightStep), 0, 100);
        state.chaos = clamp(state.chaos + randInt(-profile.chaosStep, profile.chaosStep), 0, 100);
        state.textAmount = clamp(state.textAmount + randInt(-profile.textStep, profile.textStep), 0, 100);
        state.complexity = Math.round(state.detail * 40 / 100);
        state.density = Math.round(state.detail * 15 / 100);

        setSliderUi('detail-slider', state.detail);
        setSliderUi('weight-slider', state.weight);
        setSliderUi('chaos-slider', state.chaos);
        setSliderUi('text-slider', state.textAmount);
      }

      if (!isBlockLocked('text')) {
        state.customTextAmount = clamp(state.customTextAmount + randInt(-profile.densityStep, profile.densityStep), 0, 100);
        state.customTextSize = clamp(state.customTextSize + randInt(-profile.sizeStep, profile.sizeStep), 4, 150);
        state.customTextOpacity = clamp(state.customTextOpacity + randInt(-profile.opacityStep, profile.opacityStep), 0, 100);
        setSliderUi('custom-text-density-slider', state.customTextAmount);
        setSliderUi('custom-text-size-slider', state.customTextSize);
        setSliderUi('custom-text-opacity-slider', state.customTextOpacity);
      }

      if (!isBlockLocked('lfo')) {
        state.lfos.forEach((lfo, i) => {
          lfo.rate = clamp(lfo.rate + randInt(-profile.lfoRateStep, profile.lfoRateStep), 1, 100);
          if (Math.random() < profile.lfoWaveChance) lfo.wave = pickOne(waves);
          const slider = document.querySelector(`.lfo-rate-slider[data-lfo="${i}"]`);
          if (slider) slider.value = String(lfo.rate);
          const valEl = document.querySelector(`.lfo-rate-val[data-lfo="${i}"]`);
          if (valEl) valEl.textContent = String(lfo.rate);
          document.querySelectorAll(`.lfo-wave-btn[data-lfo="${i}"]`).forEach(b => {
            b.classList.toggle('active', b.dataset.wave === lfo.wave);
          });
        });
      }

      const canShiftScene = autopilotTick % 3 === 0;
      const canShiftMode = autopilotTick % 6 === 0;
      if (canShiftScene && Math.random() < profile.paletteChance && !isBlockLocked('palette')) state.palette = pickOne(PRESET_PALETTES);
      if (canShiftScene && Math.random() < profile.bgChance && !isBlockLocked('bg')) state.bg = pickOne(PRESET_BACKGROUNDS);
      if (canShiftMode && profile.allowModeChange && Math.random() < profile.modeChance && !isBlockLocked('mode')) state.mode = pickOne(PRESET_MODES);
      if (Math.random() < profile.seedChance) {
        const nextSeed = Math.floor(Math.random() * 99999999);
        triggerFade(nextSeed);
      }

      if (!isBlockLocked('effects') && Math.random() < profile.effectToggleChance) {
        const cheapFx = ['vignette', 'grain', 'scanlines'];
        const fx = pickOne(cheapFx);
        state[fx] = !state[fx];
        const el = document.getElementById(`fx-${fx}`);
        if (el) el.checked = !!state[fx];
        if (fx === 'scanlines') {
          document.querySelector('.canvas-scanlines')?.classList.toggle('hidden', !state.scanlines);
        }
      }

      if (Math.random() < profile.patchChangeChance) {
        const allowedDests = Object.keys(state.patches).filter(dest => {
          const blockKey = getDestBlockKey(dest);
          return blockKey ? !isBlockLocked(blockKey) : true;
        });
        if (allowedDests.length === 0) {
          syncModePaletteBgUi();
          renderPatchBay();
          syncAnimBasesFromState();
          state.isBatchUpdating = false;
          if (!state.animating) draw(0, true);
          document.getElementById('footer-info').textContent = `AUTOPILOT::ON (${AUTOPILOT_LEVELS[autopilotLevelIdx].label}) STEP ${autopilotTick}`;
          return;
        }
        const dest = pickOne(allowedDests);
        const src = randInt(0, MOD_SOURCE_COUNT - 1);
        const current = state.patches[dest][src];
        if (current === null) {
          state.patches[dest][src] = randInt(35, 85);
        } else if (Math.random() < 0.2) {
          state.patches[dest][src] = null;
        } else {
          state.patches[dest][src] = clamp(current + randInt(-12, 12), 10, 100);
        }
      }

      syncModePaletteBgUi();
      renderPatchBay();
      syncAnimBasesFromState();

      state.isBatchUpdating = false;
      if (!state.animating) draw(0, true);
      document.getElementById('footer-info').textContent = `AUTOPILOT::ON (${AUTOPILOT_LEVELS[autopilotLevelIdx].label}) STEP ${autopilotTick}`;
    };

    const animateRandomIcon = () => {
      const icon = btnRandomAll.querySelector('span');
      if (!icon) return;
      if (randomIconTimer) clearTimeout(randomIconTimer);
      icon.style.transition = 'transform 0.4s ease';
      icon.style.transform = 'rotate(360deg)';
      randomIconTimer = setTimeout(() => {
        icon.style.transform = 'rotate(0deg)';
        icon.style.transition = 'none';
        randomIconTimer = null;
      }, 420);
    };

    const runRandomize = (options = {}) => {
      const useFade = !!options.useFade;
      const profileOverride = options.profileOverride || null;
      const now = performance.now();
      if (now < randomizeCooldownUntil) return;
      randomizeInProgress = true;
      btnRandomAll.disabled = true;
      if (btnAutopilot) btnAutopilot.disabled = true;

      requestAnimationFrame(() => {
        try {
          randomizeEverything(profileOverride || RANDOM_LEVELS[randomLevelIdx], { useFade });
          animateRandomIcon();
        } finally {
          randomizeCooldownUntil = performance.now() + 180;
          randomizeInProgress = false;
          btnRandomAll.disabled = false;
          if (btnAutopilot) btnAutopilot.disabled = false;
        }
      });
    };

    const syncRandomLevelUi = () => {
      if (btnRandomLevel) {
        btnRandomLevel.textContent = RANDOM_LEVELS[randomLevelIdx].label;
      }
    };

    const stopAutopilot = () => {
      autopilotEnabled = false;
      if (autopilotTimer) {
        clearInterval(autopilotTimer);
        autopilotTimer = null;
      }
      if (btnAutopilot) {
        btnAutopilot.classList.remove('active');
        btnAutopilot.innerHTML = '<span>◆</span> AUTOPILOT';
      }
      document.getElementById('footer-info').textContent = `AUTOPILOT::OFF (${AUTOPILOT_LEVELS[autopilotLevelIdx].label})`;
    };

    const armAutopilotTimer = () => {
      if (autopilotTimer) clearInterval(autopilotTimer);
      const intervalMs = AUTOPILOT_LEVELS[autopilotLevelIdx].intervalMs;
      autopilotTimer = setInterval(() => {
        if (!autopilotEnabled) return;
        const apLevel = AUTOPILOT_LEVELS[autopilotLevelIdx];
        runAutopilotStep(apLevel.key);
      }, intervalMs);
    };

    const syncAutopilotLevelUi = () => {
      if (btnAutopilotLevel) {
        btnAutopilotLevel.textContent = AUTOPILOT_LEVELS[autopilotLevelIdx].label;
      }
      if (autopilotEnabled) {
        document.getElementById('footer-info').textContent = `AUTOPILOT::ON (${AUTOPILOT_LEVELS[autopilotLevelIdx].label})`;
      }
    };

    const startAutopilot = () => {
      autopilotEnabled = true;
      autopilotTick = 0;
      if (btnAutopilot) {
        btnAutopilot.classList.add('active');
        btnAutopilot.innerHTML = '<span>◆</span> AUTOPILOT';
      }
      if (!state.animating) startAnimation();
      const apLevel = AUTOPILOT_LEVELS[autopilotLevelIdx];
      runAutopilotStep(apLevel.key);
      armAutopilotTimer();
      document.getElementById('footer-info').textContent = `AUTOPILOT::ON (${AUTOPILOT_LEVELS[autopilotLevelIdx].label})`;
    };

    btnRandomAll.addEventListener('click', () => {
      if (randomizeInProgress) return;
      runRandomize({ useFade: false });
    });

    if (btnRandomLevel) {
      syncRandomLevelUi();
      btnRandomLevel.addEventListener('click', () => {
        randomLevelIdx = (randomLevelIdx + 1) % RANDOM_LEVELS.length;
        syncRandomLevelUi();
        document.getElementById('footer-info').textContent = `RANDOM::INTENSIDAD (${RANDOM_LEVELS[randomLevelIdx].label})`;
      });
    }

    if (btnAutopilot) {
      btnAutopilot.addEventListener('click', () => {
        if (autopilotEnabled) stopAutopilot();
        else startAutopilot();
      });
    }

    if (btnAutopilotLevel) {
      syncAutopilotLevelUi();
      btnAutopilotLevel.addEventListener('click', () => {
        autopilotLevelIdx = (autopilotLevelIdx + 1) % AUTOPILOT_LEVELS.length;
        syncAutopilotLevelUi();
        if (autopilotEnabled) armAutopilotTimer();
      });
    }

    window.addEventListener('beforeunload', () => {
      if (autopilotTimer) clearInterval(autopilotTimer);
    });
  }

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));

  // Action buttons
  document.getElementById('btn-init').addEventListener('click', applyInitState);

  document.getElementById('btn-init').addEventListener('click', applyInitState);

  document.getElementById('btn-rnd-lfo').addEventListener('click', () => {
    const destKeys = Object.keys(state.patches).filter(dest => dest !== 'mode');
    // Clear existing LFO patches first
    destKeys.forEach(dest => {
      for (let i = 0; i < LFO_SOURCE_COUNT; i++) state.patches[dest][i] = null;
    });
    // Each LFO source (L1/L2/L3) gets 1–3 random connections
    for (let src = 0; src < LFO_SOURCE_COUNT; src++) {
      const numConns = 1 + Math.floor(Math.random() * 3);
      const shuffled = [...destKeys].sort(() => Math.random() - 0.5);
      for (let j = 0; j < Math.min(numConns, shuffled.length); j++) {
        const dest = shuffled[j];
        state.patches[dest][src] = 30 + Math.floor(Math.random() * 61); // 30–90 depth
        const row = document.querySelector(`.patch-dest-row[data-dest="${dest}"]`);
        const group = row?.closest('.patch-group')?.dataset.group;
        if (group) patchGroupState[group] = true;
      }
    }
    renderPatchBay();
    updatePatchGroupUi();
    document.getElementById('footer-info').textContent = 'LFO::RANDOM PATCHES APLICADOS';
  });

  // Patch bay clear/random buttons
  document.getElementById('btn-clr-lfo').addEventListener('click', () => {
    Object.keys(state.patches).forEach(dest => {
      for (let i = 0; i < LFO_SOURCE_COUNT; i++) state.patches[dest][i] = null;
    });
    renderPatchBay();
    document.getElementById('footer-info').textContent = 'LFO::PATCHES LIMPIADOS';
  });

  document.getElementById('btn-clr-audio').addEventListener('click', () => {
    Object.keys(state.patches).forEach(dest => {
      for (let i = LFO_SOURCE_COUNT; i < MOD_SOURCE_COUNT; i++) state.patches[dest][i] = null;
    });
    renderPatchBay();
    document.getElementById('footer-info').textContent = 'AUD::PATCHES LIMPIADOS';
  });

  document.getElementById('btn-rnd-audio').addEventListener('click', () => {
    const destKeys = Object.keys(state.patches).filter(dest => dest !== 'mode');
    // Clear existing band patches first
    destKeys.forEach(dest => {
      for (let i = LFO_SOURCE_COUNT; i < MOD_SOURCE_COUNT; i++) state.patches[dest][i] = null;
    });
    // Each band source (LOW/MID/HIGH) gets 1–3 random connections
    for (let src = LFO_SOURCE_COUNT; src < MOD_SOURCE_COUNT; src++) {
      const numConns = 1 + Math.floor(Math.random() * 3);
      const shuffled = [...destKeys].sort(() => Math.random() - 0.5);
      for (let j = 0; j < Math.min(numConns, shuffled.length); j++) {
        const dest = shuffled[j];
        state.patches[dest][src] = 40 + Math.floor(Math.random() * 51); // 40–90 depth
        // Expand the group containing this dest so it’s visible
        const row = document.querySelector(`.patch-dest-row[data-dest="${dest}"]`);
        const group = row?.closest('.patch-group')?.dataset.group;
        if (group) patchGroupState[group] = true;
      }
    }
    renderPatchBay();
    updatePatchGroupUi();
    document.getElementById('footer-info').textContent = 'AUD::RANDOM PATCHES APLICADOS';
  });

  document.getElementById('btn-generate').addEventListener('click', () => {
    setSeedValue(Math.floor(Math.random() * 99999999), { syncInput: true, syncBase: true });
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    draw(0, true);
    document.getElementById('footer-info').textContent = `GENERADA::${state.seed}`;
  });

  // (legacy full-clear kept for applyInitState — no UI button)

  document.getElementById('btn-download-fhd').addEventListener('click', () => downloadPNGAtSize('fhd'));
  document.getElementById('btn-download-2k').addEventListener('click', () => downloadPNGAtSize('2k'));
  document.getElementById('btn-download-4k').addEventListener('click', () => downloadPNGAtSize('4k'));
  document.getElementById('btn-download-svg').addEventListener('click', downloadSVG);
  document.getElementById('btn-live-output').addEventListener('click', () => {
    toggleLiveOutput();
  });
  document.getElementById('btn-record-video').addEventListener('click', () => {
    startVideoRecording();
  });

  document.getElementById('btn-stop-recording').addEventListener('click', () => {
    if (recordingState.isRecording && recordingState.recorder &&
        recordingState.recorder.state !== 'inactive') {
      recordingState.recorder.stop();
    }
  });

  document.getElementById('seed-input').addEventListener('change', e => {
    setSeedValue(parseInt(e.target.value, 10) || 0, { syncInput: true, syncBase: true });
    if (!state.animating) draw(0, true);
  });

  document.getElementById('btn-random-seed').addEventListener('click', () => {
    setSeedValue(Math.floor(Math.random() * 99999999), { syncInput: true, syncBase: true });
    if (!state.animating) draw(0, true);
  });

  function toggleFullscreen() {
    const wrapper = document.querySelector('.canvas-wrapper');
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    switch (e.key.toLowerCase()) {
      case 'g': document.getElementById('btn-generate').click(); break;
      case 'r': document.getElementById('btn-random-all').click(); break;
      case 'a': document.getElementById('btn-autopilot').click(); break;
      case 'f': toggleFullscreen(); break;
      case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': {
        const modes = ['vectorheart','circuit','hud','glitch','blueprint','chaos','flow','sacred','glyph'];
        const m = modes[parseInt(e.key) - 1]; if (m) { document.getElementById(`mode-${m}`)?.click(); } break;
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    teardownLiveOutput(true);
  });

  // Mobile Pagination Tab Setup
  const TABS = [
    { name: "AJUSTES [01/07]", panel: "left", sections: [".section-mode", ".section-symmetry"] },
    { name: "ESTILO [02/07]", panel: "left", sections: [".section-style"] },
    { name: "PARÁMETROS [03/07]", panel: "left", sections: [".section-params"] },
    { name: "TEXTO [04/07]", panel: "left", sections: [".section-text"] },
    { name: "EFECTOS [05/07]", panel: "left", sections: [".section-effects"] },
    { name: "ANIMACIÓN [06/07]", panel: "right", sections: [".section-anim"] },
    { name: "ACCIONES [07/07]", panel: "right", sections: [".section-actions"] }
  ];

  function syncMobileTabs() {
    const isMobile = window.innerWidth <= 768;
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');

    if (!isMobile) {
      if (leftPanel) {
        leftPanel.style.display = '';
        leftPanel.querySelectorAll('.panel-section').forEach(sec => {
          if (!sec.classList.contains('section-style')) {
            sec.style.display = '';
          } else {
            sec.style.display = 'none'; // Keep style duplicate hidden on desktop
          }
        });
      }
      if (rightPanel) {
        rightPanel.style.display = '';
        rightPanel.querySelectorAll('.panel-section').forEach(sec => {
          sec.style.display = '';
        });
      }
      return;
    }

    const currentTab = TABS[state.activeTab];
    const labelEl = document.getElementById('mobile-tab-label');
    if (labelEl) {
      labelEl.textContent = currentTab.name;
    }

    if (currentTab.panel === 'left') {
      if (leftPanel) leftPanel.style.display = 'block';
      if (rightPanel) rightPanel.style.display = 'none';
    } else {
      if (leftPanel) leftPanel.style.display = 'none';
      if (rightPanel) rightPanel.style.display = 'block';
    }

    [leftPanel, rightPanel].forEach(panel => {
      if (!panel) return;
      panel.querySelectorAll('.panel-section').forEach(sec => {
        const matches = currentTab.sections.some(sel => sec.classList.contains(sel.substring(1)));
        sec.style.display = matches ? 'block' : 'none';
      });
    });
  }

  // Bind tab navigation click events
  const btnTabPrev = document.getElementById('btn-tab-prev');
  const btnTabNext = document.getElementById('btn-tab-next');

  if (btnTabPrev && btnTabNext) {
    btnTabPrev.addEventListener('click', () => {
      state.activeTab = (state.activeTab - 1 + TABS.length) % TABS.length;
      syncMobileTabs();
      resizeCanvas();
    });

    btnTabNext.addEventListener('click', () => {
      state.activeTab = (state.activeTab + 1) % TABS.length;
      syncMobileTabs();
      resizeCanvas();
    });
  }

  // Mobile gallery toggle (remains functional in collapsed area)
  const galleryArea = document.getElementById('gallery-area');
  const btnToggleGallery = document.getElementById('btn-toggle-gallery');
  if (btnToggleGallery && galleryArea) {
    btnToggleGallery.addEventListener('click', () => {
      galleryArea.classList.toggle('expanded');
    });
  }

  window.addEventListener('resize', () => {
    syncMobileTabs();
    resizeCanvas();
  });

  // ─── INIT ─────────────────────────────────────────────────────────────────
  sortFontOptions();
  document.getElementById('seed-input').value = state.seed;
  document.getElementById('fx-vignette').checked = state.vignette;
  document.getElementById('fx-grain').checked = state.grain;
  document.getElementById('fx-scanlines').checked = state.scanlines;
  document.querySelector('.canvas-scanlines').classList.toggle('hidden', !state.scanlines);
  document.getElementById('fx-chromatic').checked = state.chromatic;
  document.getElementById('fx-glitch').checked = state.glitch;
  document.getElementById('fx-static').checked = state.static;
  renderPatchBay();
  updateWeightSelector();
  initMidiLearn();
  initUserPresetControls();
  syncMobileTabs();
  resizeCanvas();
  applyInitState();   // carga siempre en estado mínimo
  startAnimation();   // animación siempre activa desde el inicio

})();
