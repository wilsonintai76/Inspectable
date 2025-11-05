"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { AppUser, Department, Inspection, Location, Role } from "@/types";

type DataContextState = {
  // Auth
  fbUser: SupabaseUser | null | undefined;
  appUser: AppUser | null | undefined;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;

  // Data
  departments: Department[];
  locations: Location[];
  inspections: Inspection[];
  users: AppUser[];

  // CRUD
  createDepartment: (data: Omit<Department, "id">) => Promise<string>;
  updateDepartment: (id: string, patch: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  createLocation: (data: Omit<Location, "id">) => Promise<string>;
  updateLocation: (id: string, patch: Partial<Location>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  updateInspection: (id: string, patch: Partial<Inspection>) => Promise<void>;
  assignSelfAsAuditor: (id: string, slot: 1 | 2) => Promise<void>;
  toggleInspectionStatus: (id: string) => Promise<void>;

  updateUserProfile: (patch: Partial<AppUser>) => Promise<void>;
  setUserRoles: (uid: string, roles: Role[]) => Promise<void>;
  verifyUser: (uid: string) => Promise<void>;
  deleteUserAdmin: (uid: string) => Promise<void>;
  updateUserAdmin: (uid: string, patch: Partial<AppUser>) => Promise<void>;

  // Helpers
  hasRole: (...roles: Role[]) => boolean;
  isVerified: boolean;
  loading: boolean;
};

const DataContext = createContext<DataContextState | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fbUser, setFbUser] = useState<SupabaseUser | null | undefined>(undefined);
  const [appUser, setAppUser] = useState<AppUser | null | undefined>(undefined);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  const [loading, setLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    let mounted = true;
    const getProfile = async (user: SupabaseUser) => {
      const { data } = await supabase.from("app_users").select("*").eq("id", user.id).single();
      if (data) {
        if (mounted) setAppUser(data as AppUser);
      } else {
        const newUser: AppUser = {
          id: user.id,
          name: user.user_metadata?.full_name || user.email || "User",
          email: user.email || "",
          phone: "",
          departmentId: undefined,
          photoURL: user.user_metadata?.avatar_url || undefined,
          status: "Unverified",
          role: ["Viewer"],
        };
  await supabase.from("app_users").insert(newUser);
  if (mounted) setAppUser(newUser);
      }
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session: Session | null = data.session;
      const user = session?.user ?? null;
      setFbUser(user ?? null);
      if (user) await getProfile(user);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setFbUser(user);
      if (user) getProfile(user);
      else setAppUser(null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Collections subscriptions
  useEffect(() => {
    let active = true;
    const fetchAll = async () => {
      const [deps, locs, ins, us] = await Promise.all([
        supabase.from("departments").select("*"),
        supabase.from("locations").select("*"),
        supabase.from("inspections").select("*").order("date", { ascending: true }),
        supabase.from("app_users").select("*"),
      ]);
      if (!active) return;
      setDepartments((deps.data as Department[]) || []);
      setLocations((locs.data as Location[]) || []);
      setInspections((ins.data as Inspection[]) || []);
      setUsers((us.data as AppUser[]) || []);
    };
    fetchAll();
    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "departments" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "inspections" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_users" }, fetchAll)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Auth methods
  const signInEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const user = data.user;
    if (!user) throw new Error("Login failed");
    const { data: prof } = await supabase.from("app_users").select("status").eq("id", user.id).single();
    if (!prof || prof.status !== "Verified") {
      await supabase.auth.signOut();
      throw new Error("Your account is not verified yet.");
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw error;
    const user = data.user;
    if (user) {
      const newUser: AppUser = {
        id: user.id,
        name,
        email,
        phone: "",
        departmentId: undefined,
        photoURL: user.user_metadata?.avatar_url || undefined,
        status: "Unverified",
        role: ["Viewer"],
      };
      await supabase.from("app_users").insert(newUser);
    }
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}` });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // CRUD: Departments
  const createDepartment = useCallback(async (data: Omit<Department, "id">) => {
  const { data: rows, error } = await supabase.from("departments").insert(data).select("id").single();
  if (error) throw error;
  return (rows?.id as string);
  }, []);
  const updateDepartment = useCallback(async (id: string, patch: Partial<Department>) => {
    const { error } = await supabase.from("departments").update(patch).eq("id", id);
    if (error) throw error;
  }, []);
  const deleteDepartment = useCallback(async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) throw error;
  }, []);

  // CRUD: Locations (+ create Pending inspection on create)
  const createLocation = useCallback(async (data: Omit<Location, "id">) => {
  const { data: row, error } = await supabase.from("locations").insert(data).select("id").single();
  if (error) throw error;
  const newId = row?.id as string;
    const inspection: Omit<Inspection, "id"> = {
      locationId: newId,
      departmentId: data.departmentId,
      locationName: data.name,
      supervisor: data.supervisor,
      contactNumber: data.contactNumber,
      date: new Date().toISOString(),
      status: "Pending",
    };
    await supabase.from("inspections").insert(inspection);
    return newId;
  }, []);
  const updateLocation = useCallback(async (id: string, patch: Partial<Location>) => {
    const { error } = await supabase.from("locations").update(patch).eq("id", id);
    if (error) throw error;
  }, []);
  const deleteLocation = useCallback(async (id: string) => {
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) throw error;
  }, []);

  // Inspections
  const updateInspection = useCallback(async (id: string, patch: Partial<Inspection>) => {
    const { error } = await supabase.from("inspections").update(patch).eq("id", id);
    if (error) throw error;
  }, []);
  const assignSelfAsAuditor = useCallback(async (id: string, slot: 1 | 2) => {
    if (!appUser) throw new Error("Not authenticated");
    const name = appUser.name;
    const patch = slot === 1 ? { auditor1: name } : { auditor2: name };
    const { error } = await supabase.from("inspections").update(patch).eq("id", id);
    if (error) throw error;
  }, [appUser]);
  const toggleInspectionStatus = useCallback(async (id: string) => {
    const { data } = await supabase.from("inspections").select("status").eq("id", id).single();
    if (!data) return;
    const next = (data as Inspection).status === "Pending" ? "Complete" : "Pending";
    await supabase.from("inspections").update({ status: next }).eq("id", id);
  }, []);

  // Users
  const updateUserProfile = useCallback(async (patch: Partial<AppUser>) => {
    if (!appUser) throw new Error("Not authenticated");
    await supabase.from("app_users").update(patch).eq("id", appUser.id);
  }, [appUser]);

  const setUserRoles = useCallback(async (uid: string, roles: Role[]) => {
    await supabase.from("app_users").update({ role: roles }).eq("id", uid);
    const isAdmin = roles.includes("Admin");
    await fetch(`/api/admin/users/${uid}/set-claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: isAdmin }),
      credentials: "include",
    });
  }, []);

  const verifyUser = useCallback(async (uid: string) => {
    await supabase.from("app_users").update({ status: "Verified" }).eq("id", uid);
  }, []);

  const deleteUserAdmin = useCallback(async (uid: string) => {
    // Server route checks admin via cookie session
    const res = await fetch(`/api/admin/users/${uid}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete auth user");
  }, []);

  const updateUserAdmin = useCallback(async (uid: string, patch: Partial<AppUser>) => {
    await supabase.from("app_users").update(patch).eq("id", uid);
  }, []);

  const hasRole = useCallback((...roles: Role[]) => {
    if (!appUser) return false;
    return appUser.role?.some((r: Role) => roles.includes(r)) ?? false;
  }, [appUser]);

  const isVerified = !!appUser && appUser.status === "Verified";

  const value: DataContextState = useMemo(
    () => ({
      fbUser,
      appUser,
      signInEmail,
      signInGoogle,
      signUp,
      resetPassword,
      logout,
      departments,
      locations,
      inspections,
      users,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      createLocation,
      updateLocation,
      deleteLocation,
      updateInspection,
      assignSelfAsAuditor,
      toggleInspectionStatus,
      updateUserProfile,
      setUserRoles,
      verifyUser,
      deleteUserAdmin,
      updateUserAdmin,
      hasRole,
      isVerified,
      loading,
    }),
    [
      fbUser,
      appUser,
      signInEmail,
      signInGoogle,
      signUp,
      resetPassword,
      logout,
      departments,
      locations,
      inspections,
      users,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      createLocation,
      updateLocation,
      deleteLocation,
      updateInspection,
      assignSelfAsAuditor,
      toggleInspectionStatus,
      updateUserProfile,
      setUserRoles,
      verifyUser,
      deleteUserAdmin,
      updateUserAdmin,
      hasRole,
      isVerified,
      loading,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};
