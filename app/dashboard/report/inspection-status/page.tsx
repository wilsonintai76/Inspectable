"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InspectionStatusPage() {
  const { inspections, departments, hasRole, toggleInspectionStatus } = useData();
  const [deptFilter, setDeptFilter] = useState<string>("");

  const filtered = useMemo(() => (deptFilter ? inspections.filter((i) => i.departmentId === deptFilter) : inspections), [inspections, deptFilter]);
  const canToggle = hasRole("Admin", "Asset Officer");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Status</CardTitle>
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
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>{new Date(i.date).toLocaleDateString()}</TableCell>
                  <TableCell>{i.locationName}</TableCell>
                  <TableCell>{departments.find((d) => d.id === i.departmentId)?.acronym ?? i.departmentId}</TableCell>
                  <TableCell>{i.status}</TableCell>
                  <TableCell>{canToggle && <Button variant="outline" onClick={() => toggleInspectionStatus(i.id)}>Toggle</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
