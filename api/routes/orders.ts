import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, phone } = req.query
  let sql = 'SELECT * FROM orders WHERE 1=1'
  const params: any[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (phone) {
    sql += ' AND customer_phone = ?'
    params.push(phone)
  }
  sql += ' ORDER BY created_at DESC'

  const rows = db.prepare(sql).all(...params)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  if (!row) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const db = getDb()
  const { status } = req.body
  const validStatuses = ['pending_confirm', 'shooting', 'delivered', 'completed', 'reschedule_requested', 'cancel_requested', 'cancelled']
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: '无效的状态' })
    return
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  if (!existing) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(status, Number(req.params.id))
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

router.post('/:id/reschedule', (req: Request, res: Response): void => {
  const db = getDb()
  const { booking_date, time_slot } = req.body
  if (!booking_date || !time_slot) {
    res.status(400).json({ success: false, error: 'booking_date 和 time_slot 为必填项' })
    return
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id)) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  if (existing.status === 'cancelled') {
    res.status(400).json({ success: false, error: '已取消的订单无法改期' })
    return
  }

  const bookingConflict = db.prepare(
    "SELECT id FROM bookings WHERE photographer_id = ? AND booking_date = ? AND time_slot = ? AND status != 'conflict'"
  ).get(existing.photographer_id, booking_date, time_slot)
  if (bookingConflict) {
    res.status(409).json({ success: false, error: '该时段已被预约，请选择其他时间' })
    return
  }

  const orderConflict = db.prepare(
    "SELECT id FROM orders WHERE photographer_id = ? AND booking_date = ? AND time_slot = ? AND id != ? AND status NOT IN ('cancelled','reschedule_requested')"
  ).get(existing.photographer_id, booking_date, time_slot, Number(req.params.id))
  if (orderConflict) {
    res.status(409).json({ success: false, error: '该时段已被预约，请选择其他时间' })
    return
  }

  db.prepare(`
    UPDATE orders SET booking_date = ?, time_slot = ?, status = 'pending_confirm', updated_at = datetime('now','localtime') WHERE id = ?
  `).run(booking_date, time_slot, Number(req.params.id))

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

router.post('/:id/cancel', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id)) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  if (existing.status === 'cancelled') {
    res.status(400).json({ success: false, error: '订单已取消' })
    return
  }

  db.prepare("UPDATE orders SET status = 'cancelled', updated_at = datetime('now','localtime') WHERE id = ?").run(Number(req.params.id))
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

router.post('/:id/review', (req: Request, res: Response): void => {
  const db = getDb()
  const { rating, review } = req.body
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ success: false, error: '评分需在1-5之间' })
    return
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id)) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  if (existing.status !== 'delivered' && existing.status !== 'completed') {
    res.status(400).json({ success: false, error: '只有已交付的订单才能评价' })
    return
  }

  db.prepare(`
    UPDATE orders SET rating = ?, review = ?, status = 'completed', updated_at = datetime('now','localtime') WHERE id = ?
  `).run(rating, review || null, Number(req.params.id))

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

router.post('/:id/deliver', (req: Request, res: Response): void => {
  const db = getDb()
  const { delivered_images } = req.body
  if (!delivered_images) {
    res.status(400).json({ success: false, error: '交付图片不能为空' })
    return
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id)) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  const imagesValue = typeof delivered_images === 'string' ? delivered_images : JSON.stringify(delivered_images)

  db.prepare(`
    UPDATE orders SET delivered_images = ?, status = 'delivered', updated_at = datetime('now','localtime') WHERE id = ?
  `).run(imagesValue, Number(req.params.id))

  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

export default router
