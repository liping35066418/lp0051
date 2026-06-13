import { useState, useEffect } from 'react'
import { packagesApi } from '@/api'
import type { Package } from '@/api'
import PackageCard from '@/components/PackageCard'

const categories = [
  { key: '', label: '全部' },
  { key: 'portrait', label: '写真' },
  { key: 'outdoor', label: '外景' },
  { key: 'commercial', label: '商拍' },
]

export default function PackageList() {
  const [activeCategory, setActiveCategory] = useState('')
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    packagesApi
      .list(activeCategory || undefined)
      .then((data) => setPackages(data.filter((p) => p.is_active)))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false))
  }, [activeCategory])

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl text-brand-ivory mb-3">拍摄套餐</h1>
          <p className="text-brand-gray">选择适合您的拍摄方案</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-brand-gold text-brand-dark'
                  : 'bg-brand-gold/10 text-brand-ivory/70 hover:text-brand-gold border border-brand-gold/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-brand-gray py-20">加载中...</div>
        ) : packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-brand-gray text-lg">暂无相关套餐</p>
          </div>
        )}
      </div>
    </div>
  )
}
