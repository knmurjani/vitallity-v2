import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiFetch } from "@/hooks/use-admin-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Activity, FileHeart, Award, MessageSquare, Link as LinkIcon } from "lucide-react";

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "--"}</span>
    </div>
  );
}

export default function AdminUserDetailPage({ id }: { id: string }) {
  const { adminToken } = useAdminAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/users", id, adminToken],
    queryFn: () => adminApiFetch<any>(`/api/admin/users/${id}`),
    enabled: !!adminToken,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const { user, conditions, goals, medications, recentActivity, healthRecords, badges: earnedBadges, totalPoints } = data;

  return (
    <div className="p-6 space-y-4 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/users")} data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{user.name || "Unnamed User"}</h1>
          <p className="text-sm text-muted-foreground">{user.email} -- ID #{user.id}</p>
        </div>
        <div className="flex items-center gap-2">
          {user.onboarding_completed ? (
            <Badge variant="default">Onboarding Complete</Badge>
          ) : (
            <Badge variant="secondary">Step {user.onboarding_step}</Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-health">Health</TabsTrigger>
          <TabsTrigger value="gamification" data-testid="tab-gamification">Gamification</TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <InfoRow label="Age" value={user.age} />
                <InfoRow label="Gender" value={user.gender} />
                <InfoRow label="Height" value={user.height_cm ? `${user.height_cm} cm` : null} />
                <InfoRow label="Weight" value={user.weight_kg ? `${user.weight_kg} kg` : null} />
                <InfoRow label="Target Weight" value={user.target_weight_kg ? `${user.target_weight_kg} kg` : null} />
                <InfoRow label="BMI" value={user.bmi} />
                <InfoRow label="Activity Level" value={user.activity_level} />
                <InfoRow label="Consistency" value={user.consistency_history ? `${user.consistency_history}/10` : null} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Goals and Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Goals</p>
                  <div className="flex flex-wrap gap-1.5">
                    {goals && goals.length > 0 ? goals.map((g: any) => (
                      <Badge key={g.id} variant="secondary" className="text-xs">{g.goal_type.replace(/_/g, " ")}</Badge>
                    )) : <span className="text-xs text-muted-foreground">None set</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Conditions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {conditions && conditions.length > 0 ? conditions.map((c: any) => (
                      <Badge key={c.id} variant="outline" className="text-xs">{c.condition_name}</Badge>
                    )) : <span className="text-xs text-muted-foreground">None reported</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Medications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {medications && medications.length > 0 ? medications.map((m: any) => (
                      <Badge key={m.id} variant="outline" className="text-xs">{m.medication_name}</Badge>
                    )) : <span className="text-xs text-muted-foreground">None</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent Activity (Last 20)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No activity recorded</p>
              ) : (
                <div className="space-y-2">
                  {(recentActivity || []).map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="mt-0.5">
                        {a.type === "check_in" && <Activity className="h-3.5 w-3.5 text-primary" />}
                        {a.type === "chat" && <MessageSquare className="h-3.5 w-3.5 text-blue-500" />}
                        {a.type === "daily_log" && <FileHeart className="h-3.5 w-3.5 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{a.date}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {a.type.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileHeart className="h-4 w-4" /> Health Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthRecords && healthRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No health records uploaded</p>
              ) : (
                <div className="space-y-2">
                  {(healthRecords || []).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.provider} -- {r.date}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{r.type.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gamification Tab */}
        <TabsContent value="gamification" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" /> Points and Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{totalPoints}</p>
                    <p className="text-xs text-muted-foreground">Total Points</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{Math.floor(totalPoints / 100) + 1}</p>
                    <p className="text-xs text-muted-foreground">Level</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
              </CardHeader>
              <CardContent>
                {earnedBadges && earnedBadges.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No badges earned yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(earnedBadges || []).map((b: any, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/50 border border-border">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">{b.name}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">{b.tier}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4" /> Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Telegram</p>
                  <p className="text-xs text-muted-foreground">Notification delivery</p>
                </div>
                {user.telegram_linked ? (
                  <Badge variant="default" className="text-xs">Connected</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Not connected</Badge>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="text-sm font-medium">Google Sheets</p>
                  <p className="text-xs text-muted-foreground">Data export</p>
                </div>
                {user.google_sheets_connected ? (
                  <Badge variant="default" className="text-xs">Connected</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Not connected</Badge>
                )}
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border">
                <div>
                  <p className="text-sm font-medium">Auth Provider</p>
                  <p className="text-xs text-muted-foreground">Sign-in method</p>
                </div>
                <Badge variant="outline" className="text-xs">{user.auth_provider || "email"}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
