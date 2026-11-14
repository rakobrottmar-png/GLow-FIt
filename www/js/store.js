// Alle Daten liegen nur auf dem Geraet (localStorage). Nichts wird hochgeladen,
// ausser den Anfragen an OpenRouter, wenn die KI benutzt wird.
const Store = (() => {
  const KEY = 'glowup.v1';
  const fresh = () => ({
    profile: { name: '', weight: 70 },
    goals: { kcal: 2400, protein: 130, steps: 8000, water: 2500, trainMin: 30, perWeek: 3 },
    ai: { provider: 'gemini', keys: { gemini: '' } },  // nur Google Gemini (gemini-3.8-flash)
    spotify: { clientId: '' },                     // + access, refresh, expires nach dem Login
    calendar: { id: '', title: '', time: '17:00', eventIds: [] },
    plans: JSON.parse(JSON.stringify(DEFAULT_PLANS)),
    schedule: Object.assign({}, DEFAULT_SCHEDULE),
    customEx: {},        // id -> { name, muskeln, tipp, anim }
    history: [],         // { date, ts, planId, name, type, min, kcal, sets }
    lastReps: {},        // exId -> letzte Wiederholungen
    meals: {},           // date -> [{ id, name, kcal, p, c, f, slot }]
    water: {},           // date -> ml
    steps: {},           // date -> Schritte
    stepsManual: {},     // date -> von Hand eingetragen
    weights: [],         // { date, kg }
    chat: []
  });

  let d;
  try { d = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { d = fresh(); }
  for (const k of ['profile', 'goals', 'ai', 'spotify', 'calendar']) d[k] = Object.assign(fresh()[k], d[k]);
  // Neue Standardplaene aus Updates ergaenzen (eigene Aenderungen bleiben)
  for (const p of DEFAULT_PLANS) if (!d.plans.some(x => x.id === p.id)) d.plans.push(JSON.parse(JSON.stringify(p)));
  // Nur noch Gemini: vorhandenen Gemini-Key behalten, alles andere verwerfen
  d.ai = { provider: 'gemini', keys: { gemini: (d.ai && d.ai.keys && d.ai.keys.gemini) || '' } };


  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* Speicher voll oder gesperrt */ }
    if (typeof Widget !== 'undefined') Widget.update();
  };
  const day = (dt = new Date()) => {
    const z = n => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${z(dt.getMonth() + 1)}-${z(dt.getDate())}`;
  };
  const addDays = (n, from = new Date()) => { const x = new Date(from); x.setDate(x.getDate() + n); return x; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  function exercise(id) {
    if (EXERCISES[id]) return EXERCISES[id];
    const c = d.customEx[id];
    if (!c) return null;
    const base = EXERCISES[c.anim] || EXERCISES.plank;
    return Object.assign({}, base, { name: c.name, muskeln: c.muskeln || base.muskeln, tipp: c.tipp || base.tipp });
  }
  const plan = id => d.plans.find(p => p.id === id);
  const planToday = (dt = new Date()) => plan(d.schedule[dt.getDay()]) || null;

  // Dauer eines Plans in Minuten (grob)
  function planMinutes(p) {
    let s = 0;
    for (const it of p.items) {
      const sides = it.sides === 2 ? 2 : 1;
      s += it.sets * (sides * (it.sec || 40) + (sides - 1) * 5 + (it.rest || 0));
    }
    return Math.max(1, Math.round(s / 60));
  }

  function mealTotals(date = day()) {
    const t = { kcal: 0, p: 0, c: 0, f: 0 };
    for (const m of d.meals[date] || []) { t.kcal += +m.kcal || 0; t.p += +m.p || 0; t.c += +m.c || 0; t.f += +m.f || 0; }
    return t;
  }
  const stepsOn = date => (d.steps[date] || 0) + (d.stepsManual[date] || 0);
  const trainMinOn = date => d.history.filter(h => h.date === date).reduce((a, h) => a + h.min, 0);
  const doneOn = date => d.history.filter(h => h.date === date);

  function weekDates(ref = new Date()) {   // Montag bis Sonntag
    const mon = addDays(-((ref.getDay() + 6) % 7), ref);
    return Array.from({ length: 7 }, (_, i) => addDays(i, mon));
  }
  const kraftThisWeek = () => {
    const days = weekDates().map(x => day(x));
    return d.history.filter(h => h.type === 'kraft' && days.includes(h.date)).length;
  };

  return {
    get d() { return d; }, save, day, addDays, uid, exercise, plan, planToday, planMinutes,
    mealTotals, stepsOn, trainMinOn, doneOn, weekDates, kraftThisWeek,
    reset() { d = fresh(); save(); },
    // Austauschformat fuer andere Apps: { format: 'glowup.v1', exportedAt, data } ohne Keys und Logins
    exportJson() {
      const c = JSON.parse(JSON.stringify(d));
      c.ai = { provider: c.ai.provider, model: c.ai.model };
      c.spotify = {}; c.chat = (c.chat || []).map(m => { delete m.image; return m; });
      return JSON.stringify({ format: 'glowup.v1', exportedAt: new Date().toISOString(), data: c }, null, 2);
    },
    importJson(text) {
      let j; try { j = JSON.parse(text); } catch (e) { throw new Error('Das ist kein gültiges JSON.'); }
      const src = j && j.format === 'glowup.v1' ? j.data : null;
      if (!src || !Array.isArray(src.plans)) throw new Error('Das ist kein Glow-Up-Export (format glowup.v1).');
      const keep = { ai: d.ai, spotify: d.spotify, calendar: d.calendar };
      d = Object.assign(fresh(), src, keep);
      for (const k of ['profile', 'goals']) d[k] = Object.assign(fresh()[k], src[k]);
      save();
    }
  };
})();
