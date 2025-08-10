'use client';

import React, { useState } from 'react';

function currencyBRL(n: number) {
  try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n); }
  catch { return `R$ ${n}`; }
}

export default function Home() {
  const today = new Date().toISOString().slice(0,10);
  const [origin, setOrigin] = useState('GRU');
  const [destination, setDestination] = useState('LIS');
  const [anywhere, setAnywhere] = useState(false);
  const [date, setDate] = useState(today);
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin] = useState('economy');
  const [provider, setProvider] = useState<'amadeus' | 'tequila'>('amadeus');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const url = new URL('/api/search', window.location.origin);
      url.searchParams.set('provider', provider);
      url.searchParams.set('origin', origin);
      if (anywhere) url.searchParams.set('everywhere', '1');
      else url.searchParams.set('destination', destination);
      url.searchParams.set('date', date);
      url.searchParams.set('adults', String(adults));
      url.searchParams.set('cabin', cabin);
      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const offers = (json.offers || []).map((o: any) => ({
        id: o.id || Math.random().toString(36).slice(2),
        total: Number(o.total || o.price?.grandTotal || o.price || 0),
        bagIncluded: !!o.bagIncluded,
        itineraries: o.itineraries || [],
        dest: json.destination || o.dest || destination
      }));
      setResults(offers);
    } catch (err: any) {
      setError(err?.message || 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui', maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 6 }}>Live Flights BR</h1>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>Brasil → Mundo • Conectado ao seu backend em <code>/api/search</code>.</p>

      <form onSubmit={onSearch} style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', alignItems: 'end', border: '1px solid #e5e7eb', padding: 12, borderRadius: 12 }}>
        <div style={{ gridColumn: 'span 1' }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Origem</label>
          <input value={origin} onChange={e=>setOrigin(e.target.value.toUpperCase())} placeholder="GRU" style={inputStyle}/>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Destino</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input disabled={anywhere} value={destination} onChange={e=>setDestination(e.target.value.toUpperCase())} placeholder="LIS" style={{...inputStyle, flex: 1, opacity: anywhere? .5:1 }}/>
            <label style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12 }}>
              <input type="checkbox" checked={anywhere} onChange={e=>setAnywhere(e.target.checked)}/> Qualquer lugar
            </label>
          </div>
        </div>
        <div style={{ gridColumn: 'span 1' }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Data</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputStyle}/>
        </div>
        <div style={{ gridColumn: 'span 1' }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Adultos</label>
          <input type="number" min={1} max={9} value={adults} onChange={e=>setAdults(parseInt(e.target.value||'1'))} style={inputStyle}/>
        </div>
        <div style={{ gridColumn: 'span 1' }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Cabine</label>
          <select value={cabin} onChange={e=>setCabin(e.target.value)} style={inputStyle}>
            <option value="economy">Econômica</option>
            <option value="premium_economy">Econômica Premium</option>
            <option value="business">Executiva</option>
            <option value="first">Primeira</option>
          </select>
        </div>
        <div style={{ gridColumn: 'span 1' }}>
          <label style={{ fontSize: 12, color: '#6b7280' }}>Provedor</label>
          <select value={provider} onChange={e=>setProvider(e.target.value as any)} style={inputStyle}>
            <option value="amadeus">Amadeus</option>
            <option value="tequila">Kiwi (Tequila)</option>
          </select>
        </div>
        <div style={{ gridColumn: 'span 6', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading} style={btnStyle}>{loading ? 'Buscando…' : 'Buscar'}</button>
        </div>
      </form>

      {error && <div style={{ marginTop: 12, color: '#b91c1c' }}>Erro: {error}</div>}

      <section style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {results.length === 0 && !loading && <div style={{ color:'#6b7280' }}>Sem resultados ainda — clique em Buscar.</div>}
        {results.map((o) => (
          <article key={o.id} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{origin} → {o.dest}</div>
              <div style={{ fontSize: 12, color:'#6b7280' }}>{(o.itineraries?.[0]?.segments||[]).map((s:any)=> `${s.carrier}${s.flight} ${s.from}→${s.to}`).join(' · ')}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{currencyBRL(o.total || 0)}</div>
              <div style={{ fontSize: 12, color:'#6b7280' }}>{o.bagIncluded ? '1ª mala incluída' : 'Somente mão'}</div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 14
};

const btnStyle: React.CSSProperties = {
  background: '#2563eb',
  color: 'white',
  border: '1px solid #1d4ed8',
  borderRadius: 10,
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer'
};
