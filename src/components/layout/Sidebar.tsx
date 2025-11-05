"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = { open: boolean; onToggle: () => void };

export default function Sidebar({ open, onToggle }: Props) {
  const { appUser, hasRole, logout } = useData();
  const pathname = usePathname();

  type HrefProp = ComponentProps<typeof Link>["href"];
  const NavItem = ({ href, label }: { href: HrefProp; label: string }) => {
    const hrefPath = typeof href === "string" ? href : (href && typeof href === "object" && "pathname" in href ? String((href as { pathname?: string }).pathname || "") : "");
    return (
      <Link href={href} className={`block px-3 py-2 rounded hover:bg-muted ${hrefPath && pathname.startsWith(hrefPath) ? "bg-muted font-medium" : ""}`}>{label}</Link>
    );
  };

  return (
    <aside className="h-screen border-r flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between px-2 py-2">
        <span className="font-semibold">{open ? "Inspectable" : "IN"}</span>
        <button onClick={onToggle} className="text-sm text-muted-foreground">{open ? "<" : ">"}</button>
      </div>
      <nav className="flex-1 space-y-1">
        <NavItem href="/dashboard/overview" label="Overview" />
        {(hasRole("Admin") || hasRole("Auditor")) && <NavItem href="/dashboard/schedule" label="Schedule" />}
        {(hasRole("Admin") || hasRole("Asset Officer")) && <NavItem href="/dashboard/locations" label="Locations" />}
        {(hasRole("Admin") || hasRole("Asset Officer")) && <NavItem href="/dashboard/report/inspection-status" label="Inspection Status" />}
        {hasRole("Admin") && <NavItem href="/dashboard/departments" label="Departments" />}
        {hasRole("Admin") && <NavItem href="/dashboard/users" label="Users" />}
        <NavItem href="/dashboard/profile" label="Profile" />
      </nav>
      {appUser && (
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full border rounded px-2 py-2 hover:bg-muted flex items-center gap-2 text-left">
                <Avatar>
                  <AvatarImage src={appUser.photoURL || undefined} alt={appUser.name} />
                  <AvatarFallback>{(appUser.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                {open && (
                  <div className="min-w-0">
                    <div className="font-medium truncate">{appUser.name}</div>
                    <div className="text-muted-foreground text-xs truncate">{appUser.role?.join(", ")}</div>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={8} className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={appUser.photoURL || undefined} alt={appUser.name} />
                  <AvatarFallback>{(appUser.name || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm leading-tight">{appUser.name}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{appUser.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
