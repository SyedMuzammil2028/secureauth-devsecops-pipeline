import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Github,
  KeyRound,
  Linkedin,
  LockKeyhole,
  Mail,
  MessageCircle,
  Moon,
  RadioTower,
  ScanLine,
  Server,
  ShieldCheck,
  Sun,
  Wifi,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import AnimatedBackground from "@/components/AnimatedBackground";
import { Logo3D } from "@/components/Logo3D";
import { StackedLogo } from "@/components/StackedLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const SLATE_HSL = "215 16% 47%";
const SLATE_DARK = "215 14% 55%";

/*
  Only adjusted what you asked:
  - smaller cube
  - cube slightly lower
  - top section slightly pushed down
*/
const CUBE_SIZE = 620;
const CUBE_OFFSET_X = 0;
const CUBE_OFFSET_Y = 90;

const techStack = [
  { label: "Python", icon: Server, color: "text-green-400" },
  { label: "FastAPI", icon: RadioTower, color: "text-cyan-400" },
  { label: "SQLite", icon: Database, color: "text-orange-400" },
  { label: "TCP Sockets", icon: Wifi, color: "text-blue-400" },
  { label: "Password Hashing", icon: LockKeyhole, color: "text-red-400" },
  { label: "TOTP MFA", icon: ScanLine, color: "text-purple-400" },
];

const featureCards = [
  {
    title: "Secure User Onboarding",
    description:
      "Users register with strong password validation, hashed credentials, and mandatory email OTP verification before account activation.",
    icon: ShieldCheck,
    color: "text-green-400",
  },
  {
    title: "Replay-Safe Login Flow",
    description:
      "The login process uses a server-generated nonce and challenge-response style flow to demonstrate secure authentication protocol design.",
    icon: KeyRound,
    color: "text-orange-400",
  },
  {
    title: "QR-Based MFA Protection",
    description:
      "A TOTP-compatible authenticator app adds a second verification layer before issuing a valid session token.",
    icon: ScanLine,
    color: "text-purple-400",
  },
  {
    title: "Session and Access Control",
    description:
      "Secure session tokens, expiration handling, logout, session monitoring, and revocation help control authenticated access.",
    icon: Activity,
    color: "text-blue-400",
  },
  {
    title: "Lockout and Rate Limiting",
    description:
      "Repeated failed attempts are tracked, rate-limited, logged, and can trigger account lockout to reduce brute-force risk.",
    icon: LockKeyhole,
    color: "text-red-400",
  },
  {
    title: "Admin Monitoring Console",
    description:
      "Admins can review users, audit logs, sessions, lockouts, suspensions, and soft-deleted accounts from a protected dashboard.",
    icon: Database,
    color: "text-cyan-400",
  },
];

const dashboardRows = [
  { id: "AUTH-201", title: "Registration OTP sent", dot: "bg-sky-400", width: "w-[210px]" },
  { id: "AUTH-198", title: "Login challenge issued", dot: "bg-orange-400", width: "w-[230px]" },
  { id: "AUTH-197", title: "MFA verification success", dot: "bg-green-400", width: "w-[245px]" },
  { id: "AUTH-193", title: "Failed login attempt", dot: "bg-pink-500", width: "w-[210px]" },
  { id: "AUTH-191", title: "Session created", dot: "bg-slate-400", width: "w-[195px]" },
  { id: "AUTH-188", title: "Email change requested", dot: "bg-cyan-400", width: "w-[225px]" },
  { id: "AUTH-181", title: "Locked account detected", dot: "bg-yellow-400", width: "w-[215px]" },
];

const footerLinks = [
  {
    label: "Email",
    href: "mailto:secureauth@example.com",
    icon: Mail,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/syed-muzammil-sec/",
    icon: Linkedin,
  },
  {
    label: "GitHub",
    href: "https://github.com/SyedMuzammil2028",
    icon: Github,
  },
  {
    label: "Discord",
    href: "https://discord.com/users/1292564938576887913",
    icon: MessageCircle,
  },
];

