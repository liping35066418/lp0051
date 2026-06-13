import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { category } = req.query
  let rows: any[]
  if (category) {
    rows = db.prepare('SELECT * FROM gallery WHERE category = ? ORDER BY sort_order ASC, id ASC').all(category as string)
  } else {
    rows = db.prepare('SELECT * FROM gallery ORDER BY sort_order ASC, id ASC').all()
  }
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id))
  if (!row) {
    res.status(404).json({ success: false, error: '作品不存在' })
    return
  }
  db.prepare('UPDATE gallery SET views = views + 1 WHERE id = ?').run(Number(req.params.id))
  const updated = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: updated })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { title, category, images, photographer_id, package_id, description, is_active, sort_order } = req.body
  if (!title || !photographer_id) {
    res.status(400).json({ success: false, error: '标题和摄影师为必填项' })
    return
  }

  const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(photographer_id)
  if (!photographer) {
    res.status(404).json({ success: false, error: '摄影师不存在' })
    return
  }

  const imagesValue = typeof images === 'string' ? images : JSON.stringify(images || [])
  const isActiveInt = is_active === undefined ? 1 : (is_active ? 1 : 0)

  const result = db.prepare(`
    INSERT INTO gallery (title, category, images, photographer_id, package_id, description, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, category || 'portrait', imagesValue, photographer_id, package_id || null, description || '', isActiveInt, sort_order || 0)

  const row = db.prepare('SELECT * FROM gallery WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: row })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id))
  if (!existing) {
    res.status(404).json({ success: false, error: '作品不存在' })
    return
  }

  const { title, category, images, photographer_id, package_id, description, is_active, sort_order } = req.body

  if (photographer_id) {
    const photographer = db.prepare('SELECT * FROM photographers WHERE id = ?').get(photographer_id)
    if (!photographer) {
      res.status(404).json({ success: false, error: '摄影师不存在' })
      return
    }
  }

  const imagesValue = images !== undefined
    ? (typeof images === 'string' ? images : JSON.stringify(images))
    : (existing as any).images

  const isActiveInt = is_active === undefined
    ? (existing as any).is_active
    : (is_active ? 1 : 0)

  db.prepare(`
    UPDATE gallery SET
      title = ?, category = ?, images = ?, photographer_id = ?, package_id = ?,
      description = ?, is_active = ?, sort_order = ?
    WHERE id = ?
  `).run(
    title ?? (existing as any).title,
    category ?? (existing as any).category,
    imagesValue,
    photographer_id ?? (existing as any).photographer_id,
    package_id ?? (existing as any).package_id,
    description ?? (existing as any).description,
    isActiveInt,
    sort_order ?? (existing as any).sort_order,
    Number(req.params.id),
  )

  const row = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id))
  if (!existing) {
    res.status(404).json({ success: false, error: '作品不存在' })
    return
  }
  db.prepare('DELETE FROM gallery WHERE id = ?').run(Number(req.params.id))
  res.json({ success: true, data: null })
})

router.patch('/:id/toggle', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id)) as any
  if (!existing) {
    res.status(404).json({ success: false, error: '作品不存在' })
    return
  }
  const newActive = existing.is_active ? 0 : 1
  db.prepare('UPDATE gallery SET is_active = ? WHERE id = ?').run(newActive, Number(req.params.id))
  const row = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

router.post('/:id/like', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id))
  if (!existing) {
    res.status(404).json({ success: false, error: '作品不存在' })
    return
  }
  db.prepare('UPDATE gallery SET likes = likes + 1 WHERE id = ?').run(Number(req.params.id))
  const row = db.prepare('SELECT * FROM gallery WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: row })
})

export default router
