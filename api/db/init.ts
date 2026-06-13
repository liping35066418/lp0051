import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, '../../data/studio.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initTables(db)

  return db
}

function initTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('portrait','outdoor','commercial')),
      cover_image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      content TEXT DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      includes TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS photographers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      specialties TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photographer_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (photographer_id) REFERENCES photographers(id) ON DELETE CASCADE,
      UNIQUE(photographer_id, date, time_slot)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id INTEGER NOT NULL,
      photographer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','conflict')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (photographer_id) REFERENCES photographers(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      package_id INTEGER NOT NULL,
      photographer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      booking_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_confirm' CHECK(status IN ('pending_confirm','shooting','delivered','completed','reschedule_requested','cancel_requested','cancelled')),
      total_price REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      rating INTEGER DEFAULT NULL,
      review TEXT DEFAULT NULL,
      delivered_images TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (photographer_id) REFERENCES photographers(id)
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'portrait',
      images TEXT NOT NULL DEFAULT '[]',
      photographer_id INTEGER NOT NULL,
      package_id INTEGER DEFAULT NULL,
      description TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (photographer_id) REFERENCES photographers(id),
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS visit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      ip TEXT DEFAULT '',
      visited_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_packages_category ON packages(category);
    CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);
    CREATE INDEX IF NOT EXISTS idx_schedules_photographer_date ON schedules(photographer_id, date);
    CREATE INDEX IF NOT EXISTS idx_bookings_photographer_date_slot ON bookings(photographer_id, booking_date, time_slot);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_orders_photographer_date_slot ON orders(photographer_id, booking_date, time_slot);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
    CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
    CREATE INDEX IF NOT EXISTS idx_gallery_is_active ON gallery(is_active);
    CREATE INDEX IF NOT EXISTS idx_visit_logs_visited_at ON visit_logs(visited_at);
  `)
}
