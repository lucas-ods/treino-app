'use strict';

/* =========================================================
   Constantes e utilidades
   ========================================================= */
const KEY = 'treino.v1';
const COLORS = ['#c8f53b', '#4cc9f0', '#ff9f43', '#ff6b9a', '#a78bfa', '#ffd43b', '#2dd4bf', '#f87171'];
const EQUIP = ['', 'Haltere', 'Barra', 'Cabo', 'Aparelho', 'Kettlebell', 'Elástico'];
const WEEK_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const $ = (s) => document.querySelector(s);
const clone = (o) => JSON.parse(JSON.stringify(o));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const mmss = (s) => { s = Math.max(0, Math.round(s)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };
const hms = (ms) => {
  let s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};
const durTxt = (sec) => { const m = Math.round((sec || 0) / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${pad(m % 60)}`; };
const secsTxt = (s) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}:${pad(s % 60)}`);
const num = (v) => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fmtN = (n, d = 1) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: d });
const dkey = (d) => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const startOfDay = (d) => { d = new Date(d); d.setHours(0, 0, 0, 0); return d; };
const startOfWeek = (d) => { d = startOfDay(d); d.setDate(d.getDate() - d.getDay()); return d; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function relDay(ts) {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(ts)) / 864e5);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  if (diff < 30) return `há ${diff} dias`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
function initials(name) {
  const w = String(name || '?').replace(/[-–—·_/]/g, ' ').split(/\s+/).filter(Boolean);
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
  return (w[0] || '?').slice(0, 2).toUpperCase();
}
function targetTxt(e) {
  if (e.type === 'time') return `${e.sets} × ${mmss(e.secs)}`;
  return e.reps ? `${e.sets} × ${e.reps} reps` : `${e.sets} séries`;
}

/* Ícones (traços no estilo Lucide) */
const ICONS = {
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  dumbbell: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  sliders: '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  'bell-off': '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"/><path d="m2 2 20 20"/><path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'arrow-up-down': '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
  'alert': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M6 8.5l6 1.5 6-1.5"/><path d="M12 10v5"/><path d="m9 21 3-6 3 6"/>',
  list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

function openHowto(name, equip) {
  const il = illusFor({ name, equip });
  if (!il) return;
  openSheet(`<div class="illus-big">${illusSvg(il)}</div>
    <h3>${esc(name)}</h3>
    <div class="ex-sub" style="margin-bottom:14px">${equip ? `<span class="tag">${esc(equip)}</span>` : ''}<span>${esc(il.muscles)}</span></div>
    <ol class="steps">${il.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="tip">${ic('flame')}<span>${esc(il.tip)}</span></div>
    <div class="sheet-actions"><button class="btn btn-secondary" data-a="sheet-close">Entendi</button></div>`);
}

/* =========================================================
   Dados iniciais (treinos de referência)
   ========================================================= */
function mkEx(name, equip = '', sets = 3, reps = 10, secs = null) {
  return { id: uid(), name, equip, type: secs ? 'time' : 'reps', sets, reps: secs ? null : reps, secs: secs || 60, rest: null };
}
function seed() {
  const H = 'Haltere', A = 'Aparelho', C = 'Cabo', B = 'Barra';
  const r = (n, e, s, reps) => mkEx(n, e, s, reps);
  const t = (n, e, s, secs) => mkEx(n, e, s, null, secs);
  const w = (name, color, exercises) => ({ id: uid(), name, color, exercises });
  return [
    w('Runner - Triceps', COLORS[0], [
      r('Supino', H, 4, 10), r('Crucifixo no banco inclinado', H, 4, 7), r('Desenvolvimento sentado', H, 4, 6),
      r('Elevação frontal', H, 3, 8), r('Tríceps francês', H, 4, 10), r('Tríceps testa no banco', H, 4, 6),
      r('Abdominal', '', 3, 25), t('Prancha', '', 3, 60),
    ]),
    w('Runner - Biceps', COLORS[1], [
      r('Pullover', H, 4, 12), r('Remada curvada', H, 3, 8), r('Elevação lateral', H, 3, 8),
      r('Crucifixo inverso', H, 3, 8), r('Rosca bíceps', H, 4, 8), r('Rosca concentrada', H, 3, 6),
      r('Abdominal sit-up com rotação', '', 3, 24), t('Prancha', '', 3, 60),
    ]),
    w('Runner - Perna', COLORS[2], [
      r('Agachamento no hack', A, 3, 8), r('Leg Press', A, 4, 10), r('Flexão da panturrilha sentado', A, 4, 15),
      r('Extensão da perna', A, 3, 10), r('Flexão de pernas sentado', A, 3, 10), r('Abdutor de quadril sentado', A, 3, 10),
      r('Adutor de quadril sentado', A, 3, 10), r('Abdominal', '', 3, null),
    ]),
    w('Superior Completo', COLORS[3], [
      r('Puxada para baixo lateral (pegada aberta)', C, 3, 10), r('Remada sentado', C, 3, 10), r('Rosca Scott', A, 3, 10),
      r('Supino', B, 3, 10), r('Crucifixo no banco inclinado', H, 3, 10), r('Extensão de tríceps', A, 3, 10),
      r('Desenvolvimento sentado', A, 3, 10), r('Elevação lateral', H, 3, 10), r('Abdominal sentado', A, 3, 15),
      r('Abdominal', '', 3, 20),
    ]),
    w('Superior Casa', COLORS[4], [
      r('Rosca bíceps', H, 3, 10), r('Remada curvada', H, 3, 10), r('Desenvolvimento sentado', H, 3, 10),
      r('Supino inclinado', H, 3, 10), r('Elevação frontal', H, 3, 10), r('Tríceps francês', H, 3, 10),
      r('Supino', H, 3, 10), t('Prancha', '', 3, 60), r('Abdominal', '', 3, 20), t('Prancha lateral', '', 3, 30),
      r('Flexão', '', 3, 5),
    ]),
    w('Core', COLORS[5], [
      r('Flexão', '', 3, 10), r('Supino', H, 3, 10), r('Abdominal', '', 3, 25), t('Prancha lateral', '', 3, 30),
      r('Elevação das pernas deitado', '', 3, 15), t('Prancha', '', 3, 60), t('Torção russa', H, 3, 60),
    ]),
  ];
}

/* =========================================================
   Persistência
   ========================================================= */
const DEFAULT_SETTINGS = { restOn: true, restSecs: 60, vibrate: true, sound: true, wake: true, homeView: 'simple' };
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.workouts)) {
      d.sessions = d.sessions || [];
      d.settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
      d.active = d.active || null;
      d.backup = d.backup || { last: null, snooze: null };
      return d;
    }
  } catch (e) { /* dados corrompidos: recomeça */ }
  return { v: 1, workouts: seed(), sessions: [], settings: { ...DEFAULT_SETTINGS }, active: null, backup: { last: null, snooze: null } };
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Não foi possível salvar'); }
}
save();

/* Proteção dos dados: armazenamento persistente + controle de backup */
let persisted = null; // true | false | null (não suportado)
async function requestPersist() {
  try {
    if (!navigator.storage?.persist) return;
    persisted = await navigator.storage.persisted();
    if (!persisted) persisted = await navigator.storage.persist();
  } catch (e) { /* ignorado */ }
}
function backupStatus() {
  const last = S.backup?.last || 0;
  const pending = S.sessions.filter((s) => (s.end || s.start) > last).length;
  const days = last ? Math.floor((Date.now() - last) / 864e5) : null;
  const due = pending > 0 && (last ? pending >= 8 || days >= 14 : pending >= 3);
  const snoozed = S.backup?.snooze && S.backup.snooze > Date.now();
  return { last, pending, days, due, show: due && !snoozed };
}
const treinosTxt = (n) => `${n} ${n === 1 ? 'treino' : 'treinos'}`;

const getW = (id) => S.workouts.find((w) => w.id === id);
const getSess = (id) => S.sessions.find((s) => s.id === id);
const colorOf = (s) => getW(s.workoutId)?.color || s.color || COLORS[0];
function wStats(id) {
  let count = 0, last = 0, volume = 0;
  for (const s of S.sessions) if (s.workoutId === id) { count++; last = Math.max(last, s.start); volume += s.volume || 0; }
  return { count, last, volume };
}
function sessionsByDay() {
  const m = {};
  for (const s of [...S.sessions].sort((a, b) => a.start - b.start)) (m[dkey(s.start)] ||= []).push(s);
  return m;
}

/* =========================================================
   Navegação (pilha + botão voltar do celular)
   ========================================================= */
