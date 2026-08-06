import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  ArrowLeft,
  ShieldCheck,
  MailCheck,
  KeyRound,
} from "lucide-react";
import { useTheme } from "next-themes";

import { registerStart } from "@/lib/clientAuth";
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
import { Progress } from "@/components/ui/progress";

const countryOptions = [
  { name: "Pakistan", code: "+92" },
  { name: "India", code: "+91" },
  { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "UAE", code: "+971" },
  { name: "Turkey", code: "+90" },
  { name: "Canada", code: "+1" },
  { name: "Australia", code: "+61" },
  { name: "Germany", code: "+49" },
  { name: "France", code: "+33" },
  { name: "China", code: "+86" },
  { name: "Japan", code: "+81" },
  { name: "Malaysia", code: "+60" },
  { name: "Indonesia", code: "+62" },
];

function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^\w\s]/.test(password),
  };
}

function getPasswordStrength(password: string) {
  const checks = Object.values(getPasswordChecks(password));
  return checks.filter(Boolean).length;
}

export default function Register() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    country_code: "+92",
    phone_number: "",
    postal_code: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const checks = useMemo(() => getPasswordChecks(form.password), [form.password]);
  const progressValue = (strength / 5) * 100;

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (strength < 5) {
      setError("Password does not meet all security requirements.");
      return;
    }

    setLoading(true);

    try {
      await registerStart({
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
        password: form.password,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        nationality: form.nationality,
        country_code: form.country_code,
        phone_number: form.phone_number,
        postal_code: form.postal_code,
      });

      sessionStorage.setItem(
        "pending_registration",
        JSON.stringify({
          first_name: form.first_name,
          last_name: form.last_name,
          username: form.username,
          email: form.email,
          password: form.password,
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          nationality: form.nationality,
          country_code: form.country_code,
          phone_number: form.phone_number,
          postal_code: form.postal_code,
        })
      );

      navigate("/verify-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
              onClick={() => navigate("/login")}
              className="h-8 px-3 text-[13px] text-foreground/70 transition-colors hover:text-foreground"
              type="button"
            >
              Log in
            </button>
          </div>
        </div>
      </nav>

      <div className="min-h-screen px-6 pb-6 pt-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative hidden min-h-[820px] overflow-hidden pr-8 lg:flex lg:flex-col lg:justify-center">
              <div className="relative z-10">
                <p className="mb-3 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
                  Secure registration
                </p>

                <h1 className="max-w-[560px] text-[clamp(2.3rem,4.5vw,4.6rem)] font-[500] leading-[0.96] tracking-[-0.06em]">
                  Create your account with email verification and strong protection.
                </h1>

                <p className="mt-6 max-w-[500px] text-base leading-relaxed text-muted-foreground">
                  Register with your personal details, use a strong password, receive
                  an OTP on email, and complete secure onboarding before login.
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
                      <MailCheck className="h-5 w-5 text-primary" />
                      <span className="text-sm">Email OTP verification required</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                      <KeyRound className="h-5 w-5 text-primary" />
                      <span className="text-sm">Strong password validation</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="text-sm">Security-first account creation</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                      <MailCheck className="h-5 w-5 text-primary" />
                      <span className="text-sm">Profile data validation</span>
                    </div>

                    <div className="flex items-center gap-3 rounded-sm border border-border bg-background/55 px-4 py-3 backdrop-blur-[1px]">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="text-sm">Prepared for MFA onboarding</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-center">
              <Card className="w-full max-w-[720px] border-border bg-card/80 shadow-none backdrop-blur">
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
                      Create account
                    </CardTitle>
                    <CardDescription className="text-base">
                      Register your secure account and verify your email with OTP.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2.5">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={form.first_name}
                          onChange={(e) => handleChange("first_name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={form.last_name}
                          onChange={(e) => handleChange("last_name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={form.username}
                          onChange={(e) => handleChange("username", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={form.date_of_birth}
                          onChange={(e) => handleChange("date_of_birth", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                          id="gender"
                          value={form.gender}
                          onChange={(e) => handleChange("gender", e.target.value)}
                          className="flex h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        >
                          <option value="" disabled>
                            Select gender
                          </option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="country_code">Country Code</Label>
                        <input
                          id="country_code"
                          list="country-code-list"
                          value={form.country_code}
                          onChange={(e) => handleChange("country_code", e.target.value)}
                          placeholder="Search country or code"
                          className="flex h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        />
                        <datalist id="country-code-list">
                          {countryOptions.map((country) => (
                            <option
                              key={`${country.name}-${country.code}`}
                              value={country.code}
                            >
                              {country.name} ({country.code})
                            </option>
                          ))}
                        </datalist>
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          value={form.nationality}
                          onChange={(e) => handleChange("nationality", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          value={form.phone_number}
                          onChange={(e) => handleChange("phone_number", e.target.value)}
                          placeholder="311 77766699"
                          required
                        />
                      </div>

                      <div className="space-y-2.5">
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={form.postal_code}
                        onChange={(e) => handleChange("postal_code", e.target.value)} 
                        required
                      />
                    </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={form.password}
                          onChange={(e) => handleChange("password", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="confirm_password">Confirm Password</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={form.confirm_password}
                          onChange={(e) => handleChange("confirm_password", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-border p-5">
                      <div className="flex items-center justify-between text-sm">
                        <span>Password strength</span>
                        <span>{strength}/5</span>
                      </div>

                      <Progress value={progressValue} />

                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <div>{checks.minLength ? "✓" : "✗"} At least 8 characters</div>
                        <div>{checks.uppercase ? "✓" : "✗"} One uppercase letter</div>
                        <div>{checks.lowercase ? "✓" : "✗"} One lowercase letter</div>
                        <div>{checks.digit ? "✓" : "✗"} One number</div>
                        <div>{checks.special ? "✓" : "✗"} One special character</div>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" className="sm:min-w-40" disabled={loading}>
                        {loading ? "Sending OTP..." : "Send OTP"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/login")}
                      >
                        Back to login
                      </Button>
                    </div>
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