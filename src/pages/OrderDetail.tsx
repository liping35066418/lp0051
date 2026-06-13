import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Star, Image as ImageIcon } from 'lucide-react'
import { ordersApi, packagesApi, photographersApi } from '@/api'
import type { Order, Package, Photographer } from '@/api'
import OrderTimeline from '@/components/OrderTimeline'

const statusLabels: Record<string, string> = {
  pending_confirm: '待确认',
  shooting: '拍摄中',
  delivered: '已交付',
  completed: '已完成',
  cancelled: '已取消',
  reschedule_requested: '改期申请中',
  cancel_requested: '退单申请中',
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [pkg, setPkg] = useState<Package | null>(null)
  const [photographer, setPhotographer] = useState<Photographer | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    ordersApi
      .get(Number(id))
      .then((o) => {
        setOrder(o)
        if (o.package_id) packagesApi.get(o.package_id).then(setPkg).catch(() => {})
        if (o.photographer_id) photographersApi.get(o.photographer_id).then(setPhotographer).catch(() => {})
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleReschedule = async () => {
    const date = prompt('请输入新日期 (YYYY-MM-DD):')
    if (!date) return
    const timeSlot = prompt('请输入新时段 (如 10:00):')
    if (!timeSlot) return
    try {
      const updated = await ordersApi.reschedule(order!.id, { booking_date: date, time_slot: timeSlot })
      setOrder(updated)
    } catch (e: any) {
      alert(e.message || '改期失败')
    }
  }

  const handleCancel = async () => {
    if (!confirm('确定要申请退单吗？')) return
    try {
      const updated = await ordersApi.cancel(order!.id)
      setOrder(updated)
    } catch (e: any) {
      alert(e.message || '退单失败')
    }
  }

  const handleSubmitReview = async () => {
    try {
      const updated = await ordersApi.review(order!.id, { rating, review: reviewText })
      setOrder(updated)
      setShowReview(false)
    } catch (e: any) {
      alert(e.message || '评价失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-brand-gray">加载中...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-brand-gray text-lg mb-4">订单不存在</p>
          <button onClick={() => navigate('/orders')} className="text-brand-gold hover:underline">返回订单列表</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-brand-gray hover:text-brand-gold transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">返回</span>
        </button>

        <div className="p-6 rounded-lg border border-brand-gold/10 bg-brand-dark/50 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl text-brand-ivory">订单 #{order.id}</h1>
            <span className="text-sm px-3 py-1 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
              {statusLabels[order.status] || order.status}
            </span>
          </div>

          <OrderTimeline status={order.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-5 rounded-lg border border-brand-gold/10">
            <h3 className="text-brand-ivory font-medium mb-3">预约信息</h3>
            <div className="space-y-2 text-sm text-brand-gray">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand-gold" />
                <span>日期：{order.booking_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-brand-gold" />
                <span>时段：{order.time_slot}</span>
              </div>
              <p>套餐：{pkg?.name || '-'}</p>
              <p>摄影师：{photographer?.name || '-'}</p>
            </div>
          </div>

          <div className="p-5 rounded-lg border border-brand-gold/10">
            <h3 className="text-brand-ivory font-medium mb-3">客户信息</h3>
            <div className="space-y-2 text-sm text-brand-gray">
              <p>姓名：{order.customer_name}</p>
              <p>手机：{order.customer_phone}</p>
              <p>金额：<span className="text-brand-gold">¥{order.total_price.toLocaleString()}</span></p>
              {order.notes && <p>备注：{order.notes}</p>}
            </div>
          </div>
        </div>

        {order.rating && (
          <div className="p-5 rounded-lg border border-brand-gold/10 mb-6">
            <h3 className="text-brand-ivory font-medium mb-2">客户评价</h3>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={16}
                  className={i <= order.rating! ? 'fill-brand-gold text-brand-gold' : 'text-brand-gray/30'}
                />
              ))}
            </div>
            {order.review && <p className="text-brand-gray text-sm">{order.review}</p>}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {(order.status === 'shooting') && (
            <>
              <button
                onClick={handleReschedule}
                className="px-4 py-2 text-sm rounded-lg bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20 transition-colors"
              >
                申请改期
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                申请退单
              </button>
            </>
          )}
          {order.status === 'delivered' && (
            <>
              <button
                onClick={() => setShowReview(true)}
                className="px-4 py-2 text-sm rounded-lg bg-brand-gold/10 text-brand-gold border border-brand-gold/20 hover:bg-brand-gold/20 transition-colors"
              >
                评价
              </button>
              {order.delivered_images && (
                <button
                  onClick={() => {
                    const images = JSON.parse(order.delivered_images || '[]')
                    if (images.length > 0) window.open(images[0], '_blank')
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors flex items-center gap-1"
                >
                  <ImageIcon size={14} />
                  查看成片
                </button>
              )}
            </>
          )}
        </div>

        {showReview && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-brand-dark border border-brand-gold/20 rounded-lg p-6 w-full max-w-md">
              <h2 className="font-display text-xl text-brand-ivory mb-4">评价服务</h2>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setRating(i)}>
                    <Star
                      size={24}
                      className={i <= rating ? 'fill-brand-gold text-brand-gold' : 'text-brand-gray/30'}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="写下您的评价..."
                rows={4}
                className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2.5 text-brand-ivory placeholder:text-brand-gray/40 focus:outline-none focus:border-brand-gold resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowReview(false)}
                  className="px-4 py-2 text-sm text-brand-gray hover:text-brand-ivory transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-2 text-sm bg-brand-gold text-brand-dark rounded-lg font-medium hover:bg-brand-gold/90 transition-colors"
                >
                  提交评价
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
