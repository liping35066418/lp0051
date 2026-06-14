import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { HOUR_SLOTS, computeSlotsNeeded, computeConsecutiveSlots } from '../lib/slots.js'

const router = Router()

function checkConflictMultiSlot(
  db: any,
  photographer_id: number,
  booking_date: string,
  startSlot: string,
  slotsNeeded: number,
  excludeBookingId?: number,
  excludeOrderId?: number,
): { conflict: boolean; message?: string } {
  const slots = computeConsecutiveSlots(startSlot, slotsNeeded)
  if (!slots) {
    return { conflict: true, message: '所需连续时段无法满足（可能跨越休息时间或超出营业时段）' }
  }

  for (const slot of slots) {
    let bookingQuery = "SELECT id FROM bookings WHERE photographer_id = ? AND booking_date = ? AND time_slot = ? AND status != 'conflict'"
    const bookingParams: any[] = [photographer_id, booking_date, slot]
    if (excludeBookingId) {
      bookingQuery += ' AND id != ?'
      bookingParams.push(excludeBookingId)
    }
    const bookingConflict = db.prepare(bookingQuery).get(...bookingParams)
    if (bookingConflict) {
      return { conflict: true, message: `时段 ${slot} 已被预约，请选择其他时间` }
    }

    let orderQuery = "SELECT id FROM orders WHERE photographer_id = ? AND booking_date = ? AND time_slot = ? AND status NOT IN ('cancelled','reschedule_requested')"
    const orderParams: any[] = [photographer_id, booking_date, slot]
    if (excludeOrderId) {
      orderQuery += ' AND id != ?'
      orderParams.push(excludeOrderId)
    }
    const orderConflict = db.prepare(orderQuery).get(...orderParams)
    if (orderConflict) {
      return { conflict: true, message: `时段 ${slot} 已被预约，请选择其他时间` }
    }
  }

  return { conflict: false }
}

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, notes } = req.body

  if (!package_id || !photographer_id || !customer_name || !customer_phone || !booking_date || !time_slot) {
    res.status(400).json({ success: false, error: '所有必填项不能为空' })
    return
  }

  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(package_id) as any
  if (!pkg) {
    res.status(404).json({ success: false, error: '套餐不存在' })
    return
  }

  const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(photographer_id)
  if (!photographer) {
    res.status(404).json({ success: false, error: '摄影师不存在' })
    return
  }

  const slotsNeeded = computeSlotsNeeded(pkg.duration_minutes)
  const slots = computeConsecutiveSlots(time_slot, slotsNeeded)
  if (!slots) {
    res.status(400).json({ success: false, error: '该起始时段无法安排连续的拍摄档期（可能跨越休息时间或超出营业时段）' })
    return
  }

  const conflict = checkConflictMultiSlot(db, photographer_id, booking_date, time_slot, slotsNeeded)
  if (conflict.conflict) {
    res.status(409).json({ success: false, error: conflict.message || '该时段已被预约，请选择其他时间' })
    return
  }

  const scheduleSlots = db.prepare(
    'SELECT time_slot FROM schedules WHERE photographer_id = ? AND date = ? AND is_available = 1'
  ).all(photographer_id, booking_date).map((r: any) => r.time_slot)
  for (const slot of slots) {
    if (!scheduleSlots.includes(slot)) {
      res.status(409).json({ success: false, error: `时段 ${slot} 不可预约` })
      return
    }
  }

  const result = db.prepare(`
    INSERT INTO bookings (package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, slots_needed, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `).run(package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, slotsNeeded, notes || '')

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid)

  const pkgRow = db.prepare('SELECT price FROM packages WHERE id = ?').get(package_id) as any
  const orderResult = db.prepare(`
    INSERT INTO orders (booking_id, package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, slots_needed, status, total_price, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_confirm', ?, ?)
  `).run(result.lastInsertRowid, package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, slotsNeeded, pkgRow?.price || 0, notes || '')

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderResult.lastInsertRowid)

  res.json({ success: true, data: { booking, order } })
})

