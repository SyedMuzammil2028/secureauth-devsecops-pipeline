import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import AdminShell from "@/components/layout/AdminShell";
import {
  clearAdminLogs,
  getAdminLogs,
  type AdminLog,
} from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StatusFilter = "all" | "success" | "failed";

function formatDate(value: string | null) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function normalize(value: string | null | undefined) {
  return String(value || "").toLowerCase();
}

function getStatusStyle(status: string) {
  const clean = status.toLowerCase();

  if (clean.includes("success") || clean === "ok") {
    return {
      icon: CheckCircle2,
      className: "border-green-500/30 bg-green-500/10 text-green-400",
      label: "Success",
    };
  }

  if (
    clean.includes("fail") ||
    clean.includes("error") ||
    clean.includes("invalid")
  ) {
    return {
      icon: XCircle,
      className: "border-destructive/30 bg-destructive/10 text-destructive",
      label: "Failed",
    };
  }

  return {
    icon: AlertTriangle,
    className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    label: status || "Info",
  };
}

export default function AdminLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [clearingLogs, setClearingLogs] = useState(false);

  const adminSessionToken = sessionStorage.getItem("admin_session_token");

  const loadLogs = async () => {
    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getAdminLogs(adminSessionToken);
      const loadedLogs = response.logs || [];

      setLogs(loadedLogs);
      setSelectedLog(loadedLogs[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear all audit logs? This will delete existing log records. A new audit_logs_cleared record should remain if your backend is configured correctly."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setClearingLogs(true);

    try {
      const response = await clearAdminLogs(adminSessionToken);
      setSuccess(response.message || "Audit logs cleared successfully.");

      const logsResponse = await getAdminLogs(adminSessionToken);
      const loadedLogs = logsResponse.logs || [];

      setLogs(loadedLogs);
      setSelectedLog(loadedLogs[0] || null);
      setStatusFilter("all");
      setEventFilter("all");
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear audit logs.");
    } finally {
      setClearingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventTypes = useMemo(() => {
    const unique = Array.from(
      new Set(logs.map((log) => log.event_type).filter(Boolean))
    );
    return ["all", ...unique];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const search = query.trim().toLowerCase();

    return logs.filter((log) => {
      const status = normalize(log.status);
      const event = log.event_type || "";

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "success" &&
          (status.includes("success") || status.includes("ok"))) ||
        (statusFilter === "failed" &&
          (status.includes("fail") ||
            status.includes("error") ||
            status.includes("invalid")));

      const matchesEvent = eventFilter === "all" || event === eventFilter;

      const matchesSearch =
        !search ||
        normalize(log.username).includes(search) ||
        normalize(log.event_type).includes(search) ||
        normalize(log.status).includes(search) ||
        normalize(log.ip_address).includes(search) ||
        normalize(log.details).includes(search);

      return matchesStatus && matchesEvent && matchesSearch;
    });
  }, [eventFilter, logs, query, statusFilter]);

  const successCount = logs.filter((log) => {
    const s = normalize(log.status);
    return s.includes("success") || s.includes("ok");
  }).length;

  const failedCount = logs.filter((log) => {
    const s = normalize(log.status);
    return s.includes("fail") || s.includes("error") || s.includes("invalid");
  }).length;

  return (
    <AdminShell
      title="Audit Logs"
      description="Search and inspect authentication, MFA, session, and lockout events."
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <Activity className="h-5 w-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">Total Logs</p>
            <p className="mt-1 text-3xl font-semibold">{logs.length}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="mt-3 text-xs text-muted-foreground">Successful Events</p>
            <p className="mt-1 text-3xl font-semibold">{successCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <XCircle className="h-5 w-5 text-destructive" />
            <p className="mt-3 text-xs text-muted-foreground">Failed Events</p>
            <p className="mt-1 text-3xl font-semibold">{failedCount}</p>
          </CardContent>
        </Card>
      </div>

      {success && (
        <div className="mb-4 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-400">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-5 rounded-md border border-border bg-card/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search username, event, IP, status, details..."
              className="pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {eventTypes.map((event) => (
              <option key={event} value={event}>
                {event === "all" ? "All Events" : event}
              </option>
            ))}
          </select>

          <div className="flex overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`flex-1 px-3 py-2 text-sm ${
                viewMode === "timeline"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Timeline
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex-1 px-3 py-2 text-sm ${
                viewMode === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              Table
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" />
            Showing {filteredLogs.length} of {logs.length} logs
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadLogs} disabled={loading || clearingLogs}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="outline"
              onClick={handleClearLogs}
              disabled={loading || clearingLogs || logs.length === 0}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {clearingLogs ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Logs
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-md border border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
          Loading audit logs...
        </div>
      )}

      {!loading && !error && viewMode === "timeline" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="rounded-md border border-border bg-card/80 px-4 py-8 text-center text-sm text-muted-foreground">
                No logs match the selected filters.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const statusStyle = getStatusStyle(log.status);
                const StatusIcon = statusStyle.icon;
                const active = selectedLog?.id === log.id;

                return (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className={`w-full rounded-md border p-4 text-left transition-colors ${
                      active
                        ? "border-primary bg-muted/40"
                        : "border-border bg-card/80 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-md border ${statusStyle.className}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-sm font-medium">{log.event_type}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {log.username || "Unknown user"} •{" "}
                            {log.ip_address || "No IP"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`rounded-sm border px-2 py-1 text-xs ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </span>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </p>
                      </div>
                    </div>

                    {log.details && (
                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {log.details}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="rounded-md border border-border bg-card/80 p-5 lg:sticky lg:top-[88px] lg:h-fit">
            {selectedLog ? (
              <>
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Selected Log Details</p>
                    <p className="text-xs text-muted-foreground">
                      Log ID #{selectedLog.id}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  {[
                    ["Event", selectedLog.event_type],
                    ["Status", selectedLog.status],
                    ["Username", selectedLog.username || "N/A"],
                    ["User ID", selectedLog.user_id ?? "N/A"],
                    ["IP Address", selectedLog.ip_address || "N/A"],
                    ["Created At", formatDate(selectedLog.created_at)],
                    ["Details", selectedLog.details || "N/A"],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="rounded-md border border-border bg-background/50 p-3"
                    >
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 break-all">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a log to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !error && viewMode === "table" && (
        <div className="overflow-x-auto rounded-md border border-border bg-card/80">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const statusStyle = getStatusStyle(log.status);

                  return (
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3">{log.id}</td>
                      <td className="px-4 py-3 font-medium">{log.event_type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-sm border px-2 py-1 text-xs ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">{log.username || "N/A"}</td>
                      <td className="px-4 py-3">{log.ip_address || "N/A"}</td>
                      <td className="px-4 py-3">{log.details || "N/A"}</td>
                      <td className="px-4 py-3">{formatDate(log.created_at)}</td>
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