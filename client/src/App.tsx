import { useState } from "react";
import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AdminAuthProvider, useAdminAuth } from "@/hooks/use-admin-auth";
import { BadgeProvider } from "@/contexts/badge-context";
import BadgeNotificationOverlay from "@/components/badge-notification";
import AppTour from "@/components/app-tour";
import AdminLayout from "@/components/admin-layout";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthPage from "@/pages/auth";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import CheckIn from "@/pages/checkin";
import Settings from "@/pages/settings";
import MilestoneDetail from "@/pages/milestone-detail";
import DailyLogPage from "@/pages/daily-log";
import BadgesPage from "@/pages/badges";
import HealthRecordsPage from "@/pages/health-records";
import NotFound from "@/pages/not-found";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AdminUserDetailPage from "@/pages/admin/user-detail";
import AdminAnalyticsPage from "@/pages/admin/analytics";
import AdminContentPage from "@/pages/admin/content";
import AdminSettingsPage from "@/pages/admin/settings";

// ==================== ADMIN LOGIN FORM ====================
function AdminLoginForm() {
  const { adminLogin } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="Vitallity">
              <rect x="2" y="2" width="28" height="28" rx="6" stroke="hsl(var(--primary))" strokeWidth="2.5" />
              <path d="M9 17L13 22L23 10" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-sm font-semibold tracking-tight leading-none">Vitallity</p>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">Admin Panel</p>
            </div>
          </div>
          <CardTitle className="text-lg">Admin Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@vitallity.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-admin-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="admin-login-error">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-admin-login">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== ADMIN AUTH GUARD ====================
function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAdminAuthenticated } = useAdminAuth();

  if (!isAdminAuthenticated) {
    return <AdminLoginForm />;
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}

// ==================== ADMIN ROUTER ====================
function AdminRouter() {
  return (
    <AdminAuthGuard>
      <Switch>
        <Route path="/admin" component={AdminDashboardPage} />
        <Route path="/admin/users/:id">
          {(params) => <AdminUserDetailPage id={params.id} />}
        </Route>
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/analytics" component={AdminAnalyticsPage} />
        <Route path="/admin/content" component={AdminContentPage} />
        <Route path="/admin/settings" component={AdminSettingsPage} />
        <Route>
          <Redirect to="/admin" />
        </Route>
      </Switch>
    </AdminAuthGuard>
  );
}

// ==================== MAIN APP ROUTER ====================
function AppRouter() {
  const { user, loading, refreshUser } = useAuth();
  const [tourDismissed, setTourDismissed] = useState(false);
  const [location] = useHashLocation();

  // Handle admin routes before any user auth checks
  if (location.startsWith("/admin")) {
    return <AdminRouter />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  // Show tour before onboarding for new users
  if (!user.tourCompleted && !user.onboardingCompleted && !tourDismissed) {
    return (
      <AppTour
        onComplete={() => {
          setTourDismissed(true);
          refreshUser();
        }}
      />
    );
  }

  // User is logged in but onboarding not complete
  if (!user.onboardingCompleted) {
    return (
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route>
          <Redirect to="/onboarding" />
        </Route>
      </Switch>
    );
  }

  // User is logged in and onboarding is complete
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/checkin" component={CheckIn} />
      <Route path="/settings" component={Settings} />
      <Route path="/milestone/:id" component={MilestoneDetail} />
      <Route path="/daily-log" component={DailyLogPage} />
      <Route path="/badges" component={BadgesPage} />
      <Route path="/health-records" component={HealthRecordsPage} />
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <AdminAuthProvider>
            <BadgeProvider>
              <Router hook={useHashLocation}>
                <AppRouter />
                <BadgeNotificationOverlay />
              </Router>
            </BadgeProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
