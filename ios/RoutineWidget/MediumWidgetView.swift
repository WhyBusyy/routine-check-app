import SwiftUI

struct MediumWidgetView: View {
    let entry: RoutineEntry

    var percentage: Int {
        entry.total == 0 ? 0 : Int(Double(entry.completed) / Double(entry.total) * 100)
    }

    var body: some View {
        HStack(spacing: 16) {
            // Left: progress ring
            VStack(spacing: 4) {
                ZStack {
                    Circle()
                        .stroke(Color(hex: "#2a2a2a"), lineWidth: 5)
                        .frame(width: 50, height: 50)
                    Circle()
                        .trim(from: 0, to: CGFloat(entry.total == 0 ? 0 : Double(entry.completed) / Double(entry.total)))
                        .stroke(
                            entry.completed == entry.total && entry.total > 0
                                ? Color(hex: "#fbbf24")
                                : Color(hex: "#4ade80"),
                            style: StrokeStyle(lineWidth: 5, lineCap: .round)
                        )
                        .frame(width: 50, height: 50)
                        .rotationEffect(.degrees(-90))

                    Text("\(percentage)%")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(hex: "#4ade80"))
                }
                Text("\(entry.completed)/\(entry.total)")
                    .font(.system(size: 11))
                    .foregroundColor(Color(hex: "#666666"))
            }
            .frame(width: 70)

            // Divider
            Rectangle()
                .fill(Color(hex: "#2a2a2a"))
                .frame(width: 1)
                .padding(.vertical, 8)

            // Right: routine list
            VStack(alignment: .leading, spacing: 6) {
                ForEach(entry.routines.prefix(4)) { routine in
                    HStack(spacing: 6) {
                        Circle()
                            .fill(routine.checked ? Color(hex: routine.color) : Color(hex: "#333333"))
                            .frame(width: 8, height: 8)
                        Text(routine.emoji)
                            .font(.system(size: 12))
                        Text(routine.name)
                            .font(.system(size: 13))
                            .foregroundColor(routine.checked ? Color(hex: "#555555") : .white)
                            .strikethrough(routine.checked)
                            .lineLimit(1)
                    }
                }
                if entry.routines.isEmpty {
                    Text("루틴을 추가해보세요")
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#555555"))
                }
            }
            Spacer()
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#111111"))
    }
}
