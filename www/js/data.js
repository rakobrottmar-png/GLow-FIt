// Uebungen, Animationen (Strichfigur, Seitenansicht), Standard-Plaene und Lebensmittel.
// Pose: h=Kopf, s=Schulter, hp=Huefte, e/ha=Ellbogen/Hand, k/f=Knie/Fuss,
// e2/ha2/k2/f2 = hinterer Arm / hinteres Bein, sp = Mitte Wirbelsaeule (optional).
// Zeichenflaeche 200 x 140, Boden bei y = 120.

const EXERCISES = {
  pushup_decline: {
    name: 'Liegestütze (Füße erhöht)', muskeln: 'Brust, Schultern, Trizeps',
    tipp: 'Füße auf Stuhl oder Bett. Körper bleibt ein Brett, Bauch und Po fest. Langsam runter, bis die Brust fast den Boden berührt.',
    props: [{ t: 'rect', x: 136, y: 96, w: 44, h: 24 }],
    a: { h: [48, 72], s: [62, 80], hp: [102, 86], e: [62, 100], ha: [62, 120], k: [128, 90], f: [152, 93] },
    b: { h: [45, 100], s: [60, 105], hp: [102, 99], e: [80, 96], ha: [62, 120], k: [128, 96], f: [152, 93] }
  },
  pushup: {
    name: 'Liegestütze', muskeln: 'Brust, Schultern, Trizeps',
    tipp: 'Hände etwas breiter als die Schultern. Körper bleibt gerade, Ellbogen etwa 45° vom Körper.',
    a: { h: [48, 76], s: [62, 82], hp: [104, 96], e: [62, 101], ha: [62, 120], k: [132, 107], f: [160, 118] },
    b: { h: [45, 103], s: [60, 107], hp: [104, 110], e: [80, 98], ha: [62, 120], k: [132, 114], f: [160, 118] }
  },
  squat_pack: {
    name: 'Kniebeugen mit Rucksack', muskeln: 'Beine, Po, Rumpf',
    tipp: 'Vollen Rucksack vor die Brust nehmen. Knie zeigen in Richtung der Zehen, Fersen bleiben am Boden, Rücken gerade.',
    props: [{ t: 'pack', at: 'ha', dx: -4, dy: -10, w: 16, h: 22 }],
    a: { h: [102, 18], s: [101, 32], hp: [100, 68], e: [105, 50], ha: [116, 42], k: [101, 94], f: [100, 120] },
    b: { h: [110, 50], s: [105, 63], hp: [86, 95], e: [112, 80], ha: [123, 72], k: [121, 97], f: [100, 120] }
  },
  row_pack: {
    name: 'Rucksack-Rudern', muskeln: 'Rücken, Bizeps',
    tipp: 'Vorgebeugt, Rücken gerade. Rucksack mit Büchern oder Wasserflaschen zur Hüfte ziehen, Ellbogen eng am Körper, oben kurz halten.',
    props: [{ t: 'pack', at: 'ha', dx: -8, dy: 2, w: 16, h: 20 }],
    a: { h: [137, 55], s: [124, 62], hp: [88, 76], e: [125, 82], ha: [126, 100], k: [104, 96], f: [100, 120] },
    b: { h: [137, 55], s: [124, 62], hp: [88, 76], e: [104, 56], ha: [110, 77], k: [104, 96], f: [100, 120] }
  },
  plank: {
    name: 'Plank', muskeln: 'Bauch, Rumpf',
    tipp: 'Ellbogen unter den Schultern. Po nicht hochstrecken und nicht durchhängen. Bauch fest, ruhig weiteratmen.',
    hold: true,
    a: { h: [47, 90], s: [62, 96], hp: [106, 101], e: [62, 118], ha: [42, 118], k: [132, 109], f: [158, 118] },
    b: { h: [47, 89], s: [62, 95], hp: [106, 99], e: [62, 118], ha: [42, 118], k: [132, 108], f: [158, 118] }
  },
  pike_pushup: {
    name: 'Pike-Liegestütze', muskeln: 'Schultern, Trizeps',
    tipp: 'Po weit nach oben wie ein umgedrehtes V. Kopf zwischen den Händen Richtung Boden senken und wieder hochdrücken.',
    a: { h: [66, 97], s: [77, 84], hp: [106, 60], e: [73, 102], ha: [70, 120], k: [119, 91], f: [132, 120] },
    b: { h: [58, 112], s: [73, 103], hp: [106, 68], e: [88, 108], ha: [70, 120], k: [120, 95], f: [132, 120] }
  },
  lunge: {
    name: 'Ausfallschritte', muskeln: 'Beine, Po',
    tipp: 'Großer Schritt nach vorn. Hinteres Knie fast bis zum Boden, Oberkörper aufrecht. Vorderes Knie bleibt über dem Fuß.',
    a: { h: [104, 20], s: [104, 34], hp: [104, 70], e: [104, 54], ha: [106, 72], k: [124, 94], f: [124, 120], k2: [92, 96], f2: [76, 116] },
    b: { h: [104, 42], s: [104, 56], hp: [104, 92], e: [104, 76], ha: [106, 94], k: [128, 95], f: [124, 120], k2: [94, 114], f2: [70, 112] }
  },
  row_table: {
    name: 'Tisch-Rudern', muskeln: 'Rücken, Bizeps',
    tipp: 'Unter einen sehr stabilen Tisch legen, Tischkante greifen und die Brust hochziehen. Mit angewinkelten Beinen ist es leichter.',
    props: [{ t: 'rect', x: 48, y: 53, w: 112, h: 5 }, { t: 'line', x1: 54, y1: 58, x2: 54, y2: 120 }, { t: 'line', x1: 154, y1: 58, x2: 154, y2: 120 }],
    a: { h: [80, 93], s: [92, 97], hp: [122, 105], e: [93, 77], ha: [94, 58], k: [144, 112], f: [168, 118] },
    b: { h: [82, 66], s: [94, 72], hp: [122, 91], e: [108, 85], ha: [94, 58], k: [144, 105], f: [168, 118] }
  },
  superman: {
    name: 'Superman', muskeln: 'Unterer Rücken, Po',
    tipp: 'Auf dem Bauch liegen. Arme und Beine gleichzeitig anheben, oben 2 Sekunden halten. Blick zum Boden, Nacken lang.',
    a: { h: [57, 108], s: [70, 112], hp: [104, 114], e: [50, 113], ha: [30, 114], k: [132, 115], f: [160, 115] },
    b: { h: [57, 98], s: [70, 105], hp: [104, 114], e: [50, 98], ha: [31, 91], k: [132, 110], f: [158, 100] }
  },
  snow_angel: {
    name: 'Reverse Snow Angels', muskeln: 'Oberer Rücken, Schultern',
    tipp: 'Bäuchlings liegen, Brust leicht angehoben. Gestreckte Arme knapp über dem Boden von oben nach unten zur Hüfte führen und zurück.',
    a: { h: [57, 101], s: [70, 107], hp: [104, 114], e: [50, 104], ha: [31, 102], k: [132, 115], f: [160, 115] },
    b: { h: [57, 101], s: [70, 107], hp: [104, 114], e: [88, 103], ha: [106, 104], k: [132, 115], f: [160, 115] }
  },
  hip_thrust: {
    name: 'Hip Thrusts', muskeln: 'Po, Beinrückseite',
    tipp: 'Auf dem Rücken liegen, Füße nah am Po. Hüfte hochdrücken, bis Knie, Hüfte und Schultern eine Linie sind. Oben den Po fest anspannen.',
    a: { h: [49, 111], s: [62, 114], hp: [104, 113], e: [78, 116], ha: [95, 117], k: [128, 91], f: [140, 120] },
    b: { h: [49, 111], s: [62, 113], hp: [104, 91], e: [78, 116], ha: [95, 117], k: [131, 86], f: [140, 120] }
  },
  leg_raise: {
    name: 'Beinheben', muskeln: 'Unterer Bauch',
    tipp: 'Rücken liegt flach am Boden. Gestreckte Beine langsam heben und kontrolliert senken, ohne sie ganz abzulegen.',
    a: { h: [49, 111], s: [62, 114], hp: [104, 114], e: [78, 116], ha: [95, 117], k: [132, 111], f: [160, 108] },
    b: { h: [49, 111], s: [62, 114], hp: [104, 114], e: [78, 116], ha: [95, 117], k: [107, 86], f: [110, 58] }
  },
  side_plank: {
    name: 'Seitstütz', muskeln: 'Seitlicher Bauch, Rumpf',
    tipp: 'Auf einen Unterarm stützen, Körper bildet eine gerade Linie. Hüfte oben halten, nicht absinken lassen.',
    hold: true,
    a: { h: [50, 80], s: [64, 92], hp: [106, 104], e: [64, 118], ha: [84, 118], k: [132, 111], f: [158, 118], e2: [66, 72], ha2: [67, 52] },
    b: { h: [50, 79], s: [64, 91], hp: [106, 102], e: [64, 118], ha: [84, 118], k: [132, 110], f: [158, 118], e2: [66, 71], ha2: [67, 51] }
  },
  // ---------- Dehnen ----------
  st_chest: {
    name: 'Brust an der Wand', muskeln: 'Brust, vordere Schulter',
    tipp: 'Hand auf Schulterhöhe an die Wand oder den Türrahmen. Oberkörper langsam wegdrehen, bis es in der Brust zieht.',
    hold: true, props: [{ t: 'line', x1: 68, y1: 6, x2: 68, y2: 120 }],
    a: { h: [104, 20], s: [102, 34], hp: [100, 70], e: [86, 35], ha: [70, 36], k: [100, 95], f: [100, 120], e2: [104, 54], ha2: [106, 72] }
  },
  st_shoulder: {
    name: 'Schulter quer', muskeln: 'Hintere Schulter',
    tipp: 'Einen Arm gestreckt vor die Brust nehmen und mit dem anderen Arm sanft zum Körper ziehen. Schulter bleibt unten.',
    hold: true,
    a: { h: [102, 20], s: [101, 34], hp: [100, 70], e: [117, 37], ha: [133, 38], k: [100, 95], f: [100, 120], e2: [113, 50], ha2: [121, 37] }
  },
  st_triceps: {
    name: 'Trizeps über Kopf', muskeln: 'Trizeps, Schulter',
    tipp: 'Ellbogen neben den Kopf, Hand zwischen die Schulterblätter. Mit der anderen Hand den Ellbogen sanft nach hinten schieben.',
    hold: true,
    a: { h: [102, 22], s: [101, 36], hp: [100, 70], e: [100, 14], ha: [92, 30], k: [100, 95], f: [100, 120], e2: [113, 22], ha2: [102, 12] }
  },
  st_hipflexor: {
    name: 'Hüftbeuger', muskeln: 'Hüftbeuger, Oberschenkel vorn',
    tipp: 'Tiefer Ausfallschritt, hinteres Knie am Boden. Hüfte nach vorn schieben, Oberkörper aufrecht, Po leicht anspannen.',
    hold: true,
    a: { h: [104, 46], s: [102, 60], hp: [100, 97], e: [113, 78], ha: [126, 91], k: [130, 94], f: [130, 120], k2: [84, 118], f2: [57, 116] },
    b: { h: [105, 46], s: [103, 60], hp: [102, 98], e: [114, 78], ha: [126, 91], k: [130, 94], f: [130, 120], k2: [84, 118], f2: [57, 116] }
  },
  st_forward: {
    name: 'Vorbeuge', muskeln: 'Beinrückseite, unterer Rücken',
    tipp: 'Aus der Hüfte nach vorn beugen und den Oberkörper hängen lassen. Knie dürfen leicht gebeugt sein. Nicht wippen.',
    hold: true,
    a: { h: [126, 103], s: [122, 90], hp: [97, 68], e: [124, 105], ha: [118, 118], k: [101, 94], f: [100, 120] },
    b: { h: [125, 105], s: [121, 92], hp: [97, 68], e: [123, 107], ha: [117, 119], k: [101, 94], f: [100, 120] }
  },
  st_quad: {
    name: 'Oberschenkel vorn', muskeln: 'Quadrizeps',
    tipp: 'Auf einem Bein stehen, die Ferse des anderen Beins zum Po ziehen. Knie zeigt nach unten, Hüfte nach vorn. Bei Bedarf festhalten.',
    hold: true,
    a: { h: [102, 20], s: [101, 34], hp: [100, 70], e: [112, 50], ha: [124, 44], k: [100, 95], f: [100, 120], k2: [104, 96], f2: [86, 84], e2: [93, 56], ha2: [87, 80] }
  },
  st_child: {
    name: 'Kindhaltung', muskeln: 'Rücken, Schultern, Hüfte',
    tipp: 'Auf die Fersen setzen, Oberkörper nach vorn ablegen und die Arme weit nach vorn strecken. Tief in den Rücken atmen.',
    hold: true,
    a: { h: [87, 110], s: [100, 105], hp: [142, 100], e: [77, 113], ha: [56, 117], k: [120, 118], f: [152, 118], sp: [121, 94] },
    b: { h: [87, 111], s: [100, 106], hp: [142, 100], e: [77, 113], ha: [56, 117], k: [120, 118], f: [152, 118], sp: [121, 96] }
  },
  st_cobra: {
    name: 'Kobra', muskeln: 'Bauch, Hüftbeuger, Brust',
    tipp: 'Auf dem Bauch liegen, Hände unter die Schultern. Oberkörper hochdrücken, Hüfte bleibt am Boden, Schultern weg von den Ohren.',
    hold: true,
    a: { h: [71, 68], s: [78, 83], hp: [112, 114], e: [77, 102], ha: [82, 118], k: [137, 116], f: [163, 116], sp: [90, 104] },
    b: { h: [71, 67], s: [78, 82], hp: [112, 114], e: [77, 101], ha: [82, 118], k: [137, 116], f: [163, 116], sp: [90, 103] }
  },
  st_calf: {
    name: 'Waden an der Wand', muskeln: 'Waden',
    tipp: 'Hände an die Wand, ein Bein weit nach hinten. Hintere Ferse fest in den Boden drücken, Knie gestreckt.',
    hold: true, props: [{ t: 'line', x1: 142, y1: 6, x2: 142, y2: 120 }],
    a: { h: [121, 30], s: [116, 44], hp: [105, 79], e: [129, 52], ha: [140, 44], k: [127, 98], f: [124, 120], k2: [90, 100], f2: [74, 120] }
  },
  st_catcow: {
    name: 'Katze-Kuh', muskeln: 'Wirbelsäule',
    tipp: 'Im Vierfüßlerstand den Rücken abwechselnd rund machen (Katze) und sanft durchhängen lassen (Kuh). Langsam mit der Atmung.',
    a: { h: [60, 98], s: [72, 84], hp: [122, 86], e: [71, 102], ha: [70, 120], k: [122, 120], f: [150, 120], sp: [97, 70] },
    b: { h: [56, 74], s: [72, 86], hp: [122, 84], e: [71, 103], ha: [70, 120], k: [122, 120], f: [150, 120], sp: [97, 96] }
  }
};

