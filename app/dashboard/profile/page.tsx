"use client";

import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { appUser, departments, updateUserProfile } = useData();
  const [name, setName] = useState(appUser?.name ?? "");
  const [phone, setPhone] = useState(appUser?.phone ?? "");
  const [departmentId, setDepartmentId] = useState(appUser?.departmentId ?? "");
  const [saving, setSaving] = useState(false);

  if (!appUser) return <div>Loading...</div>;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({ name, phone, departmentId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="grid md:grid-cols-3 gap-3 max-w-2xl">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Department</Label>
            <select className="h-10 rounded-md border px-3" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <Button disabled={saving}>Save</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
