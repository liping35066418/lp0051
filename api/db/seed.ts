import { getDb } from './init.js'

const imgUrl = (prompt: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`

export function seedDatabase(): void {
  const db = getDb()

  const count = (db.prepare('SELECT COUNT(*) as c FROM photographers').get() as any).c
  if (count > 0) return

  const insertPhotographer = db.prepare(`
    INSERT INTO photographers (name, avatar, bio, specialties, is_active)
    VALUES (@name, @avatar, @bio, @specialties, @is_active)
  `)

  const photographers = [
    {
      name: '陈默',
      avatar: imgUrl('professional photographer portrait, male, studio lighting, business headshot'),
      bio: '从业12年，擅长人像摄影与商业摄影，曾为多家知名杂志拍摄封面。作品风格细腻自然，注重光影与情感的融合。',
      specialties: '人像摄影,商业摄影',
      is_active: 1,
    },
    {
      name: '林晓薇',
      avatar: imgUrl('professional female photographer portrait, creative style, soft lighting'),
      bio: '独立摄影师，专注户外风光与旅拍8年。足迹遍布西藏、新疆、云南等地，用镜头记录自然最动人的瞬间。',
      specialties: '户外摄影,旅拍',
      is_active: 1,
    },
    {
      name: '张远航',
      avatar: imgUrl('professional photographer male portrait, commercial style, dramatic lighting'),
      bio: '商业摄影师，服务超过200家企业客户。擅长产品拍摄、商业广告及企业宣传片制作，追求极致的画面品质。',
      specialties: '商业摄影,产品拍摄',
      is_active: 1,
    },
    {
      name: '苏婉清',
      avatar: imgUrl('professional female photographer portrait, elegant style, warm lighting'),
      bio: '人像摄影师，5年经验。擅长婚纱写真、个人形象照拍摄，善于捕捉人物最真实自然的一面，作品充满温度。',
      specialties: '人像摄影,婚纱写真',
      is_active: 1,
    },
  ]

  const photographerIds: number[] = []
  const insertAllPhotographers = db.transaction(() => {
    for (const p of photographers) {
      const result = insertPhotographer.run(p)
      photographerIds.push(result.lastInsertRowid as number)
    }
  })
  insertAllPhotographers()

  const insertPackage = db.prepare(`
    INSERT INTO packages (name, category, cover_image, description, content, price, duration_minutes, includes, notes, is_active, sort_order)
    VALUES (@name, @category, @cover_image, @description, @content, @price, @duration_minutes, @includes, @notes, @is_active, @sort_order)
  `)

  const packages = [
    {
      name: '精致证件照',
      category: 'portrait',
      cover_image: imgUrl('professional ID photo studio setup, clean background, portrait photography'),
      description: '专业证件照拍摄，多种规格可选，精修出片',
      content: '包含拍摄30分钟，精选3张精修，提供1寸/2寸/护照等多种规格电子版',
      price: 299,
      duration_minutes: 30,
      includes: '拍摄+精选3张精修+电子版',
      notes: '请提前准备着装建议，淡妆效果更佳',
      is_active: 1,
      sort_order: 1,
    },
    {
      name: '个人形象写真',
      category: 'portrait',
      cover_image: imgUrl('personal portrait photography, studio lighting, artistic style, professional model'),
      description: '个性化写真拍摄，专属造型设计，打造独特形象',
      content: '包含2套造型，拍摄2小时，精选20张精修，赠送精美相册一本',
      price: 1299,
      duration_minutes: 120,
      includes: '2套造型+拍摄2小时+精选20张精修+精美相册',
      notes: '提前3天预约，可自带道具和服装',
      is_active: 1,
      sort_order: 2,
    },
    {
      name: '城市旅拍',
      category: 'outdoor',
      cover_image: imgUrl('outdoor urban photography, city landscape, couple portrait, golden hour lighting'),
      description: '城市地标打卡，专业摄影师跟拍，记录旅途中的美好',
      content: '指定城市3个地标拍摄，拍摄3小时，精选30张精修，提供原片',
      price: 1599,
      duration_minutes: 180,
      includes: '3个地标+拍摄3小时+精选30张精修+原片',
      notes: '可根据天气调整拍摄时间，建议工作日人少时段',
      is_active: 1,
      sort_order: 3,
    },
    {
      name: '自然风光旅拍',
      category: 'outdoor',
      cover_image: imgUrl('nature landscape photography, mountain scenery, golden sunset, outdoor adventure'),
      description: '深入自然腹地，追逐光影变幻，定格壮美风光',
      content: '指定自然景区拍摄半天，精选40张精修，含航拍（视条件），提供原片',
      price: 2599,
      duration_minutes: 240,
      includes: '景区拍摄半天+精选40张精修+航拍+原片',
      notes: '需提前确认景区开放情况，建议携带防晒和防蚊用品',
      is_active: 1,
      sort_order: 4,
    },
    {
      name: '产品宣传照',
      category: 'commercial',
      cover_image: imgUrl('commercial product photography, clean studio setup, professional lighting, premium feel'),
      description: '专业产品拍摄，突出产品卖点，提升品牌形象',
      content: '10款产品拍摄，每款3个角度，含精修30张，提供白底和场景两种风格',
      price: 3999,
      duration_minutes: 300,
      includes: '10款产品+3角度/款+精修30张+白底+场景图',
      notes: '需提供产品样品，建议提前沟通拍摄风格',
      is_active: 1,
      sort_order: 5,
    },
    {
      name: '企业团队照',
      category: 'commercial',
      cover_image: imgUrl('corporate team photography, professional group portrait, office environment, business attire'),
      description: '企业团队形象拍摄，展现团队风采与企业文化',
      content: '包含团队合影+个人形象照（限10人），2套场景，精修15张，提供电子版',
      price: 2999,
      duration_minutes: 180,
      includes: '团队合影+10人个人照+2套场景+精修15张+电子版',
      notes: '建议统一着装，提前安排拍摄场地',
      is_active: 1,
      sort_order: 6,
    },
  ]

  const packageIds: number[] = []
  const insertAllPackages = db.transaction(() => {
    for (const p of packages) {
      const result = insertPackage.run(p)
      packageIds.push(result.lastInsertRowid as number)
    }
  })
  insertAllPackages()

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (photographer_id, date, time_slot, is_available)
    VALUES (@photographer_id, @date, @time_slot, @is_available)
  `)

  const today = new Date()
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

  const insertAllSchedules = db.transaction(() => {
    for (const pid of photographerIds) {
      for (const date of dates) {
        const dayOff = Math.random() < 0.15
        for (const slot of timeSlots) {
          if (dayOff) {
            insertSchedule.run({ photographer_id: pid, date, time_slot: slot, is_available: 0 })
          } else {
            insertSchedule.run({ photographer_id: pid, date, time_slot: slot, is_available: 1 })
          }
        }
      }
    }
  })
  insertAllSchedules()

  const insertGallery = db.prepare(`
    INSERT INTO gallery (title, category, images, photographer_id, package_id, description, is_active, sort_order, views, likes)
    VALUES (@title, @category, @images, @photographer_id, @package_id, @description, @is_active, @sort_order, @views, @likes)
  `)

  const galleryItems = [
    {
      title: '光影人像精选',
      category: 'portrait',
      images: JSON.stringify([
        imgUrl('elegant woman portrait photography, soft natural light, bokeh background'),
        imgUrl('artistic portrait photography, dramatic lighting, black and white style'),
        imgUrl('fashion portrait, studio lighting, minimalist background'),
      ]),
      photographer_id: photographerIds[0],
      package_id: packageIds[1],
      description: '精选人像摄影作品，展现光影之美与人物魅力',
      is_active: 1,
      sort_order: 1,
      views: 256,
      likes: 42,
    },
    {
      title: '城市漫步·街拍集',
      category: 'outdoor',
      images: JSON.stringify([
        imgUrl('urban street photography, city sunset, silhouette, golden hour'),
        imgUrl('city landmark photography, modern architecture, blue hour'),
        imgUrl('outdoor street photography, cafe scene, warm afternoon light'),
      ]),
      photographer_id: photographerIds[1],
      package_id: packageIds[2],
      description: '穿梭于城市的大街小巷，用镜头捕捉都市的温度',
      is_active: 1,
      sort_order: 2,
      views: 189,
      likes: 35,
    },
    {
      title: '商业大片·品牌视觉',
      category: 'commercial',
      images: JSON.stringify([
        imgUrl('commercial product photography, luxury watch, premium lighting'),
        imgUrl('commercial food photography, restaurant dish, professional styling'),
        imgUrl('commercial interior photography, modern office space, wide angle'),
      ]),
      photographer_id: photographerIds[2],
      package_id: packageIds[4],
      description: '商业摄影作品展示，助力品牌视觉升级',
      is_active: 1,
      sort_order: 3,
      views: 134,
      likes: 28,
    },
    {
      title: '温柔时光·写真集',
      category: 'portrait',
      images: JSON.stringify([
        imgUrl('wedding photography, bride portrait, soft romantic lighting'),
        imgUrl('couple portrait photography, outdoor garden, warm sunset'),
        imgUrl('graduation portrait, young woman, cherry blossom, spring'),
      ]),
      photographer_id: photographerIds[3],
      package_id: packageIds[1],
      description: '用心记录每一个温柔瞬间，让美好永驻',
      is_active: 1,
      sort_order: 4,
      views: 312,
      likes: 67,
    },
  ]

  const insertAllGallery = db.transaction(() => {
    for (const g of galleryItems) {
      insertGallery.run(g)
    }
  })
  insertAllGallery()

  console.log('Seed data inserted successfully')
}
