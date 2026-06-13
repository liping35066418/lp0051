import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { category } = req.query
  let rows: any[]
  if (category) {
    rows = db.prepare('SELECT * FROM packages WHERE category = ? ORDER BY sort_order ASC, id ASC').all(category as string)
  } else {
    rows = db.prepare('SELECT * FROM packages ORDER BY sort_order ASC, id ASC').all()
  }
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM packages WHERE id = ?').get(Number(req.params.id))
  if (!row) {
    res.status(404).json({ success: false, error: '套餐不存在' })
    return
  }
  res.json({ success: true, data: row })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, category, cover_image, description, content, price, duration_minutes, includes, notes, is_active, sort_order } = req.body
  if (!name || !category) {
    res.status(400).json({ success: false, error: '名称和分类为必填项' })
    return
  }
  const validCategories = ['portrait', 'outdoor', 'commercial']
  if (!validCategories.includes(category)) {
    res.status(400).json({ success: false, error: '无效的分类' })
    return
  }
  const result = db.prepare(`
    INSERT INTO packages (name, category, cover_image, description, content, price, duration_minutes, includes, notes, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, category, cover_image || '', description || '', content || '', price || 0, duration_minutes || 60, includes || '', notes || '', is_active ?? 1, sort_order || 0)
  const row = db.prepare('SELECT * FROM packages WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: row })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(Number(req.params.id))
  if (!existing) {
    res.status(404).json({ success: false, error: '套餐不存在' })
    return
  }
  const { name, category, cover_image, description, content, price, duration_minutes, includes, notes, is_active, sort_order } = req.body
  if (category) {
    const validCategories = ['portrait', 'outdoor', 'commercial']
    if (!validCategories.includes(category)) {
      res.status(400).json({ success: false, error: '无效的分类' })
      return
    }
  }
  db.prepare(`
    UPDATE packages SET
      name = ?, category = ?, cover_image = ?, description = ?, content = ?,
      price = ?, duration_minutes = ?, includes = ?, notes = ?,
      is_active = ?, sort_order = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    name ?? (existing as any).name,
    category ?? (existing as any).category,
    cover_image ?? (existing as any).cover_image,
    description ?? (existing as any).description,
    content ?? (existing as any).content,
    price ?? (existing as any).price,
    duration_minutes ?? (existing as any).duration_minutes,
    includes ?? (existing as any).includes,
    notes ?? (existing as any).notes,
    is_active ?? (existing as any).is_active,
    sort_order ?? (existing as any).sort_order,
    Number(req.params.id),
  )
  const row = db.prepare('SELECT * FROM packages WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(Number(req.params.id))
  if (!existing) {
    res.status(404).json({ success: false, error: '套餐不存在' })
    return
  }
  db.prepare('DELETE FROM packages WHERE id = ?').run(Number(req.params.id))
  res.json({ success: true, data: null })
})

router.patch('/:id/toggle', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(Number(req.params.id)) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '套餐不存在' })
    return
  }
  const newActive = existing.is_active ? 0 : 1
  db.prepare('UPDATE packages SET is_active = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?').run(newActive, Number(req.params.id))
  const row = db.prepare('SELECT * FROM packages WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

export default router