const ui = { stack: [{ view: 'home' }], draft: null, draftOrig: '', calMonth: null, calSel: dkey(Date.now()), log: null, sorting: false, libTarget: null };
const cur = () => ui.stack[ui.stack.length - 1];

function go(view, params = {}) {
  cur().scroll = window.scrollY;
  ui.stack.push({ view, ...params });
  history.pushState({ d: ui.stack.length }, '');
  render();
  window.scrollTo(0, 0);
}
function back() { history.back(); }
function setRoot(stack) { ui.stack = stack; history.pushState({ d: stack.length }, ''); render(); window.scrollTo(0, 0); }
function tab(view) { ui.stack = [{ view }]; render(); window.scrollTo(0, 0); }
function replaceTop(view, params = {}) { ui.stack[ui.stack.length - 1] = { view, ...params }; render(); window.scrollTo(0, 0); }

/* Bottom sheet */
let sheetOpen = false, sheetCb = null, sheetResult = null;
function openSheet(html, cb) {
  sheetOpen = true; sheetCb = cb || null; sheetResult = null;
  history.pushState({ sheet: 1 }, '');
  const o = $('#overlay');
  o.innerHTML = `<div class="backdrop" data-a="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="handle"></div><div class="sheet-body">${html}</div></div>`;
  o.classList.add('open');
  requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('show')));
}
function updateSheet(html) { const b = $('.sheet-body'); if (b) b.innerHTML = html; }
function closeSheet(result = null) { if (!sheetOpen) return; sheetResult = result; history.back(); }
function confirmSheet({ title, msg = '', ok = 'Confirmar', cancel = 'Cancelar', danger = false }) {
  return new Promise((res) => {
    openSheet(`<h3>${esc(title)}</h3>${msg ? `<p>${esc(msg)}</p>` : ''}
      <div class="sheet-actions">
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-a="sheet-pick" data-v="ok">${esc(ok)}</button>
        <button class="btn btn-secondary" data-a="sheet-close">${esc(cancel)}</button>
      </div>`, (r) => res(r === 'ok'));
  });
}

window.addEventListener('popstate', () => {
  if (sheetOpen) {
    sheetOpen = false;
    const o = $('#overlay');
    o.classList.remove('show');
    setTimeout(() => { if (!sheetOpen) { o.innerHTML = ''; o.classList.remove('open'); } }, 220);
    const cb = sheetCb, r = sheetResult;
    sheetCb = null; sheetResult = null;
    if (cb) cb(r);
    return;
  }
  if (ui.stack.length > 1) {
    ui.stack.pop();
    render();
    window.scrollTo(0, cur().scroll || 0);
  }
});

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* =========================================================
   Componentes compartilhados
   ========================================================= */
const backBtn = (icon = 'chevron-left') => `<button class="icon-btn" data-a="back" aria-label="Voltar">${ic(icon)}</button>`;
function tabbar(on) {
  const t = (v, icon, label) => `<button class="tab ${on === v ? 'on' : ''}" data-a="tab" data-v="${v}">${ic(icon)}<span>${label}</span></button>`;
  return `<nav class="tabbar"><div class="tabs">${t('home', 'dumbbell', 'Treinos')}${t('calendar', 'calendar', 'Calendário')}${t('settings', 'sliders', 'Ajustes')}</div></nav>`;
}
const liveMini = () => S.active ? `<button class="live-mini" data-a="resume"><span class="pulse"></span><span class="lm-name">${esc(S.active.name)}</span><span class="lm-time" data-elapsed>${hms(Date.now() - S.active.start)}</span>${ic('chevron-right')}</button>` : '';

function setTxt(e, s) {
  if (e.type === 'time') return `${mmss(s.secs || 0)}${s.kg ? ` · ${fmtN(s.kg)} kg` : ''}`;
  if (s.kg && s.reps) return `${fmtN(s.kg)} kg × ${s.reps}`;
  if (s.reps) return `${s.reps} reps`;
  if (s.kg) return `${fmtN(s.kg)} kg`;
  return '✓';
}
function sessionStats(s) {
  return `<div class="stats">
    <div class="stat"><b>${durTxt(s.duration)}</b><span>duração</span></div>
    <div class="stat"><b>${fmtN(s.volume, 0)}</b><span>kg levantados</span></div>
    <div class="stat"><b>${s.setsDone ?? s.exercises.reduce((a, e) => a + e.sets.length, 0)}</b><span>séries</span></div>
  </div>`;
}
function sessionExercises(s) {
  if (!s.exercises.length) return '';
  return `<div class="section-title">Exercícios <span>${s.exercises.length}</span></div>` + s.exercises.map((e) => `
    <div class="card sx">
      <div class="ex-name">${esc(e.name)}</div>
      ${e.equip ? `<div class="ex-sub"><span class="tag">${esc(e.equip)}</span></div>` : ''}
      <div class="sx-sets">${e.sets.map((x) => `<span>${setTxt(e, x)}</span>`).join('')}</div>
    </div>`).join('');
}

/* =========================================================
   Telas
   ========================================================= */
function backupBanner() {
  const b = backupStatus();
  if (!b.show) return '';
  const why = b.last ? `${treinosTxt(b.pending)} desde o último backup (${relDay(b.last)})` : `${treinosTxt(b.pending)} registrados e nenhum backup ainda`;
  return `<div class="card backup-banner">
    <span class="bb-ic">${ic('shield')}</span>
    <span class="bb-main"><b>Faça um backup</b><span>${why}</span></span>
    <button class="bb-btn" data-a="export">Salvar</button>
    <button class="bb-x" data-a="snooze" aria-label="Lembrar depois">${ic('x')}</button>
  </div>`;
}
function dataCard() {
  const b = backupStatus();
  const ok = b.last && !b.due;
  const lastTxt = b.last ? `Último backup ${relDay(b.last)}` : 'Nenhum backup feito ainda';
  const pendTxt = b.pending ? `${treinosTxt(b.pending)} sem cópia de segurança` : 'Tudo copiado';
  const pTxt = persisted === true ? 'O navegador não vai apagar os dados por falta de espaço.'
    : persisted === false ? 'O navegador ainda não protegeu os dados. Instalar o app na tela inicial ajuda.'
    : 'Este navegador não informa se os dados estão protegidos.';
  return `<div class="card data-card ${ok ? 'ok' : 'warn'}">
    <span class="dc-ic">${ic(ok ? 'shield-check' : 'shield')}</span>
    <span><b>${lastTxt}</b><span>${pendTxt}</span><span class="dc-p">${pTxt}</span></span>
  </div>`;
}
function vHome() {
  const now = new Date();
  const h = now.getHours();
  const greet = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const sow = startOfWeek(now);
  const byDay = sessionsByDay();
  const todayK = dkey(now);
  let weekCount = 0;
  const days = WEEK_LETTERS.map((L, i) => {
    const d = new Date(sow); d.setDate(sow.getDate() + i);
    const k = dkey(d); const ss = byDay[k] || [];
    weekCount += ss.length;
    return `<div class="wd ${k === todayK ? 'today' : ''} ${ss.length ? 'has' : ''}" ${ss.length ? `style="--c:${colorOf(ss[0])}"` : ''}>
      <span class="wd-l">${L}</span><span class="wd-n">${d.getDate()}</span></div>`;
  }).join('');

  const banner = S.active ? `
    <button class="live-banner" data-a="resume">
      <span class="lb-l"><span class="pulse"></span><span><span class="lb-t">Treino em andamento</span><br><span class="lb-n">${esc(S.active.name)}</span></span></span>
      <span class="lb-r"><span data-elapsed>${hms(Date.now() - S.active.start)}</span>${ic('chevron-right')}</span>
    </button>` : '';

  const sorting = ui.sorting;
  const detailed = S.settings.homeView === 'detailed';
  const cards = S.workouts.map((w, i) => {
    const st = wStats(w.id);
    const meta = `${w.exercises.length} exercícios · ${st.last ? 'último ' + relDay(st.last) : 'nunca feito'}`;
    let inner;
    if (detailed) {
      const mu = workoutMuscles(w);
      const musTxt = mu.top.slice(0, 4).map((k) => MUSCLES[k]).join(' · ');
      inner = `
      <span class="wc-body">${bodyMap(mu.scores, w.color)}</span>
      <span class="wc-main">
        <span class="wc-name">${esc(w.name)}</span>
        <span class="wc-mus">${musTxt || 'Músculos não reconhecidos'}</span>
        <span class="wc-meta">${meta}${st.count ? ` · ${st.count}×` : ''}</span>
      </span>`;
    } else {
      inner = `
      <span class="badge">${esc(initials(w.name))}</span>
      <span class="wc-main">
        <span class="wc-name">${esc(w.name)}</span>
        <span class="wc-meta">${meta}</span>
      </span>
      ${st.count && !sorting ? `<span class="wc-count">${st.count}×</span>` : ''}`;
    }
    if (sorting) {
      return `<div class="card wcard sorting ${detailed ? 'detailed' : 'simple'}" style="--c:${w.color}">${inner}
        <span class="sort-btns">
          <button class="icon-btn sm" data-a="wmove" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${ic('arrow-up')}</button>
          <button class="icon-btn sm" data-a="wmove" data-i="${i}" data-d="1" ${i === S.workouts.length - 1 ? 'disabled' : ''} aria-label="Descer">${ic('arrow-down')}</button>
        </span></div>`;
    }
    return `<button class="card wcard ${detailed ? 'detailed' : 'simple'}" data-a="open" data-id="${w.id}" style="--c:${w.color}">${inner}${ic('chevron-right', 'chev')}</button>`;
  }).join('');

  return `<div class="screen">
    <header class="home-head"><div><div class="eyebrow">${greet} 👋</div><h1 class="h1">Seus treinos</h1></div></header>
    ${banner}
    ${backupBanner()}
    <section class="card week-card">
      <div class="week-top"><b>Esta semana</b><span><strong>${weekCount}</strong> ${weekCount === 1 ? 'treino' : 'treinos'}</span></div>
      <div class="week">${days}</div>
    </section>
    <div class="section-title">Treinos <span>${S.workouts.length}</span>
      ${S.workouts.length ? `<span class="view-toggle" role="group" aria-label="Visualização">
        <button class="${detailed ? '' : 'on'}" data-a="homeview" data-v="simple" aria-label="Visualização simplificada" aria-pressed="${!detailed}">${ic('list')}</button>
        <button class="${detailed ? 'on' : ''}" data-a="homeview" data-v="detailed" aria-label="Visualização detalhada com mapa muscular" aria-pressed="${detailed}">${ic('body')}</button>
      </span>` : ''}
      ${S.workouts.length > 1 ? `<button class="sort-toggle ${sorting ? 'on' : ''}" data-a="sort">${sorting ? `${ic('check')} Concluir` : `${ic('arrow-up-down')} Ordenar`}</button>` : ''}
    </div>
    ${S.workouts.length ? `<div class="wlist">${cards}</div>` : `<div class="empty">${ic('dumbbell')}<div>Nenhum treino ainda.<br>Toque em <b>Novo treino</b> para criar.</div></div>`}
  </div>
  ${sorting ? '' : `<button class="fab" data-a="new">${ic('plus')} Novo treino</button>`}
  ${tabbar('home')}`;
}