router.get('/availability', (req: Request, res: Response): void => {
  const db = getDb()
  const { photographer_id, date, package_id } = req.query
  if (!photographer_id || !date) {
    res.status(400).json({ success: false, error: 'photographer_id 和 date 为必填参数' })
    return
  }

  let slotsNeeded = 1
  if (package_id) {
    const pkg = db.prepare('SELECT duration_minutes FROM packages WHERE id = ?').get(Number(package_id)) as any
    if (pkg) {
      slotsNeeded = computeSlotsNeeded(pkg.duration_minutes)
    }
  }

  const schedules = db.prepare(
    'SELECT * FROM schedules WHERE photographer_id = ? AND date = ? ORDER BY time_slot ASC'
  ).all(Number(photographer_id), date as string)

  const bookedSlots = db.prepare(
    "SELECT time_slot, slots_needed FROM bookings WHERE photographer_id = ? AND booking_date = ? AND status != 'conflict'"
  ).all(Number(photographer_id), date as string)

  const orderedSlots = db.prepare(
    "SELECT time_slot, slots_needed FROM orders WHERE photographer_id = ? AND booking_date = ? AND status NOT IN ('cancelled','reschedule_requested')"
  ).all(Number(photographer_id), date as string)

  const unavailableSet = new Set<string>()
  for (const b of bookedSlots as any[]) {
    const slots = computeConsecutiveSlots(b.time_slot, b.slots_needed || 1)
    if (slots) slots.forEach(s => unavailableSet.add(s))
  }
  for (const o of orderedSlots as any[]) {
    const slots = computeConsecutiveSlots(o.time_slot, o.slots_needed || 1)
    if (slots) slots.forEach(s => unavailableSet.add(s))
  }

  const scheduleSlotSet = new Set(schedules.map((s: any) => s.time_slot))

  const availability = schedules.map((s: any) => ({
    ...s,
    available: s.is_available && !unavailableSet.has(s.time_slot),
  }))

  const validStartTimes: Record<string, { valid: boolean; occupiedSlots: string[]; reason?: string }> = {}

  for (const slot of HOUR_SLOTS) {
    if (!scheduleSlotSet.has(slot)) {
      validStartTimes[slot] = { valid: false, occupiedSlots: [], reason: '该时段未开放' }
      continue
    }

    const scheduleItem = schedules.find((s: any) => s.time_slot === slot) as any
    if (!scheduleItem || !scheduleItem.is_available) {
      validStartTimes[slot] = { valid: false, occupiedSlots: [], reason: '该时段已关闭' }
      continue
    }

    const consecutiveSlots = computeConsecutiveSlots(slot, slotsNeeded)
    if (!consecutiveSlots) {
      validStartTimes[slot] = { valid: false, occupiedSlots: [], reason: '连续时段不足（跨越休息时间或超出营业时段）' }
      continue
    }

    let blocked = false
    let reason = ''
    for (const cs of consecutiveSlots) {
      if (!scheduleSlotSet.has(cs)) {
        blocked = true
        reason = `时段 ${cs} 未开放`
        break
      }
      const csSchedule = schedules.find((s: any) => s.time_slot === cs) as any
      if (!csSchedule || !csSchedule.is_available) {
        blocked = true
        reason = `时段 ${cs} 已关闭`
        break
      }
      if (unavailableSet.has(cs)) {
        blocked = true
        reason = `时段 ${cs} 已被预约`
        break
      }
    }

    if (blocked) {
      validStartTimes[slot] = { valid: false, occupiedSlots: consecutiveSlots, reason }
    } else {
      validStartTimes[slot] = { valid: true, occupiedSlots: consecutiveSlots }
    }
  }

  res.json({
    success: true,
    data: {
      slots: availability,
      validStartTimes,
      slotsNeeded,
    },
  })
})

export { checkConflictMultiSlot, computeSlotsNeeded, computeConsecutiveSlots }
export default router
