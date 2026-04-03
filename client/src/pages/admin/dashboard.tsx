import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiFetch } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Activity,
  UserPlus,
  CheckCircle,
  ClipboardList,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const CHART_COLORS = [
  "hsl(183, 98%, 22%)",
  "hsl(160, 55%, 38%)",
  "hsl(200, 70%, 42%)",
  "hsl(35, 80%, 50%)",
  "hsl(280, 55%, 50%)",
];

function KPICard({ title, value, icon: Icon, loading }: {
  title: string; value: string | number; icon: any; loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            {loading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="text-xl font-semibold tabular-nums mt-1" data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, "-")}`}>
                {value}
              </p>
            )}
          </div>
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { adminToken } = useAdminAuth();

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["/api/admin/dashboard/kpis", adminToken],
    queryFn: () => adminApiFetch<any>("/api/admin/dashboard/kpis"),
    enabled: !!adminToken,
  });

  const { data: signups } = useQuery({
    queryKey: ["/api/admin/dashboard/signups", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/dashboard/signups"),
    enabled: !!adminToken,
  });

  const { data: dau } = useQuery({
    queryKey: ["/api/admin/dashboard/dau", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/dashboard/dau"),
    enabled: !!adminToken,
  });

  const { data: funnel } = useQuery({
    queryKey: ["/api/admin/dashboard/onboarding-funnel", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/dashboard/onboarding-funnel"),
    enabled: !!adminToken,
  });

  const { data: featureUsage } = useQuery({
    queryKey: ["/api/admin/dashboard/feature-usage", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/dashboard/feature-usage"),
    enabled: !!adminToken,
  });

  const { data: retention } = useQuery({
    queryKey: ["/api/admin/dashboard/retention", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/dashboard/retention"),
    enabled: !!adminToken,
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vitallity wellness app overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Total Users" value={kpis?.totalUsers ?? 0} icon={Users} loading={kpisLoading} />
        <KPICard title="Active Today" value={kpis?.activeToday ?? 0} icon={Activity} loading={kpisLoading} />
        <KPICard title="New This Week" value={kpis?.newThisWeek ?? 0} icon={UserPlus} loading={kpisLoading} />
        <KPICard title="Onboarding Rate" value={`${kpis?.onboardingRate ?? 0}%`} icon={CheckCircle} loading={kpisLoading} />
        <KPICard title="Avg Check-ins" value={kpis?.avgCheckInsPerUser ?? 0} icon={ClipboardList} loading={kpisLoading} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signups Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Signups Over Time (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {signups ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={signups}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} name="Signups" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Active Users */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users (14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {dau ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dau}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[3, 3, 0, 0]} name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Onboarding Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Onboarding Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {funnel ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="step" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `Step ${v}`} width={55} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[0, 3, 3, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {featureUsage ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={featureUsage}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {featureUsage.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Retention Cohorts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retention Cohorts</CardTitle>
          </CardHeader>
          <CardContent>
            {retention ? (
              <div className="space-y-3 pt-2">
                {retention.map((r: any) => (
                  <div key={r.day} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-14 flex-shrink-0">Day {r.day}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end px-2 text-xs font-medium text-primary-foreground transition-all"
                        style={{
                          width: `${Math.max(r.rate, 8)}%`,
                          backgroundColor: CHART_COLORS[0],
                        }}
                      >
                        {r.rate}%
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  Percentage of cohort users who returned on or after day N
                </p>
              </div>
            ) : (
              <Skeleton className="h-40 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
