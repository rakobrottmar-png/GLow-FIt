import UIKit
import Capacitor

/// Eigener Bridge-Controller, damit das App-eigene Widget-Plugin registriert wird.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
    }
}
