import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Sparkles, Camera, Award } from 'lucide-react'
import { packagesApi, galleryApi, photographersApi } from '@/api'
import type { Package, GalleryItem, Photographer } from '@/api'
import PackageCard from '@/components/PackageCard'
import GalleryGrid from '@/components/GalleryGrid'

export default function Home() {
  const navigate = useNavigate()
  const [packages, setPackages] = useState<Package[]>([])
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [photographers, setPhotographers] = useState<Photographer[]>([])

  useEffect(() => {
    packagesApi.list().then(setPackages).catch(() => {})
    galleryApi.list().then(setGalleryItems).catch(() => {})
    photographersApi.list().then(setPhotographers).catch(() => {})
  }, [])

  const featuredPackages = packages.filter((p) => p.is_active).slice(0, 3)
  const latestGallery = galleryItems.filter((g) => g.is_active).slice(0, 8)

  return (
    <div>
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20photography%20studio%20dark%20moody%20elegant%20dramatic%20lighting%20vintage%20camera%20equipment&image_size=landscape_16_9')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/60 via-brand-dark/70 to-brand-dark" />
        <div className="relative z-10 text-center px-6">
          <h1 className="font-display text-5xl md:text-7xl text-brand-ivory mb-4 tracking-wider">
            光影工坊
          </h1>
          <p className="text-brand-ivory/70 text-lg md:text-xl mb-8 tracking-widest">
            捕捉光影，定格永恒
          </p>
          <button
            onClick={() => navigate('/packages')}
            className="inline-flex items-center gap-2 bg-brand-gold text-brand-dark px-8 py-3 rounded-full font-medium hover:bg-brand-gold/90 transition-colors"
          >
            浏览套餐
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-brand-ivory mb-3">精选套餐</h2>
            <p className="text-brand-gray">为您量身定制的拍摄体验</p>
          </div>
          {featuredPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          ) : (
            <p className="text-center text-brand-gray">暂无套餐</p>
          )}
        </div>
      </section>

      <section className="py-20 px-6 bg-brand-dark/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-brand-ivory mb-3">最新作品</h2>
            <p className="text-brand-gray">光影之间，灵感无限</p>
          </div>
          {latestGallery.length > 0 ? (
            <GalleryGrid
              items={latestGallery}
              onItemClick={(item) => navigate(`/gallery?id=${item.id}`)}
            />
          ) : (
            <p className="text-center text-brand-gray">暂无作品</p>
          )}
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl text-brand-ivory mb-6">关于光影工坊</h2>
              <p className="text-brand-gray leading-relaxed mb-6">
                光影工坊是一家专注于人像写真、外景拍摄与商业摄影的高端工作室。我们拥有一支经验丰富的摄影师团队，致力于为每一位客户打造独一无二的视觉作品。
              </p>
              <p className="text-brand-gray leading-relaxed">
                从前期沟通到后期精修，我们注重每一个细节，让每一次快门都成为永恒的记忆。
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {[
                { icon: Camera, title: '专业设备', desc: '全套高端摄影器材，确保影像品质' },
                { icon: Sparkles, title: '匠心后期', desc: '精细修图调色，呈现完美效果' },
                { icon: Award, title: '资深团队', desc: '十年以上经验，驾驭多种风格' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 rounded-lg border border-brand-gold/10 hover:border-brand-gold/30 transition-colors"
                >
                  <feature.icon size={24} className="text-brand-gold mt-0.5" />
                  <div>
                    <h3 className="text-brand-ivory font-medium mb-1">{feature.title}</h3>
                    <p className="text-brand-gray text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
