import WidgetKit
import SwiftUI

// MARK: - Daten (von der App in die App Group geschrieben, siehe www/js/widget.js)

struct PlanInfo: Codable {
    var id: String
    var name: String
    var sub: String?
    var min: Int?
    var count: Int?
    var ex: [String]?
}

struct WeekDay: Codable {
    var d: String
    var date: String
    var done: Bool
    var plan: String
}

struct WidgetData: Codable {
    var date: String?
    var name: String?
    var train: Double?
    var trainGoal: Double?
    var steps: Double?
    var stepsGoal: Double?
    var kcal: Double?
    var kcalGoal: Double?
    var protein: Double?
    var proteinGoal: Double?
    var water: Double?
    var waterGoal: Double?
    var doneToday: [String]?
    var kraftWeek: Int?
    var perWeek: Int?
    var plans: [String: PlanInfo]?
    var week: [WeekDay]?

    static let empty = WidgetData()

    static func load() -> WidgetData? {
        guard let json = AppGroup.defaults?.string(forKey: AppGroup.key),
              let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WidgetData.self, from: data)
    }

    static func todayKey(_ d: Date = Date()) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: d)
    }

    /// Stammen die Werte von heute? Sonst beginnt der Tag bei null.
    func isToday(_ d: Date) -> Bool { date == WidgetData.todayKey(d) }

    func plan(on d: Date) -> PlanInfo? {
        let wd = Calendar(identifier: .gregorian).component(.weekday, from: d) - 1 // 0 = Sonntag
        return plans?[String(wd)]
    }
}

struct Entry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entry { Entry(date: Date(), data: Self.sample) }

    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        completion(Entry(date: Date(), data: WidgetData.load() ?? Self.sample))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let now = Date()
        let data = WidgetData.load()
        let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
        // Jetzt, kurz nach Mitternacht (neuer Tag) und dann regelmaessig neu laden
        let entries = [Entry(date: now, data: data), Entry(date: midnight.addingTimeInterval(60), data: data)]
        completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(30 * 60))))
    }

    static let sample: WidgetData = {
        var d = WidgetData()
        d.date = WidgetData.todayKey()
        d.train = 18; d.trainGoal = 30
        d.steps = 6240; d.stepsGoal = 8000
        d.kcal = 1650; d.kcalGoal = 2400
        d.water = 1500; d.waterGoal = 2500
        d.kraftWeek = 1; d.perWeek = 3
        let a = PlanInfo(id: "tag-a", name: "Tag A", sub: "Mo / Fr · Ganzkörper", min: 23, count: 4, ex: ["Liegestütze", "Kniebeugen", "Rudern", "Plank"])
        d.plans = ["1": a, "3": PlanInfo(id: "tag-b", name: "Tag B", sub: "Mi", min: 36, count: 8, ex: ["Pike-Liegestütze"]), "5": a]
        d.week = [WeekDay(d: "Mo", date: "", done: true, plan: "A"), WeekDay(d: "Di", date: "", done: false, plan: ""),
                  WeekDay(d: "Mi", date: "", done: false, plan: "B"), WeekDay(d: "Do", date: "", done: false, plan: ""),
                  WeekDay(d: "Fr", date: "", done: false, plan: "A"), WeekDay(d: "Sa", date: "", done: false, plan: ""),
                  WeekDay(d: "So", date: "", done: false, plan: "")]
        return d
    }()
}

// MARK: - Design

enum Theme {
    static let accent = Color(red: 111 / 255, green: 205 / 255, blue: 1)
    static let deep = Color(red: 30 / 255, green: 144 / 255, blue: 1)
    static let ice = Color(red: 207 / 255, green: 238 / 255, blue: 1)
    static let muted = Color.white.opacity(0.58)
}

struct Background: View {
    var body: some View {
        ZStack {
            Color.black
            RadialGradient(colors: [Theme.deep.opacity(0.55), .clear], center: .topLeading, startRadius: 0, endRadius: 220)
            RadialGradient(colors: [Theme.accent.opacity(0.25), .clear], center: .bottomTrailing, startRadius: 0, endRadius: 200)
        }
    }
}

extension View {
    @ViewBuilder func glowBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(for: .widget) { Background() }
        } else {
            self.padding().background(Background())
        }
    }
}

func ratio(_ v: Double?, _ g: Double?) -> Double {
    guard let v = v, let g = g, g > 0 else { return 0 }
    return min(1, max(0, v / g))
}

func fmt(_ v: Double?) -> String {
    let f = NumberFormatter()
    f.numberStyle = .decimal
    f.locale = Locale(identifier: "de_DE")
    f.maximumFractionDigits = 0
    return f.string(from: NSNumber(value: v ?? 0)) ?? "0"
}

