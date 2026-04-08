import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppInit } from "@/components/app-init";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cestaria — Mesa de Controle de Rugby",
  description: "Operacao ao vivo de partidas de rugby XV e Sevens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <TooltipProvider>
          <AppInit />
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
