import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  Unlock,
} from "lucide-react";

import AdminShell from "@/components/layout/AdminShell";
import {
  getLockedAccounts,
  unlockUser,
  type LockedAccount,
} from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function formatDate(value: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export default function AdminLockedAccounts() {
  const navigate = useNavigate();

  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [query, setQuery] = useState("");
  const [unlockingId, setUnlockingId] = useState<number | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const adminSessionToken = sessionStorage.getItem("admin_session_token");

  const loadLockedAccounts = async () => {
    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await getLockedAccounts(adminSessionToken);
      setLockedAccounts(response.locked_accounts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locked accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLockedAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAccounts = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return lockedAccounts;

    return lockedAccounts.filter((account) => {
      return (
        account.username.toLowerCase().includes(search) ||
        account.email.toLowerCase().includes(search)
      );
    });
  }, [lockedAccounts, query]);

  const handleUnlock = async (userId: number) => {
    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    setError("");
    setSuccess("");
    setUnlockingId(userId);

    try {
      const response = await unlockUser(adminSessionToken, userId);
      setSuccess(response.message || "User unlocked successfully.");
      await loadLockedAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock user.");
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <AdminShell
      title="Locked Accounts"
      description="View and unlock accounts blocked by failed login attempts."
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <Lock className="h-5 w-5 text-red-400" />
            <p className="mt-3 text-xs text-muted-foreground">Locked Accounts</p>
            <p className="mt-1 text-3xl font-semibold">{lockedAccounts.length}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <ShieldAlert className="h-5 w-5 text-orange-400" />
            <p className="mt-3 text-xs text-muted-foreground">Security Reason</p>
            <p className="mt-1 text-lg font-semibold">Failed Attempts</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="mt-3 text-xs text-muted-foreground">Recovery Action</p>
            <p className="mt-1 text-lg font-semibold">Admin Unlock</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 rounded-md border border-border bg-card/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search locked users by username or email..."
              className="pl-9"
            />
          </div>

          <Button variant="outline" onClick={loadLockedAccounts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filteredAccounts.length} of {lockedAccounts.length} locked accounts
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          {success}
        </div>
      )}

      {loading && (
        <div className="rounded-md border border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
          Loading locked accounts...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4">
          {filteredAccounts.length === 0 ? (
            <div className="rounded-md border border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No locked accounts found.
            </div>
          ) : (
            filteredAccounts.map((account) => (
              <Card key={account.id} className="border-border bg-card/80 shadow-none">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>

                      <div>
                        <p className="font-medium">{account.username}</p>
                        <p className="text-sm text-muted-foreground">{account.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          User ID #{account.id}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={unlockingId === account.id}
                      onClick={() => handleUnlock(account.id)}
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      {unlockingId === account.id ? "Unlocking..." : "Unlock User"}
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-border bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Failed Attempts</p>
                      <p className="mt-1 text-lg font-semibold text-orange-400">
                        {account.failed_attempts}
                      </p>
                    </div>

                    <div className="rounded-md border border-border bg-background/50 p-3">
                      <p className="text-xs text-muted-foreground">Locked Until</p>
                      <p className="mt-1 text-sm">{formatDate(account.lock_until)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </AdminShell>
  );
}