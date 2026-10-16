import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WARZ SURVIVAL | Multiplayer Zombie Web Game",
  description: "Browser-based 3D multiplayer zombie survival game built with Three.js and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-slate-100 antialiased selection:bg-red-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
