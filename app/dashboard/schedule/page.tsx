"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function SchedulePage() {
  const { inspections, departments, hasRole, assignSelfAsAuditor, updateInspection } = useData();
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = useMemo(() => {
    return inspections
      .filter((i) => (deptFilter ? i.departmentId === deptFilter : true))
      .filter((i) => (statusFilter ? i.status === statusFilter : true))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [inspections, deptFilter, statusFilter]);

  const canAssign = hasRole("Admin", "Auditor");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
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
            <label className="text-sm">Status</label>
            <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Complete">Complete</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Auditor 1</TableHead>
                  <TableHead>Auditor 2</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Popover open={openId === i.id} onOpenChange={(o) => setOpenId(o ? i.id : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" onClick={() => setOpenId(i.id)}>
                            {format(new Date(i.date), "yyyy-MM-dd")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={new Date(i.date)}
                            onSelect={(d) => {
                              if (d) {
                                updateInspection(i.id, { date: d.toISOString() });
                                setOpenId(null);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>{i.locationName}</TableCell>
                    <TableCell>{departments.find((d) => d.id === i.departmentId)?.acronym ?? i.departmentId}</TableCell>
                    <TableCell>
                      {i.auditor1 || (canAssign && <Button variant="outline" onClick={() => assignSelfAsAuditor(i.id, 1)}>Assign self</Button>)}
                    </TableCell>
                    <TableCell>
                      {i.auditor2 || (canAssign && <Button variant="outline" onClick={() => assignSelfAsAuditor(i.id, 2)}>Assign self</Button>)}
                    </TableCell>
                    <TableCell>{i.status}</TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
