import Foundation
import WidgetKit

@objc(WidgetKitBridge)
class WidgetKitBridge: NSObject {

  @objc
  func saveData(_ jsonString: String) {
    let defaults = UserDefaults(suiteName: "group.com.routinecheck.app")
    defaults?.set(jsonString, forKey: "widgetData")
    defaults?.synchronize()

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc
  func reloadAllTimelines() {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
