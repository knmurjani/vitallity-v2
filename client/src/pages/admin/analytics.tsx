import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiFetch } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(183, 98%, 22%)",
  "hsl(160, 55%, 38%)",
  "hsl(200, 70%, 42%)",
  "hsl(35, 80%, 50%)",
  "hsl(280, 55%, 50%)",
  "hsl(350, 60%, 45%)",
  "hsl(120, 40%, 35%)",
  "hsl(45, 70%, 45%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 12,
};

export default function AdminAnalyticsPage() {
  const { adminToken } = useAdminAuth();

  const { data: goals } = useQuery({
    queryKey: ["/api/admin/analytics/goals", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/analytics/goals"),
    enabled: !!adminToken,
  });

  const { data: conditions } = useQuery({
    queryKey: ["/api/admin/analytics/conditions", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/analytics/conditions"),
    enabled: !!adminToken,
  });

  const { data: bmi } = useQuery({
    queryKey: ["/api/admin/analytics/bmi", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/analytics/bmi"),
    enabled: !!adminToken,
  });

  const { data: consistency } = useQuery({
    queryKey: ["/api/admin/analytics/consistency", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/analytics/consistency"),
    enabled: !!adminToken,
  });

  const { data: aiUsage } = useQuery({
    queryKey: ["/api/admin/analytics/ai-usage", adminToken],
    queryFn: () => adminApiFetch<any>("/api/admin/analytics/ai-usage"),
    enabled: !!adminToken,
  });

  const { data: timeOfDay } = useQuery({
    queryKey: ["/api/admin/analytics/time-of-day", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/analytics/time-of-day"),
    enabled: !!adminToken,
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Deep insights into user behavior and health data</p>
      </div>

      {/* Row 1: Goals + Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Goal Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {goals ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goals} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100}
                      tickFormatter={(v) => v.replace(/_/g, " ")} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[0, 3, 3, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-full w-full" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Condition Prevalence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {conditions ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conditions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={120} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[0, 3, 3, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-full w-full" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: BMI + Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">BMI Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {bmi ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bmi}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={45}
                      dataKey="count"
                      nameKey="category"
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={11}
                    >
                      {bmi.map((_: any, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-full w-full" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Self-reported Consistency (1-10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {consistency ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consistency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="value" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[3, 3, 0, 0]} name="Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-full w-full" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: AI Usage + Time of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {aiUsage ? (
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{aiUsage.totalChatUsers}</p>
                  <p className="text-xs text-muted-foreground">Users who chatted</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{aiUsage.avgMessagesPerUser}</p>
                  <p className="text-xs text-muted-foreground">Avg messages/user</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{aiUsage.weeklyReviews}</p>
                  <p className="text-xs text-muted-foreground">Weekly reviews generated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{aiUsage.mealAnalyses}</p>
                  <p className="text-xs text-muted-foreground">Meal analyses</p>
                </div>
              </div>
            ) : <Skeleton className="h-32 w-full" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Check-in Time of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {timeOfDay ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeOfDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(h) => `${h}:00`} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle}
                      labelFormatter={(h) => `${h}:00 - ${h}:59`} />
                    <Bar dataKey="count" fill={CHART_COLORS[3]} radius={[3, 3, 0, 0]} name="Check-ins" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-full w-full" />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
