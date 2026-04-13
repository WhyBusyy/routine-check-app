import SwiftUI

struct SmallWidgetView: View {
    let entry: RoutineEntry

    var percentage: Int {
        entry.total == 0 ? 0 : Int(Double(entry.completed) / Double(entry.total) * 100)
    }

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .stroke(Color(hex: "#2a2a2a"), lineWidth: 6)
                    .frame(width: 60, height: 60)
                Circle()
                    .trim(from: 0, to: CGFloat(entry.total == 0 ? 0 : Double(entry.completed) / Double(entry.total)))
                    .stroke(
                        entry.completed == entry.total && entry.total > 0
                            ? Color(hex: "#fbbf24")
                            : Color(hex: "#4ade80"),
                        style: StrokeStyle(lineWidth: 6, lineCap: .round)
                    )
                    .frame(width: 60, height: 60)
                    .rotationEffect(.degrees(-90))

                if entry.completed == entry.total && entry.total > 0 {
                    Text("🎉")
                        .font(.system(size: 20))
                } else {
                    Text("\(percentage)%")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color(hex: "#4ade80"))
                }
            }

            Text("\(entry.completed)/\(entry.total)")
                .font(.system(size: 12))
                .foregroundColor(Color(hex: "#666666"))

            Text("오늘의 루틴")
                .font(.system(size: 10))
                .foregroundColor(Color(hex: "#555555"))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#111111"))
    }
}
