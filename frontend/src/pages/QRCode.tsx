import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  ArrowLeft,
  ShieldCheck,
  ScanLine,
  Smartphone,
  KeyRound,
} from "lucide-react";
import { useTheme } from "next-themes";

import { generateClientQr } from "@/lib/clientAuth";
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

export default function QRCode() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [qrData, setQrData] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tempToken = sessionStorage.getItem("client_temp_token");

    if (!tempToken) {
      setError("QR session not found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchQr = async () => {
      try {
        const response = await generateClientQr({
          temp_token: tempToken,
        });

        setQrData(response.qr_data);
        setUsername(response.username);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load QR code.");
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
              onClick={() => navigate("/login")}
              className="h-8 px-3 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              type="button"
            >
              Log in
            </button>
          </div>
        </div>
      </nav>

      <div className="min-h-screen px-6 pb-8 pt-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {/* Left side */}
            <div className="relative hidden min-h-[calc(100vh-96px)] overflow-hidden pr-8 lg:flex lg:flex-col lg:justify-center">
              <div className="relative z-10">
                <p className="mb-3 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                  QR authenticator setup
                </p>

                <h1 className="max-w-[560px] text-[clamp(2.3rem,4.5vw,4.6rem)] font-[500] leading-[0.96] tracking-[-0.06em]">
                  Scan the QR code to generate your time-based OTP.
                </h1>

                <p className="mt-6 max-w-[500px] text-base leading-relaxed text-muted-foreground">
                  Use Google Authenticator, Microsoft Authenticator, Authy, or any
                  TOTP-compatible app. After scanning, return to MFA verification
                  and enter the 6-digit code.
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
                      <span className="text-sm">Scan this dynamically generated QR</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                      <KeyRound className="h-5 w-5 text-primary" />
                      <span className="text-sm">Use the 6-digit OTP on the MFA page</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="text-sm">
                        QR is generated from your saved MFA secret
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex min-h-[calc(100vh-96px)] items-center justify-center py-4">
              <Card className="w-full max-w-[620px] border-border bg-card/80 shadow-none backdrop-blur">
                <CardHeader className="space-y-4 pb-4">
                  <button
                    type="button"
                    onClick={() => navigate("/mfa")}
                    className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to MFA
                  </button>

                  <div className="space-y-3">
                    <CardTitle className="text-4xl font-medium tracking-tight">
                      Scan QR Code
                    </CardTitle>

                    <CardDescription className="text-base">
                      Scan this QR code and return to MFA verification.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {loading && (
                    <div className="rounded-md border border-border bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
                      Loading QR code...
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
                          <span>Account:</span>{" "}
                          <span className="break-all font-semibold text-foreground">
                            {username}
                          </span>
                        </div>
                      )}

                      <div className="rounded-xl border border-border bg-white p-5">
                        <img
                          src={`data:image/png;base64,${qrData}`}
                          alt="MFA QR Code"
                          className="mx-auto h-64 w-64 rounded-md object-contain"
                        />
                      </div>

                      <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                        QR code successfully generated. Scan it in your
                        authenticator app, then return to the MFA page and enter
                        the 6-digit OTP.
                      </div>
                    </>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" onClick={() => navigate("/mfa")}>
                      Continue to MFA
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/login")}
                    >
                      Back to Login
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Do not share this QR code. Anyone with this setup secret can
                    generate MFA codes for your account.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}