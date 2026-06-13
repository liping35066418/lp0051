import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { galleryApi } from '@/api'
import type { GalleryItem } from '@/api'
import { useGalleryStore } from '@/store'
import GalleryGrid from '@/components/GalleryGrid'
import GalleryDetail from './GalleryDetail'

const categories = [
  { key: '', label: '全部' },
  { key: 'portrait', label: '写真' },
  { key: 'outdoor', label: '外景' },
  { key: 'commercial', label: '商拍' },
]

export default function Gallery() {
  const [searchParams] = useSearchParams()
  const { categoryFilter, setCategoryFilter, setItems } = useGalleryStore()
  const [items, setLocalItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      galleryApi.get(Number(id)).then(setSelectedItem).catch(() => {})
    }
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    galleryApi
      .list(categoryFilter || undefined)
      .then((data) => {
        const active = data.filter((g) => g.is_active)
        setLocalItems(active)
        setItems(active)
      })
      .catch(() => setLocalItems([]))
      .finally(() => setLoading(false))
  }, [categoryFilter])

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl text-brand-ivory mb-3">作品图集</h1>
          <p className="text-brand-gray">用镜头记录每一刻的美好</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat.key
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
        ) : items.length > 0 ? (
          <GalleryGrid items={items} onItemClick={setSelectedItem} />
        ) : (
          <div className="text-center py-20">
            <p className="text-brand-gray text-lg">暂无作品</p>
          </div>
        )}
      </div>

      {selectedItem && (
        <GalleryDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  )
}
