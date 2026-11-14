// Oberflaeche: Start, Training (mit Player und Dehnen), Ernaehrung, Schritte, Coach.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const view = $('#view'), sheet = $('#sheet'), playerEl = $('#player'), toastEl = $('#toast');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = n => Math.round(n || 0).toLocaleString('de-DE');
  const pct = (v, goal) => goal > 0 ? Math.max(0, Math.min(1, v / goal)) : 0;
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const SLOTS = ['Frühstück', 'Mittag', 'Abend', 'Snack'];
  const ui = { tab: 'start', trainSeg: 'kraft', busy: false, chatBusy: false };
  const d = () => Store.d;

  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.hidden = true, 2600);
  }

  // ---------- Bausteine ----------
  function ring(r, p, color, w = 13) {
    const c = 2 * Math.PI * r;
    return `<circle cx="75" cy="75" r="${r}" stroke="${color}" stroke-width="${w}" opacity=".17"/>` +
      `<circle cx="75" cy="75" r="${r}" stroke="${color}" stroke-width="${w}" stroke-dasharray="${(c * Math.max(p, .004)).toFixed(1)} ${c.toFixed(1)}"/>`;
  }
  const gear = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.800v2.400M12 18.800v2.400M2.800 12h2.400M18.800 12h2.400M5.500 5.500l1.700 1.700M16.800 16.800l1.700 1.700M5.500 18.500l1.700-1.700M16.800 7.200l1.700-1.700"/></svg>';
  const itemLine = it => `${it.sets} × ${it.sec ? it.sec + ' Sek.' : esc(it.reps)}${it.sides === 2 ? ' pro Seite' : ''}`;
  const slotNow = () => { const h = new Date().getHours(); return h < 10 ? 'Frühstück' : h < 15 ? 'Mittag' : h < 21 ? 'Abend' : 'Snack'; };

  // ---------- Start ----------
  function vStart() {
    const t = Store.day(), g = d().goals, tot = Store.mealTotals(t);
    const steps = Store.stepsOn(t), min = Store.trainMinOn(t), water = d().water[t] || 0;
    const plan = Store.planToday(), done = Store.doneOn(t);
    const planDone = plan && done.some(h => h.planId === plan.id);
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

    const week = Store.weekDates().map(dt => {
      const key = Store.day(dt), p = Store.plan(d().schedule[dt.getDay()]);
      const kraft = d().history.some(h => h.date === key && h.type === 'kraft');
      const cls = (kraft ? 'done ' : p ? 'plan ' : '') + (key === t ? 'today' : '');
      const letter = kraft ? Ic('check') : p ? esc(p.name.replace(/^Tag\s+/i, '').slice(0, 2)) : '·';
      return `<div class="${cls}"><span>${WD[dt.getDay()]}</span><i>${letter}</i></div>`;
    }).join('');

    let today;
    if (plan) {
      today = `<div class="card">
        <div class="between"><span class="eyebrow">${planDone ? 'Heute erledigt' : 'Heute dran'}</span><span class="pill${planDone ? '' : ' gray'}">${planDone ? Ic('check') + ' Geschafft' : '≈ ' + Store.planMinutes(plan) + ' Min.'}</span></div>
        <div class="row" style="margin:10px 0 14px">
          <div class="thumb"><i data-fig="${esc(plan.items[0].ex)}"></i></div>
          <div class="grow"><h3 style="font-size:22px">${esc(plan.name)}</h3><div class="muted small">${esc(plan.sub || '')} · ${plan.items.length} Übungen</div></div>
        </div>
        <div class="btns"><button class="btn" data-a="start" data-id="${esc(plan.id)}">${planDone ? 'Nochmal starten' : 'Training starten'}</button>
        <button class="btn ghost" style="width:auto" data-a="plan" data-id="${esc(plan.id)}">Ansehen</button></div>
      </div>`;
    } else {
      today = `<div class="card">
        <span class="eyebrow">Heute</span>
        <div class="row" style="margin:10px 0 14px">
          <div class="thumb"><i data-fig="st_child"></i></div>
          <div class="grow"><h3 style="font-size:22px">Pausentag</h3><div class="muted small">Muskeln wachsen in der Pause. Dehnen tut trotzdem gut.</div></div>
        </div>
        <button class="btn soft" data-a="start" data-id="mobility">Mobility starten</button>
      </div>`;
    }

    return `
    <div class="head">
      <div><div class="eyebrow">${esc(dateStr)}</div><h1>${d().profile.name ? 'Hallo ' + esc(d().profile.name) : 'Glow Up'}</h1></div>
      <button class="iconbtn" data-a="settings" aria-label="Einstellungen">${gear}</button>
    </div>

    <div class="card"><div class="row" style="gap:16px">
      <svg class="rings" viewBox="0 0 150 150">${ring(62, pct(min, g.trainMin), 'var(--accent)')}${ring(46, pct(steps, g.steps), 'var(--accent-deep)')}${ring(30, pct(tot.kcal, g.kcal), 'var(--ice)')}</svg>
      <div class="legend">
        <div><span style="color:var(--accent)">Training</span><b>${min}<small> / ${g.trainMin} Min.</small></b></div>
        <div><span style="color:var(--accent-deep)">Schritte</span><b>${nf(steps)}<small> / ${nf(g.steps)}</small></b></div>
        <div><span style="color:var(--ice)">Kalorien</span><b>${nf(tot.kcal)}<small> / ${nf(g.kcal)} kcal</small></b></div>
      </div>
    </div></div>

    ${today}

    <div class="card">
      <div class="between" style="margin-bottom:10px"><span class="label">Diese Woche</span><span class="pill">${Store.kraftThisWeek()} / ${g.perWeek} Trainings</span></div>
      <div class="week">${week}</div>
    </div>

    <div class="grid2">
      <button class="card" style="text-align:left" data-a="tab" data-tab="schritte">
        <div class="label">Schritte</div><div class="big" style="margin:8px 0 10px">${nf(steps)}</div>
        <div class="bar"><i style="width:${pct(steps, g.steps) * 100}%;background:var(--accent-deep)"></i></div>
      </button>
      <div class="card">
        <div class="between" style="margin:-4px 0"><span class="label">Wasser</span><button class="plus" data-a="water" data-ml="250" aria-label="250 ml Wasser eintragen">${Ic('plus')}</button></div>
        <div class="big" style="margin:4px 0 10px">${(water / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}<small>/ ${(g.water / 1000).toLocaleString('de-DE')} l</small></div>
        <div class="bar"><i style="width:${pct(water, g.water) * 100}%"></i></div>
      </div>
    </div>

    <button class="card" style="text-align:left;width:100%" data-a="tab" data-tab="essen">
      <div class="between"><span class="label">Ernährung heute</span><span class="muted small">${tot.kcal > g.kcal ? nf(tot.kcal - g.kcal) + ' kcal drüber' : 'noch ' + nf(g.kcal - tot.kcal) + ' kcal'}</span></div>
      <div class="bar" style="margin:12px 0"><i style="width:${pct(tot.kcal, g.kcal) * 100}%;background:var(--ice)"></i></div>
      <div class="between small"><span><b class="num">${nf(tot.p)} g</b> <span class="muted">Eiweiß</span></span><span><b class="num">${nf(tot.c)} g</b> <span class="muted">Kohlenh.</span></span><span><b class="num">${nf(tot.f)} g</b> <span class="muted">Fett</span></span></div>
    </button>`;
  }

  // ---------- Training ----------
  function vTraining() {
    const seg = ui.trainSeg;
    let body;
    if (seg === 'verlauf') {
      const h = d().history.slice().reverse().slice(0, 40);
      body = h.length ? `<div class="card">${h.map(x => `<div class="meal"><div class="grow"><b>${esc(x.name)}</b><span class="muted small">${new Date(x.ts).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })} · ${x.min} Min. · ${nf(x.kcal)} kcal</span></div><span class="pill${x.type === 'kraft' ? '' : ' gray'}">${x.type === 'kraft' ? 'Kraft' : 'Dehnen'}</span></div>`).join('')}</div>`
        : `<div class="card muted">Noch kein Training gemacht. Starte Tag A oder Tag B, dann erscheint es hier.</div>`;
    } else {
      const plans = d().plans.filter(p => p.type === seg);
      body = `<div class="list">${plans.map(p => `
        <button class="item" data-a="plan" data-id="${esc(p.id)}">
          <div class="thumb"><i data-fig="${esc(p.items[0].ex)}"></i></div>
          <div class="grow"><h3>${esc(p.name)}</h3><div class="muted small">${esc(p.sub || '')}</div>
          <div class="small" style="margin-top:4px"><span class="pill">${p.items.length} Übungen</span> <span class="pill gray">≈ ${Store.planMinutes(p)} Min.</span></div></div>
          <span class="chev">${Ic('chev')}</span>
        </button>`).join('')}</div>
        <button class="btn soft" style="margin-top:14px" data-a="askcoach" data-q="${seg === 'kraft' ? 'Bau mir einen neuen Kraftplan für zu Hause.' : 'Bau mir eine neue Dehnroutine.'}">${Ic('spark')} Neuen Plan vom Coach bauen lassen</button>`;
    }
    return `
    <div class="head"><div><div class="eyebrow">Zu Hause · ohne Geräte</div><h1>Training</h1></div></div>
    <div class="spslot" style="margin-bottom:14px">${Spotify.bar()}</div>
    <div class="seg">${[['kraft', 'Kraft'], ['dehnen', 'Dehnen'], ['verlauf', 'Verlauf']].map(([k, n]) => `<button class="${seg === k ? 'on' : ''}" data-a="seg" data-seg="${k}">${n}</button>`).join('')}</div>
    ${body}`;
  }

  function planSheet(id) {
    const p = Store.plan(id); if (!p) return;
    openSheet(`
      <span class="eyebrow">${p.type === 'kraft' ? 'Krafttraining' : 'Dehnen'} · ≈ ${Store.planMinutes(p)} Min.</span>
      <h2 style="font-size:27px">${esc(p.name)}</h2>
      <div class="muted small" style="margin:-4px 0 14px">${esc(p.sub || '')}</div>
      <div class="list">${p.items.map(it => { const ex = Store.exercise(it.ex); return `
        <button class="item" style="background:var(--card2)" data-a="exercise" data-ex="${esc(it.ex)}">
          <div class="thumb" style="background:var(--card)"><i data-fig="${esc(it.ex)}"></i></div>
          <div class="grow"><h3>${esc(ex.name)}</h3><div class="small"><span class="accent num">${itemLine(it)}</span>${it.note ? ' <span class="muted">· ' + esc(it.note) + '</span>' : ''}</div>
          <div class="muted small">${it.rest ? 'Pause ' + it.rest + ' Sek.' : 'ohne Pause'}</div></div><span class="chev">${Ic('chev')}</span>
        </button>`; }).join('')}</div>
      <button class="btn" style="margin-top:16px" data-a="start" data-id="${esc(p.id)}">Training starten</button>
      ${p.custom ? `<button class="btn danger" style="margin-top:10px" data-a="delplan" data-id="${esc(p.id)}">Plan löschen</button>` : ''}`);
  }

  function exerciseSheet(exId, backPlan) {
    const ex = Store.exercise(exId); if (!ex) return;
    openSheet(`
      <span class="eyebrow">${esc(ex.muskeln || '')}</span>
      <h2 style="font-size:25px">${esc(ex.name)}</h2>
      <div class="stage"><i data-fig="${esc(exId)}" data-anim></i></div>
      <div class="note">${esc(ex.tipp || '')}</div>
      <button class="btn ghost" style="margin-top:14px" data-a="${backPlan ? 'plan' : 'close'}" data-id="${esc(backPlan || '')}">${backPlan ? 'Zurück zum Plan' : 'Schließen'}</button>`);
  }

  // ---------- Player ----------
  let P = null, tick = null, audio = null, wake = null;

  // iOS spielt Web-Audio erst nach einer Beruehrung ab. Deshalb beim ersten Tippen freischalten.
  function unlockAudio() {
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'transient'; // Musik kurz leiser statt stoppen
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const b = audio.createBuffer(1, 1, 22050), s = audio.createBufferSource();
      s.buffer = b; s.connect(audio.destination); s.start(0);
    } catch (e) { /* kein Ton verfuegbar */ }
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true });

  function beep(freq = 880, ms = 140, at = 0, vol = .25) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + at;
      o.type = 'square'; o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(.0001, t0 + ms / 1000);
      o.start(t0); o.stop(t0 + ms / 1000 + 0.02);
    } catch (e) { /* kein Ton verfuegbar */ }
  }
  // Deutlicher Abschluss-Ton: drei kurze Pieptoene plus Vibration
  function alarm() { beep(1175, 160, 0); beep(1175, 160, .22); beep(1568, 380, .44); Native.haptic('HEAVY'); }

  // Laeuft die App im Hintergrund, piept iOS ueber eine Mitteilung, wenn der Timer abgelaufen ist.
  const ALARM_ID = 7001;
  function scheduleAlarm() {
    if (!P || !P.running || !Native.isNative()) return;
    const title = P.phase === 'rest' ? 'Pause vorbei' : 'Zeit um';
    const next = P.phase === 'rest' && P.steps[P.i + 1] ? Store.exercise(P.steps[P.i + 1].it.ex).name : Store.exercise(P.steps[P.i].it.ex).name;
    Native.call('LocalNotifications', 'schedule', { notifications: [{ id: ALARM_ID, title, body: (P.phase === 'rest' ? 'Weiter mit: ' : '') + next, schedule: { at: new Date(P.endAt).toISOString() } }] }).catch(() => {});
  }
  const cancelAlarm = () => { if (Native.isNative()) Native.call('LocalNotifications', 'cancel', { notifications: [{ id: ALARM_ID }] }).catch(() => {}); };

  function startPlan(id) {
    const plan = Store.plan(id); if (!plan || !plan.items.length) return;
    const steps = [];
    plan.items.forEach((it, idx) => {
      const sides = it.sides === 2 ? 2 : 1;
      for (let s = 1; s <= it.sets; s++) for (let k = 1; k <= sides; k++) steps.push({ it, idx, set: s, side: sides === 2 ? k : 0 });
    });
    P = { plan, steps, i: 0, phase: 'work', running: false, endAt: 0, left: 0, started: Date.now(), sets: 0, reps: 0 };
    closeSheet(); playerEl.hidden = false; unlockAudio(); beep(660, 60);
    if (navigator.wakeLock) navigator.wakeLock.request('screen').then(w => wake = w).catch(() => {});
    if (Native.isNative()) Native.call('LocalNotifications', 'requestPermissions').catch(() => {});
    enterWork();
    clearInterval(tick); tick = setInterval(onTick, 200);
    clearInterval(spTick); Spotify.refresh(); spTick = setInterval(() => { if (Native.active) Spotify.refresh(); }, 5000);
  }
  let spTick = null;

  function repsDefault(it) {
    const last = d().lastReps[it.ex]; if (last) return last;
    const m = String(it.reps).match(/\d+/); return m ? +m[0] : 8;
  }

  function enterWork() {
    const st = P.steps[P.i], it = st.it;
    P.phase = 'work'; P.running = false;
    if (it.sec) { P.left = it.sec; if (P.plan.type === 'dehnen' && P.i > 0) startTimer(it.sec); }
    else P.reps = repsDefault(it);
    renderPlayer();
  }
  function startTimer(sec) { P.running = true; P.endAt = Date.now() + sec * 1000; P.total = sec; P.lastBeep = 99; }

  function workDone() {
    const st = P.steps[P.i], it = st.it;
    P.sets++;
    if (!it.sec) d().lastReps[it.ex] = P.reps;
    const next = P.steps[P.i + 1];
    if (!next) return finish();
    const rest = (next.it === it && st.side === 1) ? 5 : (it.rest || 0);
    if (rest > 0) { P.phase = 'rest'; startTimer(rest); renderPlayer(); }
    else { P.i++; enterWork(); }
  }

  function onTick() {
    if (!P || !P.running) return;
    const left = Math.max(0, (P.endAt - Date.now()) / 1000), whole = Math.ceil(left);
    const c = $('#pcount'), rg = $('#pring');
    if (c) c.textContent = whole;
    if (rg) rg.setAttribute('stroke-dasharray', `${(565.5 * (left / P.total)).toFixed(1)} 565.5`);
    if (whole <= 3 && whole > 0 && whole !== P.lastBeep) { P.lastBeep = whole; beep(700, 90); }
    if (left <= 0) {
      P.running = false; cancelAlarm(); alarm();
      if (P.phase === 'rest') { P.i++; enterWork(); } else workDone();
    }
  }

  function renderPlayer() {
    const st = P.steps[P.i], it = st.it, ex = Store.exercise(it.ex);
    const prog = P.i / P.steps.length;
    const top = `<div class="ptop"><button class="iconbtn" data-a="pquit" aria-label="Beenden"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <div class="bar"><i style="width:${prog * 100}%"></i></div><span class="muted small num">${P.i + 1}/${P.steps.length}</span></div>
      <div class="spslot" style="margin-top:10px">${Spotify.bar()}</div>`;
    const ringSvg = (color) => `<div class="restring"><svg viewBox="0 0 210 210"><circle cx="105" cy="105" r="90" stroke="${color}" opacity=".16"/><circle id="pring" cx="105" cy="105" r="90" stroke="${color}" stroke-dasharray="565.5 565.5"/></svg>
      <div class="mid"><div class="count" id="pcount">${Math.ceil(P.running ? (P.endAt - Date.now()) / 1000 : P.left)}</div><div class="muted small">Sekunden</div></div></div>`;

    if (P.phase === 'rest') {
      const next = P.steps[P.i + 1], nex = Store.exercise(next.it.ex), swap = next.it === it && st.side === 1;
      playerEl.innerHTML = `${top}<div class="pbody">
        <div><span class="eyebrow accent">${swap ? 'Seite wechseln' : 'Pause'}</span></div>
        ${ringSvg('var(--accent-deep)')}
        <div class="row" style="justify-content:center;text-align:left;gap:12px"><div class="thumb"><i data-fig="${esc(next.it.ex)}"></i></div>
          <div><div class="muted small">Als Nächstes</div><h3>${esc(nex.name)}</h3><div class="small accent num">${next.side ? (next.side === 1 ? 'Linke Seite · ' : 'Rechte Seite · ') : ''}Satz ${next.set} von ${next.it.sets}</div></div></div>
      </div><div class="btns"><button class="btn ghost" data-a="pmore">${Ic('plus')} 15 Sek.</button><button class="btn" data-a="pskip">Weiter</button></div>`;
    } else {
      const sub = `${st.side ? (st.side === 1 ? 'Linke Seite · ' : 'Rechte Seite · ') : ''}Satz ${st.set} von ${it.sets}${it.note ? ' · ' + esc(it.note) : ''}`;
      const main = it.sec
        ? ringSvg('var(--accent)').replace('class="restring"', 'class="restring" style="width:170px;height:170px"')
        : `<div><div class="muted small">Ziel: <b class="accent num">${esc(it.reps)}</b> Wiederholungen</div>
           <div class="stepper" style="margin-top:8px"><button data-a="preps" data-n="-1" aria-label="Weniger">${Ic('minus')}</button><div><div class="count sm" id="preps">${P.reps}</div><div class="muted small">geschafft</div></div><button data-a="preps" data-n="1" aria-label="Mehr">${Ic('plus')}</button></div></div>`;
      const btn = it.sec
        ? (P.running ? `<button class="btn ghost" data-a="ppause">Pause</button>` : `<button class="btn" data-a="pgo">${P.left < it.sec ? 'Weiter' : 'Start'}</button>`)
        : `<button class="btn" data-a="pdone">Satz geschafft</button>`;
      playerEl.innerHTML = `${top}<div class="pbody">
        <div><span class="eyebrow accent">${sub}</span><h1 style="margin-top:6px">${esc(ex.name)}</h1></div>
        <div class="stage"><i data-fig="${esc(it.ex)}" data-anim></i></div>
        ${main}
        <div class="muted small" style="max-width:420px;margin:0 auto">${esc(ex.tipp || '')}</div>
      </div><div class="btns">${it.sec ? `<button class="btn ghost" style="width:auto" data-a="pdone">Überspringen</button>` : ''}${btn}</div>`;
    }
    Figure.mount(playerEl);
    onTick();
  }

  function finish() {
    clearInterval(tick);
    const min = Math.max(1, Math.round((Date.now() - P.started) / 60000));
    const met = P.plan.type === 'kraft' ? 5 : 2.5;
    const kcal = Math.round(met * (d().profile.weight || 70) * min / 60);
    d().history.push({ date: Store.day(), ts: Date.now(), planId: P.plan.id, name: P.plan.name, type: P.plan.type, min, kcal, sets: P.sets });
    Store.save(); clearInterval(spTick); cancelAlarm(); beep(880, 120); beep(1320, 380, .16); Native.haptic('MEDIUM');
    const kraft = P.plan.type === 'kraft';
    playerEl.innerHTML = `<div class="pbody">
      <div><span class="eyebrow accent">Geschafft</span><h1 style="font-size:36px;margin-top:6px">${esc(P.plan.name)}</h1></div>
      <svg class="rings" style="margin:0 auto;width:170px;height:170px" viewBox="0 0 150 150">${ring(62, 1, 'var(--accent)')}${ring(46, 1, 'var(--accent-deep)')}${ring(30, 1, 'var(--ice)')}</svg>
      <div class="grid2" style="grid-template-columns:1fr 1fr 1fr;text-align:center">
        <div><div class="big">${min}</div><div class="muted small">Minuten</div></div>
        <div><div class="big">${P.sets}</div><div class="muted small">Sätze</div></div>
        <div><div class="big">${kcal}</div><div class="muted small">kcal (ca.)</div></div>
      </div>
      <div class="muted small">${kraft ? 'Stark. Gönn den Muskeln jetzt einen Tag Pause.' : 'Sehr gut. Regelmäßig dehnen hält dich beweglich.'}</div>
    </div>
    <div style="display:grid;gap:10px">${kraft ? `<button class="btn soft" data-a="start" data-id="dehnen-nach">Jetzt noch dehnen</button>` : ''}<button class="btn" data-a="pclose">Fertig</button></div>`;
    P = null;
  }

  function closePlayer() {
    clearInterval(tick); clearInterval(spTick); cancelAlarm(); P = null; playerEl.hidden = true; playerEl.innerHTML = '';
    if (wake) { wake.release().catch(() => {}); wake = null; }
    render();
  }

  // ---------- Ernaehrung ----------
  function vEssen() {
    const t = Store.day(), g = d().goals, tot = Store.mealTotals(t), meals = d().meals[t] || [], water = d().water[t] || 0;
    const left = g.kcal - tot.kcal;
    const groups = SLOTS.map(s => { const m = meals.filter(x => x.slot === s); return m.length ? `<div class="label" style="margin-top:14px">${s}</div>` + m.map(x => `
      <div class="meal"><div class="grow"><b>${esc(x.name)}</b><span class="muted small">${nf(x.p)} g E · ${nf(x.c)} g K · ${nf(x.f)} g F</span></div>
      <span class="num">${nf(x.kcal)}</span><button class="x" data-a="delmeal" data-id="${esc(x.id)}" aria-label="Löschen">${Ic('close')}</button></div>`).join('') : ''; }).join('');
    const macro = (name, v, goal, color) => `<div><div class="between small"><span class="muted">${name}</span><b class="num">${nf(v)}${goal ? '<span class="muted"> / ' + goal + '</span>' : ''} g</b></div><div class="bar" style="margin-top:6px"><i style="width:${pct(v, goal || Math.max(v, 1)) * 100}%;background:${color}"></i></div></div>`;
    const glasses = Math.max(8, Math.ceil(g.water / 250));
    return `
    <div class="head"><div><div class="eyebrow">Heute</div><h1>Ernährung</h1></div></div>
    <div class="card">
      <div class="row" style="gap:16px">
        <svg class="rings" style="width:112px;height:112px" viewBox="0 0 150 150">${ring(60, pct(tot.kcal, g.kcal), left < 0 ? 'var(--danger)' : 'var(--accent)', 15)}</svg>
        <div class="grow"><div class="label">${left < 0 ? 'Über dem Ziel' : 'Noch übrig'}</div><div class="big" style="font-size:38px;margin:4px 0">${nf(Math.abs(left))}<small>kcal</small></div>
        <div class="muted small">${nf(tot.kcal)} gegessen · Ziel ${nf(g.kcal)}</div></div>
      </div>
      <div style="display:grid;gap:12px;margin-top:16px">${macro('Eiweiß', tot.p, g.protein, 'var(--accent)')}${macro('Kohlenhydrate', tot.c, 0, 'var(--accent-deep)')}${macro('Fett', tot.f, 0, 'var(--ice)')}</div>
    </div>

    <div class="grid2">
      <button class="btn" data-a="scan">${Ic('scan')} Foto scannen</button>
      <button class="btn ghost" data-a="addmeal">${Ic('plus')} Eintragen</button>
    </div>

    <div class="card"><div class="between"><span class="label">Mahlzeiten</span><span class="muted small">${meals.length} Einträge</span></div>
      ${groups || '<div class="muted small" style="margin-top:10px">Noch nichts eingetragen. Mach ein Foto von deinem Essen oder trag es von Hand ein.</div>'}</div>

    <div class="card">
      <div class="between"><span class="label">Wasser</span><span class="num">${nf(water)} <span class="muted">/ ${nf(g.water)} ml</span></span></div>
      <div style="display:flex;flex-wrap:wrap;gap:7px;margin:12px 0">${Array.from({ length: glasses }, (_, i) => `<i style="width:22px;height:30px;border-radius:5px 5px 9px 9px;background:${(i + 1) * 250 <= water ? 'var(--accent)' : 'var(--card2)'}"></i>`).join('')}</div>
      <div class="btns"><button class="btn soft sm" style="flex:1" data-a="water" data-ml="250">${Ic('plus')} 250 ml</button><button class="btn soft sm" style="flex:1" data-a="water" data-ml="500">${Ic('plus')} 500 ml</button><button class="btn ghost sm" data-a="water" data-ml="-250" aria-label="250 ml weniger">${Ic('minus')}</button></div>
    </div>`;
  }

  function mealSheet(pre = {}, info = '') {
    openSheet(`
      <h2>Mahlzeit eintragen</h2>
      ${info}
      <div class="btns" style="margin-top:4px"><button class="btn soft sm" style="flex:1" data-a="scan">${Ic('camera')} Foto (KI)</button><button class="btn soft sm" style="flex:1" data-a="describe">${Ic('spark')} Beschreiben (KI)</button></div>
      <div class="field"><label for="m-search">Schnell aus der Liste (offline)</label><input id="m-search" placeholder="z. B. Banane, Reis, Quark" autocomplete="off"></div>
      <div id="m-hits" class="chips" style="flex-wrap:wrap;overflow:visible;padding-top:8px"></div>
      <div class="field"><label for="m-name">Name</label><input id="m-name" value="${esc(pre.name || '')}" placeholder="Was hast du gegessen?"></div>
      <div class="fields"><div class="field"><label for="m-kcal">Kalorien (kcal)</label><input id="m-kcal" inputmode="numeric" value="${pre.kcal != null ? pre.kcal : ''}"></div>
        <div class="field"><label for="m-slot">Wann</label><select id="m-slot">${SLOTS.map(s => `<option${s === (pre.slot || slotNow()) ? ' selected' : ''}>${s}</option>`).join('')}</select></div></div>
      <div class="fields3"><div class="field"><label for="m-p">Eiweiß (g)</label><input id="m-p" inputmode="numeric" value="${pre.p != null ? pre.p : ''}"></div>
        <div class="field"><label for="m-c">Kohlenh. (g)</label><input id="m-c" inputmode="numeric" value="${pre.c != null ? pre.c : ''}"></div>
        <div class="field"><label for="m-f">Fett (g)</label><input id="m-f" inputmode="numeric" value="${pre.f != null ? pre.f : ''}"></div></div>
      <button class="btn" style="margin-top:16px" data-a="savemeal">Speichern</button>`);
    const hits = $('#m-hits'), search = $('#m-search');
    const show = q => {
      const list = FOODS.filter(f => f[0].toLowerCase().includes(q.toLowerCase())).slice(0, q ? 8 : 6);
      hits.innerHTML = list.map(f => `<button data-a="pickfood" data-i="${FOODS.indexOf(f)}">${esc(f[0])} <span class="muted">· ${f[2]} kcal</span></button>`).join('') || '<span class="muted small">Nichts gefunden. Trag es unten von Hand ein oder frag die KI.</span>';
    };
    search.addEventListener('input', () => show(search.value.trim())); show('');
  }

  async function scanPhoto(file) {
    const preview = (window.URL || window.webkitURL).createObjectURL(file);
    openSheet(`<h2>Essen wird gescannt</h2>
      <div class="scan"><img src="${preview}" alt="Foto deines Essens"><span class="beam"></span><i class="corner c1"></i><i class="corner c2"></i><i class="corner c3"></i><i class="corner c4"></i></div>
      <div class="muted small" style="margin-top:12px;text-align:center">Die KI schätzt Kalorien und Nährwerte. Das dauert ein paar Sekunden.</div>`);
    const started = Date.now();
    try {
      const r = await AI.scanMeal({ image: await AI.shrink(file) });
      // Die Scan-Animation mindestens kurz zeigen, auch wenn die Antwort sehr schnell kommt
      await new Promise(ok => setTimeout(ok, Math.max(0, 1800 - (Date.now() - started))));
      if (!r.kcal) return mealSheet({}, `<div class="note warn">${esc(r.hinweis || 'Auf dem Foto wurde kein Essen erkannt.')}</div>`);
      mealSheet(r, `<div class="note"><b>KI-Schätzung${r.portion ? ' · ' + esc(r.portion) : ''}</b><br>${esc(r.hinweis || 'Prüfe die Werte kurz und passe sie an, wenn nötig.')}</div>`);
    } catch (e) { mealSheet({}, `<div class="note warn">${esc(e.message)}</div>`); }
    finally { (window.URL || window.webkitURL).revokeObjectURL(preview); }
  }

  function describeSheet() {
    openSheet(`<h2>Mahlzeit beschreiben</h2><div class="field"><label for="d-text">Was und wie viel?</label><textarea id="d-text" rows="3" placeholder="z. B. 2 Scheiben Vollkornbrot mit Käse und ein Apfel"></textarea></div>
      <button class="btn" style="margin-top:14px" data-a="describego">${Ic('spark')} Nährwerte schätzen</button>`);
    setTimeout(() => $('#d-text') && $('#d-text').focus(), 250);
  }

  // ---------- Schritte ----------
  const native = () => window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
  const ped = (method, opts) => window.Capacitor.nativePromise
    ? window.Capacitor.nativePromise('CapacitorPedometer', method, opts || {})
    : window.Capacitor.Plugins.CapacitorPedometer[method](opts || {});
  let stepState = native() ? 'laedt' : 'web';

  async function syncSteps(ask) {
    if (!native()) return;
    try {
      const av = await ped('isAvailable');
      if (!av.stepCounting) { stepState = 'nicht-verfuegbar'; return; }
      let perm = await ped('checkPermissions');
      if (perm.activityRecognition !== 'granted' && (ask || perm.activityRecognition === 'prompt')) perm = await ped('requestPermissions');
      if (perm.activityRecognition === 'denied') { stepState = 'verweigert'; return; }
      for (let i = 0; i < 7; i++) {
        const start = Store.addDays(-i); start.setHours(0, 0, 0, 0);
        const end = i === 0 ? new Date() : new Date(start.getTime() + 864e5);
        const m = await ped('getMeasurement', { start: start.getTime(), end: end.getTime() });
        d().steps[Store.day(start)] = Math.round(m.numberOfSteps || 0);
      }
      stepState = 'ok'; Store.save();
      if (ui.tab === 'start' || ui.tab === 'schritte') render();
    } catch (e) { stepState = 'fehler'; }
  }

  function vSchritte() {
    const t = Store.day(), g = d().goals, steps = Store.stepsOn(t);
    const km = steps * 0.00075, kcal = steps * 0.04 * (d().profile.weight || 70) / 70;
    const days = Array.from({ length: 7 }, (_, i) => Store.addDays(i - 6));
    const max = Math.max(g.steps, ...days.map(x => Store.stepsOn(Store.day(x))));
    const sum = days.reduce((a, x) => a + Store.stepsOn(Store.day(x)), 0);
    const hint = {
      web: 'In dieser Vorschau gibt es keinen Schrittsensor. Auf dem iPhone zählt die App automatisch mit.',
      laedt: 'Schritte werden vom iPhone geladen …',
      verweigert: 'Der Zugriff auf „Bewegung & Fitness“ ist aus. Schalte ihn in den iPhone-Einstellungen unter Glow Up ein.',
      'nicht-verfuegbar': 'Dieses Gerät hat keinen Schrittzähler. Du kannst Schritte von Hand eintragen.',
      fehler: 'Die Schritte konnten gerade nicht gelesen werden. Tippe auf Aktualisieren.',
      ok: 'Gezählt vom Bewegungssensor deines iPhones, auch wenn die App zu ist.'
    }[stepState];
    return `
    <div class="head"><div><div class="eyebrow">Heute</div><h1>Schritte</h1></div><button class="iconbtn" data-a="syncsteps" aria-label="Aktualisieren"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.600-5.900M20 4v4.500h-4.500"/></svg></button></div>
    <div class="card" style="text-align:center">
      <div class="restring" style="width:220px;height:220px"><svg viewBox="0 0 210 210"><circle cx="105" cy="105" r="90" stroke="var(--accent-deep)" opacity=".16" style="stroke-width:16"/><circle cx="105" cy="105" r="90" stroke="var(--accent-deep)" style="stroke-width:16" stroke-dasharray="${(565.5 * Math.max(pct(steps, g.steps), .004)).toFixed(1)} 565.5"/></svg>
        <div class="mid"><div class="count" style="font-size:52px">${nf(steps)}</div><div class="muted small">von ${nf(g.steps)}</div></div></div>
      <div class="grid2" style="margin-top:14px"><div><div class="big">${km.toLocaleString('de-DE', { maximumFractionDigits: 1 })}<small>km</small></div><div class="muted small">Strecke (ca.)</div></div>
        <div><div class="big">${nf(kcal)}<small>kcal</small></div><div class="muted small">verbrannt (ca.)</div></div></div>
    </div>
    <div class="card">
      <div class="between" style="margin-bottom:14px"><span class="label">Letzte 7 Tage</span><span class="muted small">⌀ ${nf(sum / 7)} pro Tag</span></div>
      <div class="chart">${days.map(x => { const v = Store.stepsOn(Store.day(x)); return `<div class="${Store.day(x) === t ? 'now' : v >= g.steps ? 'hit' : ''}"><i style="height:${Math.max(3, v / max * 100)}%"></i><span>${WD[x.getDay()]}</span></div>`; }).join('')}</div>
    </div>
    <div class="note">${hint}</div>
    <button class="btn ghost" style="margin-top:12px" data-a="addsteps">Schritte von Hand eintragen</button>`;
  }

  // ---------- Coach ----------
  const TOOLNAMES = { create_plan: 'Plan angelegt', update_plan: 'Plan geändert', delete_plan: 'Plan gelöscht', create_exercise: 'Übung angelegt', set_schedule: 'Wochenplan geändert', set_goals: 'Ziele geändert', log_meal: 'Mahlzeit eingetragen', log_water: 'Wasser eingetragen', log_weight: 'Gewicht eingetragen' };
  function vCoach() {
    const chat = d().chat, hasKey = !!d().ai.key;
    const chips = ['Mach Tag A etwas schwerer', 'Bau mir einen 10-Minuten-Bauchplan', 'Was soll ich heute noch essen?', 'Stell mein Kalorienziel auf Muskelaufbau ein', 'Erstelle eine Dehnroutine für den Rücken'];
    return `
    <div class="head"><div><div class="eyebrow">KI · ${esc(d().ai.model)}</div><h1>Coach</h1></div>${chat.length ? '<button class="btn sm ghost" data-a="clearchat">Leeren</button>' : ''}</div>
    ${hasKey ? '' : `<div class="card"><h3>OpenAI-Key fehlt</h3><div class="muted small" style="margin:6px 0 12px">Der Coach und der Kalorien-Scanner brauchen deinen eigenen OpenAI-API-Key. Er bleibt nur auf diesem Gerät gespeichert.</div><button class="btn" data-a="settings">Key eintragen</button></div>`}
    ${chat.length ? '' : `<div class="card" style="margin-top:12px"><h3>Ich kann Dinge in der App für dich bauen</h3><div class="muted small" style="margin-top:6px">Zum Beispiel neue Trainingspläne und Dehnroutinen anlegen, Pläne schwerer machen, deinen Wochenplan und deine Ziele ändern oder Mahlzeiten eintragen. Sag einfach, was du willst.</div></div>`}
    <div class="chat" style="margin-top:12px">${chat.map(m => `<div class="msg ${m.role}${m.err ? ' err' : ''}">${m.role === 'tool' ? Ic('spark') : ''}${m.err ? Ic('warn') + ' ' : ''}${esc(m.text)}</div>`).join('')}${ui.chatBusy ? '<div class="msg assistant"><span class="dots"><i></i><i></i><i></i></span></div>' : ''}</div>
    <div style="height:150px"></div>
    <div class="composer"><div style="flex:1;min-width:0">${chat.length ? '' : `<div class="chips">${chips.map(c => `<button data-a="askcoach" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>`}
      <div class="row" style="gap:8px"><textarea id="c-text" placeholder="Nachricht an den Coach" rows="1"></textarea><button class="send" data-a="send" aria-label="Senden">${Ic('send')}</button></div></div></div>`;
  }

  async function sendChat(text) {
    text = (text || '').trim(); if (!text || ui.chatBusy) return;
    d().chat.push({ role: 'user', text }); ui.chatBusy = true; Store.save();
    if (ui.tab !== 'coach') { ui.tab = 'coach'; } render(); scrollEnd();
    try {
      const tools = [];
      const answer = await AI.coach(d().chat.filter(m => m.role !== 'tool'), name => {
        tools.push(TOOLNAMES[name] || name);
        if (/plan|schedule/.test(name)) Calendar.syncSoon();
      });
      if (tools.length) d().chat.push({ role: 'tool', text: [...new Set(tools)].join(' · ') });
      d().chat.push({ role: 'assistant', text: answer });
    } catch (e) { d().chat.push({ role: 'assistant', text: e.message, err: true }); }
    ui.chatBusy = false; d().chat = d().chat.slice(-60); Store.save();
    if (ui.tab === 'coach') { render(); scrollEnd(); } else toast('Der Coach hat geantwortet');
  }
  const scrollEnd = () => requestAnimationFrame(() => view.scrollTop = view.scrollHeight);

  // ---------- Einstellungen ----------
  function settingsSheet() {
    const s = d(), g = s.goals;
    const opt = (v, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>`;
    const models = (s.ai.models && s.ai.models.length ? s.ai.models : ['gpt-5-mini', 'gpt-5', 'gpt-4.1-mini']).slice();
    if (!models.includes(s.ai.model)) models.unshift(s.ai.model);
    openSheet(`
      <h2>Einstellungen</h2>
      <div class="fields"><div class="field"><label for="s-name">Dein Name</label><input id="s-name" value="${esc(s.profile.name)}" autocomplete="off"></div>
        <div class="field"><label for="s-weight">Gewicht (kg)</label><input id="s-weight" inputmode="decimal" value="${esc(s.profile.weight)}"></div></div>

      <h2>Tagesziele</h2>
      <div class="fields"><div class="field"><label for="s-kcal">Kalorien (kcal)</label><input id="s-kcal" inputmode="numeric" value="${g.kcal}"></div>
        <div class="field"><label for="s-protein">Eiweiß (g)</label><input id="s-protein" inputmode="numeric" value="${g.protein}"></div>
        <div class="field"><label for="s-steps">Schritte</label><input id="s-steps" inputmode="numeric" value="${g.steps}"></div>
        <div class="field"><label for="s-water">Wasser (ml)</label><input id="s-water" inputmode="numeric" value="${g.water}"></div>
        <div class="field"><label for="s-min">Training (Min.)</label><input id="s-min" inputmode="numeric" value="${g.trainMin}"></div>
        <div class="field"><label for="s-week">Trainings pro Woche</label><input id="s-week" inputmode="numeric" value="${g.perWeek}"></div></div>

      <h2>Wochenplan</h2>
      <div class="fields">${[1, 2, 3, 4, 5, 6, 0].map(i => `<div class="field"><label for="s-d${i}">${['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][i]}</label>
        <select id="s-d${i}"><option value="">Pause</option>${s.plans.map(p => opt(p.id, s.schedule[i]) + esc(p.name) + '</option>').join('')}</select></div>`).join('')}</div>

      <h2>Spotify</h2>
      <div class="field"><label for="s-spid">Spotify Client ID</label><input id="s-spid" value="${esc(s.spotify.clientId)}" placeholder="aus dem Spotify Developer Dashboard" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="note">Einmalig: Auf developer.spotify.com eine App anlegen, als Redirect URI <b>${Spotify.REDIRECT}</b> eintragen und „Web API“ anhaken. Steuern geht nur mit Spotify Premium.</div>
      <div class="btns" style="margin-top:12px">${Spotify.connected()
        ? `<span class="pill" style="align-self:center">${Ic('check')} Verbunden</span><button class="btn sm ghost" data-a="spdisconnect">Trennen</button>`
        : `<button class="btn sm soft" data-a="spconnect">Mit Spotify verbinden</button>`}</div>

      <h2>Kalender</h2>
      <div class="muted small">Dein Training erscheint als wöchentlicher Termin. Für Google Kalender: Füge dein Google-Konto auf dem iPhone unter Einstellungen → Kalender → Accounts hinzu und wähle hier den Google-Kalender.</div>
      <div class="fields"><div class="field"><label>Kalender</label><button class="btn sm ghost" style="width:100%;justify-content:flex-start;overflow:hidden" data-a="calpick">${s.calendar.id ? esc(s.calendar.title) : 'Kalender wählen'}</button></div>
        <div class="field"><label for="s-caltime">Uhrzeit Training</label><input id="s-caltime" type="time" value="${esc(s.calendar.time)}"></div></div>
      ${s.calendar.id ? `<div class="btns" style="margin-top:12px"><button class="btn sm soft" data-a="calsync">Jetzt eintragen</button><button class="btn sm ghost" data-a="calremove">Termine entfernen</button></div>
        <div class="muted small" style="margin-top:6px">${s.calendar.synced ? 'Zuletzt eingetragen: ' + new Date(s.calendar.synced).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) + ' · ' + (s.calendar.eventIds || []).length + ' Serientermine' : 'Noch nicht eingetragen'}</div>` : ''}

      <h2>Widgets</h2>
      <div class="muted small">Halte auf dem Homescreen eine freie Stelle gedrückt → + → „Glow Up“. Es gibt Ringe, Heute, Schritte und Woche, auch für den Sperrbildschirm.</div>

      <h2>KI (OpenAI)</h2>
      <div class="field"><label for="s-key">OpenAI-API-Key</label><input id="s-key" type="password" value="${esc(s.ai.key)}" placeholder="sk-…" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
      <div class="field"><label for="s-model">Modell</label><div class="row" style="gap:8px"><select id="s-model" style="flex:1">${models.map(m => opt(m, s.ai.model) + esc(m) + '</option>').join('')}</select><button class="btn sm ghost" data-a="loadmodels">Laden</button></div></div>
      <div class="note">Den Key bekommst du auf platform.openai.com unter „API keys“. Er wird nur auf diesem Gerät gespeichert und nur an OpenAI geschickt. Jede KI-Anfrage kostet dort etwas Guthaben. „Laden“ holt die Modelle deines Kontos, ein „mini“-Modell ist am günstigsten.</div>

      <button class="btn" style="margin-top:18px" data-a="savesettings">Speichern</button>
      <button class="btn danger" style="margin-top:10px" data-a="reset">Alle Daten löschen</button>
      <div class="muted small" style="text-align:center;margin-top:14px">Glow Up 1.0 · Alle Daten bleiben auf deinem Gerät.</div>`);
  }

  // ---------- Geruest ----------
  const views = { start: vStart, training: vTraining, essen: vEssen, schritte: vSchritte, coach: vCoach };
  function render() {
    const keep = ui.lastTab === ui.tab ? view.scrollTop : 0;
    view.innerHTML = views[ui.tab]();
    Figure.mount(view);
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
    view.scrollTop = keep; ui.lastTab = ui.tab;
  }
  function openSheet(html) { sheet.innerHTML = `<div class="sheet">${html}</div>`; sheet.hidden = false; Figure.mount(sheet); }
  function closeSheet() { sheet.hidden = true; sheet.innerHTML = ''; }
  const val = id => ($('#' + id) ? $('#' + id).value.trim() : '');
  const int = (id, lo, hi, def) => { const n = parseInt(val(id).replace(/\D/g, ''), 10); return isNaN(n) ? def : Math.min(hi, Math.max(lo, n)); };

  const A = {
    tab(ds) { ui.tab = ds.tab; render(); if (ds.tab === 'schritte') syncSteps(true); },
    seg(ds) { ui.trainSeg = ds.seg; render(); },
    close: closeSheet,
    plan(ds) { planSheet(ds.id); },
    exercise(ds, el) { const back = el.closest('.sheet') && $('[data-a="start"]', sheet); exerciseSheet(ds.ex, back ? back.dataset.id : ''); },
    start(ds) { startPlan(ds.id); },
    delplan(ds) {
      if (ui.confirm !== ds.id) { ui.confirm = ds.id; return toast('Nochmal tippen, um den Plan zu löschen'); }
      d().plans = d().plans.filter(p => p.id !== ds.id);
      for (const k in d().schedule) if (d().schedule[k] === ds.id) delete d().schedule[k];
      Store.save(); Calendar.syncSoon(); closeSheet(); render(); toast('Plan gelöscht');
    },
    // Player
    pquit() { if (ui.quit && Date.now() - ui.quit < 3000) { ui.quit = 0; return closePlayer(); } ui.quit = Date.now(); toast('Nochmal tippen, um das Training abzubrechen'); },
    pclose: closePlayer,
    preps(ds) { P.reps = Math.max(0, P.reps + (+ds.n)); $('#preps').textContent = P.reps; },
    pdone() { if (P) { P.running = false; workDone(); } },
    pgo() { startTimer(P.left || P.steps[P.i].it.sec); renderPlayer(); },
    ppause() { P.left = Math.max(1, Math.ceil((P.endAt - Date.now()) / 1000)); P.running = false; renderPlayer(); },
    pmore() { P.endAt += 15000; P.total += 15; onTick(); },
    pskip() { P.running = false; P.i++; enterWork(); },
    // Ernaehrung
    water(ds) { const t = Store.day(); d().water[t] = Math.max(0, (d().water[t] || 0) + (+ds.ml)); Store.save(); render(); },
    addmeal() { mealSheet(); },
    scan() { if (!d().ai.key) { toast('Erst den OpenAI-Key eintragen'); return settingsSheet(); } const inp = $('#photo'); inp.value = ''; inp.click(); },
    describe() { if (!d().ai.key) { toast('Erst den OpenAI-Key eintragen'); return settingsSheet(); } describeSheet(); },
    async describego(ds, el) {
      const text = val('d-text'); if (!text) return toast('Schreib kurz, was du gegessen hast');
      el.disabled = true; el.textContent = 'Wird geschätzt …';
      try { const r = await AI.scanMeal({ text }); mealSheet(r, `<div class="note"><b>KI-Schätzung${r.portion ? ' · ' + esc(r.portion) : ''}</b><br>${esc(r.hinweis || 'Prüfe die Werte kurz.')}</div>`); }
      catch (e) { mealSheet({ name: text }, `<div class="note warn">${esc(e.message)}</div>`); }
    },
    pickfood(ds) { const f = FOODS[+ds.i]; $('#m-name').value = `${f[0]} (${f[1]})`; $('#m-kcal').value = f[2]; $('#m-p').value = f[3]; $('#m-c').value = f[4]; $('#m-f').value = f[5]; },
    savemeal() {
      const name = val('m-name'), kcal = int('m-kcal', 0, 9999, NaN);
      if (!name || isNaN(kcal)) return toast('Bitte Name und Kalorien eintragen');
      const t = Store.day(); (d().meals[t] = d().meals[t] || []).push({ id: Store.uid(), name: name.slice(0, 60), kcal, p: int('m-p', 0, 999, 0), c: int('m-c', 0, 999, 0), f: int('m-f', 0, 999, 0), slot: val('m-slot') || 'Snack' });
      Store.save(); closeSheet(); ui.tab = 'essen'; render(); toast('Eingetragen');
    },
    delmeal(ds) { const t = Store.day(); d().meals[t] = (d().meals[t] || []).filter(m => m.id !== ds.id); Store.save(); render(); },
    // Schritte
    syncsteps() { if (native()) { syncSteps(true).then(() => toast('Schritte aktualisiert')); } else toast('Nur auf dem iPhone verfügbar'); },
    addsteps() {
      openSheet(`<h2>Schritte eintragen</h2><div class="muted small">Für heute, zusätzlich zu den automatisch gezählten Schritten.</div>
        <div class="field"><label for="st-n">Schritte</label><input id="st-n" inputmode="numeric" value="${d().stepsManual[Store.day()] || ''}" placeholder="z. B. 3000"></div>
        <button class="btn" style="margin-top:14px" data-a="savesteps">Speichern</button>`);
    },
    savesteps() { d().stepsManual[Store.day()] = int('st-n', 0, 99999, 0); Store.save(); closeSheet(); render(); },
    // Coach
    send() { const t = $('#c-text'); const v = t.value; t.value = ''; sendChat(v); },
    askcoach(ds) { if (!d().ai.key) { ui.tab = 'coach'; render(); return toast('Erst den OpenAI-Key eintragen'); } sendChat(ds.q); },
    async loadmodels(ds, el) {
      const key = val('s-key'); if (!key) return toast('Erst den OpenAI-Key eintragen');
      el.disabled = true; el.textContent = 'Lädt …';
      try {
        const ids = await AI.listModels(key);
        if (!ids.length) throw new Error('Keine passenden Modelle gefunden.');
        const sel = $('#s-model'), cur = sel.value;
        d().ai.models = ids;
        sel.innerHTML = ids.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
        sel.value = ids.includes(cur) ? cur : AI.pickModel(ids);
        toast(ids.length + ' Modelle geladen');
      } catch (e) { toast(e.message); }
      el.disabled = false; el.textContent = 'Laden';
    },
    clearchat() { d().chat = []; Store.save(); render(); },
    // Einstellungen
    settings: settingsSheet,
    savesettings() {
      const s = d(), g = s.goals;
      s.profile.name = val('s-name').slice(0, 24);
      const w = parseFloat(val('s-weight').replace(',', '.')); if (w > 25 && w < 300) s.profile.weight = Math.round(w * 10) / 10;
      g.kcal = int('s-kcal', 800, 6000, g.kcal); g.protein = int('s-protein', 20, 400, g.protein); g.steps = int('s-steps', 1000, 50000, g.steps);
      g.water = int('s-water', 500, 6000, g.water); g.trainMin = int('s-min', 5, 180, g.trainMin); g.perWeek = int('s-week', 1, 7, g.perWeek);
      for (let i = 0; i < 7; i++) { const v = val('s-d' + i); if (v) s.schedule[i] = v; else delete s.schedule[i]; }
      s.ai.key = val('s-key'); s.ai.model = val('s-model') || s.ai.model;
      s.spotify.clientId = val('s-spid');
      if (/^\d\d:\d\d$/.test(val('s-caltime'))) s.calendar.time = val('s-caltime');
      Store.save(); Calendar.syncSoon(); closeSheet(); render(); toast('Gespeichert');
    },
    // Spotify
    sp(ds) { Spotify.cmd(ds.cmd); Native.haptic('LIGHT'); },
    spopen() { Spotify.openApp(); },
    async spconnect() {
      d().spotify.clientId = val('s-spid'); Store.save();
      try { await Spotify.login(); } catch (e) { toast(e.message); }
    },
    spdisconnect() { Spotify.disconnect(); settingsSheet(); toast('Spotify getrennt'); },
    // Kalender
    async calpick() {
      if (!Native.isNative()) return toast('Nur auf dem iPhone verfügbar');
      try {
        const cals = await Calendar.list();
        openSheet(`<h2>Kalender wählen</h2><div class="muted small" style="margin-bottom:12px">Google-Kalender stehen oben. Fehlt er, füge dein Google-Konto in den iPhone-Einstellungen unter Kalender → Accounts hinzu.</div>
          <div class="list">${cals.map(k => `<button class="item" data-a="calchoose" data-id="${esc(k.id)}" data-title="${esc(k.title)}"><div class="grow"><h3>${esc(k.title)}</h3><div class="muted small">${esc(k.source)}</div></div><span class="chev">${Ic('chev')}</span></button>`).join('') || '<div class="muted">Keine Kalender gefunden.</div>'}</div>`);
      } catch (e) { toast(e.message); }
    },
    async calchoose(ds) {
      const c = d().calendar;
      if (c.eventIds && c.eventIds.length) await Calendar.removeAll();
      c.id = ds.id; c.title = ds.title; Store.save();
      try { const n = await Calendar.sync(); toast(n + ' Trainingstage eingetragen'); } catch (e) { toast(e.message); }
      settingsSheet();
    },
    async calsync() { try { const n = await Calendar.sync(); toast(n + ' Trainingstage eingetragen'); settingsSheet(); } catch (e) { toast(e.message); } },
    async calremove() { await Calendar.removeAll(); d().calendar.id = ''; d().calendar.title = ''; Store.save(); settingsSheet(); toast('Termine entfernt'); },
    reset() {
      if (!ui.resetArmed) { ui.resetArmed = true; return toast('Nochmal tippen: Alles wird gelöscht'); }
      ui.resetArmed = false; Store.reset(); closeSheet(); ui.tab = 'start'; render(); toast('Alle Daten gelöscht');
    }
  };

  document.addEventListener('click', e => {
    if (e.target === sheet) return closeSheet();
    const el = e.target.closest('[data-a]'); if (!el) return;
    const fn = A[el.dataset.a]; if (fn) fn(el.dataset, el);
  });
  document.addEventListener('keydown', e => {
    if (e.target.id === 'c-text' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); A.send(); }
  });
  $('#photo').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if (f) scanPhoto(f); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { syncSteps(false); if (!P && sheet.hidden) render(); } });

  // Spotify-Leisten aktualisieren, ohne die ganze Seite neu zu zeichnen
  Spotify.onChange = () => document.querySelectorAll('.spslot').forEach(el => el.innerHTML = Spotify.bar());

  // Links in die App: Spotify-Anmeldung und Widgets (glowup://start/tag-a, glowup://tab/schritte)
  Native.listen('App', 'appUrlOpen', async ({ url }) => {
    if (!url) return;
    if (url.startsWith(Spotify.REDIRECT)) {
      try { await Spotify.handleRedirect(url); toast('Spotify verbunden'); Spotify.refresh(); if (!sheet.hidden) settingsSheet(); }
      catch (e) { toast(e.message); }
      return;
    }
    const m = url.match(/^glowup:\/\/(start|tab)\/([\w-]+)/);
    if (!m) return;
    if (m[1] === 'start' && Store.plan(m[2]) && !P) startPlan(m[2]);
    if (m[1] === 'tab' && views[m[2]]) { closeSheet(); ui.tab = m[2]; render(); }
  });

  // Hintergrund: Timer-Alarm als Mitteilung planen. Vordergrund: wieder abbrechen, Daten auffrischen.
  Native.listen('App', 'appStateChange', ({ isActive }) => {
    if (isActive) { cancelAlarm(); Widget.update(); if (P) Spotify.refresh(); }
    else scheduleAlarm();
  });

  render();
  syncSteps(false);
  Widget.update();
  if (Spotify.connected()) Spotify.refresh();
})();
