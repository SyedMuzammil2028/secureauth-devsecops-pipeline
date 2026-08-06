import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Lock,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import AdminShell from "@/components/layout/AdminShell";
import {
  changeAdminPassword,
  updateAdminProfile,
} from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettings() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    sessionStorage.getItem("admin_login_identifier") || "admin"
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const adminSessionToken = sessionStorage.getItem("admin_session_token");

  const handleProfileUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    if (!username.trim()) {
      setError("Admin username cannot be empty.");
      return;
    }

    setProfileLoading(true);

    try {
      const response = await updateAdminProfile({
        admin_session_token: adminSessionToken,
        username: username.trim(),
      });

      sessionStorage.setItem("admin_login_identifier", username.trim());
      setMessage(response.message || "Admin profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Profile update endpoint is not available in backend yet."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!adminSessionToken) {
      navigate("/admin/login");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Fill current password, new password, and confirm password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await changeAdminPassword({
        admin_session_token: adminSessionToken,
        current_password: currentPassword,
        new_password: newPassword,
      });

      setMessage(response.message || "Admin password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Password change endpoint is not available in backend yet."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AdminShell
      title="Admin Settings"
      description="Manage administrator profile, credentials, and security controls."
    >
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <Settings className="h-5 w-5 text-yellow-400" />
            <p className="mt-3 text-xs text-muted-foreground">Settings Area</p>
            <p className="mt-1 text-lg font-semibold">Admin Control</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            <p className="mt-3 text-xs text-muted-foreground">MFA Protection</p>
            <p className="mt-1 text-lg font-semibold">Enabled</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardContent className="p-5">
            <KeyRound className="h-5 w-5 text-purple-400" />
            <p className="mt-3 text-xs text-muted-foreground">Credential Security</p>
            <p className="mt-1 text-lg font-semibold">Password Based</p>
          </CardContent>
        </Card>
      </div>

      {message && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border bg-card/80 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-yellow-400" />
              Admin Profile
            </CardTitle>
            <CardDescription>
              Update the administrator username used for admin login.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Admin Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>

              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Profile"
                )}
              </Button>
            </form>

            {/* <div className="mt-5 rounded-md border border-border bg-background/50 p-3 text-sm text-muted-foreground">
              If your backend does not include the profile update endpoint yet,
              this form will show an API error. The UI is ready for integration.
            </div> */}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-400" />
              Change Password
            </CardTitle>
            <CardDescription>
              Change the current administrator password securely.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <Button type="submit" variant="outline" disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>

            {/* <div className="mt-5 rounded-md border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-400">
              Password update requires backend support at
              <span className="font-mono"> /api/admin/change-password</span>.
            </div> */}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}