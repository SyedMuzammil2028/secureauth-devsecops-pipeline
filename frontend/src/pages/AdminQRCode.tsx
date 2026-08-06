import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Moon,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";

import { generateAdminQr } from "@/lib/adminAuth";
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

export default function AdminQRCode() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [qrData, setQrData] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tempToken = sessionStorage.getItem("admin_temp_token");

    if (!tempToken) {
      setError("Admin QR session not found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchQr = async () => {
      try {
        const response = await generateAdminQr({ temp_token: tempToken });

        setQrData(response.qr_data);
        setUsername(response.username);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load admin QR code.");
      } finally {
        setLoading(false);
      }
    };

    fetchQr();
  }, []);

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
                Admin QR setup
              </p>

              <h1 className="max-w-[560px] text-[clamp(2.3rem,4.5vw,4.6rem)] font-[500] leading-[0.96] tracking-[-0.06em]">
                Scan the admin QR code to generate secure time-based OTPs.
              </h1>

              <p className="mt-6 max-w-[500px] text-base leading-relaxed text-muted-foreground">
                Use an authenticator app and return to the admin MFA page after scanning.
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
                    <Smartphone className="h-5 w-5 text-primary" />
                    <span className="text-sm">Open your authenticator app</span>
                  </div>

                  <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                    <ScanLine className="h-5 w-5 text-primary" />
                    <span className="text-sm">Scan the admin QR code</span>
                  </div>

                  <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <span className="text-sm">Use the OTP on admin MFA page</span>
                  </div>

                  <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm">Admin access remains MFA protected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-[calc(100vh-96px)] items-center justify-center py-4">
            <Card className="w-full max-w-[620px] border-border bg-card/80 shadow-none backdrop-blur">
              <CardHeader className="space-y-4 pb-4">
                <button
                  type="button"
                  onClick={() => navigate("/admin/mfa")}
                  className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Admin MFA
                </button>

                <div className="space-y-3">
                  <CardTitle className="text-4xl font-medium tracking-tight">
                    Scan Admin QR Code
                  </CardTitle>

                  <CardDescription className="text-base">
                    Scan this QR code and return to admin MFA verification.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {loading && (
                  <div className="rounded-md border border-border bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading admin QR code...
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {!loading && !error && qrData && (
                  <>
                    {username && (
                      <div className="rounded-md border border-border bg-background/60 px-4 py-2.5 text-sm text-muted-foreground">
                        <span>Admin Account:</span>{" "}
                        <span className="break-all font-semibold text-foreground">
                          {username}
                        </span>
                      </div>
                    )}

                    <div className="rounded-xl border border-border bg-white p-5">
                      <img
                        src={`data:image/png;base64,${qrData}`}
                        alt="Admin MFA QR Code"
                        className="mx-auto h-64 w-64 rounded-md object-contain"
                      />
                    </div>

                    <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                      Admin QR code generated successfully. Scan it, then return
                      to admin MFA and enter the 6-digit OTP.
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" onClick={() => navigate("/admin/mfa")}>
                    Continue to Admin MFA
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/login")}
                  >
                    Back to Admin Login
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Do not share this admin QR code. Anyone with this setup secret
                  can generate admin MFA codes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}