import { useState } from 'react'
import { Heart } from 'lucide-react'
import type { GalleryItem } from '@/api'

interface GalleryGridProps {
  items: GalleryItem[]
  onItemClick: (item: GalleryItem) => void
}

export default function GalleryGrid({ items, onItemClick }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const images: string[] = item.images ? JSON.parse(item.images) : []
        const cover = images[0] || '/placeholder.jpg'

        return (
          <GalleryCard
            key={item.id}
            item={item}
            cover={cover}
            onClick={() => onItemClick(item)}
          />
        )
      })}
    </div>
  )
}

function GalleryCard({
  item,
  cover,
  onClick,
}: {
  item: GalleryItem
  cover: string
  onClick: () => void
}) {
  const [liked, setLiked] = useState(false)

  return (
    <div
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer"
    >
      <img
        src={cover}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-brand-ivory font-medium text-sm mb-1">{item.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-brand-gold text-xs">{item.category}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setLiked(!liked)
            }}
            className="flex items-center gap-1 text-xs"
          >
            <Heart
              size={14}
              className={liked ? 'fill-red-500 text-red-500' : 'text-brand-ivory/70'}
            />
            <span className="text-brand-ivory/70">{item.likes + (liked ? 1 : 0)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
