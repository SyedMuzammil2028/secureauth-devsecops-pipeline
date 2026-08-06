import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Moon, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { adminLoginStart } from "@/lib/adminAuth";
import { StackedLogo } from "@/components/StackedLogo";
import { Logo3D } from "@/components/Logo3D";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Enter admin username and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await adminLoginStart({
        username: username.trim(),
        password,
      });

      sessionStorage.setItem("admin_temp_token", response.temp_token);
      sessionStorage.setItem("admin_login_identifier", username.trim());

      navigate("/admin/mfa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background px-6">
        <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <StackedLogo size={16} />
            <span className="text-[14px] font-bold uppercase tracking-[0.08em]">
              SecureAuth
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative flex h-8 w-8 items-center justify-center text-foreground/70 hover:text-foreground"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
        </div>
      </nav>

      <div className="min-h-screen px-6 pb-8 pt-20">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[calc(100vh-96px)] overflow-hidden pr-8 lg:flex lg:flex-col lg:justify-center">
            <div className="relative z-10">
              <p className="mb-3 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                Administrative access
              </p>

              <h1 className="max-w-[560px] text-[clamp(2.3rem,4.5vw,4.6rem)] font-[500] leading-[0.96] tracking-[-0.06em]">
                Monitor users, sessions, logs, and locked accounts securely.
              </h1>

              <p className="mt-6 max-w-[500px] text-base leading-relaxed text-muted-foreground">
                Admin authentication is separated from user login and protected
                with MFA before access to sensitive monitoring panels.
              </p>

              <div className="relative mt-8">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-35">
                  <Logo3D
                    variant={1}
                    size={430}
                    zoom={250}
                    bgHex="#0e0e10"
                    lineHex="#58585e"
                  />
                </div>

                <div className="relative z-10 grid gap-3">
                  <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm">Protected admin dashboard</span>
                  </div>

                  <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                    <LockKeyhole className="h-5 w-5 text-primary" />
                    <span className="text-sm">MFA required before access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-96px)] items-center justify-center py-4">
            <Card className="w-full max-w-[560px] border-border bg-card/80 shadow-none backdrop-blur">
              <CardHeader className="space-y-4">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </button>

                <div>
                  <CardTitle className="text-4xl font-medium tracking-tight">
                    Admin Login
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Enter administrator credentials to continue.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username">Admin Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter admin username"
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  {error && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Authenticating..." : "Continue to MFA"}
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    This panel is only for authorized administrators.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}