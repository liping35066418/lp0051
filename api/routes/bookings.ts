import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

const router = Router()

function checkConflict(db: any, photographer_id: number, booking_date: string, time_slot: string, excludeBookingId?: number): boolean {
  let bookingQuery = 'SELECT id FROM bookings WHERE photographer_id = ? AND booking_date = ? AND time_slot = ? AND status != \'conflict\''
  const bookingParams: any[] = [photographer_id, booking_date, time_slot]
  if (excludeBookingId) {
    bookingQuery += ' AND id != ?'
    bookingParams.push(excludeBookingId)
  }
  const bookingConflict = db.prepare(bookingQuery).get(...bookingParams)
  if (bookingConflict) return true

  let orderQuery = "SELECT id FROM orders WHERE photographer_id = ? AND booking_date = ? AND time_slot = ? AND status NOT IN ('cancelled','reschedule_requested')"
  const orderParams: any[] = [photographer_id, booking_date, time_slot]
  const orderConflict = db.prepare(orderQuery).get(...orderParams)
  if (orderConflict) return true

  return false
}

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, notes } = req.body

  if (!package_id || !photographer_id || !customer_name || !customer_phone || !booking_date || !time_slot) {
    res.status(400).json({ success: false, error: '所有必填项不能为空' })
    return
  }

  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(package_id)
  if (!pkg) {
    res.status(404).json({ success: false, error: '套餐不存在' })
    return
  }

  const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(photographer_id)
  if (!photographer) {
    res.status(404).json({ success: false, error: '摄影师不存在' })
    return
  }

  if (checkConflict(db, photographer_id, booking_date, time_slot)) {
    res.status(409).json({ success: false, error: '该时段已被预约，请选择其他时间' })
    return
  }

  const result = db.prepare(`
    INSERT INTO bookings (package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `).run(package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, notes || '')

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid)

  const pkgRow = db.prepare('SELECT price FROM packages WHERE id = ?').get(package_id) as any
  const orderResult = db.prepare(`
    INSERT INTO orders (booking_id, package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, status, total_price, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_confirm', ?, ?)
  `).run(result.lastInsertRowid, package_id, photographer_id, customer_name, customer_phone, booking_date, time_slot, pkgRow?.price || 0, notes || '')

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderResult.lastInsertRowid)

  res.json({ success: true, data: { booking, order } })
})

router.get('/availability', (req: Request, res: Response): void => {
  const db = getDb()
  const { photographer_id, date } = req.query
  if (!photographer_id || !date) {
    res.status(400).json({ success: false, error: 'photographer_id 和 date 为必填参数' })
    return
  }

  const schedules = db.prepare(
    'SELECT * FROM schedules WHERE photographer_id = ? AND date = ? ORDER BY time_slot ASC'
  ).all(Number(photographer_id), date as string)

  const bookedSlots = db.prepare(
    "SELECT time_slot FROM bookings WHERE photographer_id = ? AND booking_date = ? AND status != 'conflict'"
  ).all(Number(photographer_id), date as string).map((r: any) => r.time_slot)

  const orderedSlots = db.prepare(
    "SELECT time_slot FROM orders WHERE photographer_id = ? AND booking_date = ? AND status NOT IN ('cancelled','reschedule_requested')"
  ).all(Number(photographer_id), date as string).map((r: any) => r.time_slot)

  const unavailable = new Set([...bookedSlots, ...orderedSlots])

  const availability = schedules.map((s: any) => ({
    ...s,
    available: s.is_available && !unavailable.has(s.time_slot),
  }))

  res.json({ success: true, data: availability })
})

export default router
