import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { photographersApi, schedulesApi, uploadRequest } from '@/api'
import type { Photographer, Schedule } from '@/api'

const emptyForm = { name: '', avatar: '', bio: '', specialties: '' }

export default function PhotographerManage() {
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [editing, setEditing] = useState<Photographer | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [schedulePhId, setSchedulePhId] = useState<number | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [schedules, setSchedules] = useState<Schedule[]>([])

  const load = () => { photographersApi.list().then(setPhotographers).catch(() => {}) }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (p: Photographer) => {
    setEditing(p)
    setForm({ name: p.name, avatar: p.avatar, bio: p.bio, specialties: p.specialties })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      if (editing) { await photographersApi.update(editing.id, form) }
      else { await photographersApi.create(form) }
      setShowModal(false); load()
    } catch (e: any) { alert(e.message || '保存失败') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此摄影师？')) return
    await photographersApi.delete(id); load()
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await uploadRequest<{ url: string }>('/api/upload', fd)
      setForm((f) => ({ ...f, avatar: res.url }))
    } catch {}
  }

  const openSchedule = (ph: Photographer) => {
    setSchedulePhId(ph.id)
    setScheduleDate(new Date().toISOString().split('T')[0])
    setShowSchedule(true)
  }

  useEffect(() => {
    if (schedulePhId && scheduleDate) {
      schedulesApi.list(schedulePhId, scheduleDate).then(setSchedules).catch(() => setSchedules([]))
    }
  }, [schedulePhId, scheduleDate])

  const toggleSlot = async (s: Schedule) => {
    await schedulesApi.update(s.id, { is_available: !s.is_available })
    if (schedulePhId && scheduleDate) {
      schedulesApi.list(schedulePhId, scheduleDate).then(setSchedules).catch(() => {})
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-brand-ivory">摄影师管理</h1>
        <button onClick={openCreate} className="flex items-center gap-1 bg-brand-gold text-brand-dark px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-gold/90 transition-colors">
          <Plus size={16} /> 新增摄影师
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photographers.map((ph) => (
          <div key={ph.id} className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50">
            <div className="flex items-center gap-3 mb-3">
              <img src={ph.avatar || '/placeholder.jpg'} alt={ph.name} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h3 className="text-brand-ivory font-medium">{ph.name}</h3>
                <p className="text-brand-gold text-xs">{ph.specialties}</p>
              </div>
            </div>
            <p className="text-brand-gray text-sm mb-3 line-clamp-2">{ph.bio}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(ph)} className="text-brand-gray hover:text-brand-gold transition-colors"><Pencil size={15} /></button>
              <button onClick={() => openSchedule(ph)} className="text-xs px-2 py-1 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20 transition-colors">档期</button>
              <button onClick={() => handleDelete(ph.id)} className="text-brand-gray hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {photographers.length === 0 && <p className="text-brand-gray col-span-3 text-center py-8">暂无摄影师</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-brand-gold/20 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-brand-ivory">{editing ? '编辑摄影师' : '新增摄影师'}</h2>
              <button onClick={() => setShowModal(false)} className="text-brand-gray hover:text-brand-ivory"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">姓名</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">头像</label>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="w-full text-brand-gray text-sm" />
                {form.avatar && <img src={form.avatar} alt="avatar" className="mt-2 w-16 h-16 rounded-full object-cover" />}
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">擅长</label>
                <input value={form.specialties} onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-brand-ivory text-sm mb-1 block">简介</label>
                <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-brand-gray hover:text-brand-ivory transition-colors">取消</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-brand-gold text-brand-dark rounded-lg font-medium hover:bg-brand-gold/90 transition-colors disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {showSchedule && schedulePhId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-brand-gold/20 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-brand-ivory">档期设置</h2>
              <button onClick={() => setShowSchedule(false)} className="text-brand-gray hover:text-brand-ivory"><X size={20} /></button>
            </div>
            <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-brand-ivory focus:outline-none focus:border-brand-gold mb-4" />
            <div className="space-y-2 max-h-60 overflow-auto">
              {schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 rounded border border-brand-gold/10">
                  <span className="text-brand-ivory text-sm">{s.time_slot}</span>
                  <button
                    onClick={() => toggleSlot(s)}
                    className={`text-xs px-2 py-1 rounded ${s.is_available ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                  >
                    {s.is_available ? '可预约' : '已占'}
                  </button>
                </div>
              ))}
              {schedules.length === 0 && <p className="text-brand-gray text-sm text-center py-4">暂无档期数据</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