function vWorkout({ id }) {
  const w = getW(id);
  const st = wStats(id);
  const isActive = S.active?.workoutId === id;
  const list = w.exercises.map((e, i) => {
    const il = illusFor(e);
    const body = `${il ? `<span class="ex-thumb">${illusSvg(il)}</span>` : `<span class="ex-n">${i + 1}</span>`}
      <span class="ex-main"><span class="ex-name">${esc(e.name)}</span>
        <span class="ex-sub">${e.equip ? `<span class="tag">${esc(e.equip)}</span>` : ''}<span>${targetTxt(e)}</span></span>
      </span>`;
    return il
      ? `<button class="ex-row" data-a="howto" data-n="${esc(e.name)}" data-q="${esc(e.equip)}">${body}${ic('chevron-right', 'chev')}</button>`
      : `<div class="ex-row">${body}</div>`;
  }).join('');
  return `<div class="screen" style="--c:${w.color}">
    <div class="topbar">${backBtn()}<div class="grow"></div><button class="icon-btn" data-a="wmenu" data-id="${id}" aria-label="Mais opções">${ic('more')}</button></div>
    <div class="hero">
      <h1 class="h1">${esc(w.name)}</h1>
      ${(() => {
        const mu = workoutMuscles(w);
        return `<div class="card body-card">
          ${bodyMap(mu.scores, w.color, { labels: true, cls: 'lg' })}
          <div class="mus-chips">${mu.top.map((k) => `<span class="mus-chip" style="--o:${(0.3 + 0.7 * mu.scores[k]).toFixed(2)}">${MUSCLES[k]}</span>`).join('') || '<span class="sub">Nenhum exercício reconhecido</span>'}</div>
          ${mu.known < mu.total ? `<div class="body-note">${ic('alert')} ${mu.total - mu.known} ${mu.total - mu.known === 1 ? 'exercício não reconhecido' : 'exercícios não reconhecidos'} (sem ilustração)</div>` : ''}
        </div>`;
      })()}
      <div class="meta-row">
        <span class="pill">${ic('list')} ${w.exercises.length} exercícios</span>
        <span class="pill">${ic('flame')} ${st.count} ${st.count === 1 ? 'vez' : 'vezes'}</span>
        ${st.volume ? `<span class="pill">${ic('dumbbell')} ${fmtN(st.volume, 0)} kg</span>` : ''}
        ${st.last ? `<span class="pill">${ic('clock')} ${relDay(st.last)}</span>` : ''}
      </div>
    </div>
    ${w.exercises.length ? `<div class="card list">${list}</div>` : `<div class="empty">Nenhum exercício. Toque em Editar para adicionar.</div>`}
  </div>
  <div class="actionbar"><div class="inner">
    <button class="btn btn-secondary auto" data-a="edit" data-id="${id}">${ic('pencil')} Editar</button>
    <button class="btn btn-primary" data-a="start" data-id="${id}" ${w.exercises.length ? '' : 'disabled'}>${ic('play')} ${isActive ? 'Continuar treino' : 'Iniciar treino'}</button>
  </div></div>`;
}

/* ----- Treino em andamento ----- */
function progress(a) {
  let done = 0, total = 0;
  for (const e of a.exercises) for (const s of e.sets) { total++; if (s.done) done++; }
  return { done, total };
}
function phKg(e, si) {
  for (let j = si - 1; j >= 0; j--) if (e.sets[j].kg !== '') return String(e.sets[j].kg);
  const p = e.prev?.[si] || e.prev?.[e.prev.length - 1];
  return p?.kg ? fmtN(p.kg) : '';
}
function phReps(e, si) {
  if (e.target.reps) return String(e.target.reps);
  const p = e.prev?.[si];
  return p?.reps ? String(p.reps) : '';
}
function setRow(e, ei, s, si) {
  const p = e.prev?.[si];
  const isTime = e.type === 'time';
  const prevTxt = p ? setTxt(e, p) : '—';
  const t = S.active.timer;
  const running = t && t.ei === ei && t.si === si;
  const timeCell = isTime
    ? `<button class="tbtn ${running ? 'run' : ''}" data-a="tset" data-ei="${ei}" data-si="${si}" aria-label="Cronômetro da série">
         <span ${running ? 'data-timer' : ''}>${running ? mmss(Math.ceil((t.until - Date.now()) / 1000)) : mmss(s.secs || e.target.secs)}</span>${ic(running ? 'pause' : 'play')}</button>`
    : `<input class="inp" inputmode="numeric" enterkeyhint="done" autocomplete="off" data-f="reps" data-ei="${ei}" data-si="${si}" value="${esc(s.reps)}" placeholder="${esc(phReps(e, si) || '–')}">`;
  return `<div class="set-row ${s.done ? 'done' : ''}">
    <span class="set-no">${si + 1}</span>
    <span class="prev">${prevTxt}</span>
    <input class="inp" inputmode="decimal" enterkeyhint="done" autocomplete="off" data-f="kg" data-ei="${ei}" data-si="${si}" value="${esc(s.kg)}" placeholder="${esc(phKg(e, si) || '–')}">
    ${timeCell}
    <button class="chk" data-a="chk" data-ei="${ei}" data-si="${si}" aria-label="Concluir série ${si + 1}">${ic('check')}</button>
  </div>`;
}
function vActive() {
  const a = S.active;
  const { done, total } = progress(a);
  const cards = a.exercises.map((e, ei) => {
    const exDone = e.sets.length && e.sets.every((s) => s.done);
    const il = illusFor(e);
    return `<section class="card excard ${exDone ? 'complete' : ''}">
      <div class="exh">
        ${il ? `<button class="ex-thumb sm" data-a="howto" data-n="${esc(e.name)}" data-q="${esc(e.equip)}" aria-label="Como fazer">${illusSvg(il)}</button>` : ''}
        <div style="flex:1;min-width:0"><div class="ex-name">${esc(e.name)}</div>
          <div class="ex-sub">${e.equip ? `<span class="tag">${esc(e.equip)}</span>` : ''}<span>${targetTxt({ type: e.type, sets: e.sets.length, reps: e.target.reps, secs: e.target.secs })}</span></div></div>
        ${exDone ? `<span class="done-badge">${ic('check')}</span>` : ''}
      </div>
      <div class="set-row set-head"><span>Série</span><span>Anterior</span><span>kg</span><span>${e.type === 'time' ? 'Tempo' : 'Reps'}</span><span></span></div>
      ${e.sets.map((s, si) => setRow(e, ei, s, si)).join('')}
      <div class="set-tools">
        <button class="mini-btn" data-a="addset" data-ei="${ei}">${ic('plus')} Série</button>
        ${e.sets.length > 1 ? `<button class="mini-btn" data-a="delset" data-ei="${ei}">${ic('minus')} Remover</button>` : ''}
      </div>
    </section>`;
  }).join('');
  return `<div class="screen has-sticky" style="padding-bottom:calc(var(--safe-bottom) + 150px)">
    <header class="live-head">
      <div class="lh-row">
        ${backBtn('chevron-down')}
        <div class="lh-c"><div class="lh-name">${esc(a.name)}</div><div class="lh-time" data-elapsed>${hms(Date.now() - a.start)}</div></div>
        <button class="icon-btn ${S.settings.restOn ? 'on' : ''}" data-a="togglerest" aria-label="Descanso automático">${ic(S.settings.restOn ? 'bell' : 'bell-off')}</button>
        <button class="btn-finish" data-a="finish">Finalizar</button>
      </div>
      <div class="prog"><div style="width:${total ? (done / total) * 100 : 0}%"></div></div>
      <div class="prog-txt">${done} de ${total} séries concluídas</div>
    </header>
    ${cards}
    <button class="link-danger" data-a="discard">${ic('trash')} Descartar treino</button>
  </div>
  <div id="restbox">${restHTML()}</div>`;
}
function restHTML() {
  const r = S.active?.rest;
  if (!r) return '';
  const rem = Math.max(0, (r.until - Date.now()) / 1000);
  return `<div class="rest">
    <div class="rest-top">
      <div><div class="rest-l">Descanso</div><div class="rest-t" id="rest-t">${mmss(Math.ceil(rem))}</div></div>
      <div class="rest-btns">
        <button class="rb" data-a="rest-adj" data-d="-15">−15</button>
        <button class="rb" data-a="rest-adj" data-d="15">+15</button>
        <button class="rb skip" data-a="rest-skip">Pular</button>
      </div>
    </div>
    <div class="rest-prog"><div id="rest-bar" style="width:${(rem / r.total) * 100}%"></div></div>
  </div>`;
}

