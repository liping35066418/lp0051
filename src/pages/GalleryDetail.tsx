import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { galleryApi, photographersApi } from '@/api'
import type { GalleryItem, Photographer } from '@/api'
import { useEffect } from 'react'

export default function GalleryDetail({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [currentImg, setCurrentImg] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(item.likes)

  const images: string[] = item.images ? JSON.parse(item.images) : []

  useEffect(() => {
    setCurrentImg(0)
    setLiked(false)
    setLikes(item.likes)
    setPhotographer(null)
    if (item.photographer_id) {
      photographersApi.get(item.photographer_id).then(setPhotographer).catch(() => {})
    }
  }, [item.id])

  const handleLike = async () => {
    try {
      await galleryApi.like(item.id)
      setLiked(true)
      setLikes((l) => l + 1)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-brand-dark border border-brand-gold/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-brand-gold/10">
          <h2 className="font-display text-xl text-brand-ivory">{item.title}</h2>
          <button onClick={onClose} className="text-brand-gray hover:text-brand-ivory transition-colors">
            <X size={20} />
          </button>
        </div>

        {images.length > 0 && (
          <div className="relative">
            <img
              src={images[currentImg]}
              alt={item.title}
              className="w-full max-h-[60vh] object-contain bg-black/50"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImg((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-brand-dark/60 hover:bg-brand-dark/80 text-brand-ivory rounded-full p-2 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentImg((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-dark/60 hover:bg-brand-dark/80 text-brand-ivory rounded-full p-2 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`w-2 h-2 rounded-full ${i === currentImg ? 'bg-brand-gold' : 'bg-brand-ivory/30'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                {item.category}
              </span>
              {photographer && (
                <span className="text-brand-gray text-xs">摄影师：{photographer.name}</span>
              )}
            </div>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 text-sm"
            >
              <Heart
                size={16}
                className={liked ? 'fill-red-500 text-red-500' : 'text-brand-gray hover:text-red-400'}
              />
              <span className="text-brand-gray">{likes}</span>
            </button>
          </div>
          {item.description && (
            <p className="text-brand-gray text-sm leading-relaxed">{item.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
