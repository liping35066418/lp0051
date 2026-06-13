import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

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

export default router