const bottomHighlights = [
  {
    title: "Networking Core",
    description:
      "Demonstrates TCP socket programming, client-server architecture, JSON protocol messages, and nonce-based replay protection.",
    icon: Wifi,
    color: "text-blue-400",
  },
  {
    title: "Backend Integration",
    description:
      "FastAPI endpoints connect the frontend with the socket server, SQLite database, email service, and session management.",
    icon: Server,
    color: "text-green-400",
  },
  {
    title: "Admin Visibility",
    description:
      "Admins can monitor users, logs, sessions, lockouts, suspensions, and soft-deleted accounts through a protected console.",
    icon: Database,
    color: "text-orange-400",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [cubeZoom, setCubeZoom] = useState(() => {
    const width = window.innerWidth;
    return width < 1024 ? 220 : 285;
  });
  
  useEffect(() => {
    const handleResize = () => {
      setCubeZoom(window.innerWidth < 1024 ? 220 : 280);
    };
  
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === "dark";
    const hsl = isDark ? SLATE_DARK : SLATE_HSL;

    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-ring", hsl);
  }, [theme]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <AnimatedBackground />

      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/90 px-6 backdrop-blur">
        <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between">
          <Link to="/" className="-ml-0.5 flex items-center gap-2">
            <StackedLogo size={16} />
            <span className="text-[14px] font-bold uppercase tracking-[0.08em] text-foreground">
              SecureAuth
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative flex h-8 w-8 items-center justify-center text-foreground/70 transition-colors hover:text-foreground"
              title="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="h-8 px-3 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
            >
              Log in
            </button>

            <button
              type="button"
              onClick={() => navigate("/register")}
              className="h-8 border border-foreground/40 px-3 text-[13px] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - moved only a little down */}
      <section className="relative z-10 overflow-hidden px-6 pb-4 pt-5">
        <div className="relative mx-auto max-w-[1200px]">
          <div className="relative flex min-h-[660px] items-center pb-8 pt-10">
            <div className="relative z-[3] max-w-[590px] min-w-0 flex-1">
              <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Secure network-based authentication
              </div>

              <h1 className="max-w-[650px] text-[clamp(3.1rem,6vw,6.2rem)] font-[500] leading-[0.94] tracking-[-0.07em] text-foreground">
                Layered authentication built for secure access.
              </h1>

              <p className="mt-6 max-w-[520px] text-base leading-relaxed text-muted-foreground">
                SecureAuth protects user login with email verification,
                challenge-response authentication, QR-based MFA, session tokens,
                rate limiting, lockout controls, and admin monitoring.
              </p>

              <div className="mt-10 flex items-center gap-4">
                <Button
                  onClick={() => navigate("/login")}
                  className="group relative inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>

                <Button variant="outline" onClick={() => navigate("/register")}>
                  Create account
                </Button>
              </div>

              <div className="mt-8 flex max-w-[760px] flex-wrap gap-2">
                <Badge variant="outline" className="rounded-sm">
                  TCP Socket Concepts
                </Badge>
                <Badge variant="outline" className="rounded-sm">
                  Email OTP
                </Badge>
                <Badge variant="outline" className="rounded-sm">
                  QR / TOTP MFA
                </Badge>
                <Badge variant="outline" className="rounded-sm">
                  Challenge Response
                </Badge>
              </div>
            </div>

            <div className="pointer-events-none relative z-[1] hidden flex-1 md:block">
            <div
              className="absolute right-[10px] top-[52%]"
              style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                transform: "translateY(-50%)",
              }}
            >
              <Logo3D
                variant={1}
                size={CUBE_SIZE}
                zoom={cubeZoom}
                bgHex={theme === "dark" ? "#0e0e10" : "#ffffff"}
                lineHex={theme === "dark" ? "#58585e" : "#c0c0c8"}
              />
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative z-10 px-6 pb-20">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                Live security workspace
              </p>
              <h2 className="max-w-[780px] text-3xl font-medium tracking-tight">
                Authentication activity, sessions, and risk events in one view.
              </h2>
            </div>

            <p className="max-w-[460px] text-sm leading-relaxed text-muted-foreground">
              A visual preview of the administrator experience: audit logs,
              active sessions, lockout alerts, MFA usage, and system health.
            </p>
          </div>

          <div className="relative overflow-visible">
            <div className="relative z-10 overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl shadow-black/20">
              <div className="flex min-h-[520px]">
                <div className="flex w-[250px] shrink-0 flex-col gap-1 border-r border-border p-5">
                  <div className="mb-4 flex h-9 items-center gap-3 px-2">
                    <div className="h-5 w-5 rounded bg-slate-500/40" />
                    <div className="h-2.5 w-28 rounded-full bg-foreground/15" />
                  </div>

                  <div className="mb-3 h-px bg-border" />

                  {[
                    "Overview",
                    "Users",
                    "Audit Logs",
                    "Sessions",
                    "Lockouts",
                    "Settings",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={`flex h-10 items-center gap-3 rounded-lg px-3 ${
                        index === 2 ? "bg-accent" : ""
                      }`}
                    >
                      <div className="h-4 w-4 rounded bg-muted-foreground/15" />
                      <div
                        className={`h-2 rounded-full ${
                          index === 0
                            ? "w-24"
                            : index === 1
                            ? "w-16"
                            : index === 2
                            ? "w-28 bg-foreground/25"
                            : index === 3
                            ? "w-20"
                            : index === 4
                            ? "w-24"
                            : "w-16"
                        } bg-muted-foreground/15`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex h-12 items-center gap-4 border-b border-border px-5">
                    <div className="h-2.5 w-16 rounded-full bg-muted-foreground/15" />
                    <div className="h-2.5 w-12 rounded-full bg-muted-foreground/10" />
                    <div className="h-2.5 w-20 rounded-full bg-muted-foreground/10" />
                    <div className="ml-auto flex gap-2">
                      <div className="h-6 w-6 rounded bg-muted-foreground/8" />
                      <div className="h-6 w-6 rounded bg-muted-foreground/8" />
                    </div>
                  </div>

                  <div className="flex-1">
                    {dashboardRows.map((row) => (
                      <div
                        key={row.id}
                        className="flex h-[54px] items-center gap-4 border-b border-border px-5"
                      >
                        <div className={`h-3 w-3 rounded-full ${row.dot}`} />
                        <span className="shrink-0 font-mono text-[12px] text-muted-foreground">
                          {row.id}
                        </span>

                        <div className="min-w-[210px] text-[13px] text-muted-foreground max-md:hidden">
                          {row.title}
                        </div>

                        <div className={`h-2 ${row.width} rounded-full bg-foreground/15`} />

                        <div className="ml-auto flex items-center gap-3">
                          <div className="h-6 w-20 rounded-sm bg-muted-foreground/8" />
                          <div className="h-7 w-7 rounded-full bg-muted-foreground/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden w-[330px] shrink-0 flex-col border-l border-border lg:flex">
                  <div className="flex h-12 items-center justify-between border-b border-border px-5">
                    <div className="h-2.5 w-28 rounded-full bg-foreground/15" />
                    <div className="h-6 w-6 rounded bg-muted-foreground/10" />
                  </div>

                  <div className="space-y-5 p-5">
                    <Card className="border-border bg-background/60 shadow-none">
                      <CardContent className="p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Session Activity
                          </span>
                          <Activity className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <div className="space-y-3">
                          {[76, 42, 88, 54, 64, 31].map((value, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="h-2.5 w-12 rounded-full bg-muted-foreground/12" />
                              <div className="h-2.5 flex-1 rounded-full bg-muted">
                                <div
                                  className={`h-2.5 rounded-full ${
                                    index % 3 === 0
                                      ? "bg-blue-400"
                                      : index % 3 === 1
                                      ? "bg-purple-400"
                                      : "bg-orange-400"
                                  }`}
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border bg-background/60 shadow-none">
                      <CardContent className="p-5">
                        <div className="mb-4 text-sm text-muted-foreground">
                          Security Metrics
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-md border border-border p-4">
                            <div className="text-[12px] text-muted-foreground">
                              Active Sessions
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-blue-400">
                              12
                            </div>
                          </div>

                          <div className="rounded-md border border-border p-4">
                            <div className="text-[12px] text-muted-foreground">
                              MFA Usage
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-purple-400">
                              96%
                            </div>
                          </div>

                          <div className="rounded-md border border-border p-4">
                            <div className="text-[12px] text-muted-foreground">
                              Locked
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-red-400">
                              3
                            </div>
                          </div>

                          <div className="rounded-md border border-border p-4">
                            <div className="text-[12px] text-muted-foreground">
                              Audit Logs
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-orange-400">
                              248
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto h-10 max-w-[1240px] rounded-b-[32px] border border-t-0 border-border/60 bg-card/40" />
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="border-y border-border px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex items-center justify-between gap-6 max-md:flex-col max-md:items-start">
            <div>
              <p className="mb-2 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                Core capabilities
              </p>
              <h2 className="text-3xl font-medium tracking-tight">
                Security-first user authentication
              </h2>
            </div>

            <p className="max-w-[440px] text-sm leading-relaxed text-muted-foreground">
              Built around secure authentication protocols, TCP networking concepts,
              replay-attack mitigation, session control, logging, monitoring, and
              account protection.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title} className="border-border bg-card/70 shadow-none">
                  <CardContent className="space-y-4 p-6">
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                    <div>
                      <h3 className="text-lg font-medium">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="border-t border-border px-6 py-14">
        <div className="mx-auto max-w-[1200px]">
          <p className="mb-5 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
            Technology stack
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {techStack.map(({ label, icon: Icon, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-md border border-border bg-card/60 px-4 py-3"
              >
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom section you asked to add */}
      <section className="px-6 pb-20 pt-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-6 md:grid-cols-3">
            {bottomHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="border-border bg-card/70 shadow-none">
                  <CardContent className="p-7">
                    <Icon className={`mb-6 h-6 w-6 ${item.color}`} />
                    <h3 className="text-2xl font-medium tracking-tight">{item.title}</h3>
                    <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-10 rounded-xl border border-border bg-card/70 px-6 py-10 text-center md:px-10 md:py-12">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <RadioTower className="h-5 w-5" />
            </div>

            <h2 className="mx-auto max-w-[760px] text-[clamp(2rem,4vw,3.6rem)] font-[500] leading-[0.98] tracking-[-0.055em]">
              Secure access flow from registration to monitored sessions.
            </h2>

            <p className="mx-auto mt-4 max-w-[700px] text-base leading-relaxed text-muted-foreground">
              A complete authentication lifecycle for educational, internal, and
              security-focused applications.
            </p>

            <div className="mt-7">
              <Button
                onClick={() => navigate("/register")}
                className="group inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium"
              >
                Create Account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer kept same */}
      <footer className="border-t border-border px-6 py-14">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <StackedLogo size={18} />
                <span className="text-lg font-bold uppercase tracking-[0.12em]">
                  SecureAuth
                </span>
              </div>
              <p className="mt-3 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
                Secure network-based authentication with MFA, session control,
                audit logging, and administrator visibility.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">
                Platform
              </h3>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <Link to="/login" className="transition-colors hover:text-foreground">
                  User Login
                </Link>
                <Link to="/register" className="transition-colors hover:text-foreground">
                  Create Account
                </Link>
                <Link to="/admin/login" className="transition-colors hover:text-foreground">
                  Admin Portal
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">
                Security
              </h3>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <span>Email OTP</span>
                <span>QR / TOTP MFA</span>
                <span>Challenge Response</span>
                <span>Audit Monitoring</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">
                Contact
              </h3>

              <div className="mt-4 grid gap-3">
                {footerLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-xs text-muted-foreground">
                Â© {new Date().getFullYear()} SecureAuth. All rights reserved.
              </p>

              <div className="flex items-center gap-3">
                {footerLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={item.label}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