/* ----- Editor ----- */
function exIndicator(e, i) {
  const il = illusFor(e);
  if (il) return `<span class="ex-thumb sm">${illusSvg(il)}</span><span class="t">${i + 1}</span>`;
  return `<span class="ex-n">${i + 1}</span><span class="t${e.name.trim() ? ' warn' : ''}">${e.name.trim() ? 'Sem ilustração' : 'Exercício'}</span>`;
}
const LIB_GROUPS = [
  ['Peito', ['chest']], ['Costas', ['lats', 'traps', 'lower_back']], ['Ombros', ['shoulders', 'rear_delts']],
  ['Braços', ['biceps', 'triceps', 'forearms']], ['Pernas', ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors']],
  ['Abdômen e core', ['abs', 'obliques']],
];
function libItem(x, action, extra = '') {
  const idx = EXERCISE_LIB.indexOf(x);
  const mus = x.mk ? x.mk.p.map((k) => MUSCLES[k]).join(' · ') : '';
  return `<button class="lib-item" data-a="${action}" data-v="${idx}" ${extra}>
    <span class="ex-thumb sm">${illusSvg(x)}</span>
    <span class="li-main"><b>${esc(x.label)}</b><span>${x.defEq ? `${esc(x.defEq)} · ` : ''}${mus}</span></span>
  </button>`;
}
function suggHTML(i, q) {
  const words = normName(q);
  if (!words) return '';
  const lib = searchExercises(q).slice(0, 6);
  const exact = lib.length === 1 && normName(lib[0].label) === words;
  if (exact) return '';
  const items = lib.map((x) => libItem(x, 'pickex', `data-i="${i}"`)).join('');
  return items
    ? `<div class="sugg-box">${items}</div>`
    : `<div class="sugg-box empty">${ic('alert')}<span>Nenhum exercício com ilustração com esse nome. Você pode usar mesmo assim ou procurar na <button class="lbl-link" data-a="libpick" data-i="${i}">biblioteca</button>.</span></div>`;
}
function libListHTML(q) {
  const res = searchExercises(q);
  if (!res.length) return '<div class="empty-day">Nada encontrado. Use “Criar exercício sem ilustração”.</div>';
  if (normName(q)) return res.map((x) => libItem(x, 'sheet-pick')).join('');
  return LIB_GROUPS.map(([title, keys]) => {
    const xs = res.filter((x) => x.mk && keys.includes(x.mk.p[0]));
    return xs.length ? `<div class="lib-group">${title}</div>${xs.map((x) => libItem(x, 'sheet-pick')).join('')}` : '';
  }).join('');
}
function applyLib(e, x) {
  e.name = x.label;
  e.equip = x.defEq || '';
  if (x.type === 'time') { e.type = 'time'; e.secs = x.secs || 60; }
  else if (e.type === 'time') { e.type = 'reps'; e.reps = e.reps || 10; }
}
function openLibrary(target) {
  ui.libTarget = target;
  openSheet(`<h3>Escolher exercício</h3>
    <div class="lib-search">${ic('search')}<input class="text-in" data-f="libq" placeholder="Buscar: supino, rosca, perna..." autocomplete="off" autocorrect="off" spellcheck="false"></div>
    <div id="liblist" class="lib-list">${libListHTML('')}</div>
    <div class="sheet-actions"><button class="btn btn-secondary" data-a="sheet-pick" data-v="custom">${ic('pencil')} Criar exercício sem ilustração</button></div>`,
  (r) => {
    if (r == null) return;
    const d = ui.draft;
    if (!d) return;
    let i = ui.libTarget;
    if (i === 'new') { d.exercises.push(mkEx('', '', 3, 10)); i = d.exercises.length - 1; }
    if (r !== 'custom') applyLib(d.exercises[i], EXERCISE_LIB[+r]);
    render();
    const inp = document.querySelector(`[data-f="exname"][data-i="${i}"]`);
    if (inp) {
      inp.closest('.exedit')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (r === 'custom') inp.focus({ preventScroll: true });
    }
  });
}
function exEditor(e, i, n) {
  const chips = EQUIP.map((q) => `<button class="chip ${e.equip === q ? 'on' : ''}" data-a="equip" data-i="${i}" data-v="${esc(q)}">${q || 'Peso corporal'}</button>`).join('');
  const st = (k, label, val, input) => `<div class="st"><span class="lbl">${label}</span>
    <div class="stepper">
      <button data-a="step" data-i="${i}" data-k="${k}" data-d="-1" aria-label="Diminuir">${ic('minus')}</button>
      ${input ? `<input class="step-in" inputmode="numeric" data-f="exnum" data-i="${i}" data-k="${k}" value="${val ?? ''}" placeholder="—">` : `<span>${val}</span>`}
      <button data-a="step" data-i="${i}" data-k="${k}" data-d="1" aria-label="Aumentar">${ic('plus')}</button>
    </div></div>`;
  const restLabel = `Descanso ${e.rest != null ? `<button class="lbl-link" data-a="restreset" data-i="${i}">usar padrão</button>` : ''}`;
  return `<section class="card exedit">
    <div class="exe-head">
      <span class="exi" id="exi-${i}">${exIndicator(e, i)}</span>
      <button class="lib-btn" data-a="libpick" data-i="${i}">${ic('search')} Biblioteca</button>
      <button class="icon-btn sm" data-a="exmove" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Mover para cima">${ic('arrow-up')}</button>
      <button class="icon-btn sm" data-a="exmove" data-i="${i}" data-d="1" ${i === n - 1 ? 'disabled' : ''} aria-label="Mover para baixo">${ic('arrow-down')}</button>
      <button class="icon-btn sm danger" data-a="exdel" data-i="${i}" aria-label="Remover exercício">${ic('trash')}</button>
    </div>
    <input class="text-in" data-f="exname" data-i="${i}" value="${esc(e.name)}" placeholder="Digite para buscar o exercício" autocomplete="off" autocorrect="off" spellcheck="false">
    <div class="sugg" id="sugg-${i}"></div>
    <div class="chips">${chips}</div>
    <div class="seg">
      <button class="${e.type === 'reps' ? 'on' : ''}" data-a="extype" data-i="${i}" data-v="reps">Repetições</button>
      <button class="${e.type === 'time' ? 'on' : ''}" data-a="extype" data-i="${i}" data-v="time">Tempo</button>
    </div>
    <div class="st-grid">
      ${st('sets', 'Séries', e.sets, true)}
      ${e.type === 'time' ? st('secs', 'Tempo', mmss(e.secs), false) : st('reps', 'Reps', e.reps, true)}
      ${st('rest', restLabel, e.rest == null ? `Padrão (${secsTxt(S.settings.restSecs)})` : secsTxt(e.rest), false)}
    </div>
  </section>`;
}
function vEdit() {
  const d = ui.draft;
  const isNew = !getW(d.id);
  return `<div class="screen has-sticky">
    <header class="edit-head">
      <button class="txt-btn" data-a="editcancel">Cancelar</button>
      <div class="eh-t">${isNew ? 'Novo treino' : 'Editar treino'}</div>
      <button class="txt-btn accent" data-a="editsave">Salvar</button>
    </header>
    <label class="field"><span class="lbl">Nome do treino</span>
      <input class="text-in big" data-f="name" value="${esc(d.name)}" placeholder="Ex.: Peito e tríceps" maxlength="40" autocomplete="off"></label>
    <div class="field"><span class="lbl">Cor</span>
      <div class="swatches">${COLORS.map((c) => `<button class="swatch ${d.color === c ? 'on' : ''}" style="--c:${c}" data-a="color" data-c="${c}" aria-label="Cor"></button>`).join('')}</div></div>
    <div class="section-title">Exercícios <span>${d.exercises.length}</span></div>
    ${d.exercises.map((e, i) => exEditor(e, i, d.exercises.length)).join('')}
    <button class="add-ex" data-a="addex">${ic('plus')} Adicionar exercício</button>
    ${!isNew ? `<button class="link-danger" data-a="delw">${ic('trash')} Excluir treino</button>` : ''}
  </div>`;
}

/* ----- Calendário ----- */
function weekStreak() {
  const weeks = new Set(S.sessions.map((s) => dkey(startOfWeek(s.start))));
  const w = startOfWeek(new Date());
  if (!weeks.has(dkey(w))) w.setDate(w.getDate() - 7);
  let n = 0;
  while (weeks.has(dkey(w))) { n++; w.setDate(w.getDate() - 7); }
  return n;
}
function vCalendar() {
  const now = new Date();
  const m = ui.calMonth || (ui.calMonth = new Date(now.getFullYear(), now.getMonth(), 1));
  const y = m.getFullYear(), mo = m.getMonth();
  const byDay = sessionsByDay();
  const todayK = dkey(now);
  const first = new Date(y, mo, 1).getDay();
  const dim = new Date(y, mo + 1, 0).getDate();
  let cells = '<span></span>'.repeat(first);
  let monthCount = 0, monthSecs = 0;
  for (let d = 1; d <= dim; d++) {
    const k = dkey(new Date(y, mo, d));
    const ss = byDay[k] || [];
    monthCount += ss.length;
    ss.forEach((s) => (monthSecs += s.duration || 0));
    const cls = ['cal-day'];
    if (ss.length) cls.push('has');
    if (k === todayK) cls.push('today');
    if (k === ui.calSel) cls.push('sel');
    const dots = ss.length > 1 ? `<span class="dots">${ss.slice(0, 3).map((s) => `<i style="background:${colorOf(s)}"></i>`).join('')}</span>` : '';
    cells += `<button class="${cls.join(' ')}" data-a="calsel" data-k="${k}" ${ss.length ? `style="--c:${colorOf(ss[0])}"` : ''}>${d}${dots}</button>`;
  }
  const monthName = cap(m.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
  const monthShort = m.toLocaleDateString('pt-BR', { month: 'long' });
  const sel = ui.calSel;
  const selSs = byDay[sel] || [];
  const selTitle = fromKey(sel).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const isFuture = fromKey(sel) > startOfDay(now);
  const streak = weekStreak();
  const sessList = selSs.map((s) => `
    <button class="card sess" data-a="session" data-id="${s.id}" style="--c:${colorOf(s)}">
      <span class="badge sm">${esc(initials(s.name))}</span>
      <span class="wc-main"><span class="wc-name">${esc(s.name)}</span>
        <span class="wc-meta">${new Date(s.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · ${durTxt(s.duration)}${s.volume ? ` · ${fmtN(s.volume, 0)} kg` : ''}</span></span>
      ${ic('chevron-right', 'chev')}
    </button>`).join('');

  return `<div class="screen">
    <header class="home-head"><div><div class="eyebrow">Histórico</div><h1 class="h1">Calendário</h1></div></header>
    <div class="stats">
      <div class="stat"><b>${monthCount}</b><span>treinos em ${monthShort}</span></div>
      <div class="stat"><b>${durTxt(monthSecs)}</b><span>tempo no mês</span></div>
      <div class="stat"><b>${streak}</b><span>${streak === 1 ? 'semana seguida' : 'semanas seguidas'}</span></div>
    </div>
    <section class="card cal">
      <div class="cal-head">
        <span class="t">${monthName}</span>
        <span class="nav">
          <button class="icon-btn sm" data-a="calnav" data-d="-1" aria-label="Mês anterior">${ic('chevron-left')}</button>
          <button class="icon-btn sm" data-a="calnav" data-d="1" aria-label="Próximo mês">${ic('chevron-right')}</button>
        </span>
      </div>
      <div class="cal-wk">${WEEK_LETTERS.map((l) => `<span>${l}</span>`).join('')}</div>
      <div class="cal-grid">${cells}</div>
    </section>
    <div class="day-title">${selTitle}</div>
    ${sessList || `<div class="empty-day">${isFuture ? 'Dia ainda não chegou.' : 'Nenhum treino neste dia.'}</div>`}
    ${!isFuture && S.workouts.length ? `<button class="btn btn-ghost" data-a="logday">${ic('plus')} Registrar treino neste dia</button>` : ''}
  </div>
  ${liveMini()}
  ${tabbar('calendar')}`;
}

function vSession({ id }) {
  const s = getSess(id);
  const d = new Date(s.start);
  const date = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const t1 = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const t2 = new Date(s.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `<div class="screen" style="--c:${colorOf(s)}">
    <div class="topbar">${backBtn()}</div>
    <div class="hero">
      <span class="badge lg">${esc(initials(s.name))}</span>
      <h1 class="h1">${esc(s.name)}</h1>
      <p class="sub">${cap(date)} · ${t1}–${t2}${s.manual ? ' · registrado manualmente' : ''}</p>
    </div>
    ${sessionStats(s)}
    ${sessionExercises(s)}
    <button class="link-danger" data-a="delsess" data-id="${s.id}">${ic('trash')} Excluir registro</button>
  </div>`;
}

function vSummary({ id }) {
  const s = getSess(id);
  return `<div class="screen" style="--c:${colorOf(s)}">
    <div class="summary-hero">
      <div class="trophy">${ic('trophy')}</div>
      <h1 class="h1">Treino concluído!</h1>
      <p>${esc(s.name)} · ${cap(new Date(s.start).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
    </div>
    ${sessionStats(s)}
    <div class="btn-col">
      <button class="btn btn-primary" data-a="done">Concluir</button>
      <button class="btn btn-secondary" data-a="gocal" data-id="${s.id}">${ic('calendar')} Ver no calendário</button>
    </div>
    ${sessionExercises(s)}
  </div>`;
}

/* ----- Ajustes ----- */
function vSettings() {
  const st = S.settings;
  const canVibrate = 'vibrate' in navigator;
  const sw = (k, label, desc) => `<button class="item" data-a="setbool" data-k="${k}" role="switch" aria-checked="${!!st[k]}">
    <span><span class="it-t">${label}</span>${desc ? `<span class="it-d">${desc}</span>` : ''}</span><span class="switch ${st[k] ? 'on' : ''}"></span></button>`;
  return `<div class="screen">
    <header class="home-head"><div><div class="eyebrow">Preferências</div><h1 class="h1">Ajustes</h1></div></header>
    <div class="section-title">Descanso</div>
    <div class="card list" style="margin-top:0">
      ${sw('restOn', 'Descanso automático', 'Inicia ao concluir uma série')}
      <div class="item"><span><span class="it-t">Tempo padrão</span><span class="it-d">Ajustável por exercício</span></span>
        <div class="stepper sm"><button data-a="restdefault" data-d="-15" aria-label="Diminuir">${ic('minus')}</button><span>${secsTxt(st.restSecs)}</span><button data-a="restdefault" data-d="15" aria-label="Aumentar">${ic('plus')}</button></div></div>
      ${sw('vibrate', 'Vibrar ao terminar', canVibrate ? '' : 'Este aparelho/navegador não suporta vibração')}
      ${sw('sound', 'Som ao terminar', 'Três bipes curtos')}
    </div>
    <div class="section-title">Treino</div>
    <div class="card list" style="margin-top:0">
      ${sw('wake', 'Manter tela ligada', 'Enquanto um treino estiver em andamento')}
    </div>
    <div class="section-title">Seus dados</div>
    ${dataCard()}
    <div class="card list" style="margin-top:10px">
      <button class="item" data-a="export"><span class="it-ic">${ic('download')}<span><span class="it-t">Fazer backup</span><span class="it-d">Salve o arquivo no Drive, WhatsApp ou Arquivos</span></span></span>${ic('chevron-right', 'chev')}</button>
      <button class="item" data-a="import"><span class="it-ic">${ic('upload')}<span><span class="it-t">Importar backup</span><span class="it-d">Substitui os dados atuais</span></span></span>${ic('chevron-right', 'chev')}</button>
    </div>
    <p class="foot">Os dados ficam só neste aparelho: guarde o backup fora dele.<br>${S.sessions.length} treinos registrados · ${S.workouts.length} treinos cadastrados</p>
  </div>
  ${liveMini()}
  ${tabbar('settings')}`;
}

/* =========================================================
   Render
   ========================================================= */
const VIEWS = { home: vHome, workout: vWorkout, active: vActive, edit: vEdit, calendar: vCalendar, session: vSession, summary: vSummary, settings: vSettings };
function render() {
  const c = cur();
  const invalid =
    (c.view === 'active' && !S.active) ||
    (c.view === 'workout' && !getW(c.id)) ||
    (c.view === 'edit' && !ui.draft) ||
    ((c.view === 'session' || c.view === 'summary') && !getSess(c.id));
  if (invalid) ui.stack = [{ view: 'home' }];
  $('#app').innerHTML = VIEWS[cur().view](cur());
}

/* =========================================================
   Treino ativo: lógica
   ========================================================= */
function prevFor(e) {
  const ss = [...S.sessions].sort((a, b) => b.start - a.start);
  for (const s of ss) { const x = s.exercises.find((y) => y.id === e.id); if (x && x.sets.length) return x.sets; }
  const n = e.name.trim().toLowerCase();
  for (const s of ss) { const x = s.exercises.find((y) => y.name.trim().toLowerCase() === n && (y.equip || '') === (e.equip || '')); if (x && x.sets.length) return x.sets; }
  return null;
}
function newActive(w) {
  return {
    workoutId: w.id, name: w.name, start: Date.now(), rest: null, timer: null,
    exercises: w.exercises.map((e) => ({
      id: e.id, name: e.name, equip: e.equip, type: e.type,
      target: { reps: e.reps, secs: e.secs }, rest: e.rest, prev: prevFor(e),
      sets: Array.from({ length: Math.max(1, e.sets) }, () => ({ kg: '', reps: '', secs: 0, done: false })),
    })),
  };
}
function fillSet(e, si) {
  const s = e.sets[si];
  if (s.kg === '') s.kg = phKg(e, si);
  if (e.type === 'reps' && s.reps === '') s.reps = phReps(e, si);
  if (e.type === 'time' && !s.secs) s.secs = e.target.secs;
}
function startRest(e) {
  const a = S.active;
  if (!a || !S.settings.restOn) return;
  const { done, total } = progress(a);
  if (done >= total) return;
  const secs = e.rest ?? S.settings.restSecs;
  if (!secs) return;
  a.rest = { until: Date.now() + secs * 1000, total: secs };
  save();
  renderRest();
}
function renderRest() { const b = $('#restbox'); if (b) b.innerHTML = restHTML(); }
function endRest() {
  S.active.rest = null;
  save();
  notify();
  const b = $('#restbox');
  if (b) b.innerHTML = `<div class="rest ended">${ic('bell')} Descanso finalizado — bora pra próxima série!</div>`;
  setTimeout(() => { if (!S.active?.rest) { const bb = $('#restbox'); if (bb) bb.innerHTML = ''; } }, 3000);
}
function completeTimer() {
  const a = S.active, t = a.timer;
  a.timer = null;
  const e = a.exercises[t.ei], s = e.sets[t.si];
  s.secs = t.total; fillSet(e, t.si); s.done = true;
  save(); notify(); render(); startRest(e);
}
function buildSession(a) {
  const end = Date.now();
  let volume = 0, setsDone = 0;
  const exercises = a.exercises.map((e) => {
    const sets = e.sets.filter((s) => s.done).map((s) => {
      const kg = num(s.kg);
      const reps = e.type === 'reps' ? num(s.reps) : null;
      const secs = e.type === 'time' ? (s.secs || e.target.secs) : null;
      if (kg && reps) volume += kg * reps;
      setsDone++;
      return { kg, reps, secs };
    });
    return { id: e.id, name: e.name, equip: e.equip, type: e.type, sets };
  }).filter((e) => e.sets.length);
  return { id: uid(), workoutId: a.workoutId, name: a.name, color: getW(a.workoutId)?.color, start: a.start, end, duration: Math.round((end - a.start) / 1000), exercises, volume: Math.round(volume), setsDone };
}

/* Alertas: vibração + som */
let actx = null;
function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { /* sem áudio */ }
}
function beep() {
  if (!actx) return;
  const t = actx.currentTime;
  [0, 0.22, 0.44].forEach((o, i) => {
    const osc = actx.createOscillator(), g = actx.createGain();
    osc.type = 'sine'; osc.frequency.value = i === 2 ? 1320 : 880;
    g.gain.setValueAtTime(0.0001, t + o);
    g.gain.exponentialRampToValueAtTime(0.35, t + o + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.18);
    osc.connect(g).connect(actx.destination);
    osc.start(t + o); osc.stop(t + o + 0.2);
  });
}
function notify() {
  if (S.settings.vibrate && navigator.vibrate) navigator.vibrate([250, 100, 250, 100, 400]);
  if (S.settings.sound) beep();
}

/* Manter tela ligada */
let wakeLock = null;
async function requestWake() {
  if (!S.active || !S.settings.wake || !('wakeLock' in navigator) || wakeLock) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } catch (e) { /* ignorado */ }
}
function releaseWake() { try { wakeLock?.release(); } catch (e) { /* ignorado */ } wakeLock = null; }

/* Relógio */
function tick() {
  const a = S.active;
  if (!a) return;
  const now = Date.now();
  const el = hms(now - a.start);
  document.querySelectorAll('[data-elapsed]').forEach((n) => { if (n.textContent !== el) n.textContent = el; });
  if (a.timer) {
    const rem = Math.ceil((a.timer.until - now) / 1000);
    if (rem <= 0) completeTimer();
    else { const n = document.querySelector('[data-timer]'); if (n) n.textContent = mmss(rem); }
  }
  if (a.rest) {
    const rem = (a.rest.until - now) / 1000;
    if (rem <= 0) endRest();
    else {
      const t = $('#rest-t'), b = $('#rest-bar');
      if (t) t.textContent = mmss(Math.ceil(rem));
      if (b) b.style.width = `${(rem / a.rest.total) * 100}%`;
    }
  }
}
setInterval(tick, 250);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { tick(); requestWake(); } });

