// Verbindung zum Blick-Browser auf dem PC (im selben WLAN).
// Glow Up schickt seinen Export (glowup.v1) an  POST http://<PC>:4780/glowup/sync  (Kopf X-Blick-Code).
// Blick antwortet mit glowup://log/...-Links (z. B. Wasser vom PC aus eingetragen), die hier ausgefuehrt werden.
const Blick = (() => {
  const cfg = () => Store.d.blick;
  const on = () => !!(cfg().host && cfg().code);
  let busy = false, timer = null, quiet = false, lastError = '';

  function url() {
    let h = cfg().host.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!/:\d+$/.test(h)) h += ':4780';
    return 'http://' + h + '/glowup/sync';
  }

  // Auf dem iPhone ueber die native HTTP-Schnittstelle, im Browser per fetch
  async function post(u, code, body) {
    const headers = { 'Content-Type': 'application/json', 'X-Blick-Code': code };
    if (Native.isNative()) {
      const r = await Native.call('CapacitorHttp', 'request', { url: u, method: 'POST', headers, data: body, connectTimeout: 4000, readTimeout: 8000 });
      let json = r.data;
      if (typeof json === 'string') { try { json = JSON.parse(json); } catch (e) { json = null; } }
      return { status: r.status, json };
    }
    const res = await fetch(u, { method: 'POST', headers, body: JSON.stringify(body) });
    return { status: res.status, json: await res.json().catch(() => null) };
  }

  // manual = true: Fehler werden gemeldet (Knopf in den Einstellungen). Sonst still im Hintergrund.
  async function sync(manual) {
    if (!on()) { if (manual) throw new Error('Trag erst Adresse und Code aus Blick ein.'); return false; }
    if (busy) return false;
    busy = true;
    try {
      const j = JSON.parse(Store.exportJson());
      delete j.data.chat; delete j.data.blick; delete j.data.ai; delete j.data.spotify; delete j.data.calendar;
      j.done = (cfg().done || []).slice(-50);
      let r;
      try { r = await post(url(), cfg().code.trim().toUpperCase(), j); }
      catch (e) { throw new Error('Blick ist nicht erreichbar. Läuft Blick, und sind iPhone und PC im selben WLAN?'); }
      if (r.status === 401) throw new Error('Der Code stimmt nicht. Schau in Blick unter „Glow Up verbinden“ nach.');
      if (r.status === 429) throw new Error('Zu viele Versuche. Warte 10 Minuten.');
      if (r.status !== 200 || !r.json || !r.json.ok) throw new Error('Blick hat die Daten nicht angenommen (' + r.status + ').');
      // Eintraege vom PC ausfuehren: nur glowup://log/... ist erlaubt
      let ran = 0;
      quiet = true;
      for (const l of r.json.links || []) {
        if (!l || !l.id || cfg().done.includes(l.id)) continue;
        if (/^glowup:\/\/log\//.test(l.url) && window.GlowUp && window.GlowUp.link(l.url)) ran++;
        cfg().done.push(l.id);
      }
      cfg().done = cfg().done.slice(-50);
      cfg().last = Date.now(); lastError = '';
      Store.save();
      quiet = false;
      if (ran) setTimeout(() => sync(), 1200);   // neue Werte und Bestaetigung zurueckschicken
      return true;
    } catch (e) {
      quiet = false; lastError = e.message;
      if (manual) throw e;
      return false;
    } finally { busy = false; }
  }

  // Nach jeder Aenderung kurz warten und dann abgleichen
  function soon() {
    if (!on() || quiet) return;
    clearTimeout(timer); timer = setTimeout(() => sync(), 4000);
  }

  function status() {
    if (!on()) return 'Nicht verbunden';
    if (lastError) return lastError;
    return cfg().last ? 'Zuletzt abgeglichen: ' + new Date(cfg().last).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : 'Noch nicht abgeglichen';
  }

  return { on, sync, soon, status };
})();
