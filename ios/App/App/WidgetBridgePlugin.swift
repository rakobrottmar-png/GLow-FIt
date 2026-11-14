import Foundation
import Capacitor
import WidgetKit

/// Nimmt die Widget-Daten aus der Web-App entgegen und laedt die Widgets neu.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    @objc func update(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("json fehlt")
            return
        }
        guard let defaults = AppGroup.defaults else {
            call.resolve(["ok": false, "group": AppGroup.id])
            return
        }
        defaults.set(json, forKey: AppGroup.key)
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve(["ok": true, "group": AppGroup.id])
    }
}