/* =========================================================
   Ações
   ========================================================= */
const exAt = (el) => S.active.exercises[+el.dataset.ei];
const dEx = (el) => ui.draft.exercises[+el.dataset.i];

async function startWorkout(id) {
  if (S.active) {
    if (S.active.workoutId === id) return go('active');
    const ok = await confirmSheet({ title: 'Treino em andamento', msg: `Você está no meio de "${S.active.name}". Descartar e iniciar este?`, ok: 'Descartar e iniciar', danger: true });
    if (!ok) return;
  }
  S.active = newActive(getW(id));
  save();
  requestWake();
  go('active');
}
async function finishWorkout() {
  const a = S.active;
  const { done, total } = progress(a);
  if (done === 0) {
    const ok = await confirmSheet({ title: 'Nenhuma série concluída', msg: 'Marque pelo menos uma série para registrar o treino. Quer descartar este treino?', ok: 'Descartar treino', cancel: 'Continuar treinando', danger: true });
    if (ok) discardWorkout(true);
    return;
  }
  const ok = await confirmSheet({
    title: 'Finalizar treino?',
    msg: total - done > 0 ? `Faltam ${total - done} séries — elas não serão registradas.` : `Tempo total: ${hms(Date.now() - a.start)}. Mandou bem!`,
    ok: 'Finalizar e salvar', cancel: 'Continuar treinando',
  });
  if (!ok) return;
  const s = buildSession(a);
  S.sessions.push(s);
  S.active = null;
  if (!persisted) requestPersist();
  save();
  releaseWake();
  ui.calSel = dkey(s.start);
  setRoot([{ view: 'home' }, { view: 'summary', id: s.id }]);
}
function discardWorkout() {
  S.active = null;
  save();
  releaseWake();
  setRoot([{ view: 'home' }]);
  toast('Treino descartado');
}
function sanitizeDraft(d) {
  d.name = d.name.trim();
  d.exercises = d.exercises.filter((e) => e.name.trim()).map((e) => ({
    ...e, name: e.name.trim(),
    sets: clamp(parseInt(e.sets, 10) || 3, 1, 30),
    reps: e.type === 'reps' ? (parseInt(e.reps, 10) > 0 ? clamp(parseInt(e.reps, 10), 1, 500) : null) : null,
    secs: clamp(parseInt(e.secs, 10) || 60, 5, 3600),
  }));
  return d;
}
function logSheetHTML() {
  const l = ui.log;
  const opts = S.workouts.map((w) => `<button class="opt ${l.wid === w.id ? 'on' : ''}" data-a="log-w" data-id="${w.id}" style="--c:${w.color}"><span class="badge sm">${esc(initials(w.name))}</span>${esc(w.name)}</button>`).join('');
  const mins = [30, 45, 60, 75, 90, 120].map((m) => `<button class="chip ${l.min === m ? 'on' : ''}" data-a="log-m" data-v="${m}">${m} min</button>`).join('');
  return `<h3>Registrar treino</h3>
    <p>${cap(fromKey(l.key).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))} — as séries planejadas serão marcadas como feitas.</p>
    <span class="lbl">Treino</span><div class="opt-list">${opts}</div>
    <span class="lbl">Duração</span><div class="chips" style="margin:0 0 18px;padding:0;flex-wrap:wrap">${mins}</div>
    <div class="sheet-actions"><button class="btn btn-primary" data-a="sheet-pick" data-v="save">Salvar no calendário</button></div>`;
}
function saveLog() {
  const l = ui.log, w = getW(l.wid);
  if (!w) return;
  const dur = l.min * 60;
  const day = fromKey(l.key);
  let start = new Date(day); start.setHours(18, 0, 0, 0);
  if (dkey(day) === dkey(Date.now()) && start.getTime() + dur * 1000 > Date.now()) start = new Date(Date.now() - dur * 1000);
  let setsDone = 0;
  const exercises = w.exercises.map((e) => {
    const sets = Array.from({ length: e.sets }, () => ({ kg: null, reps: e.type === 'reps' ? e.reps : null, secs: e.type === 'time' ? e.secs : null }));
    setsDone += sets.length;
    return { id: e.id, name: e.name, equip: e.equip, type: e.type, sets };
  });
  S.sessions.push({ id: uid(), workoutId: w.id, name: w.name, color: w.color, start: start.getTime(), end: start.getTime() + dur * 1000, duration: dur, exercises, volume: 0, setsDone, manual: true });
  save();
  render();
  toast('Treino registrado');
}

