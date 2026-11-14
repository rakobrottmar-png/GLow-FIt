// Trainingsplan in einen Kalender auf dem iPhone eintragen. Ist dort das Google-Konto
// hinzugefuegt (Einstellungen -> Kalender -> Accounts), landet alles in Google Kalender.
const Calendar = (() => {
  const P = 'CapacitorCalendar';
  const c = () => Store.d.calendar;
  const connected = () => !!c().id;

  async function access() {
    const r = await Native.call(P, 'requestFullCalendarAccess');
    if (r.result !== 'granted') throw new Error('Kein Zugriff auf den Kalender. Erlaube ihn in den iPhone-Einstellungen unter Glow Up.');
  }

  // Alle beschreibbaren Kalender, Google-Kalender zuerst
  async function list() {
    await access();
    const r = await Native.call(P, 'listCalendars');
    return (r.result || []).filter(k => k.allowsContentModifications !== false && k.id)
      .map(k => ({ id: k.id, title: k.title || 'Kalender', source: (k.source && k.source.title) || '' }))
      .sort((a, b) => (/google|gmail/i.test(b.source) ? 1 : 0) - (/google|gmail/i.test(a.source) ? 1 : 0));
  }

  async function removeAll() {
    const ids = c().eventIds || [];
    if (ids.length) await Native.call(P, 'deleteEventsById', { ids, span: 1 }).catch(() => {});
    c().eventIds = []; Store.save();
  }

  // Loescht die alten Termine und legt je Trainingstag einen woechentlichen Serientermin an.
  async function sync() {
    if (!connected()) return 0;
    await access();
    await removeAll();
    const [hh, mm] = (c().time || '17:00').split(':').map(Number);
    const ids = [];
    for (const day of Object.keys(Store.d.schedule)) {
      const plan = Store.plan(Store.d.schedule[day]); if (!plan) continue;
      const start = new Date(); start.setHours(hh, mm, 0, 0);
      start.setDate(start.getDate() + ((+day - start.getDay() + 7) % 7));
      const min = Store.planMinutes(plan);
      const lines = plan.items.map(it => `• ${Store.exercise(it.ex).name}: ${it.sets} × ${it.sec ? it.sec + ' Sek.' : it.reps}`).join('\n');
      const r = await Native.call(P, 'createEvent', {
        title: `Glow Up: ${plan.name}`, calendarId: c().id,
        startDate: start.getTime(), endDate: start.getTime() + min * 60000,
        description: `${plan.sub || ''}\n\n${lines}\n\nIn der Glow-Up-App starten.`,
        alerts: [-15], recurrence: { frequency: 'weekly', interval: 1 }
      });
      if (r && r.id) ids.push(r.id);
    }
    c().eventIds = ids; c().synced = Date.now(); Store.save();
    return ids.length;
  }

  // Nach Aenderungen am Wochenplan automatisch neu eintragen (gebuendelt)
  let t;
  function syncSoon() { if (!connected() || !Native.isNative()) return; clearTimeout(t); t = setTimeout(() => sync().catch(() => {}), 1500); }

  return { connected, list, sync, syncSoon, removeAll };
})();