const DEFAULT_PLANS = [
  {
    id: 'tag-a', name: 'Tag A', sub: 'Mo / Fr · Ganzkörper', type: 'kraft',
    items: [
      { ex: 'pushup_decline', sets: 3, reps: '8-15', rest: 75 },
      { ex: 'squat_pack', sets: 3, reps: '12-15', rest: 75 },
      { ex: 'row_pack', sets: 3, reps: '10-12', rest: 75 },
      { ex: 'plank', sets: 3, sec: 45, rest: 60 }
    ]
  },
  {
    id: 'tag-b', name: 'Tag B', sub: 'Mi · Ganzkörper + Rücken', type: 'kraft',
    items: [
      { ex: 'pike_pushup', sets: 3, reps: '8-12', rest: 75 },
      { ex: 'lunge', sets: 3, reps: '10', note: 'pro Bein', rest: 75 },
      { ex: 'row_table', sets: 3, reps: 'max', note: 'erstmal mit angewinkelten Beinen', rest: 90 },
      { ex: 'superman', sets: 3, reps: '12', note: 'oben 2 Sek. halten', rest: 60 },
      { ex: 'snow_angel', sets: 3, reps: '12', rest: 60 },
      { ex: 'hip_thrust', sets: 3, reps: '12-15', rest: 60 },
      { ex: 'leg_raise', sets: 1, reps: '12', note: 'Core-Finisher', rest: 30 },
      { ex: 'side_plank', sets: 1, sec: 30, sides: 2, note: 'Core-Finisher', rest: 15 }
    ]
  },
  {
    id: 'dehnen-nach', name: 'Dehnen nach dem Training', sub: 'Ganzkörper · entspannt', type: 'dehnen',
    items: [
      { ex: 'st_chest', sets: 1, sec: 30, sides: 2, rest: 6 },
      { ex: 'st_shoulder', sets: 1, sec: 30, sides: 2, rest: 6 },
      { ex: 'st_triceps', sets: 1, sec: 30, sides: 2, rest: 6 },
      { ex: 'st_hipflexor', sets: 1, sec: 30, sides: 2, rest: 6 },
      { ex: 'st_quad', sets: 1, sec: 30, sides: 2, rest: 6 },
      { ex: 'st_forward', sets: 1, sec: 45, rest: 6 },
      { ex: 'st_cobra', sets: 1, sec: 30, rest: 6 },
      { ex: 'st_child', sets: 1, sec: 45, rest: 0 }
    ]
  },
  {
    id: 'mobility', name: 'Mobility am Morgen', sub: 'Wach werden · beweglich bleiben', type: 'dehnen',
    items: [
      { ex: 'st_catcow', sets: 1, sec: 45, rest: 6 },
      { ex: 'st_child', sets: 1, sec: 40, rest: 6 },
      { ex: 'st_cobra', sets: 1, sec: 30, rest: 6 },
      { ex: 'st_hipflexor', sets: 1, sec: 30, sides: 2, rest: 6 },
      { ex: 'st_forward', sets: 1, sec: 40, rest: 6 },
      { ex: 'st_calf', sets: 1, sec: 30, sides: 2, rest: 0 }
    ]
  }
];

