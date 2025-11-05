"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import type { Role } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const ALL_ROLES: Role[] = ["Admin", "Asset Officer", "Auditor", "Viewer"];

export default function UsersPage() {
  const { users, departments, setUserRoles, verifyUser, deleteUserAdmin, hasRole, updateUserAdmin } = useData();
  const isAdmin = hasRole("Admin");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const filtered = useMemo(() => (deptFilter ? users.filter((u) => u.departmentId === deptFilter) : users), [users, deptFilter]);

  if (!isAdmin) return <div>You do not have permission to view this page.</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Department</label>
          <select className="border rounded px-3 py-2" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <select className="border rounded px-2 py-1" value={u.departmentId ?? ""} onChange={(e) => updateUserAdmin(u.id, { departmentId: e.target.value })}>
                      <option value="">Select...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {ALL_ROLES.map((r) => (
                        <label key={r} className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1">
                          <input type="checkbox" checked={u.role?.includes(r)} onChange={(e) => {
                            const roles = new Set(u.role || []);
                            if (e.target.checked) roles.add(r); else roles.delete(r);
                            setUserRoles(u.id, Array.from(roles));
                          }} />
                          {r}
                        </label>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="space-x-2">
                    {u.status !== "Verified" && <Button variant="outline" onClick={() => verifyUser(u.id)}>Verify</Button>}
                    <Button variant="destructive" onClick={() => deleteUserAdmin(u.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
