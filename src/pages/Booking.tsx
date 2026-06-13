import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'
import { packagesApi, photographersApi, bookingsApi } from '@/api'
import type { Package, Photographer } from '@/api'
import { useBookingStore } from '@/store'

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]

export default function Booking() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const store = useBookingStore()

  const [pkg, setPkg] = useState<Package | null>(null)
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const pid = searchParams.get('package_id')
    if (pid) {
      store.setPackageId(Number(pid))
      packagesApi.get(Number(pid)).then(setPkg).catch(() => {})
    }
    photographersApi.list().then((data) => setPhotographers(data.filter((p) => p.is_active))).catch(() => {})
  }, [])

  useEffect(() => {
    if (store.photographerId && store.date) {
      bookingsApi.check({ photographer_id: store.photographerId, date: store.date })
        .then((data) => {
          setSchedules(data)
        })
        .catch(() => setSchedules([]))
    }
  }, [store.photographerId, store.date])

  const occupiedSlots = schedules
    .filter((s) => !s.available)
    .map((s) => s.time_slot)

  const today = new Date().toISOString().split('T')[0]

  const handleNext = () => {
    if (store.step === 1 && !store.photographerId) {
      setError('请选择摄影师')
      return
    }
    if (store.step === 2 && (!store.date || !store.timeSlot)) {
      setError('请选择日期和时段')
      return
    }
    setError('')
    store.setStep(store.step + 1)
  }

  const handleSubmit = async () => {
    if (!store.customerName || !store.customerPhone) {
      setError('请填写姓名和手机号')
      return
    }
    if (!/^1\d{10}$/.test(store.customerPhone)) {
      setError('请输入正确的手机号')
      return
    }

    try {
      setSubmitting(true)
      await bookingsApi.create({
        package_id: store.packageId!,
        photographer_id: store.photographerId!,
        customer_name: store.customerName,
        customer_phone: store.customerPhone,
        booking_date: store.date,
        time_slot: store.timeSlot,
        notes: store.notes,
      })
      store.reset()
      navigate('/orders')
    } catch (e: any) {
      setError(e.message || '预约失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPhotographer = photographers.find((p) => p.id === store.photographerId)

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto max-w-3xl">
        <h1 className="font-display text-3xl text-brand-ivory mb-8 text-center">在线预约</h1>

        <div className="flex items-center justify-center gap-4 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  store.step >= s ? 'bg-brand-gold text-brand-dark' : 'bg-brand-gold/10 text-brand-gray'
                }`}
              >
                {store.step > s ? <Check size={14} /> : s}
              </div>
              <span className={`text-sm hidden sm:inline ${store.step >= s ? 'text-brand-gold' : 'text-brand-gray'}`}>
                {s === 1 ? '选择摄影师' : s === 2 ? '选择档期' : '填写信息'}
              </span>
              {s < 3 && <div className={`w-8 h-0.5 ${store.step > s ? 'bg-brand-gold' : 'bg-brand-gray/20'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {store.step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photographers.map((p) => (
              <div
                key={p.id}
                onClick={() => { store.setPhotographerId(p.id); setError('') }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  store.photographerId === p.id
                    ? 'border-brand-gold bg-brand-gold/5'
                    : 'border-brand-gold/10 hover:border-brand-gold/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={p.avatar || '/placeholder.jpg'}
                    alt={p.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-brand-ivory font-medium">{p.name}</h3>
                    <p className="text-brand-gold text-xs">{p.specialties}</p>
                  </div>
                </div>
                <p className="text-brand-gray text-sm line-clamp-2">{p.bio}</p>
              </div>
            ))}
            {photographers.length === 0 && (
              <p className="text-brand-gray col-span-2 text-center py-8">暂无可选摄影师</p>
            )}
          </div>
        )}

        {store.step === 2 && (
          <div className="space-y-6">
            {selectedPhotographer && (
              <p className="text-brand-gray text-sm">
                摄影师：<span className="text-brand-gold">{selectedPhotographer.name}</span>
              </p>
            )}
            <div>
              <label className="text-brand-ivory text-sm font-medium mb-2 block">选择日期</label>
              <input
                type="date"
                min={today}
                value={store.date}
                onChange={(e) => { store.setDate(e.target.value); store.setTimeSlot(''); setError('') }}
                className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2.5 text-brand-ivory focus:outline-none focus:border-brand-gold"
              />
            </div>
            {store.date && (
              <div>
                <label className="text-brand-ivory text-sm font-medium mb-2 block">选择时段</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
                    const occupied = occupiedSlots.includes(slot)
                    return (
                      <button
                        key={slot}
                        disabled={occupied}
                        onClick={() => { store.setTimeSlot(slot); setError('') }}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          occupied
                            ? 'bg-brand-gray/10 text-brand-gray/40 cursor-not-allowed line-through'
                            : store.timeSlot === slot
                              ? 'bg-brand-gold text-brand-dark'
                              : 'bg-brand-gold/10 text-brand-ivory/70 hover:bg-brand-gold/20 border border-brand-gold/20'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {store.step === 3 && (
          <div className="space-y-5">
            <div className="p-4 rounded-lg border border-brand-gold/10 bg-brand-gold/5">
              <div className="text-sm text-brand-gray space-y-1">
                <p>套餐：<span className="text-brand-ivory">{pkg?.name || '未选择'}</span></p>
                <p>摄影师：<span className="text-brand-ivory">{selectedPhotographer?.name || '未选择'}</span></p>
                <p>日期：<span className="text-brand-ivory">{store.date}</span></p>
                <p>时段：<span className="text-brand-ivory">{store.timeSlot}</span></p>
              </div>
            </div>
            <div>
              <label className="text-brand-ivory text-sm font-medium mb-2 block">姓名</label>
              <input
                type="text"
                value={store.customerName}
                onChange={(e) => { store.setCustomerName(e.target.value); setError('') }}
                placeholder="请输入您的姓名"
                className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2.5 text-brand-ivory placeholder:text-brand-gray/40 focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-brand-ivory text-sm font-medium mb-2 block">手机号</label>
              <input
                type="tel"
                value={store.customerPhone}
                onChange={(e) => { store.setCustomerPhone(e.target.value); setError('') }}
                placeholder="请输入手机号"
                className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2.5 text-brand-ivory placeholder:text-brand-gray/40 focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-brand-ivory text-sm font-medium mb-2 block">备注（选填）</label>
              <textarea
                value={store.notes}
                onChange={(e) => store.setNotes(e.target.value)}
                placeholder="特殊需求或备注"
                rows={3}
                className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2.5 text-brand-ivory placeholder:text-brand-gray/40 focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-10">
          {store.step > 1 ? (
            <button
              onClick={() => { store.setStep(store.step - 1); setError('') }}
              className="flex items-center gap-1 text-brand-gray hover:text-brand-ivory transition-colors"
            >
              <ChevronLeft size={16} />
              <span className="text-sm">上一步</span>
            </button>
          ) : (
            <div />
          )}
          {store.step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1 bg-brand-gold text-brand-dark px-6 py-2.5 rounded-full font-medium hover:bg-brand-gold/90 transition-colors"
            >
              <span className="text-sm">下一步</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-brand-gold text-brand-dark px-8 py-2.5 rounded-full font-medium hover:bg-brand-gold/90 transition-colors disabled:opacity-50"
            >
              {submitting ? '提交中...' : '确认预约'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
