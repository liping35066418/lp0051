import { useState, useEffect } from 'react'
import { statsApi } from '@/api'
import type { Stats, UtilizationInfo } from '@/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'

const pieColors = ['#c9a96e', '#3b82f6', '#22c55e', '#8a8a8a', '#ef4444', '#f97316']

export default function Stats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [visitData, setVisitData] = useState<{ date: string; count: number }[]>([])
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([])
  const [utilizationDate, setUtilizationDate] = useState(new Date().toISOString().split('T')[0])
  const [utilizationData, setUtilizationData] = useState<UtilizationInfo[]>([])

  useEffect(() => {
    statsApi.overview().then(setStats).catch(() => {})
    statsApi.visits().then((d) => setVisitData(d.daily || [])).catch(() => {})
    statsApi.revenue().then((d) => setRevenueData(d.monthly || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (utilizationDate) {
      statsApi.utilization(utilizationDate).then(setUtilizationData).catch(() => setUtilizationData([]))
    }
  }, [utilizationDate])

  const statusData = stats?.orders_by_status
    ? Object.entries(stats.orders_by_status).map(([name, value]) => ({ name, value }))
    : []

  const statusLabels: Record<string, string> = {
    pending_confirm: '待确认',
    shooting: '拍摄中',
    delivered: '已交付',
    completed: '已完成',
    cancelled: '已取消',
  }

  const utilizationChartData = utilizationData.map((u) => ({
    name: u.photographer_name,
    utilization: u.utilization_rate,
    occupied: u.occupied_slots,
    available: u.available_slots,
  }))

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl text-brand-ivory mb-6">数据统计</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50">
          <h2 className="text-brand-ivory font-medium mb-4">访客趋势</h2>
          {visitData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={visitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8a8a8a20" />
                <XAxis dataKey="date" stroke="#8a8a8a" fontSize={11} />
                <YAxis stroke="#8a8a8a" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #c9a96e30', borderRadius: '8px' }} labelStyle={{ color: '#f5f0eb' }} />
                <Line type="monotone" dataKey="count" stroke="#c9a96e" strokeWidth={2} dot={{ fill: '#c9a96e' }} name="访客数" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-brand-gray text-center py-10">暂无数据</p>
          )}
        </div>

        <div className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50">
          <h2 className="text-brand-ivory font-medium mb-4">订单状态分布</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${statusLabels[name] || name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #c9a96e30', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-brand-gray text-center py-10">暂无数据</p>
          )}
        </div>

        <div className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50">
          <h2 className="text-brand-ivory font-medium mb-4">收入趋势</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8a8a8a20" />
                <XAxis dataKey="month" stroke="#8a8a8a" fontSize={11} />
                <YAxis stroke="#8a8a8a" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #c9a96e30', borderRadius: '8px' }} labelStyle={{ color: '#f5f0eb' }} />
                <Bar dataKey="revenue" fill="#c9a96e" radius={[4, 4, 0, 0]} name="收入" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-brand-gray text-center py-10">暂无数据</p>
          )}
        </div>

        <div className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50">
          <h2 className="text-brand-ivory font-medium mb-4">数据概要</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-gold/5">
              <span className="text-brand-gray text-sm">总访客量</span>
              <span className="text-brand-ivory font-semibold">{stats?.total_visits ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-gold/5">
              <span className="text-brand-gray text-sm">今日访客</span>
              <span className="text-brand-ivory font-semibold">{stats?.today_visits ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-gold/5">
              <span className="text-brand-gray text-sm">总订单数</span>
              <span className="text-brand-ivory font-semibold">{stats?.total_orders ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-gold/5">
              <span className="text-brand-gray text-sm">总收入</span>
              <span className="text-brand-gold font-semibold">¥{(stats?.total_revenue ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-brand-gold/10 bg-brand-dark/50 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-brand-ivory font-medium">摄影师档期利用率</h2>
            <input
              type="date"
              value={utilizationDate}
              onChange={(e) => setUtilizationDate(e.target.value)}
              className="bg-brand-dark border border-brand-gold/20 rounded-lg px-3 py-1.5 text-brand-ivory text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>
          {utilizationChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={utilizationChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#8a8a8a20" />
                  <XAxis type="number" domain={[0, 100]} stroke="#8a8a8a" fontSize={11} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#8a8a8a" fontSize={11} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #c9a96e30', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => {
                      if (name === '利用率') return [`${value}%`, name]
                      return [value, name]
                    }}
                    labelStyle={{ color: '#f5f0eb' }}
                  />
                  <Bar dataKey="utilization" fill="#c9a96e" radius={[0, 4, 4, 0]} name="利用率" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {utilizationData.map((u) => (
                  <div key={u.photographer_id} className="p-3 rounded-lg bg-brand-gold/5">
                    <p className="text-brand-ivory text-sm font-medium mb-1">{u.photographer_name}</p>
                    <p className="text-brand-gold text-lg font-semibold">{u.utilization_rate}%</p>
                    <p className="text-brand-gray text-xs mt-1">
                      {u.occupied_slots} / {u.available_slots} 档已占
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-brand-gray text-center py-10">暂无数据</p>
          )}
        </div>
      </div>
    </div>
  )
}
