import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { galleryApi, photographersApi, uploadRequest } from '@/api'
import type { GalleryItem, Photographer } from '@/api'

const categories = [
  { value: 'portrait', label: '写真' },
  { value: 'outdoor', label: '外景' },
  { value: 'commercial', label: '商拍' },
]

const emptyForm = {
  title: '',
  category: 'portrait',
  images: '[]',
  photographer_id: 0,
  package_id: null as number | null,
  description: '',
  is_active: true,
  sort_order: 0,
}

export default function GalleryManage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    galleryApi.list().then(setItems).catch(() => {})
    photographersApi.list().then(setPhotographers).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }

  const openEdit = (item: GalleryItem) => {
    setEditing(item)
    setForm({
      title: item.title,
      category: item.category,
      images: item.images,
      photographer_id: item.photographer_id,
      package_id: item.package_id,
      description: item.description,
      is_active: item.is_active,
      sort_order: item.sort_order,
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const uploaded: string[] = []
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append('file', files[i])
      try {
        const res = await uploadRequest<{ url: string }>('/api/upload', fd)
        uploaded.push(res.url)
      } catch {}
    }
    const existing: string[] = JSON.parse(form.images || '[]')
    setForm((f) => ({ ...f, images: JSON.stringify([...existing, ...uploaded]) }))
  }

  const handleSave = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      if (editing) { await galleryApi.update(editing.id, form) }
      else { await galleryApi.create(form) }
      setShowModal(false); load()
    } catch (e: any) { alert(e.message || '保存失败') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此作品？')) return
    await galleryApi.delete(id); load()
  }

  const handleToggle = async (item: GalleryItem) => {
    await galleryApi.toggle(item.id); load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brand-ivory">作品管理</h1>
        <button onClick={openCreate} className="flex items-center gap-1 bg-brand-gold text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-gold/90 transition-colors">
          <Plus size={16} /> 上传作品
        </button>
      </div>

      <div className="rounded-lg border border-brand-gold/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-dark/80">
              <tr className="border-b border-brand-gold/10">
                <th className="text-left text-brand-gray font-medium p-4">标题</th>
                <th className="text-left text-brand-gray font-medium p-4">分类</th>
                <th className="text-left text-brand-gray font-medium p-4">图片数</th>
                <th className="text-left text-brand-gray font-medium p-4">浏览/点赞</th>
                <th className="text-left text-brand-gray font-medium p-4">状态</th>
                <th className="text-left text-brand-gray font-medium p-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const imgCount = item.images ? JSON.parse(item.images).length : 0
                return (
                  <tr key={item.id} className="border-b border-brand-gold/5 hover:bg-brand-gold/5 transition-colors">
                    <td className="p-4 text-brand-ivory">{item.title}</td>
                    <td className="p-4 text-brand-gray">{item.category}</td>
                    <td className="p-4 text-brand-gray">{imgCount}</td>
                    <td className="p-4 text-brand-gray">{item.views} / {item.likes}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {item.is_active ? '上架' : '下架'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(item)} className="text-brand-gray hover:text-brand-gold transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => handleToggle(item)} className="text-brand-gray hover:text-brand-gold transition-colors">
                          {item.is_active ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-brand-gray hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-brand-gray">暂无作品</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-brand-gold/20 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-brand-ivory">{editing ? '编辑作品' : '上传作品'}</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-gray hover:text-brand-ivory"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">标题</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">分类</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold">
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">摄影师</label>
                <select value={form.photographer_id || ''} onChange={(e) => setForm((f) => ({ ...f, photographer_id: Number(e.target.value) }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold">
                  <option value="">选择摄影师</option>
                  {photographers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">上传图片（可多选）</label>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full text-brand-gray text-sm" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {(JSON.parse(form.images || '[]') as string[]).map((url, i) => (
                    <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded" />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">描述</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-brand-gray hover:text-brand-ivory transition-colors">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-brand-gold text-brand-dark rounded-lg font-medium hover:bg-brand-gold/90 transition-colors disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
