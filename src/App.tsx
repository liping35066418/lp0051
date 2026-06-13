import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminSidebar from "@/components/AdminSidebar";
import Home from "@/pages/Home";
import PackageList from "@/pages/PackageList";
import PackageDetail from "@/pages/PackageDetail";
import Booking from "@/pages/Booking";
import OrderList from "@/pages/OrderList";
import OrderDetail from "@/pages/OrderDetail";
import Gallery from "@/pages/Gallery";
import Dashboard from "@/pages/admin/Dashboard";
import PackageManage from "@/pages/admin/PackageManage";
import PhotographerManage from "@/pages/admin/PhotographerManage";
import OrderManage from "@/pages/admin/OrderManage";
import GalleryManage from "@/pages/admin/GalleryManage";
import Stats from "@/pages/admin/Stats";

function VisitLogger() {
  const location = useLocation()
  useEffect(() => {
    fetch(`/api/stats/visits?page=${encodeURIComponent(location.pathname)}`).catch(() => {})
  }, [location.pathname])
  return null
}

function Layout() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <div className="flex min-h-screen bg-brand-dark">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-auto">
          <Routes>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/packages" element={<PackageManage />} />
            <Route path="/admin/photographers" element={<PhotographerManage />} />
            <Route path="/admin/orders" element={<OrderManage />} />
            <Route path="/admin/gallery" element={<GalleryManage />} />
            <Route path="/admin/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/packages" element={<PackageList />} />
        <Route path="/packages/:id" element={<PackageDetail />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/orders" element={<OrderList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <VisitLogger />
      <Layout />
    </Router>
  )
}
