"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function LocationsPage() {
  const { locations, departments, createLocation, updateLocation, deleteLocation } = useData();
  const [filterDept, setFilterDept] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ id?: string; name: string; departmentId: string; supervisor: string; contactNumber: string }>({ name: "", departmentId: "", supervisor: "", contactNumber: "" });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => (filterDept ? locations.filter((l) => l.departmentId === filterDept) : locations), [locations, filterDept]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await updateLocation(form.id, { name: form.name, departmentId: form.departmentId, supervisor: form.supervisor, contactNumber: form.contactNumber });
      } else {
        await createLocation({ name: form.name, departmentId: form.departmentId, supervisor: form.supervisor, contactNumber: form.contactNumber });
      }
      setForm({ name: "", departmentId: "", supervisor: "", contactNumber: "" });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Locations</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Location</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit Location" : "Add Location"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Department</Label>
                <select className="h-10 rounded-md border px-3" value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} required>
                  <option value="">Select...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Supervisor</Label>
                <Input value={form.supervisor} onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Contact</Label>
                <Input value={form.contactNumber} onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))} required />
              </div>
              <div className="md:col-span-2 flex gap-2 justify-end">
                {form.id && <Button type="button" variant="outline" onClick={() => setForm({ name: "", departmentId: "", supervisor: "", contactNumber: "" })}>Cancel</Button>}
                <Button disabled={saving} type="submit">{form.id ? "Update" : "Add"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Label>Filter by Department</Label>
        <select className="border rounded px-3 py-2" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">All</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.name}</TableCell>
                    <TableCell>{departments.find((d) => d.id === l.departmentId)?.name}</TableCell>
                    <TableCell>{l.supervisor}</TableCell>
                    <TableCell>{l.contactNumber}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" onClick={() => { setForm({ id: l.id, name: l.name, departmentId: l.departmentId, supervisor: l.supervisor, contactNumber: l.contactNumber }); setOpen(true); }}>Edit</Button>
                      <Button variant="destructive" onClick={() => deleteLocation(l.id)}>Delete</Button>
                    </TableCell>
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
