import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, ArrowLeft } from 'lucide-react'
import { packagesApi } from '@/api'
import type { Package } from '@/api'

const categoryMap: Record<string, string> = {
  portrait: '写真',
  outdoor: '外景',
  commercial: '商拍',
}

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    packagesApi
      .get(Number(id))
      .then(setPkg)
      .catch(() => setPkg(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-brand-gray">加载中...</p>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-gray text-lg mb-4">套餐不存在</p>
          <button
            onClick={() => navigate('/packages')}
            className="text-brand-gold hover:underline"
          >
            返回套餐列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-brand-gray hover:text-brand-gold transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">返回</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="rounded-lg overflow-hidden">
            <img
              src={pkg.cover_image || '/placeholder.jpg'}
              alt={pkg.name}
              className="w-full object-cover"
            />
          </div>

          <div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              {categoryMap[pkg.category] || pkg.category}
            </span>
            <h1 className="font-display text-3xl text-brand-ivory mt-3 mb-2">{pkg.name}</h1>
            <div className="flex items-center gap-4 text-brand-gray text-sm mb-6">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{pkg.duration_minutes}分钟</span>
              </div>
            </div>

            <div className="text-brand-gold font-display text-3xl font-semibold mb-6">
              ¥{pkg.price.toLocaleString()}
            </div>

            {pkg.description && (
              <div className="mb-6">
                <h3 className="text-brand-ivory font-medium mb-2">套餐介绍</h3>
                <p className="text-brand-gray text-sm leading-relaxed">{pkg.description}</p>
              </div>
            )}

            {pkg.includes && (
              <div className="mb-6">
                <h3 className="text-brand-ivory font-medium mb-2">包含服务</h3>
                <p className="text-brand-gray text-sm leading-relaxed whitespace-pre-line">
                  {pkg.includes}
                </p>
              </div>
            )}

            {pkg.notes && (
              <div className="mb-8">
                <h3 className="text-brand-ivory font-medium mb-2">拍摄须知</h3>
                <p className="text-brand-gray text-sm leading-relaxed whitespace-pre-line">
                  {pkg.notes}
                </p>
              </div>
            )}

            <button
              onClick={() => navigate(`/booking?package_id=${pkg.id}`)}
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-dark px-8 py-3 rounded-full font-medium hover:bg-brand-gold/90 transition-colors"
            >
              立即预约
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
