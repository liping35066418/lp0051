import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { packagesApi, uploadRequest } from '@/api'
import type { Package } from '@/api'

const categories = [
  { value: 'portrait', label: '写真' },
  { value: 'outdoor', label: '外景' },
  { value: 'commercial', label: '商拍' },
]

const emptyForm = {
  name: '',
  category: 'portrait' as Package['category'],
  cover_image: '',
  description: '',
  content: '',
  price: 0,
  duration_minutes: 60,
  includes: '',
  notes: '',
  is_active: true,
  sort_order: 0,
}

export default function PackageManage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Package | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    packagesApi.list().then(setPackages).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (pkg: Package) => {
    setEditing(pkg)
    setForm({
      name: pkg.name,
      category: pkg.category,
      cover_image: pkg.cover_image,
      description: pkg.description,
      content: pkg.content,
      price: pkg.price,
      duration_minutes: pkg.duration_minutes,
      includes: pkg.includes,
      notes: pkg.notes,
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      if (editing) {
        await packagesApi.update(editing.id, form)
      } else {
        await packagesApi.create(form)
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      alert(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此套餐？')) return
    await packagesApi.delete(id)
    load()
  }

  const handleToggle = async (pkg: Package) => {
    await packagesApi.toggle(pkg.id)
    load()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await uploadRequest<{ url: string }>('/api/upload', fd)
      setForm((f) => ({ ...f, cover_image: res.url }))
    } catch {}
  }

  const categoryMap: Record<string, string> = { portrait: '写真', outdoor: '外景', commercial: '商拍' }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brand-ivory">套餐管理</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1 bg-brand-gold text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-gold/90 transition-colors"
        >
          <Plus size={16} />
          新增套餐
        </button>
      </div>

      <div className="rounded-lg border border-brand-gold/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-dark/80">
            <tr className="border-b border-brand-gold/10">
              <th className="text-left text-brand-gray font-medium p-4">名称</th>
              <th className="text-left text-brand-gray font-medium p-4">分类</th>
              <th className="text-left text-brand-gray font-medium p-4">价格</th>
              <th className="text-left text-brand-gray font-medium p-4">时长</th>
              <th className="text-left text-brand-gray font-medium p-4">状态</th>
              <th className="text-left text-brand-gray font-medium p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg.id} className="border-b border-brand-gold/5 hover:bg-brand-gold/5 transition-colors">
                <td className="p-4 text-brand-ivory">{pkg.name}</td>
                <td className="p-4 text-brand-gray">{categoryMap[pkg.category]}</td>
                <td className="p-4 text-brand-gold">¥{pkg.price.toLocaleString()}</td>
                <td className="p-4 text-brand-gray">{pkg.duration_minutes}分钟</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {pkg.is_active ? '上架' : '下架'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(pkg)} className="text-brand-gray hover:text-brand-gold transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => handleToggle(pkg)} className="text-brand-gray hover:text-brand-gold transition-colors">
                      {pkg.is_active ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="text-brand-gray hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-brand-gray">暂无套餐</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-brand-gold/20 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-brand-ivory">{editing ? '编辑套餐' : '新增套餐'}</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-gray hover:text-brand-ivory"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">名称</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">分类</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Package['category'] }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold">
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-brand-ivory text-sm mb-1 block">价格</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold" />
                </div>
                <div>
                  <label className="text-brand-ivory text-sm mb-1 block">时长(分钟)</label>
                  <input type="number" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold" />
                </div>
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">封面图</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-brand-gray text-sm" />
                {form.cover_image && <img src={form.cover_image} alt="cover" className="mt-2 w-32 h-20 object-cover rounded" />}
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">简介</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold resize-none" />
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">包含服务</label>
                <textarea value={form.includes} onChange={(e) => setForm((f) => ({ ...f, includes: e.target.value }))} rows={2} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold resize-none" />
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">拍摄须知</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-brand-gray hover:text-brand-ivory transition-colors">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-brand-gold text-brand-dark rounded-lg font-medium hover:bg-brand-gold/90 transition-colors disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
