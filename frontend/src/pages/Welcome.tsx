import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  MailCheck,
  MonitorCog,
  Moon,
  Network,
  RadioTower,
  ScanLine,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  TerminalSquare,
  TimerReset,
  UserRound,
  Workflow,
} from "lucide-react";
import { useTheme } from "next-themes";

import AnimatedBackground from "@/components/AnimatedBackground";
import { StackedLogo } from "@/components/StackedLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const securityFeatures = [
  {
    title: "Email OTP Verification",
    description: "Ensures only verified email owners can activate new accounts.",
    icon: MailCheck,
    color: "text-green-400",
  },
  {
    title: "Challenge–Response Login",
    description: "Uses a nonce-based login step to reduce replay attack risk.",
    icon: KeyRound,
    color: "text-orange-400",
  },
  {
    title: "QR-Based TOTP MFA",
    description: "Adds authenticator-app based second-factor verification before access.",
    icon: ScanLine,
    color: "text-purple-400",
  },
  {
    title: "Session Token Management",
    description: "Issues controlled session tokens after successful authentication.",
    icon: ShieldCheck,
    color: "text-blue-400",
  },
  {
    title: "Rate Limiting",
    description: "Limits repeated requests and reduces brute-force style abuse.",
    icon: TimerReset,
    color: "text-pink-400",
  },
  {
    title: "Account Lockout",
    description: "Automatically locks accounts after repeated failed login attempts.",
    icon: Lock,
    color: "text-red-400",
  },
  {
    title: "Audit Logging",
    description: "Records authentication events for monitoring and incident review.",
    icon: TerminalSquare,
    color: "text-yellow-400",
  },
  {
    title: "Admin Monitoring",
    description: "Provides visibility into users, sessions, logs, and locked accounts.",
    icon: MonitorCog,
    color: "text-cyan-400",
  },
];

