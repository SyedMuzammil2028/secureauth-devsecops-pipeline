import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import AdminShell from "@/components/layout/AdminShell";
import {
  getAdminDashboard,
  type AdminDashboardStats,
} from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type TabName = "overview" | "security" | "workflow";

type StatCard = {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  color: string;
};

function MetricCard({ stat }: { stat: StatCard }) {
  const Icon = stat.icon;

  return (
    <Card className="border-border bg-card/80 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{stat.title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {stat.description}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
            <Icon className={`h-5 w-5 ${stat.color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span>{percent}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const adminSessionToken = sessionStorage.getItem("admin_session_token");

  const loadDashboard = async () => {
    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getAdminDashboard(adminSessionToken);
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo<StatCard[]>(() => {
    if (!stats) return [];

    return [
      {
        title: "Total Users",
        value: stats.total_users,
        description: "Registered client accounts",
        icon: Users,
        color: "text-purple-400",
      },
      {
        title: "Verified Emails",
        value: stats.verified_emails,
        description: "Users who completed email OTP",
        icon: UserCheck,
        color: "text-green-400",
      },
      {
        title: "Active Sessions",
        value: stats.active_sessions,
        description: "Currently valid session tokens",
        icon: Clock,
        color: "text-blue-400",
      },
      {
        title: "Locked Accounts",
        value: stats.locked_accounts,
        description: "Accounts blocked by failed attempts",
        icon: Lock,
        color: "text-red-400",
      },
      {
        title: "MFA Success",
        value: stats.recent_mfa_success_count,
        description: "Recent successful MFA events",
        icon: ShieldCheck,
        color: "text-orange-400",
      },
    ];
  }, [stats]);

  const quickLinks = [
    {
      title: "Users",
      description: "Review users, verification, MFA and failed attempts.",
      href: "/admin/users",
      icon: Users,
      color: "text-purple-400",
    },
    {
      title: "Audit Logs",
      description: "Search authentication events and failed activity.",
      href: "/admin/logs",
      icon: Activity,
      color: "text-orange-400",
    },
    {
      title: "Sessions",
      description: "Monitor active sessions and revoke tokens.",
      href: "/admin/sessions",
      icon: Clock,
      color: "text-green-400",
    },
    {
      title: "Locked Accounts",
      description: "Unlock accounts after failed login lockout.",
      href: "/admin/locked-accounts",
      icon: Lock,
      color: "text-red-400",
    },
  ];

  return (
    <AdminShell
      title="Admin Dashboard"
      description="Monitor users, sessions, logs, and account security."
    >
      <div className="mb-5 flex flex-col gap-4 rounded-md border border-border bg-card/80 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            SecureAuth Control Center
          </p>
          <h2 className="mt-2 max-w-[780px] text-[clamp(1.8rem,3vw,3.4rem)] font-medium leading-[0.98] tracking-[-0.055em]">
            Clean monitoring for authentication, sessions, logs, and lockouts.
          </h2>
        </div>

        <Button variant="outline" onClick={loadDashboard}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {loading && (
        <div className="rounded-md border border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => (
              <MetricCard key={card.title} stat={card} />
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-md border border-border bg-card/80">
            <div className="flex border-b border-border">
              {[
                { id: "overview", label: "Overview" },
                { id: "security", label: "Security Layers" },
                { id: "workflow", label: "Workflow" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabName)}
                  className={`px-4 py-3 text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-md border border-border bg-background/40 p-5">
                {activeTab === "overview" && (
                  <div className="space-y-5">
                    <ProgressBar
                      label="Email verification coverage"
                      value={stats.verified_emails}
                      total={stats.total_users}
                      color="bg-green-400"
                    />
                    <ProgressBar
                      label="Locked account ratio"
                      value={stats.locked_accounts}
                      total={Math.max(stats.total_users, 1)}
                      color="bg-red-400"
                    />
                    <ProgressBar
                      label="Session activity"
                      value={stats.active_sessions}
                      total={Math.max(stats.total_users, stats.active_sessions, 1)}
                      color="bg-blue-400"
                    />
                    <ProgressBar
                      label="MFA success activity"
                      value={stats.recent_mfa_success_count}
                      total={Math.max(
                        stats.recent_mfa_success_count,
                        stats.active_sessions,
                        1
                      )}
                      color="bg-orange-400"
                    />
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-3 text-sm">
                    {[
                      ["Email OTP verification", "text-green-400"],
                      ["QR/TOTP administrator MFA", "text-purple-400"],
                      ["User session token validation", "text-blue-400"],
                      ["Account lockout monitoring", "text-red-400"],
                      ["Audit event tracking", "text-orange-400"],
                    ].map(([item, color]) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-md border border-border bg-background/60 px-3 py-2"
                      >
                        <span>{item}</span>
                        <span className={`flex items-center gap-1 ${color}`}>
                          <CheckCircle2 className="h-4 w-4" />
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "workflow" && (
                  <div className="space-y-3 text-sm">
                    {[
                      "User registration with email OTP",
                      "Login with nonce challenge-response",
                      "MFA verification through authenticator app",
                      "Session token issued after successful MFA",
                      "Admin reviews logs, sessions, and locked accounts",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className="flex gap-3 rounded-md border border-border bg-background/60 p-3"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-xs">
                          {index + 1}
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {quickLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="group rounded-md border border-border bg-background/40 p-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                            <Icon className={`h-5 w-5 ${link.color}`} />
                          </div>

                          <div>
                            <p className="text-sm font-medium">{link.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {link.description}
                            </p>
                          </div>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}