import WidgetKit

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> RoutineEntry {
        RoutineEntry(date: Date(), routines: sampleRoutines, completed: 2, total: 4)
    }

    func getSnapshot(in context: Context, completion: @escaping (RoutineEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RoutineEntry>) -> Void) {
        let entry = loadEntry()
        let midnight = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
        let timeline = Timeline(entries: [entry], policy: .after(midnight))
        completion(timeline)
    }

    private func loadEntry() -> RoutineEntry {
        let defaults = UserDefaults(suiteName: "group.com.routinecheck.app")
        guard let jsonString = defaults?.string(forKey: "widgetData"),
              let data = jsonString.data(using: .utf8),
              let widgetData = try? JSONDecoder().decode(WidgetData.self, from: data)
        else {
            return RoutineEntry(date: Date(), routines: [], completed: 0, total: 0)
        }
        return RoutineEntry(
            date: Date(),
            routines: widgetData.routines,
            completed: widgetData.completed,
            total: widgetData.total
        )
    }

    private var sampleRoutines: [WidgetRoutine] {
        [
            WidgetRoutine(id: "1", name: "물 마시기", emoji: "💧", color: "#60a5fa", checked: true),
            WidgetRoutine(id: "2", name: "운동", emoji: "💪", color: "#4ade80", checked: true),
            WidgetRoutine(id: "3", name: "독서", emoji: "📚", color: "#f472b6", checked: false),
            WidgetRoutine(id: "4", name: "명상", emoji: "🧘", color: "#a78bfa", checked: false),
        ]
    }
}
