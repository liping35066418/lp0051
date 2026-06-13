import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import type { Package } from '@/api'

const categoryMap: Record<string, string> = {
  portrait: '写真',
  outdoor: '外景',
  commercial: '商拍',
}

export default function PackageCard({ pkg }: { pkg: Package }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/packages/${pkg.id}`)}
      className="group bg-brand-dark/80 border border-brand-gold/10 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-gold/5 hover:border-brand-gold/30"
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={pkg.cover_image || '/placeholder.jpg'}
          alt={pkg.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
            {categoryMap[pkg.category] || pkg.category}
          </span>
          <div className="flex items-center gap-1 text-brand-gray text-xs">
            <Clock size={12} />
            <span>{pkg.duration_minutes}分钟</span>
          </div>
        </div>
        <h3 className="text-brand-ivory font-medium text-lg mb-1">{pkg.name}</h3>
        <p className="text-brand-gray text-sm mb-3 line-clamp-2">{pkg.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-brand-gold font-display text-xl font-semibold">
            ¥{pkg.price.toLocaleString()}
          </span>
          <span className="text-xs text-brand-gold/70 group-hover:text-brand-gold transition-colors">
            查看详情 →
          </span>
        </div>
      </div>
    </div>
  )
}
