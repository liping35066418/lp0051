import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import { statsApi, ordersApi } from '@/api'
import type { Stats, Order } from '@/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const statusLabels: Record<string, string> = {
  pending_confirm: '待确认',
  shooting: '拍摄中',
  delivered: '已交付',
  completed: '已完成',
  cancelled: '已取消',
  reschedule_requested: '改期申请中',
  cancel_requested: '退单申请中',
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    statsApi.overview().then(setStats).catch(() => {})
    ordersApi.list().then((data) => setRecentOrders(data.slice(0, 10))).catch(() => {})
  }, [])

  const cards = [
    { label: '总访客', value: stats?.total_visits ?? 0, icon: Eye, color: 'text-blue-400' },
    { label: '今日访客', value: stats?.today_visits ?? 0, icon: TrendingUp, color: 'text-green-400' },
    { label: '总订单', value: stats?.total_orders ?? 0, icon: ShoppingCart, color: 'text-brand-gold' },
    { label: '总收入', value: `¥${(stats?.total_revenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400' },
  ]

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-brand-ivory mb-6">数据概览</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-brand-gray text-sm">{card.label}</span>
              <card.icon size={18} className={card.color} />
            </div>
            <div className="text-brand-ivory text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </div>

      {stats?.monthly_revenue && stats.monthly_revenue.length > 0 && (
        <div className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50 mb-8">
          <h2 className="text-brand-ivory font-medium mb-4">月度收入趋势</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#8a8a8a20" />
              <XAxis dataKey="month" stroke="#8a8a8a" fontSize={12} />
              <YAxis stroke="#8a8a8a" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #c9a96e30', borderRadius: '8px' }}
                labelStyle={{ color: '#f5f0eb' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} dot={{ fill: '#c9a96e' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-brand-ivory font-medium">最近订单</h2>
          <Link to="/admin/orders" className="text-brand-gold text-sm hover:underline">查看全部</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-gold/10">
                <th className="text-left text-brand-gray font-medium py-3 pr-4">订单号</th>
                <th className="text-left text-brand-gray font-medium py-3 pr-4">客户</th>
                <th className="text-left text-brand-gray font-medium py-3 pr-4">日期</th>
                <th className="text-left text-brand-gray font-medium py-3 pr-4">金额</th>
                <th className="text-left text-brand-gray font-medium py-3">状态</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-brand-gold/5">
                  <td className="py-3 pr-4 text-brand-ivory">#{order.id}</td>
                  <td className="py-3 pr-4 text-brand-gray">{order.customer_name}</td>
                  <td className="py-3 pr-4 text-brand-gray">{order.booking_date}</td>
                  <td className="py-3 pr-4 text-brand-gold">¥{order.total_price.toLocaleString()}</td>
                  <td className="py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-gray">暂无订单</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
