import WidgetKit

struct RoutineEntry: TimelineEntry {
    let date: Date
    let routines: [WidgetRoutine]
    let completed: Int
    let total: Int
}

struct WidgetRoutine: Codable, Identifiable {
    let id: String
    let name: String
    let emoji: String
    let color: String
    let checked: Bool
}

struct WidgetData: Codable {
    let routines: [WidgetRoutine]
    let completed: Int
    let total: Int
    let date: String
}