// Wochentag (0 = Sonntag) -> Plan
const DEFAULT_SCHEDULE = { 1: 'tag-a', 3: 'tag-b', 5: 'tag-a' };

// Offline-Liste: [Name, Portion, kcal, Eiweiss, Kohlenhydrate, Fett]
const FOODS = [
  ['Haferflocken', '50 g', 185, 7, 30, 4], ['Milch 1,5 %', '250 ml', 118, 9, 12, 4], ['Magerquark', '250 g', 170, 30, 10, 1],
  ['Skyr natur', '200 g', 126, 22, 8, 0], ['Joghurt natur', '150 g', 95, 6, 7, 5], ['Ei gekocht', '1 Stück', 78, 7, 1, 5],
  ['Rührei (2 Eier)', '1 Portion', 200, 14, 1, 15], ['Vollkornbrot', '1 Scheibe', 110, 4, 20, 1], ['Brötchen', '1 Stück', 150, 5, 30, 1],
  ['Butter', '10 g', 74, 0, 0, 8], ['Käse (Gouda)', '30 g', 107, 7, 0, 9], ['Putenbrust-Aufschnitt', '30 g', 32, 6, 0, 1],
  ['Banane', '1 Stück', 105, 1, 27, 0], ['Apfel', '1 Stück', 80, 0, 21, 0], ['Beeren', '150 g', 65, 1, 12, 1],
  ['Erdnussbutter', '15 g', 94, 4, 2, 8], ['Nüsse gemischt', '30 g', 185, 6, 4, 16], ['Proteinshake (Wasser)', '30 g Pulver', 115, 24, 2, 1],
  ['Hähnchenbrust', '150 g', 165, 35, 0, 3], ['Rinderhack', '150 g', 330, 30, 0, 23], ['Lachs', '150 g', 310, 30, 0, 21],
  ['Thunfisch (Dose)', '1 Dose', 120, 27, 0, 1], ['Tofu', '150 g', 190, 20, 3, 11], ['Linsen gekocht', '200 g', 230, 18, 40, 1],
  ['Reis gekocht', '200 g', 260, 5, 57, 1], ['Nudeln gekocht', '200 g', 300, 10, 60, 2], ['Kartoffeln', '250 g', 190, 5, 40, 0],
  ['Gemüse gemischt', '200 g', 60, 4, 10, 1], ['Salat mit Dressing', '1 Schale', 150, 3, 8, 12], ['Olivenöl', '1 EL', 120, 0, 0, 14],
  ['Pizza Margherita', '1 Stück (350 g)', 850, 33, 105, 30], ['Döner', '1 Stück', 650, 35, 60, 28], ['Burger', '1 Stück', 550, 28, 40, 30],
  ['Pommes', '150 g', 430, 5, 55, 21], ['Schokolade', '25 g', 135, 2, 14, 8], ['Proteinriegel', '1 Stück', 200, 20, 18, 7],
  ['Cola', '330 ml', 140, 0, 35, 0], ['Orangensaft', '200 ml', 90, 1, 20, 0], ['Kaffee mit Milch', '1 Tasse', 30, 2, 3, 1]
];
