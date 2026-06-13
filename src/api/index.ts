export interface Package {
  id: number
  name: string
  category: 'portrait' | 'outdoor' | 'commercial'
  cover_image: string
  description: string
  content: string
  price: number
  duration_minutes: number
  includes: string
  notes: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Photographer {
  id: number
  name: string
  avatar: string
  bio: string
  specialties: string
  is_active: boolean
  created_at: string
}

export interface Schedule {
  id: number
  photographer_id: number
  date: string
  time_slot: string
  is_available: boolean
}

export interface Booking {
  id: number
  package_id: number
  photographer_id: number
  customer_name: string
  customer_phone: string
  booking_date: string
  time_slot: string
  notes: string
  status: 'pending' | 'confirmed' | 'conflict'
  created_at: string
}

export interface Order {
  id: number
  booking_id: number
  package_id: number
  photographer_id: number
  customer_name: string
  customer_phone: string
  booking_date: string
  time_slot: string
  status: 'pending_confirm' | 'shooting' | 'delivered' | 'completed' | 'reschedule_requested' | 'cancel_requested' | 'cancelled'
  total_price: number
  notes: string
  rating: number | null
  review: string | null
  delivered_images: string | null
  created_at: string
  updated_at: string
}

export interface GalleryItem {
  id: number
  title: string
  category: string
  images: string
  photographer_id: number
  package_id: number | null
  description: string
  is_active: boolean
  sort_order: number
  views: number
  likes: number
  created_at: string
}

export interface Stats {
  total_visits: number
  today_visits: number
  total_orders: number
  total_revenue: number
  orders_by_status: Record<string, number>
  recent_orders: Order[]
  monthly_revenue: { month: string; revenue: number }[]
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || '请求失败')
  return json.data as T
}

function uploadRequest<T>(url: string, formData: FormData): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    headers: {} as Record<string, string>,
    body: formData,
  })
}

export const packagesApi = {
  list: (category?: string) =>
    request<Package[]>(`/api/packages${category ? `?category=${category}` : ''}`),
  get: (id: number) => request<Package>(`/api/packages/${id}`),
  create: (data: Partial<Package>) =>
    request<Package>('/api/packages', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Package>) =>
    request<Package>(`/api/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/api/packages/${id}`, { method: 'DELETE' }),
  toggle: (id: number) =>
    request<Package>(`/api/packages/${id}/toggle`, { method: 'PATCH' }),
}

export const photographersApi = {
  list: () => request<Photographer[]>('/api/photographers'),
  get: (id: number) => request<Photographer>(`/api/photographers/${id}`),
  create: (data: Partial<Photographer>) =>
    request<Photographer>('/api/photographers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Photographer>) =>
    request<Photographer>(`/api/photographers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/api/photographers/${id}`, { method: 'DELETE' }),
}

export const schedulesApi = {
  list: (photographer_id: number, date: string) =>
    request<Schedule[]>(`/api/schedules?photographer_id=${photographer_id}&date=${date}`),
  create: (data: Partial<Schedule>) =>
    request<Schedule>('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Schedule>) =>
    request<Schedule>(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

export const bookingsApi = {
  create: (data: Partial<Booking>) =>
    request<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  check: (params: { photographer_id: number; date: string }) =>
    request<{ available: boolean }[]>(`/api/bookings/availability?photographer_id=${params.photographer_id}&date=${params.date}`),
}

export const ordersApi = {
  list: (status?: string, phone?: string) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (phone) params.set('phone', phone)
    const qs = params.toString()
    return request<Order[]>(`/api/orders${qs ? `?${qs}` : ''}`)
  },
  get: (id: number) => request<Order>(`/api/orders/${id}`),
  updateStatus: (id: number, status: string) =>
    request<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  reschedule: (id: number, data: { booking_date: string; time_slot: string }) =>
    request<Order>(`/api/orders/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: number) =>
    request<Order>(`/api/orders/${id}/cancel`, { method: 'POST' }),
  review: (id: number, data: { rating: number; review: string }) =>
    request<Order>(`/api/orders/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  deliver: (id: number, data: { delivered_images: string }) =>
    request<Order>(`/api/orders/${id}/deliver`, { method: 'POST', body: JSON.stringify(data) }),
}

export const galleryApi = {
  list: (category?: string) =>
    request<GalleryItem[]>(`/api/gallery${category ? `?category=${category}` : ''}`),
  get: (id: number) => request<GalleryItem>(`/api/gallery/${id}`),
  create: (data: Partial<GalleryItem>) =>
    request<GalleryItem>('/api/gallery', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<GalleryItem>) =>
    request<GalleryItem>(`/api/gallery/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/api/gallery/${id}`, { method: 'DELETE' }),
  toggle: (id: number) =>
    request<GalleryItem>(`/api/gallery/${id}/toggle`, { method: 'PATCH' }),
  like: (id: number) =>
    request<GalleryItem>(`/api/gallery/${id}/like`, { method: 'POST' }),
}

export const statsApi = {
  overview: () => request<Stats>('/api/stats/overview'),
  visits: () => request<{ daily: { date: string; count: number }[] }>('/api/stats/visits'),
  revenue: () => request<{ monthly: { month: string; revenue: number }[] }>('/api/stats/revenue'),
}

export { uploadRequest }