const techStack = [
  {
    category: "Frontend",
    items: ["React", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui"],
    icon: Cpu,
    color: "text-cyan-400",
  },
  {
    category: "Backend API",
    items: ["FastAPI", "Python", "REST API", "JSON"],
    icon: Server,
    color: "text-green-400",
  },
  {
    category: "Networking",
    items: ["TCP Sockets", "Client-Server", "JSON over TCP", "Nonce Flow"],
    icon: Network,
    color: "text-blue-400",
  },
  {
    category: "Database",
    items: ["SQLite", "Users", "Sessions", "Audit Logs", "MFA Secrets"],
    icon: Database,
    color: "text-orange-400",
  },
  {
    category: "Security",
    items: ["Password Hashing", "Email OTP", "TOTP MFA", "Session Expiry"],
    icon: ShieldCheck,
    color: "text-purple-400",
  },
  {
    category: "Email Delivery",
    items: ["SMTP", "Gmail App Password", "OTP Expiry", "Verification"],
    icon: MailCheck,
    color: "text-pink-400",
  },
];

const businessValues = [
  "Reduces unauthorized account access",
  "Improves login security with layered authentication",
  "Provides administrator visibility into suspicious events",
  "Supports account recovery through controlled unlock workflow",
  "Demonstrates networking, security, and backend integration together",
  "Suitable as a base for secure internal authentication portals",
];

export default function Welcome() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const username = sessionStorage.getItem("client_login_identifier") || "User";
  const [activeFeature, setActiveFeature] = useState(securityFeatures[0]);

  const ActiveIcon = activeFeature.icon;

  const handleLogout = () => {
    sessionStorage.removeItem("client_session_token");
    sessionStorage.removeItem("client_login_identifier");
    sessionStorage.removeItem("client_temp_token");
    navigate("/login");
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <AnimatedBackground />

      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex min-h-[64px] max-w-[1280px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <StackedLogo size={18} />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em]">
                SecureAuth
              </p>
              <p className="text-xs text-muted-foreground">
                Secure Network-Based Authentication Platform
              </p>
            </div>
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

            <Button variant="outline" onClick={() => navigate("/user")}>
              <UserRound className="mr-2 h-4 w-4" />
              User Area
            </Button>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-md border border-border bg-card/80 p-7">
            <div className="mb-4 flex w-fit items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Secure session active for {username}
            </div>

            <h1 className="max-w-[900px] text-[clamp(2.4rem,5vw,5rem)] font-medium leading-[0.95] tracking-[-0.065em]">
              Enterprise-style authentication with layered security controls.
            </h1>

            <p className="mt-6 max-w-[820px] text-base leading-relaxed text-muted-foreground">
              SecureAuth is a network-based authentication system designed to
              protect user access through email verification, nonce-based login,
              QR-based MFA, session control, rate limiting, account lockout, and
              real-time administrator monitoring.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate("/user")}>
                Open User Console
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          </div>

          <Card className="border-border bg-card/80 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-background">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                </div>

                <div>
                  <p className="text-sm font-medium">Platform Value</p>
                  <p className="text-xs text-muted-foreground">
                    Built for secure access visibility
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {businessValues.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-md border border-border bg-background/50 px-3 py-2 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6">
          <div className="mb-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Core Security Capabilities
            </h2>
            <p className="text-sm text-muted-foreground">
              A complete authentication flow with prevention, verification,
              monitoring, and recovery.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
            {securityFeatures.map((feature) => {
              const Icon = feature.icon;
              const active = activeFeature.title === feature.title;

              return (
                <button
                  key={feature.title}
                  type="button"
                  onClick={() => setActiveFeature(feature)}
                  className={`bg-background p-4 text-left transition-colors hover:bg-muted/30 ${
                    active ? "bg-muted/50" : ""
                  }`}
                >
                  <Icon className={`h-5 w-5 ${feature.color}`} />
                  <h3 className="mt-3 text-sm font-medium">{feature.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Technology Stack
            </h2>
            <p className="text-sm text-muted-foreground">
              Technologies used to build the frontend, backend, networking layer,
              security controls, and storage.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
            {techStack.map((stack) => {
              const Icon = stack.icon;

              return (
                <div key={stack.category} className="bg-background p-5">
                  <Icon className={`h-5 w-5 ${stack.color}`} />
                  <h3 className="mt-3 text-sm font-medium">{stack.category}</h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {stack.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-sm border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <Card className="border-border bg-card/80 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-background">
                  <ActiveIcon className={`h-6 w-6 ${activeFeature.color}`} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Selected Capability
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {activeFeature.title}
                  </h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {activeFeature.description}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <RadioTower className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold tracking-tight">
                  Networking and Security Design
                </h2>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "TCP socket programming",
                  "Client-server architecture",
                  "JSON-based protocol messages",
                  "Nonce-based replay protection",
                  "Session expiry handling",
                  "Audit logging and monitoring",
                  "Rate limiting and lockout",
                  "Admin-controlled unlock workflow",
                ].map((concept, index) => {
                  const colors = [
                    "text-blue-400",
                    "text-purple-400",
                    "text-orange-400",
                    "text-green-400",
                    "text-pink-400",
                    "text-red-400",
                    "text-cyan-400",
                    "text-yellow-400",
                  ];

                  return (
                    <div
                      key={concept}
                      className="flex items-center gap-3 rounded-md border border-border bg-background/50 px-3 py-2 text-sm"
                    >
                      <Layers className={`h-4 w-4 ${colors[index]}`} />
                      <span>{concept}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6">
          <Card className="border-border bg-card/80 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Workflow className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold tracking-tight">
                  Authentication Lifecycle
                </h2>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  "User registers and verifies email ownership",
                  "Primary login starts with identifier and password",
                  "Server issues a nonce-based challenge",
                  "Authenticator app verifies user with time-based OTP",
                  "Backend issues secure session token",
                  "Admin panel monitors users, sessions, logs, and lockouts",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-3 rounded-md border border-border bg-background/50 p-3 text-sm"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-xs">
                      {index + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}