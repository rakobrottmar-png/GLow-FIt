// KI ueber OpenRouter (ein Key, viele Modelle):
// Kalorien-Scanner und der Coach, der Dinge in der App anlegen kann.
const AI = (() => {
  const P = { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', site: 'openrouter.ai' };
  // Schnelle Modelle, die Fotos verstehen und Werkzeuge benutzen koennen
  const MODELS = [
    { id: 'google/gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (schnell, empfohlen)' },
    { id: 'anthropic/claude-haiku-5.5', label: 'Claude Haiku 5.5 (schnell, günstig)' },
    { id: 'google/gemini-3.8-flash', label: 'Gemini 3.8 Flash (genauer, langsamer)' }
  ];
  const DEFAULT = MODELS[0].id;
  const key = () => ((Store.d.ai.keys || {}).openrouter || '').trim();
  const hasKey = () => !!key();
  const prov = () => P;
  const model = () => (Store.d.ai.model || DEFAULT).trim();
  const short = () => { const m = model(); return m.slice(m.indexOf('/') + 1); };

  // Auf dem iPhone ueber die native HTTP-Schnittstelle (keine CORS-Probleme), im Browser per fetch
  async function get(url, auth) {
    const headers = auth ? { Authorization: 'Bearer ' + auth } : {};
    if (Native.isNative()) {
      const r = await Native.call('CapacitorHttp', 'request', { url, method: 'GET', headers });
      let json = r.data;
      if (typeof json === 'string') { try { json = JSON.parse(json); } catch (e) { json = null; } }
      return { ok: r.status >= 200 && r.status < 300, status: r.status, json };
    }
    const res = await fetch(url, { headers });
    return { ok: res.ok, status: res.status, json: await res.json().catch(() => null) };
  }

  async function post(url, auth, body) {
    const headers = { Authorization: 'Bearer ' + auth, 'Content-Type': 'application/json', 'X-Title': 'Glow Up' };
    if (Native.isNative()) {
      const r = await Native.call('CapacitorHttp', 'request', { url, method: 'POST', headers, data: body });
      let json = r.data;
      if (typeof json === 'string') { try { json = JSON.parse(json); } catch (e) { json = null; } }
      return { ok: r.status >= 200 && r.status < 300, status: r.status, json };
    }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    return { ok: res.ok, status: res.status, json: await res.json().catch(() => null) };
  }

  async function call(body) {
    if (!hasKey()) throw new Error('Kein OpenRouter-Key eingetragen. Öffne die Einstellungen (Zahnrad auf der Startseite).');
    if (!navigator.onLine) throw new Error('Keine Internetverbindung. Die KI braucht Internet, alles andere geht offline.');
    // Wenig "Nachdenken" und schnellster Anbieter: kuerzere Wartezeit
    // (Claude denkt ohne reasoning-Angabe gar nicht nach, Gemini nur wenig)
    const req = Object.assign({ model: model(), provider: { sort: 'latency' } }, /^google\//.test(model()) ? { reasoning: { effort: 'low' } } : {}, body);
    let res;
    try { res = await post(P.url, key(), req); }
    catch (e) { throw new Error('OpenRouter ist nicht erreichbar. Prüfe deine Internetverbindung.'); }
    const j0 = res.json;
    if (!res.ok || !j0 || j0.error || !j0.choices || !j0.choices.length) {
      const err = j0 && j0.error;
      const msg = err && (err.message || (typeof err === 'string' ? err : ''));
      if (res.status === 401) throw new Error('Der OpenRouter-Key ist ungültig. Prüfe ihn in den Einstellungen.');
      if (res.status === 402) throw new Error('Dein OpenRouter-Guthaben ist leer. Lade auf openrouter.ai Guthaben auf.');
      if (res.status === 404) throw new Error('Das Modell "' + model() + '" gibt es bei OpenRouter nicht. Wähle in den Einstellungen ein anderes.');
      if (res.status === 429) throw new Error('OpenRouter: Zu viele Anfragen. Warte kurz und versuch es nochmal.');
      throw new Error(msg ? 'OpenRouter: ' + msg : ('Fehler von OpenRouter (' + res.status + ').'));
    }
    return j0.choices[0].message;
  }

  // ---------- Kalorien-Scanner ----------
  const SCAN = 'Du bist ein Ernährungs-Assistent. Schätze die Mahlzeit realistisch für eine normale Portion. ' +
    'Antworte NUR mit JSON, ohne Text davor oder danach: ' +
    '{"name":"kurzer deutscher Name","portion":"z. B. 1 Teller, ca. 350 g","kcal":0,"protein":0,"carbs":0,"fat":0,"hinweis":"ein kurzer Satz, was unsicher ist"}. ' +
    'Alle Zahlen sind ganze Zahlen (kcal bzw. Gramm). Ist kein Essen zu erkennen, setze kcal auf 0 und erkläre es in "hinweis".';

  async function scanMeal({ image, text }) {
    const content = [];
    if (text) content.push({ type: 'text', text: 'Mahlzeit: ' + text });
    if (image) { content.push({ type: 'text', text: 'Schätze die Nährwerte der Mahlzeit auf dem Foto.' }); content.push({ type: 'image_url', image_url: { url: image } }); }
    const msg = await call({ response_format: { type: 'json_object' }, messages: [{ role: 'system', content: SCAN }, { role: 'user', content }] });
    const raw = typeof msg.content === 'string' ? msg.content : (msg.content || []).map(c => c.text || '').join('');
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Die KI hat keine auswertbare Antwort geliefert. Versuch es noch einmal.');
    const j = JSON.parse(m[0]);
    const n = v => Math.max(0, Math.round(+v || 0));
    return { name: String(j.name || 'Mahlzeit'), portion: String(j.portion || ''), kcal: n(j.kcal), p: n(j.protein), c: n(j.carbs), f: n(j.fat), hinweis: String(j.hinweis || '') };
  }

  // Foto verkleinern, damit der Upload klein und guenstig bleibt
  function shrink(file, max = 768) {
    return new Promise((ok, fail) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL_.revokeObjectURL(img.src);
        ok(c.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => fail(new Error('Das Foto konnte nicht gelesen werden.'));
      img.src = URL_.createObjectURL(file);
    });
  }
  const URL_ = window.URL || window.webkitURL;

  // ---------- Coach mit Werkzeugen ----------
  const item = {
    type: 'object',
    properties: {
      exercise: { type: 'string', description: 'ID der Übung' },
      sets: { type: 'integer' },
      reps: { type: 'string', description: 'z. B. "8-12", "10" oder "max". Leer lassen bei Zeit-Übungen.' },
      seconds: { type: 'integer', description: 'Dauer in Sekunden für Halte-Übungen und Dehnungen' },
      sides: { type: 'integer', description: '2, wenn links und rechts einzeln gemacht wird' },
      rest: { type: 'integer', description: 'Pause in Sekunden nach jedem Satz' },
      note: { type: 'string' }
    },
    required: ['exercise', 'sets']
  };
  const fn = (name, description, properties, required = []) =>
    ({ type: 'function', function: { name, description, parameters: { type: 'object', properties, required } } });
  const days = {}; ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'].forEach(k => days[k] = { type: 'string', description: 'Plan-ID oder "frei"' });

  const TOOLS = [
    fn('create_plan', 'Legt einen neuen Trainings- oder Dehnplan an.', {
      name: { type: 'string' }, subtitle: { type: 'string' }, type: { type: 'string', enum: ['kraft', 'dehnen'] },
      items: { type: 'array', items: item }
    }, ['name', 'type', 'items']),
    fn('update_plan', 'Ändert einen vorhandenen Plan. Nur die angegebenen Felder werden ersetzt.', {
      id: { type: 'string' }, name: { type: 'string' }, subtitle: { type: 'string' }, items: { type: 'array', items: item }
    }, ['id']),
    fn('delete_plan', 'Löscht einen Plan.', { id: { type: 'string' } }, ['id']),
    fn('create_exercise', 'Legt eine eigene Übung an. Sie nutzt die Animation einer vorhandenen, ähnlichen Übung.', {
      name: { type: 'string' }, muscles: { type: 'string' }, tip: { type: 'string', description: 'kurze Ausführungshinweise' },
      animation: { type: 'string', description: 'ID einer vorhandenen Übung, deren Bewegung am ähnlichsten ist' }
    }, ['name', 'animation']),
    fn('set_schedule', 'Legt fest, an welchem Wochentag welcher Plan dran ist.', days),
    fn('set_goals', 'Ändert Tagesziele.', {
      kcal: { type: 'integer' }, protein: { type: 'integer' }, steps: { type: 'integer' },
      water_ml: { type: 'integer' }, train_minutes: { type: 'integer' }, workouts_per_week: { type: 'integer' }
    }),
    fn('log_meal', 'Trägt eine Mahlzeit für heute ein.', {
      name: { type: 'string' }, kcal: { type: 'integer' }, protein: { type: 'integer' }, carbs: { type: 'integer' }, fat: { type: 'integer' },
      slot: { type: 'string', enum: ['Frühstück', 'Mittag', 'Abend', 'Snack'] }
    }, ['name', 'kcal']),
    fn('log_water', 'Trägt getrunkenes Wasser für heute ein.', { ml: { type: 'integer' } }, ['ml']),
    fn('log_weight', 'Trägt das Körpergewicht ein.', { kg: { type: 'number' } }, ['kg'])
  ];

  const toItem = it => {
    if (!Store.exercise(it.exercise)) throw new Error('Unbekannte Übung "' + it.exercise + '". Erlaubte IDs: ' + exerciseIds().join(', '));
    const o = { ex: it.exercise, sets: Math.min(10, Math.max(1, it.sets | 0)), rest: Math.min(300, Math.max(0, it.rest == null ? 60 : it.rest | 0)) };
    if (it.seconds) o.sec = Math.min(600, Math.max(5, it.seconds | 0)); else o.reps = String(it.reps || '10');
    if (it.sides === 2) o.sides = 2;
    if (it.note) o.note = String(it.note).slice(0, 80);
    return o;
  };
  const exerciseIds = () => Object.keys(EXERCISES).concat(Object.keys(Store.d.customEx));
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'plan';

  const RUN = {
    create_plan(a) {
      const p = { id: slug(a.name) + '-' + Store.uid().slice(-4), name: String(a.name).slice(0, 40), sub: String(a.subtitle || 'Vom Coach erstellt').slice(0, 60), type: a.type === 'dehnen' ? 'dehnen' : 'kraft', items: (a.items || []).map(toItem), custom: true };
      if (!p.items.length) throw new Error('Ein Plan braucht mindestens eine Übung.');
      Store.d.plans.push(p); return { ok: true, id: p.id };
    },
    update_plan(a) {
      const p = Store.plan(a.id); if (!p) throw new Error('Plan nicht gefunden: ' + a.id);
      if (a.name) p.name = String(a.name).slice(0, 40);
      if (a.subtitle) p.sub = String(a.subtitle).slice(0, 60);
      if (a.items) { const it = a.items.map(toItem); if (!it.length) throw new Error('Ein Plan braucht mindestens eine Übung.'); p.items = it; }
      return { ok: true };
    },
    delete_plan(a) {
      const i = Store.d.plans.findIndex(p => p.id === a.id); if (i < 0) throw new Error('Plan nicht gefunden: ' + a.id);
      Store.d.plans.splice(i, 1);
      for (const k in Store.d.schedule) if (Store.d.schedule[k] === a.id) delete Store.d.schedule[k];
      return { ok: true };
    },
    create_exercise(a) {
      if (!EXERCISES[a.animation]) throw new Error('Unbekannte Animation. Erlaubt: ' + Object.keys(EXERCISES).join(', '));
      const id = 'c-' + slug(a.name);
      Store.d.customEx[id] = { name: String(a.name).slice(0, 40), muskeln: String(a.muscles || '').slice(0, 60), tipp: String(a.tip || '').slice(0, 300), anim: a.animation };
      return { ok: true, id };
    },
    set_schedule(a) {
      const map = { so: 0, mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6 };
      for (const k in map) {
        if (!(k in a)) continue;
        if (!a[k] || a[k] === 'frei') delete Store.d.schedule[map[k]];
        else if (Store.plan(a[k])) Store.d.schedule[map[k]] = a[k];
        else throw new Error('Plan nicht gefunden: ' + a[k]);
      }
      return { ok: true };
    },
    set_goals(a) {
      const g = Store.d.goals, set = (k, v, lo, hi) => { if (v != null) g[k] = Math.min(hi, Math.max(lo, v | 0)); };
      set('kcal', a.kcal, 800, 6000); set('protein', a.protein, 20, 400); set('steps', a.steps, 1000, 50000);
      set('water', a.water_ml, 500, 6000); set('trainMin', a.train_minutes, 5, 180); set('perWeek', a.workouts_per_week, 1, 7);
      return { ok: true, goals: g };
    },
    log_meal(a) {
      const t = Store.day(); (Store.d.meals[t] = Store.d.meals[t] || []).push({ id: Store.uid(), name: String(a.name).slice(0, 60), kcal: a.kcal | 0, p: a.protein | 0, c: a.carbs | 0, f: a.fat | 0, slot: a.slot || 'Snack' });
      return { ok: true };
    },
    log_water(a) { const t = Store.day(); Store.d.water[t] = Math.max(0, (Store.d.water[t] || 0) + (a.ml | 0)); return { ok: true, heute_ml: Store.d.water[t] }; },
    log_weight(a) {
      const kg = Math.round(+a.kg * 10) / 10; if (!(kg > 25 && kg < 300)) throw new Error('Gewicht unplausibel.');
      Store.d.weights.push({ date: Store.day(), kg }); Store.d.profile.weight = kg; return { ok: true };
    }
  };

  function systemPrompt() {
    const d = Store.d, t = Store.day(), tot = Store.mealTotals(t);
    const tage = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const exList = exerciseIds().map(id => id + ' = ' + Store.exercise(id).name).join('; ');
    const plans = d.plans.map(p => `${p.id} "${p.name}" (${p.type}): ` + p.items.map(i => `${i.ex} ${i.sets}x${i.sec ? i.sec + 's' : i.reps}`).join(', ')).join('\n');
    const sched = tage.map((n, i) => n + ': ' + (d.schedule[i] || 'frei')).join(', ');
    return `Du bist der Coach in der Fitness-App "Glow Up". Antworte auf Deutsch, kurz, freundlich und konkret, in einfachen Worten.
Du kannst mit den Werkzeugen direkt Dinge in der App anlegen und ändern (Pläne, eigene Übungen, Wochenplan, Ziele, Mahlzeiten, Wasser, Gewicht). Wenn der Nutzer etwas gebaut oder geändert haben will, benutze die Werkzeuge und sag danach in einem Satz, was du gemacht hast und wo er es findet. Frag nur nach, wenn etwas Wichtiges fehlt.
Training zu Hause ohne Geräte (Rucksack, Tisch, Stuhl sind da). Für Muskelaufbau: 3 Sätze, 60-90 s Pause, 3x pro Woche mit Pausentag. Bei Schmerzen, Krankheit oder Essstörungs-Themen rätst du, das ärztlich abklären zu lassen, und gibst keine extremen Diät-Tipps.

Heute: ${t} (${tage[new Date().getDay()]}). Name: ${d.profile.name || 'unbekannt'}, Gewicht: ${d.profile.weight} kg.
Ziele: ${d.goals.kcal} kcal, ${d.goals.protein} g Eiweiß, ${d.goals.steps} Schritte, ${d.goals.water} ml Wasser, ${d.goals.perWeek} Krafttrainings pro Woche.
Heute gegessen: ${tot.kcal} kcal, ${tot.p} g Eiweiß. Schritte: ${Store.stepsOn(t)}. Wasser: ${d.water[t] || 0} ml. Krafttrainings diese Woche: ${Store.kraftThisWeek()}.
Wochenplan: ${sched}
Pläne:
${plans}
Verfügbare Übungen (ID = Name): ${exList}
Nutze nur diese IDs. Fehlt eine Übung, lege sie zuerst mit create_exercise an und wähle die ähnlichste Animation.`;
  }

  // Schickt den Verlauf an die KI, fuehrt Werkzeug-Aufrufe aus und gibt die Antwort zurueck.
  async function coach(history, onTool) {
    // Bilder nur bei den letzten Nachrichten mitschicken (spart Kosten)
    const recent = history.slice(-16), lastImg = recent.map(m => !!m.image).lastIndexOf(true);
    const messages = [{ role: 'system', content: systemPrompt() }].concat(recent.map((m, i) => {
      if (m.role === 'user' && m.image && i >= lastImg - 2) {
        return { role: 'user', content: [{ type: 'text', text: m.text || 'Was siehst du auf dem Bild?' }, { type: 'image_url', image_url: { url: m.image } }] };
      }
      return { role: m.role, content: m.text || (m.image ? '[Bild]' : '') };
    }));
    for (let i = 0; i < 6; i++) {
      const msg = await call({ messages, tools: TOOLS });
      if (!msg.tool_calls || !msg.tool_calls.length) return (typeof msg.content === 'string' ? msg.content : '') || 'Erledigt.';
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let out;
        try {
          const run = RUN[tc.function.name];
          if (!run) throw new Error('Unbekanntes Werkzeug');
          out = run(JSON.parse(tc.function.arguments || '{}'));
          Store.save(); if (onTool) onTool(tc.function.name);
        } catch (e) { out = { error: e.message }; }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(out) });
      }
    }
    return 'Ich habe mehrere Schritte ausgeführt. Schau bitte kurz nach, ob alles passt.';
  }

  return { prov, model, short, MODELS, hasKey, scanMeal, shrink, coach };
})();