const A = {
  back: () => back(),
  tab: (el) => tab(el.dataset.v),
  open: (el) => go('workout', { id: el.dataset.id }),
  resume: () => go('active'),
  start: (el) => startWorkout(el.dataset.id),
  new: () => {
    ui.draft = { id: uid(), name: '', color: COLORS[S.workouts.length % COLORS.length], exercises: [mkEx('', '', 3, 10)] };
    ui.draftOrig = JSON.stringify(ui.draft);
    go('edit');
  },
  edit: (el) => {
    ui.draft = clone(getW(el.dataset.id));
    ui.draftOrig = JSON.stringify(ui.draft);
    go('edit');
  },
  wmenu: (el) => {
    const id = el.dataset.id;
    openSheet(`<h3>${esc(getW(id).name)}</h3>
      <button class="menu-item" data-a="sheet-pick" data-v="edit">${ic('pencil')} Editar treino</button>
      <button class="menu-item" data-a="sheet-pick" data-v="dup">${ic('copy')} Duplicar treino</button>
      <button class="menu-item danger" data-a="sheet-pick" data-v="del">${ic('trash')} Excluir treino</button>`, async (r) => {
      if (r === 'edit') A.edit(el);
      if (r === 'dup') {
        const w = clone(getW(id));
        w.id = uid(); w.name = `${w.name} (cópia)`; w.exercises.forEach((e) => (e.id = uid()));
        S.workouts.splice(S.workouts.findIndex((x) => x.id === id) + 1, 0, w);
        save(); setRoot([{ view: 'home' }, { view: 'workout', id: w.id }]); toast('Treino duplicado');
      }
      if (r === 'del') deleteWorkout(id);
    });
  },

  /* editor */
  color: (el) => { ui.draft.color = el.dataset.c; render(); },
  equip: (el) => { dEx(el).equip = el.dataset.v; render(); },
  extype: (el) => { dEx(el).type = el.dataset.v; if (el.dataset.v === 'reps' && !dEx(el).reps) dEx(el).reps = 10; render(); },
  step: (el) => {
    const e = dEx(el), k = el.dataset.k, d = +el.dataset.d;
    if (k === 'sets') e.sets = clamp((parseInt(e.sets, 10) || 0) + d, 1, 30);
    if (k === 'reps') { const v = (parseInt(e.reps, 10) || 0) + d; e.reps = v <= 0 ? null : Math.min(v, 500); }
    if (k === 'secs') e.secs = clamp((e.secs || 60) + d * 15, 5, 3600);
    if (k === 'rest') e.rest = clamp((e.rest ?? S.settings.restSecs) + d * 15, 0, 600);
    render();
  },
  restreset: (el) => { dEx(el).rest = null; render(); },
  exmove: (el) => {
    const i = +el.dataset.i, j = i + +el.dataset.d, ex = ui.draft.exercises;
    if (j < 0 || j >= ex.length) return;
    [ex[i], ex[j]] = [ex[j], ex[i]];
    render();
  },
  exdel: (el) => { ui.draft.exercises.splice(+el.dataset.i, 1); render(); },
  addex: () => openLibrary('new'),
  libpick: (el) => openLibrary(+el.dataset.i),
  pickex: (el) => { applyLib(dEx(el), EXERCISE_LIB[+el.dataset.v]); render(); },
  sort: () => { ui.sorting = !ui.sorting; render(); },
  homeview: (el) => { S.settings.homeView = el.dataset.v; save(); render(); },
  wmove: (el) => {
    const i = +el.dataset.i, j = i + +el.dataset.d, ws = S.workouts;
    if (j < 0 || j >= ws.length) return;
    [ws[i], ws[j]] = [ws[j], ws[i]];
    save(); render();
  },
  editsave: () => {
    const d = sanitizeDraft(clone(ui.draft));
    if (!d.name) { toast('Dê um nome ao treino'); $('[data-f="name"]')?.focus(); return; }
    if (!d.exercises.length) { toast('Adicione pelo menos um exercício'); return; }
    const i = S.workouts.findIndex((w) => w.id === d.id);
    ui.draft = null;
    if (i >= 0) { S.workouts[i] = d; save(); back(); }
    else { S.workouts.push(d); save(); replaceTop('workout', { id: d.id }); }
    toast('Treino salvo');
  },
  editcancel: async () => {
    if (JSON.stringify(ui.draft) !== ui.draftOrig) {
      const ok = await confirmSheet({ title: 'Descartar alterações?', msg: 'As mudanças feitas neste treino serão perdidas.', ok: 'Descartar', cancel: 'Continuar editando', danger: true });
      if (!ok) return;
    }
    back();
  },
  delw: () => deleteWorkout(ui.draft.id),

  /* treino ativo */
  chk: (el) => {
    const a = S.active, e = exAt(el), si = +el.dataset.si, s = e.sets[si];
    if (!s.done) {
      if (a.timer && a.timer.ei === +el.dataset.ei && a.timer.si === si) {
        s.secs = Math.max(1, Math.round((Date.now() - (a.timer.until - a.timer.total * 1000)) / 1000));
        a.timer = null;
      }
      fillSet(e, si);
      s.done = true;
      if (navigator.vibrate && S.settings.vibrate) navigator.vibrate(15);
      save(); render(); startRest(e);
    } else {
      s.done = false; save(); render();
    }
  },
  tset: (el) => {
    const a = S.active, ei = +el.dataset.ei, si = +el.dataset.si, e = a.exercises[ei], s = e.sets[si];
    const t = a.timer;
    if (t && t.ei === ei && t.si === si) {
      s.secs = Math.max(1, Math.round((Date.now() - (t.until - t.total * 1000)) / 1000));
      a.timer = null; fillSet(e, si); s.done = true;
      save(); render(); startRest(e);
      return;
    }
    s.done = false;
    a.rest = null;
    a.timer = { ei, si, total: e.target.secs, until: Date.now() + e.target.secs * 1000 };
    save(); render();
  },
  addset: (el) => {
    const e = exAt(el);
    e.sets.push({ kg: '', reps: '', secs: 0, done: false });
    save(); render();
  },
  delset: (el) => {
    const e = exAt(el), a = S.active;
    if (e.sets.length <= 1) return;
    if (a.timer && a.timer.ei === +el.dataset.ei && a.timer.si === e.sets.length - 1) a.timer = null;
    e.sets.pop(); save(); render();
  },
  'rest-adj': (el) => {
    const r = S.active.rest; if (!r) return;
    const d = +el.dataset.d;
    r.until = Math.max(Date.now() + 1000, r.until + d * 1000);
    r.total = Math.max(r.total + d, Math.ceil((r.until - Date.now()) / 1000));
    save(); tick();
  },
  'rest-skip': () => { S.active.rest = null; save(); renderRest(); },
  togglerest: () => {
    S.settings.restOn = !S.settings.restOn;
    if (!S.settings.restOn && S.active) S.active.rest = null;
    save(); render();
    toast(S.settings.restOn ? 'Descanso automático ligado' : 'Descanso automático desligado');
  },
  finish: () => finishWorkout(),
  discard: async () => {
    const ok = await confirmSheet({ title: 'Descartar treino?', msg: 'Nada deste treino será salvo.', ok: 'Descartar', cancel: 'Continuar treinando', danger: true });
    if (ok) discardWorkout();
  },

  /* resumo / sessão */
  done: () => setRoot([{ view: 'home' }]),
  gocal: (el) => {
    const s = getSess(el.dataset.id);
    const d = new Date(s.start);
    ui.calSel = dkey(d); ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    setRoot([{ view: 'calendar' }]);
  },
  session: (el) => go('session', { id: el.dataset.id }),
  howto: (el) => openHowto(el.dataset.n, el.dataset.q),
  delsess: async (el) => {
    const ok = await confirmSheet({ title: 'Excluir registro?', msg: 'Este treino será removido do calendário. Não dá para desfazer.', ok: 'Excluir', danger: true });
    if (!ok) return;
    S.sessions = S.sessions.filter((s) => s.id !== el.dataset.id);
    save(); back(); toast('Registro excluído');
  },

  /* calendário */
  calnav: (el) => { const m = ui.calMonth; ui.calMonth = new Date(m.getFullYear(), m.getMonth() + +el.dataset.d, 1); render(); },
  calsel: (el) => { ui.calSel = el.dataset.k; render(); },
  logday: () => {
    ui.log = { key: ui.calSel, wid: S.workouts[0]?.id, min: 60 };
    openSheet(logSheetHTML(), (r) => { if (r === 'save') saveLog(); });
  },
  'log-w': (el) => { ui.log.wid = el.dataset.id; updateSheet(logSheetHTML()); },
  'log-m': (el) => { ui.log.min = +el.dataset.v; updateSheet(logSheetHTML()); },

  /* ajustes */
  setbool: (el) => {
    const k = el.dataset.k;
    S.settings[k] = !S.settings[k];
    if (k === 'restOn' && !S.settings.restOn && S.active) S.active.rest = null;
    if (k === 'wake') S.settings.wake ? requestWake() : releaseWake();
    if (k === 'sound' && S.settings.sound) beep();
    if (k === 'vibrate' && S.settings.vibrate && navigator.vibrate) navigator.vibrate(60);
    save(); render();
  },
  restdefault: (el) => { S.settings.restSecs = clamp(S.settings.restSecs + +el.dataset.d * 15, 15, 600); save(); render(); },
  export: async () => {
    const data = { ...S, active: null, backup: undefined, exportedAt: new Date().toISOString() };
    const json = JSON.stringify(data, null, 2);
    const name = `treino-backup-${dkey(Date.now())}.json`;
    let shared = false;
    try {
      const file = new File([json], name, { type: 'application/json' });
      const touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
      if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Backup do Treino' });
        shared = true;
      }
    } catch (e) {
      if (e.name === 'AbortError') return; // cancelou o compartilhamento
    }
    if (!shared) {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    S.backup = { last: Date.now(), snooze: null };
    save(); render();
    toast('Backup salvo');
  },
  snooze: () => {
    S.backup = { ...S.backup, snooze: Date.now() + 3 * 864e5 };
    save(); render();
    toast('Vou lembrar de novo em 3 dias');
  },
  import: () => $('#importfile').click(),

  /* sheet */
  'sheet-pick': (el) => closeSheet(el.dataset.v),
  'sheet-close': () => closeSheet(null),
};

