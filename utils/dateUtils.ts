const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

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

/** YYYY-MM-DD → "4월 8일 화요일" 형식 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = DAYS[date.getDay()]
  return `${month}월 ${day}일 ${dayOfWeek}요일`
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
