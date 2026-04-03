import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth, adminApiFetch } from "@/hooks/use-admin-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Pencil, Pill, Award, Bell } from "lucide-react";

// ==================== MEDICATIONS TAB ====================
function MedicationsTab() {
  const { adminToken } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", genericName: "", category: "", commonUse: "" });

  const { data: meds, isLoading } = useQuery({
    queryKey: ["/api/admin/content/medications", search, adminToken],
    queryFn: () => adminApiFetch<any[]>(`/api/admin/content/medications?search=${encodeURIComponent(search)}`),
    enabled: !!adminToken,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      adminApiFetch("/api/admin/content/medications", {
        method: "POST",
        body: JSON.stringify(newMed),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/medications"] });
      setShowAdd(false);
      setNewMed({ name: "", genericName: "", category: "", commonUse: "" });
      toast({ title: "Medication added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-med-search"
          />
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-med">
          <Plus className="h-4 w-4 mr-1" /> Add Medication
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Common Use</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (meds || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No medications found</TableCell>
                </TableRow>
              ) : (
                (meds || []).map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-sm">{m.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.generic_name || "--"}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{m.category || "--"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.common_use || "--"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Medication Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={newMed.name} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} data-testid="input-med-name" />
            </div>
            <div>
              <Label>Generic Name</Label>
              <Input value={newMed.genericName} onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={newMed.category} onChange={(e) => setNewMed({ ...newMed, category: e.target.value })} />
            </div>
            <div>
              <Label>Common Use</Label>
              <Input value={newMed.commonUse} onChange={(e) => setNewMed({ ...newMed, commonUse: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!newMed.name || addMutation.isPending} data-testid="button-save-med">
              {addMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== BADGES TAB ====================
function BadgesTab() {
  const { adminToken } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);

  const { data: allBadges, isLoading } = useQuery({
    queryKey: ["/api/admin/content/badges", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/content/badges"),
    enabled: !!adminToken,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApiFetch(`/api/admin/content/badges/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({ description: editing.description, pointsAwarded: editing.points_awarded }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/badges"] });
      setEditing(null);
      toast({ title: "Badge updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const tierColors: Record<string, string> = {
    bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    silver: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Badge</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                (allBadges || []).map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium text-sm">{b.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{b.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{b.category}</Badge></TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[b.tier] || ""}`}>
                        {b.tier}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{b.points_awarded}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setEditing({ ...b })} data-testid={`button-edit-badge-${b.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Badge Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Badge: {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  data-testid="input-badge-description"
                />
              </div>
              <div>
                <Label>Points Awarded</Label>
                <Input
                  type="number"
                  value={editing.points_awarded}
                  onChange={(e) => setEditing({ ...editing, points_awarded: parseInt(e.target.value) || 0 })}
                  data-testid="input-badge-points"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-save-badge">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== TEMPLATES TAB ====================
function TemplatesTab() {
  const { adminToken } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/admin/content/templates", adminToken],
    queryFn: () => adminApiFetch<any[]>("/api/admin/content/templates"),
    enabled: !!adminToken,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApiFetch(`/api/admin/content/templates/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({ body: editing.body, subject: editing.subject }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content/templates"] });
      setEditing(null);
      toast({ title: "Template updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          (templates || []).map((t: any) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{t.name}</p>
                      <Badge variant="outline" className="text-xs">{t.channel}</Badge>
                    </div>
                    {t.subject && <p className="text-xs text-muted-foreground">Subject: {t.subject}</p>}
                    <p className="text-sm text-muted-foreground line-clamp-2">{t.body}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0 ml-2" onClick={() => setEditing({ ...t })} data-testid={`button-edit-template-${t.id}`}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template: {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              {editing.channel === "email" && (
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={editing.subject || ""}
                    onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                    data-testid="input-template-subject"
                  />
                </div>
              )}
              <div>
                <Label>Body</Label>
                <Textarea
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  rows={5}
                  data-testid="input-template-body"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available variables: {"{{streak_count}}"}, {"{{user_name}}"}, {"{{app_url}}"}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-save-template">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== MAIN CONTENT PAGE ====================
export default function AdminContentPage() {
  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Content Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage medications, badges, and notification templates</p>
      </div>

      <Tabs defaultValue="medications" className="w-full">
        <TabsList>
          <TabsTrigger value="medications" data-testid="tab-medications">
            <Pill className="h-3.5 w-3.5 mr-1.5" /> Medications
          </TabsTrigger>
          <TabsTrigger value="badges" data-testid="tab-badges">
            <Award className="h-3.5 w-3.5 mr-1.5" /> Badges
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <Bell className="h-3.5 w-3.5 mr-1.5" /> Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medications" className="mt-4">
          <MedicationsTab />
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <BadgesTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