async function deleteWorkout(id) {
  const w = getW(id);
  const ok = await confirmSheet({ title: `Excluir "${w.name}"?`, msg: 'O treino será removido. Os registros no calendário continuam salvos.', ok: 'Excluir treino', danger: true });
  if (!ok) return;
  S.workouts = S.workouts.filter((x) => x.id !== id);
  ui.draft = null;
  save();
  setRoot([{ view: 'home' }]);
  toast('Treino excluído');
}

/* Inputs */
const F = {
  name: (el) => { ui.draft.name = el.value; },
  exname: (el) => {
    const i = +el.dataset.i, e = dEx(el);
    e.name = el.value;
    const ind = document.getElementById(`exi-${i}`);
    if (ind) ind.innerHTML = exIndicator(e, i);
    const sg = document.getElementById(`sugg-${i}`);
    if (sg) sg.innerHTML = suggHTML(i, el.value);
  },
  libq: (el) => { const l = document.getElementById('liblist'); if (l) l.innerHTML = libListHTML(el.value); },
  exnum: (el) => { dEx(el)[el.dataset.k] = el.value.replace(/\D/g, ''); },
  kg: (el) => { exAt(el).sets[+el.dataset.si].kg = el.value.replace(/[^\d.,]/g, ''); save(); },
  reps: (el) => { exAt(el).sets[+el.dataset.si].reps = el.value.replace(/\D/g, ''); save(); },
};

