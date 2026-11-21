'use strict';
/* =========================================================
   Mapa muscular (corpo masculino, frente e costas)
   Os músculos são desenhados na metade esquerda e espelhados.
   ========================================================= */
(() => {
  const MUSCLES = {
    chest: 'Peitoral', shoulders: 'Ombros', rear_delts: 'Ombro posterior', biceps: 'Bíceps', triceps: 'Tríceps',
    forearms: 'Antebraço', abs: 'Abdômen', obliques: 'Oblíquos', traps: 'Trapézio', lats: 'Dorsais',
    lower_back: 'Lombar', glutes: 'Glúteos', abductors: 'Abdutores', adductors: 'Adutores', quads: 'Quadríceps',
    hamstrings: 'Posterior de coxa', calves: 'Panturrilha',
  };

  const SIL = 'M50 26.5 L45 26.5 L45 31.5 C40 33.5 30 33.6 25 36.6 C20 39.6 18 45.5 18 53.5 C17 63.5 17 73.5 18 81.5 C16 91.5 15 99.5 15 107.5 L14 117.5 C16 121 20 121 21.2 117.6 L22 106 C24 98 27 90 28 82 C29 76 30 70 31 62 L32 60 C32 72 33 84 33 92 C31 98 30 104 30 112 C29 130 30 145 32 156 C31 170 31 185 33 200 L32 207.5 C35 211 42 211 44 207.5 L43 200 C44 186 45 170 44 158 C46 145 47 128 48 112 L50 110 Z';
  const FOREARM = 'M20.2 82 C18 89 16.8 96 17.3 104 L21.6 104.5 C24.2 97 26.8 89.5 28.1 82.5 C25.6 80.8 22.4 80.6 20.2 82 Z';

  const FRONT = [
    ['traps', 'M45 30 C43 33 39 35 32 36.6 C38 37.4 43 37.2 45.5 36.8 Z'],
    ['shoulders', 'M31 37.5 C25 37.5 20.5 41.5 19.5 48 C19 53 20 57 21.5 60 C24 55 27.5 50.5 33 46.5 C34.5 43 34 39.5 31 37.5 Z'],
    ['chest', 'M34.5 39 C40 37.8 45.5 37.8 49.2 38.8 L49.2 55.5 C44.5 58.5 37.5 58.3 33.3 54.8 C31.8 51 32.3 44.5 34.5 39 Z'],
    ['biceps', 'M22.3 61 C20.4 65.5 19.8 71.5 20.6 77.5 C22.6 80.5 26.6 80.2 28.4 76.6 C29.4 70.5 29.6 65 28.3 59.5 C26.6 58.6 24 59.4 22.3 61 Z'],
    ['forearms', FOREARM],
    ['abs', 'M43.6 61.5 a2 2 0 0 1 2-2 h1.6 a2 2 0 0 1 2 2 v4.4 a2 2 0 0 1 -2 2 h-1.6 a2 2 0 0 1 -2 -2 Z'],
    ['abs', 'M43.6 71.4 a2 2 0 0 1 2-2 h1.6 a2 2 0 0 1 2 2 v4.4 a2 2 0 0 1 -2 2 h-1.6 a2 2 0 0 1 -2 -2 Z'],
    ['abs', 'M43.6 81.3 a2 2 0 0 1 2-2 h1.6 a2 2 0 0 1 2 2 v4.4 a2 2 0 0 1 -2 2 h-1.6 a2 2 0 0 1 -2 -2 Z'],
    ['abs', 'M44 91.2 a2 2 0 0 1 2-2 h1.2 a2 2 0 0 1 2 2 v6.5 a2 2 0 0 1 -2 2 h-1.2 a2 2 0 0 1 -2 -2 Z'],
    ['obliques', 'M33.6 59 C36.4 60.6 39.6 61.6 42.2 62.4 L42.2 93 C38.6 93 35.6 91.2 34.4 88.4 C33.6 79 33 69 33.6 59 Z'],
    ['abductors', 'M32.6 93.5 C31 97.5 30.4 102 31 106.5 C33.4 104.5 35.6 101.5 36.4 98 C35.8 95.6 34.4 94 32.6 93.5 Z'],
    ['quads', 'M31.4 108 C30 118 30.2 132 32.2 146 C34 152.5 39.6 154.6 43.6 150.6 C45.2 141 45.8 127 45 113 C42.4 106.6 36.6 104.2 31.4 108 Z'],
    ['adductors', 'M45.6 106 C47.7 107.6 49 110.6 49 115 C48.4 124 47.3 132 46.3 138 C46 128 45.9 116 45.6 106 Z'],
    ['calves', 'M33.2 159 C31.6 168 31.8 180 33.8 195 L37.8 195.5 C39.8 182 40.8 169 40.2 159.5 C37.8 157.8 35.2 157.8 33.2 159 Z'],
  ];
  const FRONT_LINES = ['M38.2 111 C37 124 37.4 138 39.6 150', 'M34.5 48 C38 50.5 43 51.5 49 51'];

  const BACK = [
    ['traps', 'M45.5 28.5 C43.5 33 38 35.5 30.5 37.5 C37 41.5 43.5 50 49.2 63 L49.2 28.5 Z'],
    ['rear_delts', 'M30 38.5 C24.5 39 20.6 43.6 19.8 50.5 C23.5 48.4 28 45.6 33.4 42.4 C32.6 40.4 31.6 39.2 30 38.5 Z'],
    ['triceps', 'M20.6 53.5 C19 61 19 70 20.8 78 C23.4 80.4 27 79.6 28.8 76.4 C29 68.4 28.6 61 27.6 54.5 C25.4 52.6 22.6 52.4 20.6 53.5 Z'],
    ['forearms', FOREARM],
    ['lats', 'M33.6 45 C38.6 51 44 58.6 48.8 66 L48.8 82 C44 85.6 38.4 87.6 34.6 88 C33.4 75 32.8 59 33.6 45 Z'],
    ['lower_back', 'M42.4 86.5 C44.6 85.4 47 84.2 49 83.8 L49 101 L42 100.2 C41.8 95.4 42 90.6 42.4 86.5 Z'],
    ['glutes', 'M31.8 103 C34.6 99.2 42.4 99 49.2 101.6 L49.2 122 C42.4 126.2 34.6 124.6 31.2 118.4 C30.2 112.4 30.4 107 31.8 103 Z'],
    ['hamstrings', 'M31.8 127 C30.8 137 31.6 147 34.8 154.6 L44.2 154.6 C46 146.6 47 136.6 47.2 126.4 C42.2 128.6 36.4 128.8 31.8 127 Z'],
    ['calves', 'M33 160 C30.4 168 30.8 178 33.6 186.4 C36.6 189 41 188.4 43.2 184.6 C45.2 176.6 45.2 166.4 43.2 160.2 C40.2 157.6 35.8 157.6 33 160 Z'],
  ];
  const BACK_LINES = ['M39.5 130 C39 140 39.6 148 40.5 154', 'M38.2 165 C38.4 172 38.6 180 38.4 187'];

  const MIRROR = 'matrix(-1 0 0 1 100 0)';

  function figure(parts, lines, scores, dx, label) {
    const half = (lvl) => parts.map(([k, d]) => {
      const v = scores[k] || 0;
      return `<path d="${d}" class="m${v ? ' on' : ''}"${v ? ` style="fill-opacity:${(0.42 + 0.58 * v).toFixed(2)}"` : ''}/>`;
    }).join('') + lines.map((d) => `<path d="${d}" class="ml"/>`).join('');
    const h = half();
    return `<g transform="translate(${dx} 0)">
      <ellipse class="sil" cx="50" cy="15" rx="8.2" ry="10.2"/>
      <path class="sil" d="${SIL}"/><path class="sil" d="${SIL}" transform="${MIRROR}"/>
      <g>${h}</g><g transform="${MIRROR}">${h}</g>
      ${label ? `<text x="50" y="223" class="bl">${label}</text>` : ''}
    </g>`;
  }

  /** scores: { musculo: 0..1 } · color: cor de destaque · labels: mostra "Frente/Costas" */
  function bodyMap(scores, color, { labels = false, cls = '' } = {}) {
    return `<svg class="body ${cls}" viewBox="0 0 208 ${labels ? 228 : 214}" style="--mc:${color}" aria-hidden="true">
      ${figure(FRONT, FRONT_LINES, scores, 0, labels && 'Frente')}${figure(BACK, BACK_LINES, scores, 108, labels && 'Costas')}
    </svg>`;
  }

  /** Soma os músculos de todos os exercícios reconhecidos de um treino */
  function workoutMuscles(w) {
    const raw = {};
    let known = 0;
    for (const e of w.exercises) {
      const il = window.illusFor(e);
      if (!il || !il.mk) continue;
      known++;
      for (const m of il.mk.p) raw[m] = (raw[m] || 0) + 1;
      for (const m of il.mk.s) raw[m] = (raw[m] || 0) + 0.5;
    }
    const max = Math.max(0, ...Object.values(raw));
    const scores = {};
    for (const k in raw) scores[k] = raw[k] / max;
    const top = Object.keys(raw).sort((a, b) => raw[b] - raw[a]);
    return { scores, top, known, total: w.exercises.length };
  }

  window.MUSCLES = MUSCLES;
  window.bodyMap = bodyMap;
  window.workoutMuscles = workoutMuscles;
})();
