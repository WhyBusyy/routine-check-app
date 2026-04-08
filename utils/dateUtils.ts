const DAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0]
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
