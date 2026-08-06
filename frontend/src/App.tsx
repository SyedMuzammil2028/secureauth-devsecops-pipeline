import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import MFA from "./pages/MFA";
import QRCode from "./pages/QRCode";
import Welcome from "./pages/Welcome";
import UserArea from "./pages/UserArea";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/AdminLogin";
import AdminMFA from "./pages/AdminMFA";
import AdminQRCode from "./pages/AdminQRCode";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import AdminSessions from "./pages/AdminSessions";
import AdminLockedAccounts from "./pages/AdminLockedAccounts";
import AdminSettings from "./pages/AdminSettings";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="/mfa" element={<MFA />} />
            <Route path="/qr-code" element={<QRCode />} />

            <Route path="/welcome" element={<Welcome />} />
            <Route path="/user" element={<UserArea />} />

            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/mfa" element={<AdminMFA />} />
            <Route path="/admin/qr-code" element={<AdminQRCode />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/sessions" element={<AdminSessions />} />
            <Route
              path="/admin/locked-accounts"
              element={<AdminLockedAccounts />}
            />
            <Route path="/admin/settings" element={<AdminSettings />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;