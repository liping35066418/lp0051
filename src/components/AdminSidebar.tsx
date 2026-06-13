import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Camera,
  ClipboardList,
  Image,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: '数据概览', exact: true },
  { to: '/admin/packages', icon: Package, label: '套餐管理' },
  { to: '/admin/photographers', icon: Camera, label: '摄影师管理' },
  { to: '/admin/orders', icon: ClipboardList, label: '订单管理' },
  { to: '/admin/gallery', icon: Image, label: '作品管理' },
  { to: '/admin/stats', icon: BarChart3, label: '数据统计' },
]

export default function AdminSidebar() {
  const location = useLocation()

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return location.pathname === item.to
    return location.pathname.startsWith(item.to)
  }

  return (
    <aside className="w-60 min-h-screen bg-brand-dark border-r border-brand-gold/10 flex flex-col">
      <div className="p-6 border-b border-brand-gold/10">
        <Link to="/admin" className="flex items-center gap-2 text-brand-gold">
          <Camera size={22} />
          <span className="font-display text-lg font-semibold">光影工坊</span>
        </Link>
        <p className="text-brand-gray text-xs mt-1">管理后台</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors relative ${
                active
                  ? 'text-brand-gold bg-brand-gold/5'
                  : 'text-brand-ivory/60 hover:text-brand-ivory hover:bg-white/5'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-gold" />
              )}
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-brand-gold/10">
        <Link
          to="/"
          className="text-brand-gray text-xs hover:text-brand-gold transition-colors"
        >
          ← 返回前台
        </Link>
      </div>
    </aside>
  )
}
