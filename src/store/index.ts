import { create } from 'zustand'
import type { Order, GalleryItem } from '@/api'

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  statusFilter: string
  phoneFilter: string
  setOrders: (orders: Order[]) => void
  setCurrentOrder: (order: Order | null) => void
  setStatusFilter: (status: string) => void
  setPhoneFilter: (phone: string) => void
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  statusFilter: '',
  phoneFilter: '',
  setOrders: (orders) => set({ orders }),
  setCurrentOrder: (currentOrder) => set({ currentOrder }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setPhoneFilter: (phoneFilter) => set({ phoneFilter }),
}))

interface BookingState {
  step: number
  packageId: number | null
  photographerId: number | null
  date: string
  timeSlot: string
  customerName: string
  customerPhone: string
  notes: string
  setStep: (step: number) => void
  setPackageId: (id: number | null) => void
  setPhotographerId: (id: number | null) => void
  setDate: (date: string) => void
  setTimeSlot: (slot: string) => void
  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const initialBooking = {
  step: 1,
  packageId: null,
  photographerId: null,
  date: '',
  timeSlot: '',
  customerName: '',
  customerPhone: '',
  notes: '',
}

export const useBookingStore = create<BookingState>((set) => ({
  ...initialBooking,
  setStep: (step) => set({ step }),
  setPackageId: (packageId) => set({ packageId }),
  setPhotographerId: (photographerId) => set({ photographerId }),
  setDate: (date) => set({ date }),
  setTimeSlot: (timeSlot) => set({ timeSlot }),
  setCustomerName: (customerName) => set({ customerName }),
  setCustomerPhone: (customerPhone) => set({ customerPhone }),
  setNotes: (notes) => set({ notes }),
  reset: () => set(initialBooking),
}))

interface GalleryState {
  items: GalleryItem[]
  categoryFilter: string
  setItems: (items: GalleryItem[]) => void
  setCategoryFilter: (category: string) => void
}

export const useGalleryStore = create<GalleryState>((set) => ({
  items: [],
  categoryFilter: '',
  setItems: (items) => set({ items }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
}))
