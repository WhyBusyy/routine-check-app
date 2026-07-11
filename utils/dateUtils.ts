/** Date 객체를 로컬 시간 기준 YYYY-MM-DD 형식으로 반환 */
export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 오늘 날짜를 로컬 시간 기준 YYYY-MM-DD 형식으로 반환 */
export function getToday(): string {
  return toDateString(new Date())
}

/** N일 전 날짜를 YYYY-MM-DD 형식으로 반환 (로컬 기준) */
export function getDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toDateString(date)
}

/** YYYY-MM-DD → 로케일에 맞는 "월 일 요일" 표기 */
export function formatDate(dateStr: string, locale: string = 'ko'): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

/** 로케일에 맞는 요일 약칭 배열(일요일 시작, 7개) */
export function getWeekdayLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  // 2023-01-01은 일요일
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(Date.UTC(2023, 0, 1 + i))),
  )
}

/** 스트릭 수에 따른 이모지 */
export function streakEmoji(streak: number): string {
  if (streak >= 100) return '💎'
  if (streak >= 50) return '👑'
  if (streak >= 30) return '🏆'
  if (streak >= 14) return '⭐'
  if (streak >= 7) return '🔥'
  if (streak >= 3) return '✨'
  return '🌱'
}
