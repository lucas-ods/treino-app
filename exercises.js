'use strict';
/* =========================================================
   Biblioteca de exercícios
   Cada ilustração é um boneco (vista lateral ou frontal) descrito por poses-chave.
   O motor interpola os ângulos das articulações e gera um SVG animado (SMIL).

   Ângulos em graus: 0 = direita, 90 = baixo, 180 = esquerda, -90 = cima.
   Vista lateral (boneco olhando para a direita):
     h:[x,y] quadril · t: ângulo do tronco · ha: inclinação da cabeça
     aN/aF: braço perto/longe  [ombro→cotovelo, cotovelo→mão]  ou  {ik:[x,y], bend:±1}
     lN/lF: perna perto/longe  [quadril→joelho, joelho→tornozelo, pé]  ou  {ik:[x,y], bend, foot}
   Vista frontal: h = pelve · arms/legs (lado direito, o esquerdo é espelhado) · ou aR/aL/lR/lL
   Comprimentos podem ser trocados por pose: tl tronco, ua braço, fa antebraço, th coxa, sn canela, hd cabeça.
   ========================================================= */
(() => {
  const D = Math.PI / 180;
  const LEN = { side: { tl: 50, hd: 20, ua: 30, fa: 28, th: 40, sn: 38, ft: 12, hr: 12 },
                front: { tl: 46, hd: 20, ua: 30, fa: 28, th: 40, sn: 38, ft: 7, sw: 15, hw: 8, hr: 12 } };
  const v = (a) => [Math.cos(a * D), Math.sin(a * D)];
  const mv = (p, a, l) => { const d = v(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; };
  const addv = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s];

  function ik(a, c, l1, l2, bend) {
    const dx = c[0] - a[0], dy = c[1] - a[1];
    const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
    const A = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
    const ang = Math.atan2(dy, dx) + bend * A;
    return [a[0] + l1 * Math.cos(ang), a[1] + l1 * Math.sin(ang)];
  }
  function limb(o, spec, l1, l2) {
    if (Array.isArray(spec)) { const m = mv(o, spec[0], l1); return [m, mv(m, spec[1], l2), spec[2]]; }
    const m = ik(o, spec.ik, l1, l2, spec.bend ?? -1);
    const dx = spec.ik[0] - m[0], dy = spec.ik[1] - m[1], d = Math.hypot(dx, dy);
    const end = d > l2 ? [m[0] + dx / d * l2, m[1] + dy / d * l2] : spec.ik;
    return [m, end, spec.foot];
  }
  const mir = (s, cx) => {
    if (!s) return s;
    if (Array.isArray(s)) return s.map((a) => 180 - a);
    return { ik: [2 * cx - s.ik[0], s.ik[1]], bend: -(s.bend ?? -1), foot: s.foot != null ? 180 - s.foot : undefined };
  };

  function sideJoints(p) {
    const l = (k) => p[k] ?? LEN.side[k];
    const J = { hip: p.h };
    J.sh = mv(J.hip, p.t, l('tl'));
    J.head = mv(J.sh, p.t + (p.ha || 0), l('hd'));
    for (const s of ['N', 'F']) {
      const a = p['a' + s];
      if (a) { const [e, w] = limb(J.sh, a, l('ua'), l('fa')); J['e' + s] = e; J['w' + s] = w; }
      const g = p['l' + s];
      if (g) { const [k, an, ft] = limb(J.hip, g, l('th'), l('sn')); J['k' + s] = k; J['an' + s] = an; J['to' + s] = mv(an, ft ?? 0, l('ft')); }
    }
    return J;
  }
  function frontJoints(p) {
    const l = (k) => p[k] ?? LEN.front[k];
    const d = v(p.t), side = [-d[1], d[0]];
    const J = { pel: p.h };
    J.neck = addv(J.pel, d, l('tl'));
    J.head = addv(J.neck, v(p.t + (p.ha || 0)), l('hd'));
    J.shR = addv(J.neck, side, l('sw')); J.shL = addv(J.neck, side, -l('sw'));
    J.hipR = addv(J.pel, side, l('hw')); J.hipL = addv(J.pel, side, -l('hw'));
    const cx = p.h[0];
    const arms = { R: p.aR ?? p.arms, L: p.aL ?? mir(p.arms, cx) };
    const legs = { R: p.lR ?? p.legs, L: p.lL ?? mir(p.legs, cx) };
    for (const s of ['R', 'L']) {
      if (arms[s]) { const [e, w] = limb(J['sh' + s], arms[s], l('ua'), l('fa')); J['e' + s] = e; J['w' + s] = w; }
      if (legs[s]) {
        const [k, an, ft] = limb(J['hip' + s], legs[s], l('th'), l('sn'));
        J['k' + s] = k; J['an' + s] = an; J['to' + s] = mv(an, ft ?? (s === 'R' ? 10 : 170), l('ft'));
      }
    }
    return J;
  }

  /* ---------- interpolação ---------- */
  function lerp(a, b, u) {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * u;
    if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => lerp(x, b[i], u));
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const o = { ...a };
      for (const k in b) o[k] = k in a ? lerp(a[k], b[k], u) : b[k];
      return o;
    }
    return u < 0.5 ? a : b;
  }
  const easeIO = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  function makeFrames(spec, jf) {
    const seq = (spec.seq || [[0, {}]]).map(([t, p]) => [t, { ...spec.base, ...p }]);
    if (seq.length === 1) return [{ t: 0, J: jf(seq[0][1]) }];
    const out = [];
    for (let i = 0; i < seq.length - 1; i++) {
      const [t0, p0] = seq[i], [t1, p1] = seq[i + 1];
      const same = JSON.stringify(p0) === JSON.stringify(p1);
      const n = same ? 1 : Math.max(3, Math.round((t1 - t0) * 30));
      for (let k = 0; k < n; k++) { const u = k / n; out.push({ t: t0 + (t1 - t0) * u, J: jf(lerp(p0, p1, same ? 0 : easeIO(u))) }); }
    }
    out.push({ t: 1, J: jf(seq[seq.length - 1][1]) });
    return out;
  }

  /* ---------- renderização ---------- */
  const TORSO = new Set(['hip', 'sh', 'pel', 'neck', 'shL', 'shR', 'hipL', 'hipR']);
  const f1 = (n) => Math.round(n * 10) / 10;
  const pt = (p) => `${f1(p[0])},${f1(p[1])}`;
  function res(ref, J) {
    if (typeof ref === 'string') return J[ref];
    if (Array.isArray(ref)) return ref;
    if (ref.mid) { const a = J[ref.mid[0]], b = J[ref.mid[1]]; return [(a[0] + b[0]) / 2 + (ref.dx || 0), (a[1] + b[1]) / 2 + (ref.dy || 0)]; }
    const p = J[ref.j]; return [p[0] + (ref.dx || 0), p[1] + (ref.dy || 0)];
  }

  function build(spec) {
    const front = spec.view === 'front';
    const jf = front ? frontJoints : sideJoints;
    const all = makeFrames(spec, jf);
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frames = all;
    if (reduce) { let best = all[0]; for (const f of all) if (Math.abs(f.t - 0.5) < Math.abs(best.t - 0.5)) best = f; frames = [best]; }
    const kt = frames.map((f) => f4(f.t)).join(';');
    const dur = spec.dur || '2.8s';
    function f4(n) { return Math.round(n * 10000) / 10000; }
    const anim = (attr, vals) => (vals.every((x) => x === vals[0]) ? null : `<animate attributeName="${attr}" values="${vals.join(';')}" keyTimes="${kt}" dur="${dur}" repeatCount="indefinite"/>`);
    const poly = (cls, fn, extra = '') => {
      const vals = frames.map((f) => fn(f.J).map(pt).join(' '));
      const a = anim('points', vals);
      return `<polyline class="${cls}" ${extra} points="${vals[0]}">${a || ''}</polyline>`;
    };
    const grp = (fn, inner) => {
      const vals = frames.map((f) => { const p = fn(f.J); return `${f1(p[0])} ${f1(p[1])}`; });
      const moving = !vals.every((x) => x === vals[0]);
      return `<g transform="translate(${vals[0]})">${moving ? `<animateTransform attributeName="transform" type="translate" values="${vals.join(';')}" keyTimes="${kt}" dur="${dur}" repeatCount="indefinite"/>` : ''}${inner}</g>`;
    };
    const head = () => {
      const cx = frames.map((f) => f1(f.J.head[0])), cy = frames.map((f) => f1(f.J.head[1]));
      return `<circle class="h" r="${LEN[front ? 'front' : 'side'].hr}" cx="${cx[0]}" cy="${cy[0]}">${anim('cx', cx) || ''}${anim('cy', cy) || ''}</circle>`;
    };
    const eqSvg = (e) => {
      if (e.k === 'plate') return grp((J) => res(e.at, J), `<circle class="eq" r="${e.r}"/><circle class="eq-in" r="${f1(e.r * 0.38)}"/>`);
      if (e.k === 'db') return grp((J) => res(e.at, J), '<rect class="eq" x="-12" y="-2.5" width="24" height="5" rx="2.5"/><rect class="eq" x="-16" y="-8" width="7" height="16" rx="2.5"/><rect class="eq" x="9" y="-8" width="7" height="16" rx="2.5"/>');
      if (e.k === 'grip') return grp((J) => res(e.at, J), '<rect class="eq" x="-4" y="-9" width="8" height="18" rx="4"/>');
      if (e.k === 'pad') return grp((J) => res(e.at, J), `<circle class="pad" r="${e.r}"/>`);
      if (e.k === 'line') return poly(e.cls || 'cable', (J) => [res(e.a, J), res(e.b, J)]);
      if (e.k === 'bar') return poly('barl', (J) => {
        const a = res(e.a, J), b = res(e.b, J), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, x = e.ext || 12;
        return [[a[0] - dx / d * x, a[1] - dy / d * x], [b[0] + dx / d * x, b[1] + dy / d * x]];
      });
      return '';
    };
    const hlSvg = (h) => poly('hl', (J) => {
      const a = res(h.a, J), b = res(h.b, J), dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const pp = [dy / d, -dx / d], o = h.off || 0, s0 = h.f0 ?? 0, s1 = h.f1 ?? 1;
      return [[a[0] + dx * s0 + pp[0] * o, a[1] + dy * s0 + pp[1] * o], [a[0] + dx * s1 + pp[0] * o, a[1] + dy * s1 + pp[1] * o]];
    }, `style="stroke-width:${h.w || 9}"`);

    const hls = (spec.hl || []).map((h) => (Array.isArray(h) ? { a: h[0], b: h[1] } : h));
    const isTorso = (h) => typeof h.a === 'string' && typeof h.b === 'string' && TORSO.has(h.a) && TORSO.has(h.b);
    const eqs = spec.eq || [];
    const eqZ = (z) => eqs.filter((e) => (e.z || 'front') === z).map(eqSvg).join('');
    const J0 = all[0].J;
    let body;
    if (front) {
      body = {
        far: '',
        torso: [J0.kR && poly('b', (J) => [J.hipR, J.kR, J.anR, J.toR]), J0.kL && poly('b', (J) => [J.hipL, J.kL, J.anL, J.toL]),
          poly('b', (J) => [J.hipL, J.hipR]), poly('b tf', (J) => [J.pel, J.neck]), poly('b', (J) => [J.shL, J.shR]), head()].filter(Boolean).join(''),
        near: [J0.eR && poly('b', (J) => [J.shR, J.eR, J.wR]), J0.eL && poly('b', (J) => [J.shL, J.eL, J.wL])].filter(Boolean).join(''),
      };
    } else {
      body = {
        far: [J0.kF && poly('b far', (J) => [J.hip, J.kF, J.anF, J.toF]), J0.eF && poly('b far', (J) => [J.sh, J.eF, J.wF])].filter(Boolean).join(''),
        torso: poly('b t', (J) => [J.hip, J.sh]) + head(),
        near: [J0.kN && poly('b', (J) => [J.hip, J.kN, J.anN, J.toN]), J0.eN && poly('b', (J) => [J.sh, J.eN, J.wN])].filter(Boolean).join(''),
      };
    }

    // caixa de visualização automática
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const grow = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    for (const f of all) for (const k in f.J) { const p = f.J[k]; const r = k === 'head' ? 13 : 5; grow(p[0] - r, p[1] - r); grow(p[0] + r, p[1] + r); }
    if (spec.box) { grow(spec.box[0], spec.box[1]); grow(spec.box[2], spec.box[3]); }
    if (spec.floor) grow(x0, spec.floor + 3);
    const pad = 12;
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    let w = x1 - x0, h = y1 - y0;
    if (w < h) { x0 -= (h - w) / 2; w = h; }
    if (h < w * 0.66) { y0 -= (w * 0.66 - h) / 2; h = w * 0.66; }
    const vb = [x0, y0, w, h].map(f1).join(' ');
    const floor = spec.floor ? `<line class="floor" x1="${f1(x0 + 8)}" y1="${spec.floor}" x2="${f1(x0 + w - 8)}" y2="${spec.floor}"/>` : '';

    const inner = floor + (spec.bg || '') + eqZ('back') + body.far + eqZ('mid') + body.torso +
      hls.filter(isTorso).map(hlSvg).join('') + body.near + eqZ('front') +
      hls.filter((x) => !isTorso(x)).map(hlSvg).join('') + (spec.fg || '');
    return { vb, inner };
  }

  /* ---------- atalhos para montar cenários ---------- */
  const plate = (at, r = 10, z = 'front') => ({ k: 'plate', at, r, z });
  const db = (at, z = 'front') => ({ k: 'db', at, z });
  const grip = (at, z = 'front') => ({ k: 'grip', at, z });
  const pad = (at, r = 7, z = 'front') => ({ k: 'pad', at, r, z });
  const ln = (a, b, cls = 'cable', z = 'back') => ({ k: 'line', a, b, cls, z });
  const bar = (a, b, ext = 12, z = 'front') => ({ k: 'bar', a, b, ext, z });
  const R = (x, y, w, h, rx = 3) => `<rect class="bench" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
  const L = (x1, y1, x2, y2, cls = 'benchl') => `<line class="${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const guide = (x1, y1, x2, y2) => `<line class="guide" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><animate attributeName="opacity" values=".15;.9;.15" keyTimes="0;.5;1" dur="2.2s" repeatCount="indefinite"/></line>`;
  /** pose A → B → A com pausas nas pontas */
  const cycle = (A, B, t = [0.12, 0.5, 0.62]) => [[0, A], [t[0], A], [t[1], B], [t[2], B], [1, A]];

  // posturas base
  const STAND = { h: [100, 106], t: -90, lN: [90, 90, 0], lF: [93, 93, 0], aN: [92, 90], aF: [95, 93] };
  const SEAT = { h: [86, 126], t: -88, lN: [2, 90, 0], lF: [5, 93, 0] };
  const SEAT_BG = R(56, 132, 54, 9, 4) + R(80, 141, 8, 27, 2);
  const FSTAND = { h: [100, 106], t: -90, legs: [86, 90], arms: [84, 86] };
  const FSEAT = { h: [100, 128], t: -90, legs: [72, 92], th: 22 };
  const FSEAT_BG = R(66, 129, 68, 9, 4) + R(96, 138, 8, 50, 2);
  const BENCH_FLAT = R(36, 120, 114, 9, 4) + R(50, 129, 7, 35, 2) + R(132, 129, 7, 35, 2);
  const LIE = { h: [128, 113], t: 180, lN: [15, 92, 0], lF: [20, 95, 0] };

  /* =========================================================
     Exercícios
     ========================================================= */
  const LIB = [
    {
      names: ['rosca biceps', 'rosca direta', 'rosca alternada'], muscles: 'Bíceps',
      base: { ...STAND }, seq: cycle({}, { aN: [96, -62], aF: [99, -58] }), floor: 184,
      eq: [plate('wF', 9, 'mid'), plate('wN', 10)], hl: [['sh', 'eN']],
      steps: ['Em pé, pés na largura do quadril, halteres ao lado do corpo com as palmas para a frente.', 'Mantenha os cotovelos colados ao tronco durante todo o movimento.', 'Suba os halteres dobrando os cotovelos até perto dos ombros.', 'Desça devagar, controlando, até estender os braços.'],
      tip: 'Não balance o tronco para ajudar. Se precisar, reduza a carga.',
    },
    {
      names: ['supino', 'supino reto'], equip: 'Haltere', muscles: 'Peitoral · Tríceps · Ombros',
      base: { ...LIE, ua: 18, aN: [92, -86] }, seq: cycle({}, { ua: -30, aN: [92, -90] }), floor: 164,
      bg: BENCH_FLAT, eq: [plate('wN', 11)], hl: [{ a: 'hip', b: 'sh', f0: 0.55, f1: 0.92, off: -5, w: 6 }],
      steps: ['Deite no banco com os pés firmes no chão e as escápulas encaixadas.', 'Comece com os halteres na linha do peito, cotovelos um pouco abaixo do banco.', 'Empurre os halteres para cima até estender os braços.', 'Desça devagar até sentir o alongamento no peito.'],
      tip: 'Cotovelos a uns 45° do tronco protegem os ombros.',
    },
    {
      names: ['supino', 'supino reto'], equip: 'Barra', muscles: 'Peitoral · Tríceps · Ombros', dur: '3s',
      base: { ...LIE, ua: 18, aN: [92, -86] }, seq: cycle({}, { ua: -30, aN: [92, -90] }), floor: 164,
      bg: BENCH_FLAT + R(60, 40, 6, 80, 2) + R(84, 40, 6, 80, 2), eq: [plate('wN', 17)], hl: [{ a: 'hip', b: 'sh', f0: 0.55, f1: 0.92, off: -5, w: 6 }],
      steps: ['Deite com os olhos na linha da barra e os pés firmes no chão.', 'Segure a barra um pouco mais aberto que os ombros e tire do suporte.', 'Desça a barra controlando até tocar de leve a parte baixa do peito.', 'Empurre de volta até estender os braços, sem tirar o quadril do banco.'],
      tip: 'Use um parceiro ou travas de segurança quando a carga for alta.',
    },
    {
      names: ['supino inclinado'], muscles: 'Peitoral superior · Ombros · Tríceps',
      base: { h: [125, 120], t: -150, lN: [10, 92, 0], lF: [14, 95, 0], ua: 16, aN: [100, -84] },
      seq: cycle({}, { ua: -30, aN: [100, -92] }), floor: 168,
      bg: L(128, 133, 70, 100) + R(108, 127, 40, 8, 4) + R(122, 135, 7, 33, 2) + R(84, 106, 6, 62, 2),
      eq: [plate('wN', 11)], hl: [{ a: 'hip', b: 'sh', f0: 0.55, f1: 0.92, off: -5, w: 6 }],
      steps: ['Ajuste o banco entre 30° e 45° e apoie bem as costas.', 'Comece com os halteres na altura do peito, cotovelos abaixo da linha do banco.', 'Empurre para cima e um pouco para dentro até estender os braços.', 'Desça devagar até a altura do peito.'],
      tip: 'Inclinação maior que 45° tira o foco do peito e joga para o ombro.',
    },
    {
      names: ['crucifixo no banco inclinado', 'crucifixo inclinado', 'crucifixo'], view: 'front', muscles: 'Peitoral',
      base: { ...FSEAT, arms: [10, 30] }, seq: cycle({}, { arms: [-75, -125] }), floor: 189,
      bg: R(76, 50, 48, 82, 12) + FSEAT_BG, eq: [db('wR'), db('wL')],
      hl: [{ a: 'shL', b: 'shR', f0: 0.12, f1: 0.88, off: -9, w: 7 }],
      steps: ['Sente no banco inclinado (30° a 45°) com as costas bem apoiadas.', 'Comece com os halteres acima do peito, palmas viradas uma para a outra.', 'Abra os braços em arco, cotovelos levemente dobrados, até sentir o peito alongar.', 'Feche o arco “abraçando” o ar até os halteres voltarem acima do peito.'],
      tip: 'Os cotovelos ficam travados no mesmo ângulo: o movimento é do ombro.',
    },
    {
      names: ['desenvolvimento sentado', 'desenvolvimento'], equip: 'Haltere', view: 'front', muscles: 'Ombros · Tríceps',
      base: { ...FSEAT, arms: [5, -88] }, seq: cycle({}, { arms: [-66, -96] }), floor: 189,
      bg: R(78, 54, 44, 78, 12) + FSEAT_BG, eq: [db('wR'), db('wL')],
      hl: [{ a: 'shR', b: 'eR', f1: 0.4, w: 10 }, { a: 'shL', b: 'eL', f1: 0.4, w: 10 }],
      steps: ['Sente com as costas apoiadas e os pés firmes no chão.', 'Halteres na altura das orelhas, cotovelos abaixo das mãos.', 'Empurre para cima até quase estender os braços, aproximando os halteres.', 'Desça controlando até a altura das orelhas.'],
      tip: 'Não arqueie a lombar: mantenha o abdômen firme.',
    },
    {
      names: ['desenvolvimento sentado', 'desenvolvimento'], equip: 'Aparelho', view: 'front', muscles: 'Ombros · Tríceps',
      base: { ...FSEAT, arms: [5, -88] }, seq: cycle({}, { arms: [-66, -96] }), floor: 189,
      bg: R(78, 54, 44, 78, 12) + FSEAT_BG + R(44, 14, 6, 175, 2) + R(150, 14, 6, 175, 2) + R(44, 12, 112, 6, 3),
      eq: [ln([56, 18], 'wL', 'lever'), ln([144, 18], 'wR', 'lever'), grip('wR'), grip('wL')], box: [40, 10, 160, 20],
      hl: [{ a: 'shR', b: 'eR', f1: 0.4, w: 10 }, { a: 'shL', b: 'eL', f1: 0.4, w: 10 }],
      steps: ['Ajuste o banco para as pegadas ficarem na altura dos ombros.', 'Sente com as costas apoiadas e segure as pegadas.', 'Empurre para cima até quase estender os braços.', 'Volte devagar até a altura dos ombros, sem deixar o peso bater.'],
      tip: 'Expire ao empurrar e inspire ao descer.',
    },
    {
      names: ['elevacao frontal'], muscles: 'Ombro (deltoide anterior)',
      base: { ...STAND }, seq: cycle({}, { aN: [-4, -2], aF: [4, 6] }), floor: 184,
      eq: [plate('wF', 9, 'mid'), plate('wN', 10)], hl: [{ a: 'sh', b: 'eN', f1: 0.4, w: 10 }],
      steps: ['Em pé, halteres na frente das coxas, palmas viradas para trás.', 'Com os braços quase esticados, eleve os halteres à frente.', 'Pare na altura dos ombros.', 'Desça devagar, sem deixar cair.'],
      tip: 'Não jogue o tronco para trás para ganhar impulso.',
    },
    {
      names: ['elevacao lateral'], view: 'front', muscles: 'Ombro (deltoide lateral)',
      base: { ...FSTAND }, seq: cycle({}, { arms: [-4, 2] }), floor: 184,
      eq: [db('wR'), db('wL')], hl: [{ a: 'shR', b: 'eR', f1: 0.4, w: 10 }, { a: 'shL', b: 'eL', f1: 0.4, w: 10 }],
      steps: ['Em pé, halteres ao lado do corpo, cotovelos levemente dobrados.', 'Eleve os braços para os lados, guiando com os cotovelos.', 'Pare quando os braços ficarem na altura dos ombros.', 'Desça devagar até o lado do corpo.'],
      tip: 'Imagine que está despejando água de uma jarra: mindinho levemente para cima.',
    },
    {
      names: ['triceps frances'], muscles: 'Tríceps',
      base: { ...STAND, ha: 20, aN: [250, 108], aF: [252, 110] }, seq: cycle({}, { aN: [250, 262], aF: [252, 264] }), floor: 184,
      eq: [plate('wN', 10)], hl: [['sh', 'eN']],
      steps: ['Segure um halter com as duas mãos acima da cabeça.', 'Mantenha os cotovelos apontando para cima, perto da cabeça.', 'Desça o halter atrás da cabeça dobrando só os cotovelos.', 'Estenda os braços de volta para cima.'],
      tip: 'Se os cotovelos abrirem muito, a carga está alta demais.',
    },
    {
      names: ['triceps testa no banco', 'triceps testa'], muscles: 'Tríceps',
      base: { ...LIE, aN: [265, 270] }, seq: cycle({}, { aN: [265, 195] }), floor: 164,
      bg: BENCH_FLAT, eq: [plate('wN', 10)], hl: [['sh', 'eN']],
      steps: ['Deite no banco com os halteres acima do peito, braços estendidos.', 'Deixe os braços parados apontando para o teto.', 'Dobre os cotovelos levando os halteres em direção à testa.', 'Estenda os cotovelos de volta, sem mexer os ombros.'],
      tip: 'Desça devagar: o controle protege os cotovelos.',
    },
    {
      names: ['abdominal', 'abdominal supra', 'abdominal reto'], muscles: 'Abdômen',
      base: { h: [120, 165], t: 180, lN: [-55, 70, 0], lF: [-52, 73, 0], aN: [-30, 167] },
      seq: cycle({}, { t: 205, ha: -15, aN: [-5, 192] }), floor: 172, dur: '2.4s',
      hl: [{ a: 'hip', b: 'sh', f0: 0.15, f1: 0.6, off: -5, w: 6 }],
      steps: ['Deite de costas com os joelhos dobrados e os pés no chão.', 'Cruze os braços no peito (ou mãos atrás da cabeça, sem puxar o pescoço).', 'Contraia o abdômen e tire as escápulas do chão.', 'Volte devagar sem relaxar totalmente.'],
      tip: 'O movimento é curto: pense em aproximar as costelas do quadril.',
    },
    {
      names: ['abdominal sit-up com rotacao', 'sit-up', 'abdominal com rotacao'], muscles: 'Abdômen · Oblíquos',
      base: { h: [120, 165], t: 180, lN: [-55, 70, 0], lF: [-52, 73, 0], aN: [-40, -40] },
      seq: cycle({}, { t: 235, ha: -10, aN: [-5, -5] }), floor: 172,
      hl: [{ a: 'hip', b: 'sh', f0: 0.1, f1: 0.7, off: -5, w: 6 }],
      steps: ['Deite de costas com os joelhos dobrados e os pés apoiados.', 'Suba o tronco inteiro até ficar quase sentado.', 'No alto, gire o tronco levando o cotovelo (ou as mãos) para o lado do joelho oposto.', 'Volte ao centro e desça devagar. Alterne o lado a cada repetição.'],
      tip: 'Se os pés saírem do chão, prenda-os sob um apoio.',
    },
    {
      names: ['pullover'], muscles: 'Dorsal · Peitoral',
      base: { ...LIE, aN: [270, 268] }, seq: cycle({}, { aN: [190, 188] }), floor: 164, dur: '3s',
      bg: BENCH_FLAT, eq: [plate('wN', 11)], hl: [{ a: 'hip', b: 'sh', f0: 0.5, f1: 0.95, off: -5, w: 6 }],
      steps: ['Deite no banco e segure um halter com as duas mãos acima do peito.', 'Com os cotovelos levemente dobrados, leve o halter para trás da cabeça em arco.', 'Desça até sentir o alongamento nas costas e no peito.', 'Puxe de volta pelo mesmo arco até acima do peito.'],
      tip: 'Mantenha o quadril baixo e o abdômen firme o tempo todo.',
    },
    {
      names: ['remada curvada', 'remada unilateral', 'remada'], muscles: 'Costas · Bíceps',
      base: { h: [100, 107], t: -25, ha: 5, lN: [80, 100, 0], lF: [84, 103, 0], aN: [90, 90], aF: [93, 92] },
      seq: cycle({}, { aN: [200, 95], aF: [197, 95] }), floor: 186,
      eq: [plate('wF', 9, 'mid'), plate('wN', 10)], hl: [{ a: 'hip', b: 'sh', f0: 0.35, f1: 0.95, off: 5, w: 6 }],
      steps: ['Incline o tronco à frente com a coluna reta e os joelhos levemente dobrados.', 'Deixe os halteres pendurados abaixo dos ombros.', 'Puxe os halteres em direção ao quadril levando os cotovelos para trás.', 'Desça estendendo os braços, sem arredondar as costas.'],
      tip: 'Aperte as escápulas no alto do movimento.',
    },
    {
      names: ['crucifixo inverso'], view: 'front', muscles: 'Ombro posterior · Costas',
      base: { h: [100, 108], t: -90, tl: 26, hd: 7, legs: [74, 100], arms: [86, 88] }, seq: cycle({}, { arms: [2, 8] }), floor: 186,
      eq: [db('wR'), db('wL')], hl: [{ a: 'shL', b: 'shR', w: 8 }],
      steps: ['Incline o tronco à frente com a coluna reta e joelhos levemente dobrados.', 'Halteres pendurados, palmas viradas uma para a outra.', 'Abra os braços para os lados até a altura dos ombros.', 'Desça devagar até a posição inicial.'],
      tip: 'Use carga leve: quem trabalha é a parte de trás do ombro.',
    },
    {
      names: ['rosca concentrada'], muscles: 'Bíceps',
      base: { ...SEAT, t: -55, ha: 20, aN: [80, 95] }, seq: cycle({}, { aN: [80, -100] }), floor: 168,
      bg: SEAT_BG, eq: [plate('wN', 10)], hl: [['sh', 'eN']],
      steps: ['Sente no banco com as pernas afastadas e incline o tronco à frente.', 'Apoie o cotovelo na parte interna da coxa, braço estendido.', 'Suba o halter dobrando o cotovelo até perto do ombro.', 'Desça devagar até estender o braço.'],
      tip: 'O cotovelo fica parado na coxa durante todo o movimento.',
    },
    {
      names: ['agachamento no hack', 'hack', 'agachamento hack'], muscles: 'Quadríceps · Glúteos',
      base: { h: [100, 108], t: -110, ha: 20, lN: { ik: [120, 180], bend: -1, foot: 0 }, lF: { ik: [116, 180], bend: -1, foot: 0 }, aN: [60, -80] },
      seq: cycle({}, { h: [84, 148] }), floor: 187, dur: '3s',
      bg: L(80, 25, 32, 150) + R(100, 181, 44, 6, 2),
      eq: [ln({ j: 'hip', dx: -11, dy: 5 }, { j: 'sh', dx: -11, dy: -5 }, 'padl'), pad({ j: 'sh', dx: 3, dy: -7 }, 7, 'mid')],
      hl: [['hip', 'kN']], box: [28, 20, 150, 190],
      steps: ['Encoste costas e ombros nos apoios e posicione os pés no meio da plataforma.', 'Destrave o aparelho e desça dobrando joelhos e quadril.', 'Desça até as coxas ficarem paralelas à plataforma (ou o máximo confortável).', 'Empurre a plataforma com o pé inteiro para subir.'],
      tip: 'Joelhos apontam na direção dos pés, sem fechar para dentro.',
    },
    {
      names: ['leg press', 'leg press 45'], muscles: 'Quadríceps · Glúteos · Posterior',
      base: { h: [92, 140], t: -162, ha: 20, lN: { ik: [128, 110], bend: -1, foot: -135 }, lF: { ik: [124, 114], bend: -1, foot: -135 }, aN: [40, 20] },
      seq: cycle({}, { lN: { ik: [146, 86], bend: -1, foot: -135 }, lF: { ik: [142, 90], bend: -1, foot: -135 } }), floor: 182,
      bg: L(116, 156, 190, 82) + L(97, 153, 33, 131) + R(80, 146, 32, 8, 3) + R(90, 154, 7, 28, 2) + R(40, 136, 7, 46, 2),
      eq: [ln({ j: 'anN', dx: -8, dy: -18 }, { j: 'anN', dx: 18, dy: 8 }, 'plat', 'back')],
      hl: [['hip', 'kN']], box: [30, 70, 192, 186],
      steps: ['Sente com as costas e o quadril bem apoiados no encosto.', 'Pés na largura do quadril no meio da plataforma.', 'Destrave e desça dobrando os joelhos até uns 90°.', 'Empurre a plataforma até quase estender as pernas.'],
      tip: 'Não trave os joelhos no alto e não tire o quadril do banco embaixo.',
    },
    {
      names: ['flexao da panturrilha sentado', 'panturrilha sentado', 'panturrilha'], muscles: 'Panturrilha',
      base: { h: [85, 128], t: -85, ha: 5, lN: { ik: [125.7, 174.1], bend: -1, foot: -20 }, lF: { ik: [122, 174.1], bend: -1, foot: -20 }, aN: [70, 10] },
      seq: cycle({}, { lN: { ik: [126.6, 164], bend: -1, foot: 30 }, lF: { ik: [122.9, 164], bend: -1, foot: 30 } }, [0.1, 0.42, 0.6]), floor: 178, dur: '2.2s',
      bg: R(54, 134, 46, 9, 4) + R(74, 143, 8, 35, 2) + R(129, 170, 20, 8, 2),
      eq: [ln({ j: 'kN', dx: -16, dy: -9 }, { j: 'kN', dx: 8, dy: -9 }, 'padl', 'front')],
      hl: [{ a: 'kN', b: 'anN', f0: 0.2, f1: 0.75, off: -4, w: 7 }],
      steps: ['Sente com a ponta dos pés no apoio e os joelhos sob a almofada.', 'Solte a trava e deixe os calcanhares descerem bem.', 'Suba os calcanhares o máximo que conseguir.', 'Segure um instante no alto e desça devagar.'],
      tip: 'Amplitude completa vale mais que muito peso.',
    },
    {
      names: ['extensao da perna', 'cadeira extensora', 'extensora'], muscles: 'Quadríceps',
      base: { h: [88, 126], t: -96, ha: 6, lN: [0, 92, 2], lF: [3, 94, 4], aN: [80, 20] },
      seq: cycle({}, { lN: [0, 2, -88], lF: [3, 6, -84] }), floor: 170,
      bg: R(58, 132, 76, 9, 4) + R(62, 66, 10, 66, 4) + R(92, 141, 8, 29, 2),
      eq: [pad({ j: 'anN', dx: 2, dy: -2 }, 7)], hl: [['hip', 'kN']],
      steps: ['Sente com as costas apoiadas e o rolo na frente dos tornozelos.', 'Alinhe o joelho com o eixo do aparelho.', 'Estenda as pernas até ficarem retas.', 'Desça devagar, sem deixar o peso bater.'],
      tip: 'Segure o banco com as mãos para o quadril não subir.',
    },
    {
      names: ['flexao de pernas sentado', 'cadeira flexora', 'flexora'], muscles: 'Posterior de coxa',
      base: { h: [88, 126], t: -96, ha: 6, lN: [0, 5, -85], lF: [3, 9, -81], aN: [80, 20] },
      seq: cycle({}, { lN: [0, 105, 15], lF: [3, 108, 18] }), floor: 170,
      bg: R(58, 132, 76, 9, 4) + R(62, 66, 10, 66, 4) + R(92, 141, 8, 29, 2) + L(98, 113, 126, 113, 'padl'),
      eq: [pad({ j: 'anN', dx: 0, dy: 5 }, 7)], hl: [{ a: 'hip', b: 'kN', f0: 0.1, f1: 0.95, off: -4, w: 6 }],
      steps: ['Sente com o rolo atrás dos tornozelos e a almofada travando as coxas.', 'Comece com as pernas estendidas.', 'Puxe o rolo para baixo e para trás dobrando os joelhos.', 'Volte devagar até estender as pernas.'],
      tip: 'Não deixe o quadril escorregar no banco.',
    },
    {
      names: ['abdutor de quadril sentado', 'abdutora', 'cadeira abdutora'], view: 'front', muscles: 'Glúteo médio · Quadril',
      base: { ...FSEAT, legs: [78, 92], arms: [70, 100] }, seq: cycle({}, { legs: [25, 72] }), floor: 189,
      bg: R(78, 54, 44, 78, 12) + FSEAT_BG,
      eq: [pad({ j: 'kR', dx: 9, dy: 0 }, 6), pad({ j: 'kL', dx: -9, dy: 0 }, 6)],
      hl: [{ a: 'hipR', b: 'kR', w: 9 }, { a: 'hipL', b: 'kL', w: 9 }],
      steps: ['Sente com as costas apoiadas e as almofadas por fora dos joelhos.', 'Segure as pegadas laterais.', 'Abra as pernas empurrando as almofadas para fora.', 'Volte devagar, sem deixar o peso bater.'],
      tip: 'Incline levemente o tronco à frente para ativar mais o glúteo.',
    },
    {
      names: ['adutor de quadril sentado', 'adutora', 'cadeira adutora'], view: 'front', muscles: 'Adutores (parte interna da coxa)',
      base: { ...FSEAT, legs: [25, 72], arms: [70, 100] }, seq: cycle({}, { legs: [80, 93] }), floor: 189,
      bg: R(78, 54, 44, 78, 12) + FSEAT_BG,
      eq: [pad({ j: 'kR', dx: -8, dy: 0 }, 6), pad({ j: 'kL', dx: 8, dy: 0 }, 6)],
      hl: [{ a: 'hipR', b: 'kR', w: 9 }, { a: 'hipL', b: 'kL', w: 9 }],
      steps: ['Sente com as costas apoiadas e as almofadas por dentro dos joelhos.', 'Comece com as pernas abertas até onde for confortável.', 'Feche as pernas apertando as almofadas.', 'Abra devagar de volta.'],
      tip: 'Controle a volta: é nela que muita gente se machuca.',
    },
    {
      names: ['puxada para baixo lateral (pegada aberta)', 'puxada para baixo lateral', 'puxada alta', 'puxada frontal', 'puxada'], view: 'front', muscles: 'Dorsal · Bíceps',
      base: { ...FSEAT, arms: [-62, -72] }, seq: cycle({}, { arms: [40, -95] }), floor: 189,
      bg: FSEAT_BG + L(84, 142, 116, 142, 'padl') + '<circle class="eq" cx="100" cy="6" r="5"/>',
      eq: [ln([100, 6], { mid: ['wL', 'wR'] }, 'cable'), bar('wL', 'wR', 14)], box: [90, 0, 110, 10],
      hl: [{ a: 'shR', b: 'hipR', f0: 0.1, f1: 0.6, w: 6 }, { a: 'shL', b: 'hipL', f0: 0.1, f1: 0.6, w: 6 }],
      steps: ['Sente com as coxas presas sob a almofada.', 'Segure a barra com as mãos bem mais abertas que os ombros.', 'Puxe a barra até a parte de cima do peito levando os cotovelos para baixo.', 'Suba devagar até estender os braços.'],
      tip: 'Peito aberto e tronco quase reto: não puxe atrás da nuca.',
    },
    {
      names: ['remada sentado', 'remada baixa', 'remada no cabo'], muscles: 'Costas · Bíceps',
      base: { h: [66, 150], t: -80, ha: -5, lN: { ik: [146, 160], bend: -1, foot: -75 }, lF: { ik: [142, 161], bend: -1, foot: -75 }, aN: [4, 2], aF: [7, 5] },
      seq: cycle({}, { t: -96, aN: [160, 0], aF: [163, 2] }), floor: 176,
      bg: R(40, 156, 60, 8, 3) + R(64, 164, 8, 12, 2) + R(150, 138, 7, 38, 2) + '<circle class="eq" cx="186" cy="150" r="5"/>',
      eq: [ln([186, 150], 'wN', 'cable'), grip('wN')], box: [30, 90, 192, 180],
      hl: [{ a: 'hip', b: 'sh', f0: 0.35, f1: 0.95, off: 5, w: 6 }],
      steps: ['Sente com os pés no apoio e os joelhos levemente dobrados.', 'Segure o triângulo com os braços estendidos e a coluna reta.', 'Puxe até o abdômen levando os cotovelos para trás, junto ao corpo.', 'Volte estendendo os braços, sem curvar as costas.'],
      tip: 'Aperte as escápulas no fim da puxada.',
    },
    {
      names: ['rosca scott'], muscles: 'Bíceps',
      base: { ...SEAT, h: [78, 128], t: -80, ha: 10, aN: [45, 38] }, seq: cycle({}, { aN: [45, -75] }), floor: 168,
      bg: R(48, 134, 52, 9, 4) + R(70, 143, 8, 25, 2) + L(80, 84, 110, 114, 'padl') + R(106, 112, 7, 56, 2),
      eq: [plate('wN', 9)], hl: [['sh', 'eN']],
      steps: ['Sente e apoie a parte de trás dos braços inteira na almofada inclinada.', 'Segure a pegada com os braços quase estendidos.', 'Suba dobrando os cotovelos até perto dos ombros.', 'Desça devagar, sem estender totalmente com força.'],
      tip: 'As axilas ficam encostadas no topo da almofada.',
    },
    {
      names: ['extensao de triceps', 'triceps maquina', 'triceps no aparelho'], muscles: 'Tríceps',
      base: { ...SEAT, h: [78, 128], t: -80, ha: 5, aN: [50, -55] }, seq: cycle({}, { aN: [50, 50] }), floor: 168,
      bg: R(48, 134, 52, 9, 4) + R(70, 143, 8, 25, 2) + L(80, 86, 108, 120, 'padl') + R(104, 118, 7, 50, 2),
      eq: [grip('wN')], hl: [['sh', 'eN']],
      steps: ['Ajuste o banco para os cotovelos ficarem alinhados com o eixo do aparelho.', 'Apoie os braços na almofada e segure as pegadas.', 'Estenda os cotovelos empurrando as pegadas para baixo.', 'Volte devagar até os cotovelos dobrarem uns 90°.'],
      tip: 'Os braços não saem da almofada: só o antebraço se mexe.',
    },
    {
      names: ['abdominal sentado', 'abdominal na maquina'], muscles: 'Abdômen',
      base: { ...SEAT, t: -95, aN: [75, -95] }, seq: cycle({}, { t: -55, ha: 15, aN: [115, -55] }), floor: 168,
      bg: SEAT_BG + R(46, 70, 10, 64, 4),
      eq: [grip('wN')], hl: [{ a: 'hip', b: 'sh', f0: 0.1, f1: 0.6, off: -5, w: 6 }],
      steps: ['Sente, prenda os pés e segure as pegadas na altura dos ombros.', 'Contraia o abdômen e flexione o tronco para a frente e para baixo.', 'Pense em enrolar a coluna, aproximando costelas e quadril.', 'Volte devagar sem deixar o peso bater.'],
      tip: 'Quem puxa é o abdômen, não os braços.',
    },
    {
      names: ['prancha', 'prancha frontal'], muscles: 'Abdômen · Core · Ombros',
      base: { h: [101.2, 151.1], t: -12.8, ha: -8, lN: [167.2, 167.2, 150], lF: [168, 168, 150], aN: [90, 0], aF: [88, 2] },
      seq: [[0, {}], [0.5, { h: [101.2, 149.8] }], [1, {}]], floor: 176, dur: '3.2s',
      fg: guide(18, 154, 172, 120), hl: [{ a: 'hip', b: 'sh', f0: 0.15, f1: 0.7, off: -5, w: 6 }],
      steps: ['Apoie os antebraços no chão, cotovelos logo abaixo dos ombros.', 'Estenda as pernas e apoie-se na ponta dos pés.', 'Contraia abdômen e glúteos: corpo reto da cabeça aos calcanhares.', 'Respire normalmente e segure pelo tempo da série.'],
      tip: 'Não deixe o quadril cair nem empinar.',
    },
    {
      names: ['prancha lateral'], view: 'front', muscles: 'Oblíquos · Core',
      base: { h: [100, 144], t: -14, lR: { ik: [30, 166], bend: 1, foot: 100 }, lL: { ik: [26, 158], bend: 1, foot: 100 }, aR: { ik: [176, 164], bend: 1 }, aL: [-95, -92] },
      seq: cycle({}, { h: [100, 136], t: -20 }, [0.1, 0.4, 0.85]), floor: 170, dur: '3.4s',
      fg: guide(22, 150, 168, 112), hl: [{ a: 'hipR', b: 'shR', f0: 0.15, f1: 0.85, w: 6 }],
      steps: ['Deite de lado e apoie o antebraço no chão, cotovelo abaixo do ombro.', 'Pernas estendidas, um pé sobre o outro.', 'Suba o quadril até o corpo formar uma linha reta.', 'Segure pelo tempo da série e depois troque de lado.'],
      tip: 'Empurre o chão com o antebraço para não afundar no ombro.',
    },
    {
      names: ['flexao', 'flexao de braco', 'flexao de bracos'], muscles: 'Peitoral · Tríceps · Core',
      base: { h: [105, 135.8], t: -25.8, ha: -5, lN: [154.2, 154.2, 150], lF: [155, 155, 150], aN: { ik: [150, 172], bend: 1 }, aF: { ik: [146, 172], bend: 1 } },
      seq: cycle({}, { h: [111.6, 156.2], t: -10, lN: [170, 170, 150], lF: [171, 171, 150] }, [0.1, 0.45, 0.55]), floor: 176, dur: '2.4s',
      hl: [{ a: 'hip', b: 'sh', f0: 0.6, f1: 0.95, off: -5, w: 6 }, { a: 'sh', b: 'eN', w: 9 }],
      steps: ['Mãos no chão um pouco mais abertas que os ombros, corpo reto.', 'Desça o peito em direção ao chão dobrando os cotovelos.', 'Pare quando o peito estiver perto do chão.', 'Empurre o chão até estender os braços.'],
      tip: 'Se ficar pesado, apoie os joelhos no chão mantendo o corpo reto.',
    },
    {
      names: ['elevacao das pernas deitado', 'elevacao de pernas'], muscles: 'Abdômen inferior',
      base: { h: [110, 165], t: 180, lN: [-4, -4, -94], lF: [-2, -2, -92], aN: [6, 2] },
      seq: cycle({}, { lN: [-86, -86, -176], lF: [-84, -84, -174] }), floor: 172, dur: '3s',
      hl: [{ a: 'hip', b: 'sh', f0: 0, f1: 0.45, off: -5, w: 6 }],
      steps: ['Deite de costas com as pernas estendidas e as mãos ao lado do corpo.', 'Pressione a lombar contra o chão.', 'Suba as pernas esticadas até apontarem para o teto.', 'Desça devagar sem encostar os pés no chão.'],
      tip: 'Se a lombar descolar do chão, dobre um pouco os joelhos.',
    },
    {
      names: ['torcao russa', 'russian twist'], view: 'front', muscles: 'Oblíquos · Abdômen',
      base: { h: [100, 140], t: -82, tl: 40, hd: 18, th: 14, sn: 26, legs: [-35, 105], aR: { ik: [128, 134], bend: 1 }, aL: { ik: [124, 137], bend: -1 } },
      seq: cycle({}, { t: -98, aR: { ik: [76, 137], bend: 1 }, aL: { ik: [72, 134], bend: -1 } }, [0.08, 0.5, 0.58]), dur: '2.4s',
      eq: [db({ mid: ['wL', 'wR'] })], hl: [{ a: 'shR', b: 'hipR', f0: 0.2, f1: 0.8, w: 6 }, { a: 'shL', b: 'hipL', f0: 0.2, f1: 0.8, w: 6 }],
      steps: ['Sente com os joelhos dobrados e incline o tronco para trás (uns 45°).', 'Segure o halter com as duas mãos na frente do peito.', 'Gire o tronco levando o halter para um lado do quadril.', 'Gire para o outro lado. Tire os pés do chão para dificultar.'],
      tip: 'Gire o tronco inteiro, não só os braços.',
    },
  ];

  /* ---------- Nome de exibição, equipamento padrão e músculos (p = principal, s = secundário) ---------- */
  const META = {
    'rosca biceps|': ['Rosca bíceps', 'Haltere', { p: ['biceps'], s: ['forearms'] }],
    'supino|Haltere': ['Supino', 'Haltere', { p: ['chest'], s: ['triceps', 'shoulders'] }],
    'supino|Barra': ['Supino', 'Barra', { p: ['chest'], s: ['triceps', 'shoulders'] }],
    'supino inclinado|': ['Supino inclinado', 'Haltere', { p: ['chest', 'shoulders'], s: ['triceps'] }],
    'crucifixo no banco inclinado|': ['Crucifixo no banco inclinado', 'Haltere', { p: ['chest'], s: ['shoulders'] }],
    'desenvolvimento sentado|Haltere': ['Desenvolvimento sentado', 'Haltere', { p: ['shoulders'], s: ['triceps', 'traps'] }],
    'desenvolvimento sentado|Aparelho': ['Desenvolvimento sentado', 'Aparelho', { p: ['shoulders'], s: ['triceps', 'traps'] }],
    'elevacao frontal|': ['Elevação frontal', 'Haltere', { p: ['shoulders'], s: [] }],
    'elevacao lateral|': ['Elevação lateral', 'Haltere', { p: ['shoulders'], s: ['traps'] }],
    'triceps frances|': ['Tríceps francês', 'Haltere', { p: ['triceps'], s: [] }],
    'triceps testa no banco|': ['Tríceps testa no banco', 'Haltere', { p: ['triceps'], s: [] }],
    'abdominal|': ['Abdominal', '', { p: ['abs'], s: [] }],
    'abdominal sit-up com rotacao|': ['Abdominal sit-up com rotação', '', { p: ['abs', 'obliques'], s: [] }],
    'pullover|': ['Pullover', 'Haltere', { p: ['lats', 'chest'], s: ['triceps'] }],
    'remada curvada|': ['Remada curvada', 'Haltere', { p: ['lats', 'traps'], s: ['biceps', 'rear_delts', 'lower_back'] }],
    'crucifixo inverso|': ['Crucifixo inverso', 'Haltere', { p: ['rear_delts', 'traps'], s: [] }],
    'rosca concentrada|': ['Rosca concentrada', 'Haltere', { p: ['biceps'], s: [] }],
    'agachamento no hack|': ['Agachamento no hack', 'Aparelho', { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'] }],
    'leg press|': ['Leg Press', 'Aparelho', { p: ['quads', 'glutes'], s: ['hamstrings', 'adductors'] }],
    'flexao da panturrilha sentado|': ['Flexão da panturrilha sentado', 'Aparelho', { p: ['calves'], s: [] }],
    'extensao da perna|': ['Extensão da perna', 'Aparelho', { p: ['quads'], s: [] }],
    'flexao de pernas sentado|': ['Flexão de pernas sentado', 'Aparelho', { p: ['hamstrings'], s: ['calves'] }],
    'abdutor de quadril sentado|': ['Abdutor de quadril sentado', 'Aparelho', { p: ['abductors', 'glutes'], s: [] }],
    'adutor de quadril sentado|': ['Adutor de quadril sentado', 'Aparelho', { p: ['adductors'], s: [] }],
    'puxada para baixo lateral (pegada aberta)|': ['Puxada para baixo lateral (pegada aberta)', 'Cabo', { p: ['lats'], s: ['biceps', 'rear_delts', 'traps'] }],
    'remada sentado|': ['Remada sentado', 'Cabo', { p: ['lats', 'traps'], s: ['biceps', 'rear_delts'] }],
    'rosca scott|': ['Rosca Scott', 'Aparelho', { p: ['biceps'], s: ['forearms'] }],
    'extensao de triceps|': ['Extensão de tríceps', 'Aparelho', { p: ['triceps'], s: [] }],
    'abdominal sentado|': ['Abdominal sentado', 'Aparelho', { p: ['abs'], s: [] }],
    'prancha|': ['Prancha', '', { p: ['abs'], s: ['obliques', 'shoulders', 'lower_back'] }, 60],
    'prancha lateral|': ['Prancha lateral', '', { p: ['obliques'], s: ['abs', 'shoulders'] }, 30],
    'flexao|': ['Flexão', '', { p: ['chest', 'triceps'], s: ['shoulders', 'abs'] }],
    'elevacao das pernas deitado|': ['Elevação das pernas deitado', '', { p: ['abs'], s: ['quads'] }],
    'torcao russa|': ['Torção russa', 'Haltere', { p: ['obliques'], s: ['abs'] }, 60],
  };
  for (const x of LIB) {
    const m = META[`${x.names[0]}|${x.equip || ''}`];
    if (!m) { console.warn('Sem META:', x.names[0]); continue; }
    [x.label, x.defEq, x.mk] = m;
    if (m[3]) { x.type = 'time'; x.secs = m[3]; }
  }

  /* ---------- API ---------- */
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const cache = new Map();
  function illusFor(e) {
    const n = norm(e.name);
    if (!n) return null;
    return LIB.find((x) => x.names.includes(n) && (!x.equip || x.equip === e.equip)) || LIB.find((x) => x.names.includes(n)) || null;
  }
  function illusSvg(il, cls = '') {
    if (!cache.has(il)) cache.set(il, build(il));
    const { vb, inner } = cache.get(il);
    return `<svg class="illus ${cls}" viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
  }
  /** Busca na biblioteca: todas as palavras digitadas precisam aparecer no nome ou apelidos */
  function searchExercises(q) {
    const words = norm(q).split(' ').filter(Boolean);
    if (!words.length) return LIB.slice();
    return LIB.map((x) => {
      const hay = norm([x.label, x.defEq, ...x.names].join(' '));
      if (!words.every((w) => hay.includes(w))) return null;
      const lab = norm(x.label);
      const score = lab.startsWith(words.join(' ')) ? 0 : lab.split(' ').some((t) => t.startsWith(words[0])) ? 1 : 2;
      return { x, score };
    }).filter(Boolean).sort((a, b) => a.score - b.score || a.x.label.localeCompare(b.x.label, 'pt-BR')).map((r) => r.x);
  }
  window.normName = norm;
  window.searchExercises = searchExercises;
  window.illusFor = illusFor;
  window.illusSvg = illusSvg;
  window.EXERCISE_LIB = LIB;
})();
