export const HOUR_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export const BREAK_LABEL = '11:00 - 13:00 休息'

export function addHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function computeSlotsNeeded(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes / 60))
}

export function computeConsecutiveSlots(startSlot: string, count: number): string[] | null {
  const startIdx = HOUR_SLOTS.indexOf(startSlot)
  if (startIdx === -1) return null
  if (count <= 0) return null
  if (startIdx + count > HOUR_SLOTS.length) return null

  const slots = [startSlot]
  for (let i = 1; i < count; i++) {
    const prevEnd = addHour(HOUR_SLOTS[startIdx + i - 1])
    const currStart = HOUR_SLOTS[startIdx + i]
    if (prevEnd !== currStart) return null
    slots.push(currStart)
  }
  return slots
}

export function formatSlotRange(startSlot: string, count: number): string {
  const slots = computeConsecutiveSlots(startSlot, count)
  if (!slots || slots.length === 0) return startSlot
  const end = addHour(slots[slots.length - 1])
  return `${startSlot} - ${end}`
}
