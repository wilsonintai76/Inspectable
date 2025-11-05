"use client";

import { useState } from "react";
import { useData } from "@/context/DataContext";
import type { Department } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DepartmentsPage() {
  const { departments, createDepartment, updateDepartment, deleteDepartment } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; acronym: string; id?: string }>({ name: "", acronym: "" });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await updateDepartment(form.id, { name: form.name, acronym: form.acronym });
      } else {
        await createDepartment({ name: form.name, acronym: form.acronym });
      }
      setForm({ name: "", acronym: "" });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (d: Department) => {
    setForm({ id: d.id, name: d.name, acronym: d.acronym });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Departments</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Department</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit Department" : "Add Department"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="grid gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Acronym</Label>
                <Input value={form.acronym} onChange={(e) => setForm((f) => ({ ...f, acronym: e.target.value }))} required />
              </div>
              <div className="flex gap-2 justify-end">
                {form.id && (
                  <Button type="button" variant="outline" onClick={() => setForm({ name: "", acronym: "" })}>Clear</Button>
                )}
                <Button disabled={saving} type="submit">{form.id ? "Update" : "Add"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Acronym</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.acronym}</TableCell>
                    <TableCell className="space-x-2">
                      <Button variant="outline" onClick={() => startEdit(d)}>Edit</Button>
                      <Button variant="destructive" onClick={() => deleteDepartment(d.id)}>Delete</Button>
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