struct Ring: View {
    var progress: Double
    var color: Color
    var width: CGFloat
    var body: some View {
        ZStack {
            Circle().stroke(color.opacity(0.2), lineWidth: width)
            Circle().trim(from: 0, to: max(progress, 0.004))
                .stroke(color, style: StrokeStyle(lineWidth: width, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}

struct Rings: View {
    var data: WidgetData
    var today: Bool
    var width: CGFloat = 10
    var body: some View {
        GeometryReader { geo in
            let s = min(geo.size.width, geo.size.height)
            let gap = width + 3
            ZStack {
                Ring(progress: today ? ratio(data.train, data.trainGoal) : 0, color: Theme.accent, width: width)
                Ring(progress: today ? ratio(data.steps, data.stepsGoal) : 0, color: Theme.deep, width: width)
                    .padding(gap)
                Ring(progress: today ? ratio(data.kcal, data.kcalGoal) : 0, color: Theme.ice, width: width)
                    .padding(gap * 2)
            }
            .frame(width: s, height: s)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct Placeholder: View {
    var body: some View {
        VStack(spacing: 6) {
            Text("Glow Up").font(.system(.headline, design: .rounded)).foregroundColor(Theme.accent)
            Text("Öffne die App einmal, dann erscheinen hier deine Daten.")
                .font(.caption2).foregroundColor(Theme.muted).multilineTextAlignment(.center)
        }
    }
}

// MARK: - Ringe

struct RingeView: View {
    @Environment(\.widgetFamily) var family
    var entry: Entry
    var body: some View {
        Group {
            if let d = entry.data {
                let today = d.isToday(entry.date)
                if family == .systemMedium {
                    HStack(spacing: 14) {
                        Rings(data: d, today: today, width: 11)
                        VStack(alignment: .leading, spacing: 6) {
                            legend("Training", today ? d.train : 0, d.trainGoal, "Min.", Theme.accent)
                            legend("Schritte", today ? d.steps : 0, d.stepsGoal, "", Theme.deep)
                            legend("Kalorien", today ? d.kcal : 0, d.kcalGoal, "kcal", Theme.ice)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else if family == .accessoryCircular {
                    Rings(data: d, today: today, width: 5)
                } else {
                    Rings(data: d, today: today, width: 12)
                }
            } else {
                Placeholder()
            }
        }
        .widgetURL(URL(string: "glowup://tab/start"))
        .glowBackground()
    }

    func legend(_ name: String, _ v: Double?, _ g: Double?, _ unit: String, _ c: Color) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(name).font(.caption2.weight(.bold)).foregroundColor(c)
            HStack(alignment: .firstTextBaseline, spacing: 3) {
                Text(fmt(v)).font(.system(.title3, design: .rounded).weight(.heavy)).foregroundColor(.white)
                Text("/ \(fmt(g)) \(unit)").font(.caption2.weight(.semibold)).foregroundColor(Theme.muted)
            }
        }
    }
}

struct RingeWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "GlowUpRinge", provider: Provider()) { RingeView(entry: $0) }
            .configurationDisplayName("Ringe")
            .description("Training, Schritte und Kalorien von heute.")
            .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular])
    }
}

// MARK: - Heute

struct HeuteView: View {
    @Environment(\.widgetFamily) var family
    var entry: Entry
    var body: some View {
        Group {
            if let d = entry.data {
                let plan = d.plan(on: entry.date)
                let done = plan != nil && d.isToday(entry.date) && (d.doneToday ?? []).contains(plan!.id)
                if family == .accessoryRectangular {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(done ? "Erledigt ✓" : "Heute").font(.caption2.weight(.bold))
                        Text(plan?.name ?? "Pausentag").font(.headline)
                        Text(plan.map { "≈ \($0.min ?? 0) Min. · \($0.count ?? 0) Übungen" } ?? "Dehnen tut gut")
                            .font(.caption2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(done ? "HEUTE ERLEDIGT ✓" : "HEUTE").font(.caption2.weight(.heavy)).foregroundColor(done ? Theme.accent : Theme.muted)
                        Text(plan?.name ?? "Pausentag").font(.system(.title2, design: .rounded).weight(.heavy)).foregroundColor(.white).lineLimit(1)
                        Text(plan.map { "≈ \($0.min ?? 0) Min. · \($0.count ?? 0) Übungen" } ?? "Muskeln wachsen in der Pause")
                            .font(.caption).foregroundColor(Theme.muted).lineLimit(2)
                        if family == .systemMedium, let ex = plan?.ex {
                            Text(ex.joined(separator: " · ")).font(.caption2).foregroundColor(Theme.ice.opacity(0.8)).lineLimit(2)
                        }
                        Spacer(minLength: 0)
                        Text(plan == nil ? "Mobility starten" : (done ? "Nochmal starten" : "Training starten"))
                            .font(.caption.weight(.heavy)).foregroundColor(.black)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(Capsule().fill(LinearGradient(colors: [Theme.ice, Theme.accent], startPoint: .top, endPoint: .bottom)))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                Placeholder()
            }
        }
        .widgetURL(URL(string: "glowup://start/" + (entry.data?.plan(on: entry.date)?.id ?? "mobility")))
        .glowBackground()
    }
}

struct HeuteWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "GlowUpHeute", provider: Provider()) { HeuteView(entry: $0) }
            .configurationDisplayName("Heute")
            .description("Dein Training von heute. Tippen startet es.")
            .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}

// MARK: - Schritte

struct SchritteView: View {
    @Environment(\.widgetFamily) var family
    var entry: Entry
    var body: some View {
        Group {
            if let d = entry.data {
                let steps = d.isToday(entry.date) ? (d.steps ?? 0) : 0
                let p = ratio(steps, d.stepsGoal)
                switch family {
                case .accessoryInline:
                    Text("\(fmt(steps)) Schritte")
                case .accessoryCircular:
                    ZStack {
                        Ring(progress: p, color: .white, width: 5)
                        VStack(spacing: 0) {
                            Text(steps >= 10_000 ? "\(Int(steps / 1000))k" : fmt(steps)).font(.system(size: 13, weight: .heavy, design: .rounded))
                            Image(systemName: "figure.walk").font(.system(size: 9))
                        }
                    }
                default:
                    VStack(spacing: 6) {
                        ZStack {
                            Ring(progress: p, color: Theme.deep, width: 11)
                            VStack(spacing: 0) {
                                Text(fmt(steps)).font(.system(.title3, design: .rounded).weight(.heavy)).foregroundColor(.white).minimumScaleFactor(0.6)
                                Text("von \(fmt(d.stepsGoal))").font(.caption2).foregroundColor(Theme.muted)
                            }
                        }
                        Text(String(format: "%.1f km", steps * 0.00075).replacingOccurrences(of: ".", with: ","))
                            .font(.caption2.weight(.bold)).foregroundColor(Theme.accent)
                    }
                }
            } else {
                Placeholder()
            }
        }
        .widgetURL(URL(string: "glowup://tab/schritte"))
        .glowBackground()
    }
}

struct SchritteWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "GlowUpSchritte", provider: Provider()) { SchritteView(entry: $0) }
            .configurationDisplayName("Schritte")
            .description("Deine Schritte von heute.")
            .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryInline])
    }
}

