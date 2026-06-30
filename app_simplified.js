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
      this.currentPath = '';
    }

    moveTo(x, y) {
      if (this.currentPath === null) this.beginPath();
      this.currentPath += ` M ${x.toFixed(2)} ${y.toFixed(2)}`;
    }

    lineTo(x, y) {
      if (this.currentPath === null) this.beginPath();
      this.currentPath += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
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
        const pathNode = `<path d="${this.currentPath}" ${this._getAttrs(true, false)} />`;
        if (this.isDrawingOverlay) {
          this.overlayElements.push(pathNode);
        } else {
          this.elements.push(pathNode);
        }
      }
    }

    rect(x, y, w, h) {
      this.moveTo(x, y);
      this.lineTo(x + w, y);
      this.lineTo(x + w, y + h);
      this.lineTo(x, y + h);
      this.closePath();
    }

    fillRect(x, y, w, h) {
      let fill = this.state.fillStyle;
      if (fill && typeof fill === 'object' && fill.isVignette) {
        const rectNode = `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="url(#vignette-grad)" pointer-events="none" />`;
        if (this.isDrawingOverlay) {
          this.overlayElements.push(rectNode);
        } else {
          this.elements.push(rectNode);
        }
        return;
      }
      const rectNode = `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" ${this._getAttrs(true, false)} />`;
      if (this.isDrawingOverlay) {
        this.overlayElements.push(rectNode);
      } else {
        this.elements.push(rectNode);
      }
    }

    strokeRect(x, y, w, h) {
      const rectNode = `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" ${this._getAttrs(false, true)} />`;
      if (this.isDrawingOverlay) {
        this.overlayElements.push(rectNode);
      } else {
        this.elements.push(rectNode);
      }
    }

    arc(x, y, r, startAngle, endAngle, anticlockwise = false) {
      if (this.currentPath === null) this.beginPath();
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
        this.currentPath += ` A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${mx.toFixed(2)} ${my.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${startX.toFixed(2)} ${startY.toFixed(2)}`;
      } else {
        let diff = endAngle - startAngle;
        if (anticlockwise) {
          if (diff > 0) diff -= Math.PI * 2;
        } else {
          if (diff < 0) diff += Math.PI * 2;
        }
        const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;
        const sweepFlag = anticlockwise ? 0 : 1;
        this.currentPath += ` A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${endX.toFixed(2)} ${endY.toFixed(2)}`;
      }
    }

    fillText(text, x, y) {
      const escapedText = text
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

      const textNode = `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${anchor}" ${this._getAttrs(true, false)}>${escapedText}</text>`;
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
    mode: 'vectorheart', palette: 'mono', bg: 'light',
    complexity: 0, density: 0, weight: 0, chaos: 0, textAmount: 0,
    customText: '', customFont: "'Share Tech Mono', monospace", customFontWeight: '400', customTextAmount: 0,
    customTextSize: 20, customTextOpacity: 70, customTextColor: 'auto',
    animComplexity: false, animDensity: false, animWeight: false, animChaos: false, animText: false,
    animCustomDensity: false, animCustomSize: false, animSeed: false, animPalette: false, animBg: false, animMode: false,
    animEffects: false,
    animSpeed: 15,
    animSpeedMod: 0,
    currentAnimSpeed: 15,
    animSpeedModWave: 'triangle',
    animAmountComplexity: 100, animAmountDensity: 100, animAmountWeight: 100, animAmountChaos: 100, animAmountText: 100,
    animAmountCustomDensity: 100, animAmountCustomSize: 100, animAmountSeed: 100, animAmountPalette: 100, animAmountBg: 100, animAmountMode: 100,
    animAmountEffects: 100,
    effectsIntensity: 1.0,
    animNoise: 0, fadeDuration: 3,
    symmetry: 'none',
    vignette: false, grain: false, scanlines: false,
    chromatic: false, glitch: false, static: false,
    animating: false, animFrame: null, animTime: 0,
    lastSeedChange: 0, elementCount: 0, fps: 60, lastFrameTime: 0,
    seed: Math.floor(Math.random() * 99999999),
    hasGenerated: true,
    animWave: 'triangle',
    activeTab: 0,
  };

  const customFontDataUrls = [];

  // Bases for organic parameter modulation (oscillating around active slider settings)
  const animBases = {
    complexity: 0,
    density: 0,
    weight: 0,
    chaos: 0,
    textAmount: 0,
    customTextAmount: 0,
    customTextSize: 20,
    paletteIdx: 0,
    bgIdx: 0,
    modeIdx: 0
  };

  // ── Canvas & SVG ───────────────────────────────────────────────────────────
  const canvas = document.getElementById('main-canvas');
  const ctx = canvas.getContext('2d');
  // Off-screen context is our custom SvgContext
  const offCanvas = { width: 1280, height: 720 };
  const offCtx = new SvgContext(1280, 720);
  let fadeActive = false, fadeProgress = 0, fadeStart = 0;

  function resizeCanvas() {}

  // Zoom and pan removed — composition system handles visual structure

  // ── Seeded RNG ─────────────────────────────────────────────────────────────
  let rngState = 0;
  function seedRng(s) {}
  function rng() {}
  function rngRange(a, b) {}
  function rngInt(a, b) {}
  function rngPick(arr) {}

  // ── Value Noise ────────────────────────────────────────────────────────────
  function smoothstep(t) {}
  function lerpN(a, b, t) {}
  function pseudoRnd(x, y) {}
  function valueNoise(x, y) {}

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
    evangelion:{ bg_light:'#fff0e8', bg_dark:'#0d0200', bg_paper:'#fff5f0', bg_black:'#080000', colors:['#ff6600','#ff2200','#ffaa00','#ffffff','#cc3300','#ff8800'], accent:'#ff6600', thin:'#ff660044' },
  };

  function getPalette() {}
  function getBgColor() {}
  function getColors() {}
  function getAccent() {}
  function getThin() {}
  function lw(base = 1) {}
  function lf(base = 8) {}

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

  function buildComposition(W, H) {}

  // ─────────────────────────────────────────────────────────────────────────
  //  DRAW MODES (all draw to offCtx)
  // ─────────────────────────────────────────────────────────────────────────

  function drawVectorheart(t = 0, isDetailPass = false) {}

  function drawCircuit(t = 0, isDetailPass = false) {}

  function drawHud(t = 0, isDetailPass = false) {}

  function drawGlitch(t = 0, isDetailPass = false) {}

  function drawBlueprint(t = 0, isDetailPass = false) {}

  function drawChaos(t = 0, isDetailPass = false) {})();
