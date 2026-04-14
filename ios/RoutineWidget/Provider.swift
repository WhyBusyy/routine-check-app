import WidgetKit

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> RoutineEntry {
        RoutineEntry(date: Date(), routines: sampleRoutines, completed: 2, total: 4)
    }

    func getSnapshot(in context: Context, completion: @escaping (RoutineEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RoutineEntry>) -> Void) {
        let now = Date()
        let entry = loadEntry()

        // 자정에 타임라인 갱신 (새 날짜로 초기화)
        let midnight = Calendar.current.startOfDay(for: now).addingTimeInterval(86400)

        // 자정 직후 엔트리 추가: 모든 루틴을 미체크로 리셋
        let midnightEntry = RoutineEntry(
            date: midnight,
            routines: entry.routines.map { r in
                WidgetRoutine(id: r.id, name: r.name, emoji: r.emoji, color: r.color, checked: false)
            },
            completed: 0,
            total: entry.total
        )

        let timeline = Timeline(entries: [entry, midnightEntry], policy: .after(midnight))
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

        // 저장된 날짜가 오늘이 아니면 전부 미체크로 표시
        let todayStr = Self.todayString()
        if widgetData.date != todayStr {
            let resetRoutines = widgetData.routines.map { r in
                WidgetRoutine(id: r.id, name: r.name, emoji: r.emoji, color: r.color, checked: false)
            }
            return RoutineEntry(
                date: Date(),
                routines: resetRoutines,
                completed: 0,
                total: widgetData.routines.count
            )
        }

        return RoutineEntry(
            date: Date(),
            routines: widgetData.routines,
            completed: widgetData.completed,
            total: widgetData.total
        )
    }

    /// 로컬 시간 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    private static func todayString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone.current
        return formatter.string(from: Date())
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
