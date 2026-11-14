// Spotify steuern (Web API, Login mit PKCE ohne Secret). Steuern geht nur mit Premium.
// Einrichtung: developer.spotify.com -> App anlegen -> Redirect URI "glowup://spotify",
// "Web API" anhaken -> Client ID in Glow Up eintragen.
const Spotify = (() => {
  const REDIRECT = 'glowup://spotify';
  const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
  const API = 'https://api.spotify.com/v1';
  let now = null;          // letzter bekannter Zustand
  let onChange = () => {};

  const s = () => Store.d.spotify;
  const connected = () => !!(s().refresh && s().clientId);

  const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  function randomString(n = 64) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const a = crypto.getRandomValues(new Uint8Array(n));
    return Array.from(a, x => chars[x % chars.length]).join('');
  }

  async function login() {
    if (!s().clientId) throw new Error('Trag zuerst die Spotify Client ID ein.');
    if (!Native.isNative()) throw new Error('Die Spotify-Anmeldung geht nur in der App auf dem iPhone.');
    const verifier = randomString(64), state = randomString(16);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    sessionStorage.setItem('sp.verifier', verifier); sessionStorage.setItem('sp.state', state);
    const q = new URLSearchParams({ client_id: s().clientId, response_type: 'code', redirect_uri: REDIRECT, scope: SCOPES, code_challenge_method: 'S256', code_challenge: challenge, state });
    await Native.call('Browser', 'open', { url: 'https://accounts.spotify.com/authorize?' + q });
  }

  async function token(params) {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(Object.assign({ client_id: s().clientId }, params))
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('Spotify-Anmeldung fehlgeschlagen: ' + (j.error_description || j.error || res.status));
    s().access = j.access_token; s().expires = Date.now() + (j.expires_in - 60) * 1000;
    if (j.refresh_token) s().refresh = j.refresh_token;
    Store.save();
  }

  // Rueckkehr von der Anmeldung: glowup://spotify?code=...&state=...
  async function handleRedirect(url) {
    Native.call('Browser', 'close').catch(() => {});
    const q = new URL(url.replace('glowup://spotify', 'https://x/')).searchParams;
    if (q.get('error')) throw new Error('Spotify: Anmeldung abgebrochen (' + q.get('error') + ').');
    if (q.get('state') !== sessionStorage.getItem('sp.state')) throw new Error('Spotify: Anmeldung ungültig. Bitte nochmal verbinden.');
    await token({ grant_type: 'authorization_code', code: q.get('code'), redirect_uri: REDIRECT, code_verifier: sessionStorage.getItem('sp.verifier') });
  }

  async function api(method, path, retry = true) {
    if (!connected()) throw new Error('Spotify ist nicht verbunden.');
    if (!s().access || Date.now() > s().expires) await token({ grant_type: 'refresh_token', refresh_token: s().refresh });
    const res = await fetch(API + path, { method, headers: { Authorization: 'Bearer ' + s().access } });
    if (res.status === 401 && retry) { s().expires = 0; return api(method, path, false); }
    if (res.status === 204 || res.status === 202) return null;
    const j = await res.json().catch(() => null);
    if (!res.ok) {
      const reason = j && j.error && (j.error.reason || j.error.message);
      if (res.status === 404 || reason === 'NO_ACTIVE_DEVICE') { const e = new Error('Kein aktives Gerät. Starte kurz einen Song in der Spotify-App.'); e.noDevice = true; throw e; }
      if (res.status === 403) throw new Error('Spotify erlaubt das Steuern nur mit Premium.');
      throw new Error('Spotify: ' + (reason || res.status));
    }
    return j;
  }

  async function refresh() {
    if (!connected()) { now = null; onChange(); return; }
    try {
      const p = await api('GET', '/me/player');
      now = p && p.item ? {
        playing: p.is_playing, title: p.item.name, artist: (p.item.artists || []).map(a => a.name).join(', '),
        cover: ((p.item.album && p.item.album.images) || []).slice(-2)[0], device: p.device && p.device.name
      } : { idle: true };
    } catch (e) { now = { error: e.message, noDevice: e.noDevice }; }
    onChange();
  }

  async function cmd(c) {
    const map = { play: ['PUT', '/me/player/play'], pause: ['PUT', '/me/player/pause'], next: ['POST', '/me/player/next'], prev: ['POST', '/me/player/previous'] };
    if (c === 'toggle') c = now && now.playing ? 'pause' : 'play';
    if (now) { if (c === 'play') now.playing = true; if (c === 'pause') now.playing = false; onChange(); }
    try { await api(...map[c]); } catch (e) { now = { error: e.message, noDevice: e.noDevice }; onChange(); }
    setTimeout(refresh, 600);
  }

  function disconnect() { const c = s().clientId; Store.d.spotify = { clientId: c }; Store.save(); now = null; onChange(); }
  const openApp = () => { location.href = 'spotify:'; };

  // Kleine Steuerleiste (HTML). Wird von der App in einen Platzhalter gesetzt.
  // Tippen auf das Spotify-Logo oder das Albumbild oeffnet die Spotify-App.
  function bar() {
    const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const logo = `<button class="splogo" data-a="spopen" aria-label="Spotify öffnen">${Ic('spotify')}</button>`;
    if (!connected()) return `<div class="spbar">${logo}<button class="grow sptext" data-a="settings"><b>Spotify verbinden</b><small>Musik im Training steuern</small></button><span class="chev">${Ic('chev')}</span></div>`;
    if (!now) return `<div class="spbar">${logo}<span class="grow"><b>Spotify</b><small>wird geladen …</small></span></div>`;
    if (now.error || now.idle) return `<div class="spbar">${logo}<span class="grow"><b>${now.idle ? 'Gerade läuft nichts' : 'Spotify'}</b><small>${esc(now.error || 'Tippe Play oder öffne Spotify')}</small></span>
      <button class="spbtn round" data-a="sp" data-cmd="play" aria-label="Abspielen">${Ic('play')}</button></div>`;
    const art = now.cover ? `<button class="spcover" data-a="spopen" aria-label="Spotify öffnen"><img src="${esc(now.cover.url)}" alt=""></button>` : logo;
    return `<div class="spbar">${art}
      <span class="grow"><b>${esc(now.title)}</b><small>${esc(now.artist)}</small></span>
      <button class="spbtn round" data-a="sp" data-cmd="prev" aria-label="Zurück">${Ic('prev')}</button>
      <button class="spbtn round main" data-a="sp" data-cmd="toggle" aria-label="${now.playing ? 'Pause' : 'Abspielen'}">${now.playing ? Ic('pause') : Ic('play')}</button>
      <button class="spbtn round" data-a="sp" data-cmd="next" aria-label="Weiter">${Ic('next')}</button></div>`;
  }

  return { REDIRECT, connected, login, handleRedirect, refresh, cmd, disconnect, openApp, bar, set onChange(f) { onChange = f; } };
})();
