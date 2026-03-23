import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppInit } from "@/components/app-init";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rugby Match Pro",
  description: "Operacao ao vivo de partidas de rugby XV e Sevens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="rugby-match-pro-theme">
          <TooltipProvider>
            <AppInit />
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
