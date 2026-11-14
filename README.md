# Glow Up

Fitness-App fürs iPhone im Stil von Apple Fitness: Training mit Timer und animierten Übungen, Dehnen, Ernährung mit KI-Kalorien-Scanner, Schrittzähler und ein KI-Coach, der Pläne direkt in der App anlegt.

## Was drin ist

- **Start:** Ringe für Training, Schritte und Kalorien, das heutige Training, Wochenübersicht, Wasser.
- **Training:** Tag A (Mo/Fr), Tag B (Mi), zwei Dehnroutinen. Player mit Satz-Zähler, Pausen-Timer, Tönen und animierter Figur für jede Übung.
- **Ernährung:** Mahlzeiten eintragen (Liste, von Hand, per Foto oder Text mit KI), Kalorien, Eiweiß, Wasser.
- **Schritte:** liest den Schrittzähler des iPhones (Core Motion), 7-Tage-Verlauf.
- **Coach:** Chat mit Werkzeugen, auch mit Bildern. Kann Pläne, Übungen, Wochenplan, Ziele und Mahlzeiten anlegen und ändern.
- **Spotify, Kalender, Widgets:** Musik im Training steuern, Trainingstermine im iPhone-/Google-Kalender, Homescreen-Widgets.

Alles außer der KI läuft offline. Die Daten bleiben auf dem Gerät.

## KI einrichten

Coach und Kalorien-Scanner nutzen **Google Gemini** (`gemini-3.8-flash`) über Googles OpenAI-kompatible Schnittstelle.

1. Im [Google AI Studio](https://aistudio.google.com) unter „Get API key“ einen Key erstellen.
2. In der App: Start → Zahnrad → **KI (Google Gemini)** → Key eintragen → Speichern.

Der Key wird nur auf dem Gerät gespeichert und nur an Google geschickt.

## Schnittstellen für andere Apps

Glow Up ist so gebaut, dass andere Apps und iOS-Kurzbefehle Daten eintragen und auslesen können.

**Links (URL-Schema `glowup://`)**, z. B. aus einer anderen App oder einem Kurzbefehl „URL öffnen“:

| Link | Wirkung |
|---|---|
| `glowup://start/tag-a` | Training mit dieser Plan-ID starten |
| `glowup://tab/essen` | Tab öffnen (`start`, `training`, `essen`, `schritte`, `coach`) |
| `glowup://log/water?ml=250` | Wasser eintragen |
| `glowup://log/meal?name=Banane&kcal=105&p=1&c=27&f=0&slot=Snack` | Mahlzeit eintragen |
| `glowup://log/weight?kg=72.5` | Gewicht eintragen |
| `glowup://log/steps?n=3000` | Schritte für heute ergänzen |
| `glowup://coach?q=Text` | Frage an den Coach |

**Datenaustausch:** Einstellungen → Daten → Exportieren kopiert alles als JSON in die Zwischenablage, Importieren liest es wieder ein. Format:

```json
{ "format": "glowup.v1", "exportedAt": "2026-11-14T12:00:00.000Z", "data": { "plans": [], "history": [], "meals": {}, "water": {}, "steps": {}, "weights": [], "goals": {}, "profile": {} } }
```

Keys, Spotify-Login und Bilder sind im Export nicht enthalten.

## IPA bekommen

Jeder Push auf `main` startet den Workflow „IPA bauen“. Die fertige `GlowUp.ipa` hängt danach unter **Releases**.

Die IPA ist **nicht signiert**. Ein iPhone installiert sie nur über ein Werkzeug, das sie mit deiner Apple-ID signiert, zum Beispiel:

- [Sideloadly](https://sideloadly.io) (Windows/Mac, iPhone per Kabel)
- [AltStore](https://altstore.io)

Mit einer kostenlosen Apple-ID läuft die App 7 Tage und muss dann neu signiert werden. Mit einem bezahlten Entwickler-Konto hält sie ein Jahr.

## Entwickeln

```bash
npm install
npm start        # Vorschau im Browser auf http://localhost:4173
```

Die App ist reines HTML/CSS/JS in `www/`, verpackt mit [Capacitor](https://capacitorjs.com). Das Xcode-Projekt liegt in `ios/`.
