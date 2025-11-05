"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  const { signInEmail, signInGoogle, signUp, resetPassword } = useData();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === "login") {
        console.log("Attempting login...");
        await signInEmail(email, password);
        console.log("Login successful - redirecting to dashboard");
        // Force a hard redirect to bypass any caching
        router.push("/dashboard/overview");
        router.refresh();
      } else if (mode === "signup") {
        console.log("Attempting signup...");
        await signUp(name, email, password);
        setMessage("Account created. Await admin verification before logging in.");
        setMode("login");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setMessage("Password reset email sent.");
        setMode("login");
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Inspectable</CardTitle>
          <CardDescription className="text-center">Schedule and manage asset inspections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 justify-center mb-6 text-sm">
            <Button variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>Login</Button>
            <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>Sign Up</Button>
            <Button variant={mode === "forgot" ? "default" : "outline"} onClick={() => setMode("forgot")}>Forgot</Button>
          </div>

          {message && <div className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">{message}</div>}

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            )}
            <Button disabled={loading} className="w-full">
              {loading ? "Processing..." : mode === "login" ? "Login" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          <div className="mt-6">
            <Button variant="outline" className="w-full" onClick={() => signInGoogle().catch((e: unknown) => setMessage(e instanceof Error ? e.message : "Google sign-in failed"))}>
              Continue with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
