// Zugriff auf native iPhone-Funktionen (Capacitor-Plugins) ohne Bundler.
// Im Browser (Vorschau) gibt es kein natives Geraet: isNative() ist dann false.
const Native = (() => {
  const C = () => window.Capacitor;
  const isNative = () => !!(C() && C().isNativePlatform && C().isNativePlatform());

  function call(plugin, method, opts = {}) {
    if (!isNative()) return Promise.reject(new Error('Nur auf dem iPhone verfügbar.'));
    const cap = C();
    if (cap.nativePromise) return cap.nativePromise(plugin, method, opts);
    return cap.Plugins[plugin][method](opts);
  }

  // Ereignisse eines Plugins abonnieren, z. B. listen('App', 'appUrlOpen', cb)
  function listen(plugin, eventName, cb) {
    if (!isNative()) return;
    const cap = C();
    if (cap.nativeCallback) cap.nativeCallback(plugin, 'addListener', { eventName }, cb);
    else if (cap.Plugins[plugin] && cap.Plugins[plugin].addListener) cap.Plugins[plugin].addListener(eventName, cb);
  }

  // Kurze Vibration (Haptics), still im Browser
  const haptic = (style = 'HEAVY') => call('Haptics', 'impact', { style }).catch(() => {});

  // App im Vordergrund?
  let active = true;
  listen('App', 'appStateChange', s => { active = !!s.isActive; });

  return { isNative, call, listen, haptic, get active() { return active; } };
})();
