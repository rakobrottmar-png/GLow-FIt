import Foundation

/// Gemeinsamer Speicher von App und Widget (App Group).
/// Beim Sideloading haengen AltStore/SideStore/iloader oft die Team-ID an die Gruppe an.
/// Deshalb wird die echte Gruppe zur Laufzeit gesucht statt fest eingetragen.
enum AppGroup {
    static let fallback = "group.app.glowup.fitness"
    static let key = "widget"

    static let id: String = {
        // 1. AltStore/SideStore schreiben die Gruppen ins Info.plist
        if let groups = Bundle.main.object(forInfoDictionaryKey: "ALTAppGroups") as? [String], let g = groups.first {
            return g
        }
        // 2. Gruppen aus dem eingebetteten Provisioning-Profil lesen
        if let g = groupFromProfile() { return g }
        return fallback
    }()

    static var defaults: UserDefaults? { UserDefaults(suiteName: id) }

    private static func groupFromProfile() -> String? {
        guard let url = Bundle.main.url(forResource: "embedded", withExtension: "mobileprovision"),
              let data = try? Data(contentsOf: url),
              let text = String(data: data, encoding: .isoLatin1),
              let start = text.range(of: "<?xml"),
              let end = text.range(of: "</plist>") else { return nil }
        let xml = String(text[start.lowerBound..<end.upperBound])
        guard let plist = try? PropertyListSerialization.propertyList(from: Data(xml.utf8), format: nil) as? [String: Any],
              let ent = plist["Entitlements"] as? [String: Any],
              let groups = ent["com.apple.security.application-groups"] as? [String] else { return nil }
        return groups.first(where: { $0.contains("glowup") }) ?? groups.first
    }
}
