import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiFetch } from "@/hooks/use-admin-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

export default function AdminUsersPage() {
  const { adminToken } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const limit = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/users", search, page, sortBy, sortDir, adminToken],
    queryFn: () =>
      adminApiFetch<any>(
        `/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}&sortBy=${sortBy}&sortDir=${sortDir}`
      ),
    enabled: !!adminToken,
  });

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
  }

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  function SortHeader({ col, children }: { col: string; children: React.ReactNode }) {
    return (
      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(col)}>
        <div className="flex items-center gap-1">
          {children}
          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </TableHead>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
          data-testid="input-user-search"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader col="id">ID</SortHeader>
                  <SortHeader col="email">Email</SortHeader>
                  <SortHeader col="name">Name</SortHeader>
                  <SortHeader col="createdAt">Signup</SortHeader>
                  <TableHead>Last Active</TableHead>
                  <SortHeader col="checkIns">Check-ins</SortHeader>
                  <TableHead>Points</TableHead>
                  <TableHead>Onboarding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u: any) => (
                    <TableRow
                      key={u.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => setLocation(`/admin/users/${u.id}`)}
                      data-testid={`row-user-${u.id}`}
                    >
                      <TableCell className="tabular-nums text-xs text-muted-foreground">{u.id}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm font-medium">{u.name || "--"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "--"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {u.last_active || "--"}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">{u.checkin_count}</TableCell>
                      <TableCell className="tabular-nums text-sm">{u.total_points}</TableCell>
                      <TableCell>
                        {u.onboarding_completed ? (
                          <Badge variant="default" className="text-xs">Complete</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Step {u.onboarding_step}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm tabular-nums">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
