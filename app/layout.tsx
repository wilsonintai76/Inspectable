import "../src/styles/globals.css";
import type { Metadata } from "next";
import { DataProvider } from "@/context/DataContext";

export const metadata: Metadata = {
  title: "Inspectable",
  description: "Schedule and manage asset inspections",
};

// Force dynamic rendering to avoid accidental static pre-render/export attempts.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <DataProvider>{children}</DataProvider>
      </body>
    </html>
  );
}