/* =========================================================
   Eventos globais
   ========================================================= */
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  unlockAudio();
  const fn = A[el.dataset.a];
  if (fn) fn(el, ev);
});
document.addEventListener('input', (ev) => {
  const f = ev.target.dataset?.f;
  if (f && F[f]) F[f](ev.target);
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && ev.target.classList?.contains('inp')) ev.target.blur();
});
document.addEventListener('pointerdown', (ev) => {
  if (ev.target.closest('.sugg')) ev.preventDefault(); // mantém o foco no campo para o toque contar
});
document.addEventListener('focusout', (ev) => {
  if (ev.target.dataset?.f !== 'exname') return;
  const sg = document.getElementById(`sugg-${ev.target.dataset.i}`);
  setTimeout(() => { if (sg && document.activeElement !== ev.target) sg.innerHTML = ''; }, 150);
});
document.addEventListener('focusin', (ev) => {
  if (ev.target.dataset?.f === 'exname') {
    const sg = document.getElementById(`sugg-${ev.target.dataset.i}`);
    if (sg && !illusFor(dEx(ev.target))) sg.innerHTML = suggHTML(+ev.target.dataset.i, ev.target.value);
  }
  if (ev.target.classList?.contains('inp')) setTimeout(() => ev.target.select?.(), 0);
});
$('#importfile').addEventListener('change', async (ev) => {
  const file = ev.target.files?.[0];
  ev.target.value = '';
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (!Array.isArray(d.workouts) || !Array.isArray(d.sessions)) throw new Error('formato');
    const ok = await confirmSheet({ title: 'Importar backup?', msg: `${d.workouts.length} treinos e ${d.sessions.length} registros vão substituir os dados atuais.`, ok: 'Importar' });
    if (!ok) return;
    S = { v: 1, workouts: d.workouts, sessions: d.sessions, settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) }, active: null,
      backup: { last: Date.parse(d.exportedAt) || Date.now(), snooze: null } };
    save(); render(); toast('Backup importado');
  } catch (e) {
    toast('Arquivo inválido');
  }
});

/* Início */
history.replaceState({ d: 1 }, '');
render();
if (S.active) requestWake();
requestPersist().then(() => { if (cur().view === 'settings') render(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
