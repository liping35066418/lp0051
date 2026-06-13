import { Link } from 'react-router-dom'
import { Camera, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-brand-dark border-t border-brand-gold/10">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 text-brand-gold mb-4">
              <Camera size={22} />
              <span className="font-display text-lg font-semibold">光影工坊</span>
            </div>
            <p className="text-brand-gray text-sm leading-relaxed">
              专注人像写真、外景拍摄与商业摄影，用光影记录每一个珍贵瞬间。
            </p>
          </div>

          <div>
            <h3 className="text-brand-ivory font-medium mb-4">快速链接</h3>
            <div className="flex flex-col gap-2">
              {[
                { to: '/packages', label: '拍摄套餐' },
                { to: '/gallery', label: '作品图集' },
                { to: '/orders', label: '我的订单' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-brand-gray text-sm hover:text-brand-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-brand-ivory font-medium mb-4">联系我们</h3>
            <div className="flex flex-col gap-3 text-brand-gray text-sm">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-brand-gold" />
                <span>400-888-6666</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-brand-gold" />
                <span>hello@guangying.studio</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-brand-gold" />
                <span>上海市静安区光影路88号</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-brand-gold/10 text-center text-brand-gray text-xs">
          © {new Date().getFullYear()} 光影工坊. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
