import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Laptop,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import AnimatedBackground from "@/components/AnimatedBackground";
import { StackedLogo } from "@/components/StackedLogo";
import {
  deleteOwnAccount,
  getUserProfile,
  getUserSessions,
  logoutClient,
  requestEmailChange,
  verifyEmailChange,
  type UserProfileResponse,
  type UserSessionsResponse,
} from "@/lib/clientAuth";
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

type UserSession = UserSessionsResponse["sessions"][number];

function formatDate(value: string | null | undefined) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function shortToken(token: string) {
  if (!token) return "N/A";
  if (token.length <= 20) return token;

  return `${token.slice(0, 10)}...${token.slice(-8)}`;
}

function StatusPill({
  active,
  trueText,
  falseText,
  color,
}: {
  active: boolean;
  trueText: string;
  falseText: string;
  color: "green" | "purple" | "blue" | "red";
}) {
  const classes = {
    green: "border-green-500/30 bg-green-500/10 text-green-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs ${
        active ? classes[color] : classes.red
      }`}
    >
      {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {active ? trueText : falseText}
    </span>
  );
}

export default function UserArea() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  const [newEmail, setNewEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);

  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteReason, setDeleteReason] = useState("User requested account deletion.");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [requestingEmail, setRequestingEmail] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const [showTokens, setShowTokens] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");

  const sessionToken = sessionStorage.getItem("client_session_token");

  const loadData = async () => {
    if (!sessionToken) {
      navigate("/login");
      return;
    }

    setLoadingProfile(true);
    setError("");

    try {
      const profileResponse = await getUserProfile(sessionToken);
      const sessionsResponse = await getUserSessions(sessionToken);

      setProfile(profileResponse);
      setSessions(sessionsResponse.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user data.");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSessions = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();

    if (!query) return sessions;

    return sessions.filter((session) => {
      return (
        session.login_identifier.toLowerCase().includes(query) ||
        session.session_token.toLowerCase().includes(query) ||
        String(session.ip_address || "").toLowerCase().includes(query)
      );
    });
  }, [sessionSearch, sessions]);

  const activeSessions = sessions.filter((session) => !session.is_revoked).length;
  const revokedSessions = sessions.filter((session) => session.is_revoked).length;

  const handleRequestEmailChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!sessionToken) {
      setError("Session not found.");
      return;
    }

    if (!newEmail.trim()) {
      setError("Enter a new email address.");
      return;
    }

    setRequestingEmail(true);

    try {
      const response = await requestEmailChange(sessionToken, newEmail.trim());
      setMessage(response.message || "OTP sent to new email.");
      setEmailChangeRequested(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request email change.");
    } finally {
      setRequestingEmail(false);
    }
  };

  const handleVerifyEmailChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!sessionToken) {
      setError("Session not found.");
      return;
    }

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError("Enter a valid 6-digit OTP code.");
      return;
    }

    setVerifyingEmail(true);

    try {
      const response = await verifyEmailChange(
        sessionToken,
        newEmail.trim(),
        otpCode.trim()
      );

      setMessage(response.message || "Email updated successfully.");
      setEmailChangeRequested(false);
      setOtpCode("");

      const updatedProfile = await getUserProfile(sessionToken);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify email change.");
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleDeleteAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!sessionToken) {
      setError("Session not found.");
      return;
    }

    if (!/^\d{6}$/.test(deleteOtp.trim())) {
      setError("Enter a valid 6-digit MFA OTP code to delete your account.");
      return;
    }

    if (deleteConfirmText.trim() !== "DELETE") {
      setError('Type DELETE in the confirmation box to continue.');
      return;
    }

    const confirmed = window.confirm(
      "This will delete your account, revoke your sessions, and log you out. Continue?"
    );

    if (!confirmed) return;

    setDeletingAccount(true);

    try {
      const response = await deleteOwnAccount(
        sessionToken,
        deleteOtp.trim(),
        deleteReason.trim() || "User requested account deletion."
      );

      sessionStorage.removeItem("client_session_token");
      sessionStorage.removeItem("client_login_identifier");
      sessionStorage.removeItem("client_temp_token");

      alert(response.message || "Account deleted successfully.");
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await logoutClient({ session_token: sessionToken });
      } catch {
        // Local logout should still happen.
      }
    }

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
                User Security Console
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/welcome")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Welcome
            </Button>

            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="mb-5 rounded-md border border-border bg-card/80 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            User Console
          </p>
          <h1 className="mt-2 text-[clamp(2rem,4vw,3.8rem)] font-medium leading-[0.98] tracking-[-0.055em]">
            Manage your profile, sessions, and account security.
          </h1>
          <p className="mt-4 max-w-[760px] text-sm leading-relaxed text-muted-foreground">
            This dashboard shows your profile details, active authentication
            session, session history, MFA status, secure email update flow, and
            protected account deletion.
          </p>
        </div>

        {loadingProfile && (
          <Card className="border-border bg-card/80 shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Loading user details...
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            {message}
          </div>
        )}

        {!loadingProfile && profile && (
          <>
            <section className="mb-6 grid gap-4 md:grid-cols-4">
              <Card className="border-border bg-card/80 shadow-none">
                <CardContent className="p-5">
                  <UserRound className="h-5 w-5 text-purple-400" />
                  <p className="mt-3 text-xs text-muted-foreground">Username</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight">
                    {profile.username}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 shadow-none">
                <CardContent className="p-5">
                  <Smartphone className="h-5 w-5 text-purple-400" />
                  <p className="mt-3 text-xs text-muted-foreground">MFA Status</p>
                  <p className="mt-2">
                    <StatusPill
                      active={Boolean(profile.mfa_enabled)}
                      trueText="Enabled"
                      falseText="Disabled"
                      color="purple"
                    />
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 shadow-none">
                <CardContent className="p-5">
                  <Mail className="h-5 w-5 text-green-400" />
                  <p className="mt-3 text-xs text-muted-foreground">Email Status</p>
                  <p className="mt-2">
                    <StatusPill
                      active={Boolean(profile.is_email_verified)}
                      trueText="Verified"
                      falseText="Unverified"
                      color="green"
                    />
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 shadow-none">
                <CardContent className="p-5">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <p className="mt-3 text-xs text-muted-foreground">Active Sessions</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight">
                    {activeSessions}
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="border-border bg-card/80 shadow-none">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your registered account details</CardDescription>
                </CardHeader>

                <CardContent className="grid gap-3 text-sm">
                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="text-muted-foreground">Name</span>
                    <span>
                      {profile.first_name} {profile.last_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="text-muted-foreground">Username</span>
                    <span>{profile.username}</span>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="text-muted-foreground">Email</span>
                    <span className="break-all">{profile.email}</span>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span>{profile.date_of_birth || "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="text-muted-foreground">Gender</span>
                    <span>{profile.gender || "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="text-muted-foreground">Nationality</span>
                    <span>{profile.nationality || "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <span className="text-muted-foreground">Phone</span>
                    <span>
                      {profile.country_code} {profile.phone_number}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 shadow-none">
                <CardHeader>
                  <CardTitle>Current Session</CardTitle>
                  <CardDescription>Session currently being used</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">Session Token</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTokens((value) => !value)}
                    >
                      {showTokens ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="rounded-md border border-border bg-background/50 p-3 font-mono text-xs break-all">
                    {showTokens
                      ? profile.session.session_token
                      : shortToken(profile.session.session_token)}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">Login Identifier</p>
                      <p className="mt-1 break-all">{profile.session.login_identifier}</p>
                    </div>

                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">IP Address</p>
                      <p className="mt-1">{profile.session.ip_address || "N/A"}</p>
                    </div>

                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">Issued At</p>
                      <p className="mt-1">{formatDate(profile.session.issued_at)}</p>
                    </div>

                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">Expires At</p>
                      <p className="mt-1">{formatDate(profile.session.expires_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              <Card className="border-border bg-card/80 shadow-none">
                <CardHeader>
                  <CardTitle>Change Email</CardTitle>
                  <CardDescription>
                    Verify a new email using OTP before updating your account.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <form onSubmit={handleRequestEmailChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">New Email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={requestingEmail}>
                      {requestingEmail ? "Sending OTP..." : "Send Email Change OTP"}
                    </Button>
                  </form>

                  {emailChangeRequested && (
                    <form onSubmit={handleVerifyEmailChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="otpCode">OTP Code</Label>
                        <Input
                          id="otpCode"
                          value={otpCode}
                          onChange={(e) =>
                            setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="Enter 6-digit OTP"
                          inputMode="numeric"
                          maxLength={6}
                          required
                        />
                      </div>

                      <Button type="submit" variant="outline" disabled={verifyingEmail}>
                        {verifyingEmail ? "Verifying..." : "Verify New Email"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80 shadow-none">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Session Records</CardTitle>
                      <CardDescription>
                        {activeSessions} active, {revokedSessions} revoked
                      </CardDescription>
                    </div>

                    <div className="relative w-full sm:w-[260px]">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={sessionSearch}
                        onChange={(e) => setSessionSearch(e.target.value)}
                        placeholder="Search sessions..."
                        className="pl-8"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {filteredSessions.length === 0 ? (
                    <div className="rounded-md border border-border bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
                      No sessions found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSessions.map((session) => (
                        <div
                          key={session.id}
                          className="rounded-md border border-border bg-background/40 p-4 text-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {session.is_revoked ? (
                                <XCircle className="h-4 w-4 text-red-400" />
                              ) : (
                                <Laptop className="h-4 w-4 text-blue-400" />
                              )}

                              <div>
                                <p className="font-medium">
                                  {session.login_identifier}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {session.ip_address || "Unknown IP"}
                                </p>
                              </div>
                            </div>

                            <StatusPill
                              active={!Boolean(session.is_revoked)}
                              trueText="Active"
                              falseText="Revoked"
                              color="blue"
                            />
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Issued</p>
                              <p className="mt-1">{formatDate(session.issued_at)}</p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">Expires</p>
                              <p className="mt-1">{formatDate(session.expires_at)}</p>
                            </div>
                          </div>

                          <div className="mt-3 rounded-md border border-border bg-background/50 p-2 font-mono text-xs break-all">
                            {showTokens
                              ? session.session_token
                              : shortToken(session.session_token)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="mt-6">
              <Card className="border-red-500/30 bg-red-500/5 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <Trash2 className="h-5 w-5" />
                    Delete Account
                  </CardTitle>
                  <CardDescription>
                    This action requires your current MFA OTP. Your account will be
                    soft-deleted, all sessions will be revoked, and a confirmation
                    email will be sent to your registered email address.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-5 rounded-md border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-400">
                    <div className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Account deletion is protected. Enter your authenticator app
                        OTP and type <span className="font-semibold">DELETE</span> to
                        confirm. You will be logged out immediately after deletion.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleDeleteAccount} className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="deleteOtp">MFA OTP Code</Label>
                      <Input
                        id="deleteOtp"
                        value={deleteOtp}
                        onChange={(e) =>
                          setDeleteOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="Enter 6-digit OTP"
                        inputMode="numeric"
                        maxLength={6}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deleteConfirmText">Confirmation</Label>
                      <Input
                        id="deleteConfirmText"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deleteReason">Reason</Label>
                      <Input
                        id="deleteReason"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Reason for deletion"
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={deletingAccount}
                        className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingAccount ? "Deleting Account..." : "Delete My Account"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}