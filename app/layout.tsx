import type { Metadata } from "next";
import "../src/styles.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "WildSense", template: "%s | WildSense" },
  description: "An offline-first AI nature companion.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<Toaster /></body></html>;
}
