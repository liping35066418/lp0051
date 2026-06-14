import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { computeConsecutiveSlots, HOUR_SLOTS } from '../lib/slots.js'

const router = Router()

router.get('/overview', (_req: Request, res: Response): void => {
  const db = getDb()

  const totalVisits = (db.prepare('SELECT COUNT(*) as c FROM visit_logs').get() as any).c

  const today = new Date().toISOString().slice(0, 10)
  const todayVisits = (db.prepare("SELECT COUNT(*) as c FROM visit_logs WHERE visited_at LIKE ?").get(`${today}%`) as any).c

  const totalOrders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c

  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_price), 0) as s FROM orders WHERE status NOT IN ('cancelled','cancel_requested')").get() as any).s

  const ordersByStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all()

  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').all()

  const monthlyRevenue = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(total_price), 0) as revenue
    FROM orders
    WHERE status NOT IN ('cancelled','cancel_requested')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 12
  `).all()

  res.json({
    success: true,
    data: {
      totalVisits,
      todayVisits,
      totalOrders,
      totalRevenue,
      ordersByStatus,
      recentOrders,
      monthlyRevenue,
    },
  })
})

router.get('/visits', (req: Request, res: Response): void => {
  const db = getDb()
  const { days } = req.query
  const d = days ? Number(days) : 30

  const daily = db.prepare(`
    SELECT DATE(visited_at) as date, COUNT(*) as count
    FROM visit_logs
    WHERE visited_at >= datetime('now', '-' || ? || ' days', 'localtime')
    GROUP BY DATE(visited_at)
    ORDER BY date ASC
  `).all(d)

  const total = (db.prepare('SELECT COUNT(*) as c FROM visit_logs').get() as any).c
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = (db.prepare("SELECT COUNT(*) as c FROM visit_logs WHERE visited_at LIKE ?").get(`${today}%`) as any).c

  res.json({
    success: true,
    data: { daily, total, todayCount },
  })
})

router.get('/revenue', (req: Request, res: Response): void => {
  const db = getDb()
  const { months } = req.query
  const m = months ? Number(months) : 12

  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month,
           COALESCE(SUM(total_price), 0) as revenue,
           COUNT(*) as order_count
    FROM orders
    WHERE status NOT IN ('cancelled','cancel_requested')
      AND created_at >= datetime('now', '-' || ? || ' months', 'localtime')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month ASC
  `).all(m)

  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_price), 0) as s FROM orders WHERE status NOT IN ('cancelled','cancel_requested')").get() as any).s

  res.json({
    success: true,
    data: { monthly, totalRevenue },
  })
})

router.get('/utilization', (req: Request, res: Response): void => {
  const db = getDb()
  const { photographer_id, date } = req.query

  if (!date) {
    res.status(400).json({ success: false, error: 'date 为必填参数' })
    return
  }

  const photographers = photographer_id
    ? db.prepare('SELECT * FROM photographers WHERE id = ?').all(Number(photographer_id))
    : db.prepare('SELECT * FROM photographers').all()

  const result = photographers.map((ph: any) => {
    const scheduleRows = db.prepare(
      'SELECT time_slot, is_available FROM schedules WHERE photographer_id = ? AND date = ?'
    ).all(ph.id, date as string)

    const availableSlots = scheduleRows.filter((s: any) => s.is_available).length

    const bookedRows = db.prepare(
      "SELECT time_slot, slots_needed FROM bookings WHERE photographer_id = ? AND booking_date = ? AND status != 'conflict'"
    ).all(ph.id, date as string)

    const orderedRows = db.prepare(
      "SELECT time_slot, slots_needed FROM orders WHERE photographer_id = ? AND booking_date = ? AND status NOT IN ('cancelled','reschedule_requested')"
    ).all(ph.id, date as string)

    const occupiedSet = new Set<string>()
    for (const b of bookedRows as any[]) {
      const slots = computeConsecutiveSlots(b.time_slot, b.slots_needed || 1)
      if (slots) slots.forEach(s => occupiedSet.add(s))
    }
    for (const o of orderedRows as any[]) {
      const slots = computeConsecutiveSlots(o.time_slot, o.slots_needed || 1)
      if (slots) slots.forEach(s => occupiedSet.add(s))
    }

    const occupiedCount = occupiedSet.size
    const utilizationRate = availableSlots > 0 ? Math.round((occupiedCount / availableSlots) * 100) : 0

    return {
      photographer_id: ph.id,
      photographer_name: ph.name,
      date: date as string,
      available_slots: availableSlots,
      occupied_slots: occupiedCount,
      occupied_details: Array.from(occupiedSet).sort(),
      utilization_rate: utilizationRate,
    }
  })

  res.json({ success: true, data: result })
})

export default router
