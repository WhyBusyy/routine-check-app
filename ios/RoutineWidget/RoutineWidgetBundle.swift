import WidgetKit
import SwiftUI

@main
struct RoutineWidgetBundle: WidgetBundle {
    var body: some Widget {
        RoutineCheckWidget()
    }
}

struct RoutineCheckWidget: Widget {
    let kind = "RoutineCheckWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                WidgetEntryView(entry: entry)
                    .containerBackground(Color(hex: "#111111"), for: .widget)
            } else {
                WidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("루틴 체크")
        .description("오늘의 루틴 진행률을 확인하세요")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct WidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: RoutineEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}
