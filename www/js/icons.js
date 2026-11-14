// Eigene Symbole als SVG (statt Emojis). Ic('play') -> '<svg ...>'.
const Ic = (() => {
  const line = d => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const solid = d => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${d}</svg>`;
  const P = {
    play: solid('<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>'),
    pause: solid('<rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/>'),
    next: solid('<path d="M5 6.2v11.6a.9.9 0 0 0 1.4.75L14.6 13a1.2 1.2 0 0 0 0-2L6.4 5.45A.9.9 0 0 0 5 6.2z"/><rect x="16.5" y="5.5" width="2.6" height="13" rx="1"/>'),
    prev: solid('<path d="M19 6.2v11.6a.9.9 0 0 1-1.4.75L9.4 13a1.2 1.2 0 0 1 0-2l8.2-5.55A.9.9 0 0 1 19 6.2z"/><rect x="4.9" y="5.5" width="2.6" height="13" rx="1"/>'),
    scan: line('<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/>'),
    camera: line('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.4-2h5.8l1.4 2h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.4"/>'),
    spark: line('<path d="M12 3.5l1.7 4.6 4.6 1.7-4.6 1.7-1.7 4.6-1.7-4.6-4.6-1.7 4.6-1.7z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
    check: line('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    close: line('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
    send: line('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    chev: line('<path d="M9.5 6l6 6-6 6"/>'),
    plus: line('<path d="M12 5v14M5 12h14"/>'),
    minus: line('<path d="M5 12h14"/>'),
    warn: line('<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.5v.01"/>'),
    edit: line('<path d="M5 19h4l10-10-4-4L5 15z"/>'),
    // Offizielles Spotify-Symbol (Markenzeichen von Spotify AB)
    spotify: '<svg class="ic spotify" viewBox="0 0 24 24" aria-label="Spotify" role="img"><path fill="#1ED760" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>'
  };
  return name => P[name] || '';
})();
