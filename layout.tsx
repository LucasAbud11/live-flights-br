export const metadata = {
  title: "Live Flights BR",
  description: "Brasil → Mundo • Preços em BRL",
};

import "./../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
