import { Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, AuthProvider } from "./context";
import Home from "./pages/Home";
import Book from "./pages/Book";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminServices from "./pages/admin/AdminServices";

export default function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="bookings" replace />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="schedule" element={<AdminSchedule />} />
            <Route path="services" element={<AdminServices />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  );
}
