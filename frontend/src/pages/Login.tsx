import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  ScanLine,
} from "lucide-react";
import { useTheme } from "next-themes";

import { loginStart, loginVerify } from "@/lib/clientAuth";
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

async function buildHmacResponse(password: string, nonce: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const nonceBytes = encoder.encode(nonce);

  const passwordHash = await crypto.subtle.digest("SHA-256", passwordBytes);
  const key = await crypto.subtle.importKey(
    "raw",
    passwordHash,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, nonceBytes);

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Login() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const startResponse = await loginStart({
        login_identifier: loginIdentifier,
        password,
      });

      const nonce = startResponse.nonce;
      const hmacResponse = await buildHmacResponse(password, nonce);

      const verifyResponse = await loginVerify({
        login_identifier: loginIdentifier,
        password,
        nonce,
        hmac_response: hmacResponse,
      });

      sessionStorage.setItem("client_temp_token", verifyResponse.temp_token);
      sessionStorage.setItem("client_login_identifier", loginIdentifier);

      navigate("/mfa");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background px-6">
        <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between">
          <Link to="/" className="flex items-center gap-2 -ml-0.5">
            <StackedLogo size={16} />
            <span className="text-[14px] font-bold uppercase tracking-[0.08em] text-foreground">
              SecureAuth
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative flex h-8 w-8 items-center justify-center text-foreground/70 transition-colors hover:text-foreground"
              title="Toggle theme"
              type="button"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            <button
              onClick={() => navigate("/register")}
              className="h-8 border border-foreground/40 px-3 text-[13px] text-foreground transition-colors hover:bg-foreground hover:text-background"
              type="button"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      <div className="h-screen overflow-hidden px-6 pb-6 pt-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative hidden h-[calc(100vh-96px)] overflow-hidden pr-8 lg:flex lg:flex-col lg:justify-center">
              <div className="relative z-10">
                <p className="mb-3 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                  Secure login
                </p>

                <h1 className="max-w-[560px] text-[clamp(2.3rem,4.5vw,4.6rem)] font-[500] leading-[0.96] tracking-[-0.06em]">
                  Access your account with challenge-response security.
                </h1>

                <p className="mt-6 max-w-[500px] text-base leading-relaxed text-muted-foreground">
                  Sign in using your username or email. The system verifies your
                  password, generates a fresh nonce, validates the HMAC proof, and
                  then redirects you to MFA verification.
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
                      <KeyRound className="h-5 w-5 text-primary" />
                      <span className="text-sm">Username or email authentication</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="text-sm">Nonce-based challenge-response login</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                      <ScanLine className="h-5 w-5 text-primary" />
                      <span className="text-sm">QR / TOTP MFA required after password check</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-[calc(100vh-96px)] items-center justify-center">
              <Card className="w-full max-w-[620px] border-border bg-card/80 shadow-none backdrop-blur lg:max-h-[calc(100vh-120px)]">
                <CardHeader className="space-y-3 pb-4">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                  </button>

                  <div className="space-y-2">
                    <CardTitle className="text-4xl font-medium tracking-tight">
                      Log in
                    </CardTitle>
                    <CardDescription className="text-base">
                      Access your secure account using username or email.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2.5">
                      <Label htmlFor="loginIdentifier">Username or Email</Label>
                      <Input
                        id="loginIdentifier"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Enter username or email"
                        autoComplete="username"
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
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

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" className="sm:min-w-40" disabled={loading}>
                        {loading ? "Signing in..." : "Log in"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/register")}
                      >
                        Create account
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      After password verification, you will continue to MFA verification.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}