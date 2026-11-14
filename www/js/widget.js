// Schreibt die Daten fuer die Homescreen-Widgets (WidgetKit) in die App Group.
// Die Widgets lesen nur diese Daten; neu berechnet wird, wenn die App sie aktualisiert.
const Widget = (() => {
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  function payload() {
    const d = Store.d, t = Store.day(), g = d.goals, tot = Store.mealTotals(t);
    const plans = {};
    for (let i = 0; i < 7; i++) {
      const p = Store.plan(d.schedule[i]);
      if (p) plans[i] = { id: p.id, name: p.name, sub: p.sub || '', min: Store.planMinutes(p), count: p.items.length, ex: p.items.slice(0, 4).map(it => Store.exercise(it.ex).name) };
    }
    const week = Store.weekDates().map(dt => {
      const key = Store.day(dt), p = Store.plan(d.schedule[dt.getDay()]);
      return { d: WD[dt.getDay()], date: key, done: d.history.some(h => h.date === key && h.type === 'kraft'), plan: p ? p.name.replace(/^Tag\s+/i, '').slice(0, 2) : '' };
    });
    return {
      v: 1, date: t, updated: Date.now(), name: d.profile.name,
      train: Store.trainMinOn(t), trainGoal: g.trainMin,
      steps: Store.stepsOn(t), stepsGoal: g.steps,
      kcal: tot.kcal, kcalGoal: g.kcal, protein: tot.p, proteinGoal: g.protein,
      water: d.water[t] || 0, waterGoal: g.water,
      doneToday: Store.doneOn(t).filter(h => h.type === 'kraft').map(h => h.planId),
      kraftWeek: Store.kraftThisWeek(), perWeek: g.perWeek,
      plans, week
    };
  }

  let timer;
  function update() {
    if (!Native.isNative()) return;
    clearTimeout(timer);
    timer = setTimeout(() => Native.call('WidgetBridge', 'update', { json: JSON.stringify(payload()) }).catch(() => {}), 400);
  }

  return { update, payload };
})();
