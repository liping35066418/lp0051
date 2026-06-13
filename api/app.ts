import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { getDb } from './db/init.js'
import { seedDatabase } from './db/seed.js'
import packageRoutes from './routes/packages.js'
import photographerRoutes from './routes/photographers.js'
import scheduleRoutes from './routes/schedules.js'
import bookingRoutes from './routes/bookings.js'
import orderRoutes from './routes/orders.js'
import galleryRoutes from './routes/gallery.js'
import statsRoutes from './routes/stats.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const uploadsDir = path.resolve(__dirname, '../uploads')
app.use('/uploads', express.static(uploadsDir))

app.use((req: Request, _res: Response, next: NextFunction) => {
  const db = getDb()
  const page = req.path
  const ip = req.ip || req.socket.remoteAddress || ''
  db.prepare('INSERT INTO visit_logs (page, ip) VALUES (?, ?)').run(page, ip)
  next()
})

app.use('/api/packages', packageRoutes)
app.use('/api/photographers', photographerRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/gallery', galleryRoutes)
app.use('/api/stats', statsRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

getDb()
seedDatabase()

export default app
