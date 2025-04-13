import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NextAuthProvider from "@/providers/NextAuthProvider";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Management App",
  description: "Manage your tasks and projects efficiently",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nextAuthSession = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <NextAuthProvider session={nextAuthSession}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ReduxProvider>{children}</ReduxProvider>
            <Toaster position="top-right" />
          </ThemeProvider>
        </body>
      </NextAuthProvider>
    </html>
  );
}
