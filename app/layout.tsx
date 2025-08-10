import "./globals.css";

export const metadata = {
  title: "Live Flights BR",
  description: "Brasil → Mundo • Preços em BRL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
