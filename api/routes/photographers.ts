import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM photographers ORDER BY id ASC').all()
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM photographers WHERE id = ?').get(Number(req.params.id))
  if (!row) {
    res.status(404).json({ success: false, error: '摄影师不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, avatar, bio, specialties, is_active } = req.body
  if (!name) {
    res.status(400).json({ success: false, error: '名称为必填项' })
    return
  }
  const result = db.prepare(`
    INSERT INTO photographers (name, avatar, bio, specialties, is_active)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, avatar || '', bio || '', specialties || '', is_active ?? 1)
  const row = db.prepare('SELECT * FROM photographers WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: row })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM photographers WHERE id = ?').get(Number(req.params.id))
  if (!existing) {
    res.status(404).json({ success: false, error: '摄影师不存在' })
    return
  }
  const { name, avatar, bio, specialties, is_active } = req.body
  db.prepare(`
    UPDATE photographers SET
      name = ?, avatar = ?, bio = ?, specialties = ?, is_active = ?
    WHERE id = ?
  `).run(
    name ?? (existing as any).name,
    avatar ?? (existing as any).avatar,
    bio ?? (existing as any).bio,
    specialties ?? (existing as any).specialties,
    is_active ?? (existing as any).is_active,
    Number(req.params.id),
  )
  const row = db.prepare('SELECT * FROM photographers WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM photographers WHERE id = ?').get(Number(req.params.id))
  if (!existing) {
    res.status(404).json({ success: false, error: '摄影师不存在' })
    return
  }
  db.prepare('DELETE FROM photographers WHERE id = ?').run(Number(req.params.id))
  res.json({ success: true, data: null })
})

export default router
