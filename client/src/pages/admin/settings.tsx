import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdminAuth, adminApiFetch } from "@/hooks/use-admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Database, Download, Trash2, HardDrive } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function AdminSettingsPage() {
  const { adminToken } = useAdminAuth();
  const { toast } = useToast();

  const { data: dbStats, isLoading } = useQuery({
    queryKey: ["/api/admin/settings/db-stats", adminToken],
    queryFn: () => adminApiFetch<any>("/api/admin/settings/db-stats"),
    enabled: !!adminToken,
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      adminApiFetch("/api/admin/settings/clear-test-data", { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Test data cleared", description: "All user data has been removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handleExport() {
    const url = "/api/admin/settings/export-db";
    const a = document.createElement("a");
    a.download = "vitallity-data.db";
    fetch(url, {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch(() => toast({ title: "Export failed", variant: "destructive" }));
  }

  return (
    <div className="p-6 space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Database management and system administration</p>
      </div>

      {/* Database Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" /> Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-3 border-b border-border">
                <HardDrive className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold tabular-nums">{formatBytes(dbStats?.fileSize || 0)}</p>
                  <p className="text-xs text-muted-foreground">Database file size</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead className="text-right">Row Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dbStats?.tableCounts || []).map((t: any) => (
                    <TableRow key={t.table}>
                      <TableCell className="text-sm font-mono">{t.table}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{t.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Export Database</p>
                <p className="text-xs text-muted-foreground mt-0.5">Download the full SQLite database file</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={handleExport} data-testid="button-export-db">
                  Download .db file
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Clear Test Data</p>
                <p className="text-xs text-muted-foreground mt-0.5">Remove all users and their data. This action cannot be undone.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="mt-3" data-testid="button-clear-data">
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all user accounts, check-ins, chat messages, health records, and all other user data from the database. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => clearMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-confirm-clear"
                      >
                        {clearMutation.isPending ? "Clearing..." : "Yes, clear all data"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
