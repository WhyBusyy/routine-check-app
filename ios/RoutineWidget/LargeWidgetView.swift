import SwiftUI

struct LargeWidgetView: View {
    let entry: RoutineEntry

    var percentage: Int {
        entry.total == 0 ? 0 : Int(Double(entry.completed) / Double(entry.total) * 100)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("오늘의 루틴")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                    Text(formattedDate)
                        .font(.system(size: 12))
                        .foregroundColor(Color(hex: "#666666"))
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(Color(hex: "#2a2a2a"), lineWidth: 4)
                        .frame(width: 40, height: 40)
                    Circle()
                        .trim(from: 0, to: CGFloat(entry.total == 0 ? 0 : Double(entry.completed) / Double(entry.total)))
                        .stroke(
                            entry.completed == entry.total && entry.total > 0
                                ? Color(hex: "#fbbf24")
                                : Color(hex: "#4ade80"),
                            style: StrokeStyle(lineWidth: 4, lineCap: .round)
                        )
                        .frame(width: 40, height: 40)
                        .rotationEffect(.degrees(-90))
                    Text("\(percentage)%")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(Color(hex: "#4ade80"))
                }
            }

            // Divider
            Rectangle()
                .fill(Color(hex: "#2a2a2a"))
                .frame(height: 1)

            // Routine list (show all)
            VStack(alignment: .leading, spacing: 8) {
                ForEach(entry.routines) { routine in
                    HStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .fill(routine.checked ? Color(hex: routine.color) : Color.clear)
                                .frame(width: 22, height: 22)
                            Circle()
                                .stroke(routine.checked ? Color.clear : Color(hex: "#3a3a3a"), lineWidth: 1.5)
                                .frame(width: 22, height: 22)
                            if routine.checked {
                                Text("✓")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.black)
                            }
                        }

                        Text(routine.emoji)
                            .font(.system(size: 18))

                        Text(routine.name)
                            .font(.system(size: 15))
                            .foregroundColor(routine.checked ? Color(hex: "#666666") : .white)
                            .strikethrough(routine.checked)
                            .lineLimit(1)

                        Spacer()
                    }
                }
            }

            if entry.routines.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 8) {
                        Text("✨")
                            .font(.system(size: 28))
                        Text("루틴을 추가해보세요")
                            .font(.system(size: 14))
                            .foregroundColor(Color(hex: "#555555"))
                    }
                    Spacer()
                }
                Spacer()
            }

            Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: "#111111"))
    }

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "M월 d일 EEEE"
        return formatter.string(from: Date())
    }
}