// MARK: - Woche

struct WocheView: View {
    var entry: Entry
    var body: some View {
        Group {
            if let d = entry.data {
                let todayKey = WidgetData.todayKey(entry.date)
                let today = d.isToday(entry.date)
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("Diese Woche").font(.caption.weight(.bold)).foregroundColor(Theme.muted)
                        Spacer()
                        Text("\(d.kraftWeek ?? 0) / \(d.perWeek ?? 3) Trainings")
                            .font(.caption2.weight(.heavy)).foregroundColor(Theme.accent)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Capsule().fill(Theme.accent.opacity(0.16)))
                    }
                    HStack(spacing: 0) {
                        ForEach(Array((d.week ?? []).enumerated()), id: \.offset) { _, w in
                            VStack(spacing: 4) {
                                Text(w.d).font(.caption2.weight(.bold)).foregroundColor(w.date == todayKey ? .white : Theme.muted)
                                ZStack {
                                    if w.done {
                                        Circle().fill(Theme.accent)
                                        Text("✓").font(.caption.weight(.heavy)).foregroundColor(.black)
                                    } else if !w.plan.isEmpty {
                                        Circle().stroke(Theme.accent, lineWidth: 2)
                                        Text(w.plan).font(.caption2.weight(.heavy)).foregroundColor(Theme.accent)
                                    } else {
                                        Circle().fill(Color.white.opacity(0.08))
                                        Text("·").font(.caption2).foregroundColor(Theme.muted)
                                    }
                                }
                                .frame(width: 26, height: 26)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    let liters = String(format: "%.1f", (today ? (d.water ?? 0) : 0) / 1000).replacingOccurrences(of: ".", with: ",")
                    HStack {
                        Label("\(liters) l Wasser", systemImage: "drop.fill")
                        Spacer()
                        Label("\(fmt(today ? d.protein : 0)) g Eiweiß", systemImage: "bolt.fill")
                    }
                    .font(.caption2.weight(.semibold)).foregroundColor(Theme.ice.opacity(0.85))
                }
            } else {
                Placeholder()
            }
        }
        .widgetURL(URL(string: "glowup://tab/training"))
        .glowBackground()
    }
}

struct WocheWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "GlowUpWoche", provider: Provider()) { WocheView(entry: $0) }
            .configurationDisplayName("Woche")
            .description("Deine Trainingswoche, Wasser und Eiweiß.")
            .supportedFamilies([.systemMedium])
    }
}

// MARK: - Bundle

@main
struct GlowUpWidgets: WidgetBundle {
    var body: some Widget {
        RingeWidget()
        HeuteWidget()
        SchritteWidget()
        WocheWidget()
    }
}
