import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Clock,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, type ReactNode } from "react";

import AnimatedBackground from "@/components/AnimatedBackground";
import { StackedLogo } from "@/components/StackedLogo";
import { Button } from "@/components/ui/button";
import { logoutAdmin } from "@/lib/adminAuth";

type AdminShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-400",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    color: "text-purple-400",
  },
  {
    label: "Audit Logs",
    href: "/admin/logs",
    icon: Activity,
    color: "text-orange-400",
  },
  {
    label: "Sessions",
    href: "/admin/sessions",
    icon: Clock,
    color: "text-green-400",
  },
  {
    label: "Locked Accounts",
    href: "/admin/locked-accounts",
    icon: Lock,
    color: "text-red-400",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    color: "text-yellow-400",
  },
];

export default function AdminShell({
  title,
  description,
  children,
}: AdminShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    const token = sessionStorage.getItem("admin_session_token");

    if (token) {
      try {
        await logoutAdmin(token);
      } catch {
        // Local logout should still happen.
      }
    }

    sessionStorage.removeItem("admin_session_token");
    sessionStorage.removeItem("admin_login_identifier");
    sessionStorage.removeItem("admin_temp_token");

    navigate("/admin/login");
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AnimatedBackground />

      <div className="flex min-h-screen">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 border-r border-border bg-card/95 transition-all duration-300 lg:block ${
            sidebarOpen ? "w-[280px]" : "w-[76px]"
          }`}
        >
          <div className="flex h-[64px] items-center justify-between border-b border-border px-4">
            <Link
              to="/admin/dashboard"
              className={`flex min-w-0 items-center gap-3 ${
                sidebarOpen ? "justify-start" : "justify-center"
              }`}
            >
              <StackedLogo size={18} />

              {sidebarOpen && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold uppercase tracking-[0.12em]">
                    SecureAuth
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Admin Panel
                  </p>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav className="space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  } ${sidebarOpen ? "justify-start" : "justify-center"}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div className="mx-3 mt-4 rounded-md border border-border bg-background/60 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                <p className="text-sm font-medium">Protected Console</p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Admin access is protected by MFA and session validation.
              </p>
            </div>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex min-h-[64px] items-center justify-between px-6">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2 lg:hidden">
                  <Menu className="h-5 w-5 text-muted-foreground" />
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>

                <h1 className="truncate text-xl font-semibold tracking-tight">
                  {title}
                </h1>

                {description && (
                  <p className="truncate text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  title="Toggle theme"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </button>

                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <main className="px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}