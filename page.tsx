export default function Home() {
  return (
    <main style={{padding: 24, fontFamily: "ui-sans-serif, system-ui"}}>
      <h1 style={{fontSize: 28, marginBottom: 8}}>Live Flights BR</h1>
      <p>✅ Deployed on Vercel.</p>
      <p>API endpoint: <code>/api/search</code></p>
      <p style={{marginTop: 16}}>
        Try: <a href="/api/search?provider=tequila&origin=SSA&everywhere=1&date=2025-11-10&adults=1">/api/search?provider=tequila&origin=SSA&everywhere=1&date=2025-11-10&adults=1</a>
      </p>
    </main>
  );
}
