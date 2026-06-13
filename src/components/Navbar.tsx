import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Camera, Menu, X } from 'lucide-react'

const links = [
  { to: '/', label: '首页' },
  { to: '/packages', label: '套餐' },
  { to: '/gallery', label: '图集' },
  { to: '/orders', label: '我的订单' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-brand-dark/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-brand-gold">
          <Camera size={24} />
          <span className="font-display text-xl font-semibold tracking-wide">光影工坊</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors relative py-1 ${
                location.pathname === link.to
                  ? 'text-brand-gold'
                  : 'text-brand-ivory/70 hover:text-brand-gold'
              }`}
            >
              {link.label}
              {location.pathname === link.to && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold" />
              )}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden text-brand-ivory"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-brand-dark/95 backdrop-blur-md border-t border-brand-gold/10">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-brand-gold'
                    : 'text-brand-ivory/70 hover:text-brand-gold'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
