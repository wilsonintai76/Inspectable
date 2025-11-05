"use client";

import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OverviewPage() {
  const { inspections, departments } = useData();

  const today = new Date();
  const upcoming = inspections
    .filter((i) => new Date(i.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const upcomingCount = inspections.filter((i) => new Date(i.date) >= today && i.status === "Pending").length;

  // Auditor analysis: count assignments across auditor1/auditor2
  const auditorMap = new Map<string, { total: number; complete: number; pending: number }>();
  for (const i of inspections) {
    const auditors = [i.auditor1, i.auditor2].filter(Boolean) as string[];
    for (const a of auditors) {
      const rec = auditorMap.get(a) || { total: 0, complete: 0, pending: 0 };
      rec.total += 1;
      if (i.status === "Complete") rec.complete += 1; else rec.pending += 1;
      auditorMap.set(a, rec);
    }
  }
  const topAuditors = Array.from(auditorMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  // Department progress
  const deptProgress = departments.map((d) => {
    const ins = inspections.filter((i) => i.departmentId === d.id);
    const total = ins.length;
    const complete = ins.filter((i) => i.status === "Complete").length;
    const pending = total - complete;
    const pct = total === 0 ? 0 : Math.round((complete / total) * 100);
    return { id: d.id, name: d.name, acronym: d.acronym, total, complete, pending, pct };
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      {/* Upcoming summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base">Upcoming (Pending)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-semibold">{upcomingCount}</div>
            <p className="text-sm text-muted-foreground">Inspections from today forward</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base">Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-semibold">{inspections.filter((i) => i.status === "Complete").length}</div>
            <p className="text-sm text-muted-foreground">All-time completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-base">Departments</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-semibold">{departments.length}</div>
            <p className="text-sm text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Location</th>
                  <th className="p-2 text-left">Department</th>
                  <th className="p-2 text-left">Auditors</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="p-2">{new Date(i.date).toLocaleDateString()}</td>
                    <td className="p-2">{i.locationName}</td>
                    <td className="p-2">{departments.find((d) => d.id === i.departmentId)?.acronym ?? i.departmentId}</td>
                    <td className="p-2">{[i.auditor1, i.auditor2].filter(Boolean).join(", ") || "Unassigned"}</td>
                    <td className="p-2">{i.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Two-column analytics */}
      <section className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Auditor Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {topAuditors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No auditor assignments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Auditor</th>
                      <th className="p-2 text-left">Total</th>
                      <th className="p-2 text-left">Complete</th>
                      <th className="p-2 text-left">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAuditors.map(([name, stats]) => (
                      <tr key={name} className="border-t">
                        <td className="p-2">{name}</td>
                        <td className="p-2">{stats.total}</td>
                        <td className="p-2">{stats.complete}</td>
                        <td className="p-2">{stats.pending}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inspection Status by Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deptProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">No departments found.</p>
            ) : (
              deptProgress.map((d) => (
                <div key={d.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">{d.acronym} <span className="text-muted-foreground">({d.complete}/{d.total})</span></div>
                    <div className="text-muted-foreground">{d.pct}%</div>
                  </div>
                  <div className="w-full h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-primary" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
