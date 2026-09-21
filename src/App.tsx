import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmed from './pages/OrderConfirmed'
import CustomerAuth from './pages/CustomerAuth'
import MyOrders from './pages/MyOrders'
import Login from './pages/Login'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'
import CustomerProtectedRoute from './components/CustomerProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Landing / entry point: splash + choose Shop or Customer */}
      <Route path="/" element={<Landing />} />
      <Route path="/customer-auth" element={<CustomerAuth />} />
      <Route path="/shop-login" element={<Login />} />

      {/* Customer-only area */}
      <Route
        path="/shop"
        element={
          <CustomerProtectedRoute>
            <Navbar />
            <Home />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <CustomerProtectedRoute>
            <Navbar />
            <Cart />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <CustomerProtectedRoute>
            <Navbar />
            <Checkout />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/order-confirmed"
        element={
          <CustomerProtectedRoute>
            <Navbar />
            <OrderConfirmed />
          </CustomerProtectedRoute>
        }
      />
      <Route
        path="/my-orders"
        element={
          <CustomerProtectedRoute>
            <Navbar />
            <MyOrders />
          </CustomerProtectedRoute>
        }
      />

      {/* Shop-owner-only area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
