# Glow Up

Fitness-App fürs iPhone im Stil von Apple Fitness: Training mit Timer und animierten Übungen, Dehnen, Ernährung mit KI-Kalorien-Scanner, Schrittzähler und ein KI-Coach, der Pläne direkt in der App anlegt.

## Was drin ist

- **Start:** Ringe für Training, Schritte und Kalorien, das heutige Training, Wochenübersicht, Wasser.
- **Training:** Tag A (Mo/Fr), Tag B (Mi), zwei Dehnroutinen. Player mit Satz-Zähler, Pausen-Timer, Tönen und animierter Figur für jede Übung.
- **Ernährung:** Mahlzeiten eintragen (Liste, von Hand, per Foto oder Text mit KI), Kalorien, Eiweiß, Wasser.
- **Schritte:** liest den Schrittzähler des iPhones (Core Motion), 7-Tage-Verlauf.
- **Coach:** Chat mit Werkzeugen. Kann Pläne, Übungen, Wochenplan, Ziele und Mahlzeiten anlegen und ändern.

Alles außer der KI läuft offline. Die Daten bleiben auf dem Gerät.

## KI einrichten

1. Auf [openrouter.ai](https://openrouter.ai) einen Key anlegen und Guthaben aufladen.
2. In der App: Start → Zahnrad → „OpenRouter-Key“ eintragen.

Der Key wird nur auf dem Gerät gespeichert und nur an OpenRouter geschickt.

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
