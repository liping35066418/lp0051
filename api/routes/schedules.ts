import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { photographer_id, date } = req.query
  if (!photographer_id || !date) {
    res.status(400).json({ success: false, error: 'photographer_id 和 date 为必填参数' })
    return
  }
  const rows = db.prepare(
    'SELECT * FROM schedules WHERE photographer_id = ? AND date = ? ORDER BY time_slot ASC'
  ).all(Number(photographer_id), date as string)
  res.json({ success: true, data: rows })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { photographer_id, date, time_slots, is_available } = req.body
  if (!photographer_id || !date || !time_slots || !Array.isArray(time_slots)) {
    res.status(400).json({ success: false, error: 'photographer_id, date 和 time_slots 为必填项' })
    return
  }

  const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(photographer_id)
  if (!photographer) {
    res.status(404).json({ success: false, error: '摄影师不存在' })
    return
  }

  const upsert = db.prepare(`
    INSERT INTO schedules (photographer_id, date, time_slot, is_available)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(photographer_id, date, time_slot)
    DO UPDATE SET is_available = excluded.is_available
  `)

  const insertAll = db.transaction(() => {
    for (const slot of time_slots) {
      upsert.run(photographer_id, date, slot, is_available ?? 1)
    }
  })
  insertAll()

  const rows = db.prepare(
    'SELECT * FROM schedules WHERE photographer_id = ? AND date = ? ORDER BY time_slot ASC'
  ).all(photographer_id, date)
  res.json({ success: true, data: rows })
})

router.put('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { photographer_id, date, time_slot, is_available } = req.body
  if (!photographer_id || !date || !time_slot) {
    res.status(400).json({ success: false, error: 'photographer_id, date 和 time_slot 为必填项' })
    return
  }

  const existing = db.prepare(
    'SELECT * FROM schedules WHERE photographer_id = ? AND date = ? AND time_slot = ?'
  ).get(photographer_id, date, time_slot)

  if (existing) {
    db.prepare(
      'UPDATE schedules SET is_available = ? WHERE photographer_id = ? AND date = ? AND time_slot = ?'
    ).run(is_available ?? 1, photographer_id, date, time_slot)
  } else {
    db.prepare(
      'INSERT INTO schedules (photographer_id, date, time_slot, is_available) VALUES (?, ?, ?, ?)'
    ).run(photographer_id, date, time_slot, is_available ?? 1)
  }

  const row = db.prepare(
    'SELECT * FROM schedules WHERE photographer_id = ? AND date = ? AND time_slot = ?'
  ).get(photographer_id, date, time_slot)
  res.json({ success: true, data: row })
})

export default router
