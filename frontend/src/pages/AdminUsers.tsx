import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Lock,
  MailCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import AdminShell from "@/components/layout/AdminShell";
import {
  deleteUser,
  getAdminUsers,
  lockUser,
  suspendUser,
  unlockUser,
  type AdminUser,
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

function StatusBadge({
  active,
  activeText,
  inactiveText,
  color,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
  color: "green" | "purple" | "blue" | "red" | "orange";
}) {
  const colors = {
    green: "border-green-500/30 bg-green-500/10 text-green-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs ${
        active ? colors[color] : colors.red
      }`}
    >
      {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {active ? activeText : inactiveText}
    </span>
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "verified" | "unverified" | "mfa" | "locked" | "suspended" | "deleted"
  >("all");
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const adminSessionToken = sessionStorage.getItem("admin_session_token");

  const loadUsers = async () => {
    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getAdminUsers(adminSessionToken);
      setUsers(response.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    return users.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);

      const isVerified = boolValue(user.is_email_verified);
      const hasMfa = boolValue(user.mfa_enabled);
      const isLocked = Boolean(user.lock_until);
      const isSuspended = boolValue(user.is_suspended);
      const isDeleted = boolValue(user.is_deleted);

      const matchesFilter =
        filter === "all" ||
        (filter === "verified" && isVerified) ||
        (filter === "unverified" && !isVerified) ||
        (filter === "mfa" && hasMfa) ||
        (filter === "locked" && isLocked) ||
        (filter === "suspended" && isSuspended) ||
        (filter === "deleted" && isDeleted);

      return matchesSearch && matchesFilter;
    });
  }, [filter, query, users]);

  const activeUsers = users.filter((user) => !boolValue(user.is_deleted)).length;
  const verifiedCount = users.filter((user) => boolValue(user.is_email_verified) && !boolValue(user.is_deleted)).length;
  const suspendedCount = users.filter((user) => boolValue(user.is_suspended) && !boolValue(user.is_deleted)).length;
  const deletedCount = users.filter((user) => boolValue(user.is_deleted)).length;

  const runUserAction = async (
    userId: number,
    action: () => Promise<{ status: string; message: string }>
  ) => {
    setSuccess("");
    setError("");
    setBusyUserId(userId);

    try {
      const response = await action();
      setSuccess(response.message || "Action completed successfully.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleLock = (userId: number) => {
    if (!adminSessionToken) return;
    runUserAction(userId, () =>
      lockUser(adminSessionToken, userId, 10, "Manually locked by administrator.")
    );
  };

  const handleUnlock = (userId: number) => {
    if (!adminSessionToken) return;
    runUserAction(userId, () => unlockUser(adminSessionToken, userId));
  };

  const handleSuspendToggle = (user: AdminUser) => {
    if (!adminSessionToken) return;

    const nextState = !boolValue(user.is_suspended);

    runUserAction(user.id, () =>
      suspendUser(
        adminSessionToken,
        user.id,
        nextState,
        nextState
          ? "User suspended by administrator."
          : "User reactivated by administrator."
      )
    );
  };

  const handleDelete = (user: AdminUser) => {
    if (!adminSessionToken) return;

    const confirmDelete = window.confirm(
      `Soft delete user "${user.username}"? This will revoke sessions and hide account from normal login.`
    );

    if (!confirmDelete) return;

    runUserAction(user.id, () =>
      deleteUser(adminSessionToken, user.id, "Soft deleted from admin users panel.")
    );
  };

  return (
    <AdminShell
      title="Admin Users"
      description="Review registered users, verification, MFA, lockout, suspension, and deletion status."
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <Users className="h-5 w-5 text-purple-400" />
            <p className="mt-3 text-xs text-muted-foreground">Active Users</p>
            <p className="mt-1 text-3xl font-semibold">{activeUsers}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <MailCheck className="h-5 w-5 text-green-400" />
            <p className="mt-3 text-xs text-muted-foreground">Verified Emails</p>
            <p className="mt-1 text-3xl font-semibold">{verifiedCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <ShieldAlert className="h-5 w-5 text-orange-400" />
            <p className="mt-3 text-xs text-muted-foreground">Suspended</p>
            <p className="mt-1 text-3xl font-semibold">{suspendedCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <Trash2 className="h-5 w-5 text-red-400" />
            <p className="mt-3 text-xs text-muted-foreground">Deleted</p>
            <p className="mt-1 text-3xl font-semibold">{deletedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 rounded-md border border-border bg-card/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="pl-9"
            />
          </div>

          <select
            value={filter}
            onChange={(e) =>
              setFilter(
                e.target.value as
                  | "all"
                  | "verified"
                  | "unverified"
                  | "mfa"
                  | "locked"
                  | "suspended"
                  | "deleted"
              )
            }
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Users</option>
            <option value="verified">Verified Email</option>
            <option value="unverified">Unverified Email</option>
            <option value="mfa">MFA Enabled</option>
            <option value="locked">Locked</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>

          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          {success}
        </div>
      )}

      {loading && (
        <div className="rounded-md border border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
          Loading users...
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-md border border-border bg-card/80">
          <table className="w-full min-w-[1350px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">MFA</th>
                <th className="px-4 py-3">Failed</th>
                <th className="px-4 py-3">Lock</th>
                <th className="px-4 py-3">Suspended</th>
                <th className="px-4 py-3">Deleted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isDeleted = boolValue(user.is_deleted);
                  const isSuspended = boolValue(user.is_suspended);
                  const isLocked = Boolean(user.lock_until);

                  return (
                    <tr key={user.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-xs font-semibold text-purple-400">
                            {user.first_name?.[0] || "U"}
                            {user.last_name?.[0] || ""}
                          </div>

                          <div>
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{user.username} · ID #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">{user.email}</td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          active={boolValue(user.is_email_verified)}
                          activeText="Verified"
                          inactiveText="No"
                          color="green"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          active={boolValue(user.mfa_enabled)}
                          activeText="Enabled"
                          inactiveText="Disabled"
                          color="purple"
                        />
                      </td>

                      <td className="px-4 py-3">{user.failed_attempts}</td>

                      <td className="px-4 py-3">
                        {isLocked ? (
                          <span className="text-xs text-red-400">
                            {formatDate(user.lock_until)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not locked</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          active={!isSuspended}
                          activeText="Active"
                          inactiveText="Suspended"
                          color="blue"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          active={!isDeleted}
                          activeText="No"
                          inactiveText="Deleted"
                          color="green"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {isLocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyUserId === user.id || isDeleted}
                              onClick={() => handleUnlock(user.id)}
                            >
                              <Unlock className="mr-2 h-4 w-4" />
                              Unlock
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyUserId === user.id || isDeleted}
                              onClick={() => handleLock(user.id)}
                            >
                              <Lock className="mr-2 h-4 w-4" />
                              Lock
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyUserId === user.id || isDeleted}
                            onClick={() => handleSuspendToggle(user)}
                          >
                            {isSuspended ? (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Suspend
                              </>
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyUserId === user.id || isDeleted}
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}