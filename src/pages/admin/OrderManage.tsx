import { useState, useEffect } from 'react'
import { ordersApi } from '@/api'
import type { Order } from '@/api'

const statusLabels: Record<string, string> = {
  pending_confirm: '待确认',
  shooting: '拍摄中',
  delivered: '已交付',
  completed: '已完成',
  cancelled: '已取消',
  reschedule_requested: '改期申请中',
  cancel_requested: '退单申请中',
}

const statusFilters = [
  { key: '', label: '全部' },
  { key: 'pending_confirm', label: '待确认' },
  { key: 'shooting', label: '拍摄中' },
  { key: 'delivered', label: '已交付' },
  { key: 'reschedule_requested', label: '改期申请' },
  { key: 'cancel_requested', label: '退单申请' },
]

export default function OrderManage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    ordersApi.list(filter || undefined).then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const handleConfirm = async (id: number) => {
    await ordersApi.updateStatus(id, 'shooting')
    load()
  }

  const handleDeliver = async (id: number) => {
    const images = prompt('请输入交付图片URL（多个用逗号分隔）:')
    if (!images) return
    await ordersApi.deliver(id, { delivered_images: JSON.stringify(images.split(',').map((s) => s.trim())) })
    load()
  }

  const handleApproveReschedule = async (order: Order) => {
    const date = prompt('确认改期到哪天？(YYYY-MM-DD):', order.booking_date)
    if (!date) return
    const slot = prompt('确认改期到哪个时段？:', order.time_slot)
    if (!slot) return
    await ordersApi.updateStatus(order.id, 'shooting')
    load()
  }

  const handleApproveCancel = async (id: number) => {
    if (!confirm('确认同意退单？')) return
    await ordersApi.updateStatus(id, 'cancelled')
    load()
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-brand-ivory mb-6">订单管理</h1>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {statusFilters.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === s.key ? 'bg-brand-gold text-brand-dark' : 'bg-brand-gold/10 text-brand-ivory/70 border border-brand-gold/20 hover:text-brand-gold'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-brand-gray py-20">加载中...</div>
      ) : (
        <div className="rounded-lg border border-brand-gold/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-dark/80">
                <tr className="border-b border-brand-gold/10">
                  <th className="text-left text-brand-gray font-medium p-4">订单号</th>
                  <th className="text-left text-brand-gray font-medium p-4">客户</th>
                  <th className="text-left text-brand-gray font-medium p-4">手机</th>
                  <th className="text-left text-brand-gray font-medium p-4">日期</th>
                  <th className="text-left text-brand-gray font-medium p-4">时段</th>
                  <th className="text-left text-brand-gray font-medium p-4">金额</th>
                  <th className="text-left text-brand-gray font-medium p-4">状态</th>
                  <th className="text-left text-brand-gray font-medium p-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-brand-gold/5 hover:bg-brand-gold/5 transition-colors">
                    <td className="p-4 text-brand-ivory">#{order.id}</td>
                    <td className="p-4 text-brand-gray">{order.customer_name}</td>
                    <td className="p-4 text-brand-gray">{order.customer_phone}</td>
                    <td className="p-4 text-brand-gray">{order.booking_date}</td>
                    <td className="p-4 text-brand-gray">{order.time_slot}</td>
                    <td className="p-4 text-brand-gold">¥{order.total_price.toLocaleString()}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {order.status === 'pending_confirm' && (
                          <button onClick={() => handleConfirm(order.id)} className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">确认</button>
                        )}
                        {order.status === 'shooting' && (
                          <button onClick={() => handleDeliver(order.id)} className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">交付</button>
                        )}
                        {order.status === 'reschedule_requested' && (
                          <button onClick={() => handleApproveReschedule(order)} className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors">审批改期</button>
                        )}
                        {order.status === 'cancel_requested' && (
                          <button onClick={() => handleApproveCancel(order.id)} className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">审批退单</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-brand-gray">暂无订单</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
