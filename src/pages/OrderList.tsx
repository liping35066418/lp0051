import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ordersApi } from '@/api'
import type { Order } from '@/api'
import { useOrderStore } from '@/store'

const statusTabs = [
  { key: '', label: '全部' },
  { key: 'pending_confirm', label: '待确认' },
  { key: 'shooting', label: '拍摄中' },
  { key: 'delivered', label: '已交付' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const statusColors: Record<string, string> = {
  pending_confirm: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  shooting: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  reschedule_requested: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  cancel_requested: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const statusLabels: Record<string, string> = {
  pending_confirm: '待确认',
  shooting: '拍摄中',
  delivered: '已交付',
  completed: '已完成',
  cancelled: '已取消',
  reschedule_requested: '改期申请中',
  cancel_requested: '退单申请中',
}

export default function OrderList() {
  const navigate = useNavigate()
  const { statusFilter, setStatusFilter, setOrders } = useOrderStore()
  const [orders, setLocalOrders] = useState<Order[]>([])
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)

  const loadOrders = () => {
    setLoading(true)
    ordersApi
      .list(statusFilter || undefined, phone || undefined)
      .then((data) => {
        setLocalOrders(data)
        setOrders(data)
      })
      .catch(() => setLocalOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="font-display text-3xl text-brand-ivory mb-8 text-center">我的订单</h1>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                statusFilter === tab.key
                  ? 'bg-brand-gold text-brand-dark'
                  : 'bg-brand-gold/10 text-brand-ivory/70 hover:text-brand-gold border border-brand-gold/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="输入手机号查询"
            className="flex-1 bg-brand-dark border border-brand-gold/20 rounded-lg px-4 py-2 text-sm text-brand-ivory placeholder:text-brand-gray/40 focus:outline-none focus:border-brand-gold"
          />
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-brand-gold/10 text-brand-gold text-sm rounded-lg border border-brand-gold/20 hover:bg-brand-gold/20 transition-colors"
          >
            查询
          </button>
        </div>

        {loading ? (
          <div className="text-center text-brand-gray py-20">加载中...</div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50 cursor-pointer hover:border-brand-gold/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-brand-ivory font-medium">订单 #{order.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[order.status] || ''}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="text-sm text-brand-gray space-y-1">
                  <p>客户：{order.customer_name}</p>
                  <p>日期：{order.booking_date} {order.time_slot}</p>
                  <p>金额：<span className="text-brand-gold">¥{order.total_price.toLocaleString()}</span></p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-brand-gray text-lg">暂无订单</p>
          </div>
        )}
      </div>
    </div>
  )
}
