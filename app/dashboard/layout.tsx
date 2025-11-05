"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { fbUser, isVerified, loading } = useData();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!fbUser || !isVerified) {
        router.replace("/");
      }
    }
  }, [fbUser, isVerified, loading, router]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: sidebarOpen ? "260px 1fr" : "64px 1fr" }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-col">
        <header className="h-14 border-b flex items-center px-4">Dashboard</header>
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
