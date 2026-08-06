import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Laptop,
  RefreshCw,
  Search,
  ShieldX,
  Timer,
  XCircle,
} from "lucide-react";

import AdminShell from "@/components/layout/AdminShell";
import {
  getAdminSessions,
  revokeUserSession,
  type AdminSession,
} from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function boolValue(value: number | boolean) {
  return value === true || value === 1;
}

function formatDate(value: string | null) {
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

export default function AdminSessions() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "revoked">("all");
  const [showTokens, setShowTokens] = useState(false);
  const [revokingToken, setRevokingToken] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const adminSessionToken = sessionStorage.getItem("admin_session_token");

  const loadSessions = async () => {
    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await getAdminSessions(adminSessionToken);
      setSessions(response.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSessions = useMemo(() => {
    const search = query.trim().toLowerCase();

    return sessions.filter((session) => {
      const revoked = boolValue(session.is_revoked);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && !revoked) ||
        (filter === "revoked" && revoked);

      const matchesSearch =
        !search ||
        session.username.toLowerCase().includes(search) ||
        session.email.toLowerCase().includes(search) ||
        session.login_identifier.toLowerCase().includes(search) ||
        session.session_token.toLowerCase().includes(search) ||
        String(session.ip_address || "").toLowerCase().includes(search);

      return matchesFilter && matchesSearch;
    });
  }, [filter, query, sessions]);

  const activeCount = sessions.filter((session) => !boolValue(session.is_revoked)).length;
  const revokedCount = sessions.filter((session) => boolValue(session.is_revoked)).length;

  const handleRevoke = async (sessionToken: string) => {
    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    setError("");
    setSuccess("");
    setRevokingToken(sessionToken);

    try {
      const response = await revokeUserSession(adminSessionToken, sessionToken);
      setSuccess(response.message || "Session revoked successfully.");
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke session.");
    } finally {
      setRevokingToken("");
    }
  };

  return (
    <AdminShell
      title="Admin Sessions"
      description="Monitor active sessions and revoke suspicious session tokens."
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <Clock className="h-5 w-5 text-green-400" />
            <p className="mt-3 text-xs text-muted-foreground">Total Sessions</p>
            <p className="mt-1 text-3xl font-semibold">{sessions.length}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <CheckCircle2 className="h-5 w-5 text-blue-400" />
            <p className="mt-3 text-xs text-muted-foreground">Active</p>
            <p className="mt-1 text-3xl font-semibold">{activeCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <XCircle className="h-5 w-5 text-red-400" />
            <p className="mt-3 text-xs text-muted-foreground">Revoked</p>
            <p className="mt-1 text-3xl font-semibold">{revokedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 rounded-md border border-border bg-card/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_150px_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username, email, login ID, IP, or token..."
              className="pl-9"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "active" | "revoked")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Sessions</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>

          <Button variant="outline" onClick={() => setShowTokens((value) => !value)}>
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

          <Button variant="outline" onClick={loadSessions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          {success}
        </div>
      )}

      {loading && (
        <div className="rounded-md border border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
          Loading sessions...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4">
          {filteredSessions.length === 0 ? (
            <div className="rounded-md border border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No sessions found.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const revoked = boolValue(session.is_revoked);

              return (
                <Card key={session.id} className="border-border bg-card/80 shadow-none">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-md border ${
                            revoked
                              ? "border-red-500/30 bg-red-500/10"
                              : "border-green-500/30 bg-green-500/10"
                          }`}
                        >
                          {revoked ? (
                            <XCircle className="h-5 w-5 text-red-400" />
                          ) : (
                            <Laptop className="h-5 w-5 text-green-400" />
                          )}
                        </div>

                        <div>
                          <p className="font-medium">{session.username}</p>
                          <p className="text-sm text-muted-foreground">{session.email}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Login ID: {session.login_identifier}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-sm border px-2 py-1 text-xs ${
                            revoked
                              ? "border-red-500/30 bg-red-500/10 text-red-400"
                              : "border-green-500/30 bg-green-500/10 text-green-400"
                          }`}
                        >
                          {revoked ? "Revoked" : "Active"}
                        </span>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={revoked || revokingToken === session.session_token}
                          onClick={() => handleRevoke(session.session_token)}
                        >
                          <ShieldX className="mr-2 h-4 w-4" />
                          {revokingToken === session.session_token ? "Revoking..." : "Revoke"}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-md border border-border bg-background/50 p-3">
                        <p className="text-xs text-muted-foreground">IP Address</p>
                        <p className="mt-1 text-sm">{session.ip_address || "N/A"}</p>
                      </div>

                      <div className="rounded-md border border-border bg-background/50 p-3">
                        <p className="text-xs text-muted-foreground">Issued At</p>
                        <p className="mt-1 text-sm">{formatDate(session.issued_at)}</p>
                      </div>

                      <div className="rounded-md border border-border bg-background/50 p-3">
                        <p className="text-xs text-muted-foreground">Expires At</p>
                        <p className="mt-1 text-sm">{formatDate(session.expires_at)}</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-md border border-border bg-background/50 p-3 font-mono text-xs break-all">
                      {showTokens ? session.session_token : shortToken(session.session_token)}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </AdminShell>
  );
}