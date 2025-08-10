import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscador de Passagens (BR)",
  description: "Brasil → Mundo • Preços em BRL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
