import { useState } from "react";
import { Switch, Route, Router, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { BadgeProvider } from "@/contexts/badge-context";
import BadgeNotificationOverlay from "@/components/badge-notification";
import AppTour from "@/components/app-tour";
import { Loader2 } from "lucide-react";
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

function AppRouter() {
  const { user, loading, refreshUser } = useAuth();
  const [tourDismissed, setTourDismissed] = useState(false);

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
          <BadgeProvider>
            <Router hook={useHashLocation}>
              <AppRouter />
              <BadgeNotificationOverlay />
            </Router>
          </BadgeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
