'use client';

import React, { useEffect, useMemo, useState } from 'react';

// ---------- helpers ----------
type Provider = 'amadeus' | 'tequila';
type Cabin = 'economy' | 'premium_economy' | 'business' | 'first';

const BR_AIRPORTS = ['GRU','GIG','BSB','SSA','REC','FOR','POA','CWB','CNF','BEL'];
const POP_DESTS   = ['LIS','MAD','BCN','MIA','JFK','CDG','EZE','SCL','MEX','NRT'];

const fmtBRL = (n:number) =>
  new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(n);

const addDays = (iso:string, n:number) => {
  const d = new Date(iso); d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
};

function todayPlus(days:number) {
  const d = new Date(); d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}

// ---------- tiny UI atoms (no external CSS needed) ----------
const card: React.CSSProperties = { border:'1px solid #e5e7eb', borderRadius:16, background:'#fff', boxShadow:'0 1px 2px rgba(0,0,0,.04)' };
const pad: React.CSSProperties = { padding:16 };
const lbl: React.CSSProperties = { fontSize:12, color:'#6b7280', display:'block', marginBottom:6 };
const inputBase: React.CSSProperties = { width:'100%', border:'1px solid #d1d5db', borderRadius:12, padding:'8px 10px', fontSize:14, background:'#fff' };
const buttonPrimary: React.CSSProperties = { background:'#2563eb', color:'#fff', border:'1px solid #1d4ed8', borderRadius:14, padding:'10px 16px', fontSize:14, fontWeight:600, cursor:'pointer' };

export default function Page() {
  // defaults: Brazil → popular international
  const [origin, setOrigin] = useState<string>('GRU');
  const [destination, setDestination] = useState<string>('LIS');
  const [anywhere, setAnywhere] = useState<boolean>(false);
  const [date, setDate] = useState<string>(todayPlus(30));
  const [adults, setAdults] = useState<number>(1);
  const [cabin, setCabin] = useState<Cabin>('economy');
  const [provider, setProvider] = useState<Provider>('amadeus');

  const [maxStops, setMaxStops] = useState<number>(2);
  const [sortBy, setSortBy] = useState<'price'|'duration'>('price');

  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  // date matrix (±3 days)
  const matrixDates = useMemo(()=>[-3,-2,-1,0,1,2,3].map(d=> addDays(date,d)),[date]);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true); setError(null); setResults([]);

    try {
      const url = new URL('/api/search', window.location.origin);
      url.searchParams.set('provider', provider);
      url.searchParams.set('origin', origin);
      if (anywhere) url.searchParams.set('everywhere', '1');
      else          url.searchParams.set('destination', destination);
      url.searchParams.set('date', date);
      url.searchParams.set('adults', String(adults));
      url.searchParams.set('cabin', cabin);

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const offers = (json.offers || []).map((o:any) => ({
        id: o.id || Math.random().toString(36).slice(2),
        total: Number(o.total || o.price?.grandTotal || o.price || 0),
        bagIncluded: !!o.bagIncluded,
        itineraries: o.itineraries || [],
        dest: json.destination || o.dest || destination,
      }));

      // filters + sort
      const filtered = offers.filter((o:any)=> ((o.itineraries?.[0]?.segments?.length || 1)-1) <= maxStops);
      const sorted = filtered.sort((a:any,b:any) => sortBy==='price'
        ? a.total - b.total
        : (a.itineraries?.[0]?.durationHrs || 0) - (b.itineraries?.[0]?.durationHrs || 0));

      setResults(sorted);
    } catch (err:any) {
      setError(err?.message || 'Erro ao buscar');
    } finally {
      setLoading(false);
    }
  }

  // auto-run once so the page isn’t empty
  useEffect(()=>{ runSearch(); /* eslint-disable-next-line */ },[]);

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(#eff6ff, #fff)', color:'#111827', fontFamily:'ui-sans-serif, system-ui'}}>
      <div style={{maxWidth:1200, margin:'0 auto', padding:'24px 16px'}}>
        {/* header */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, gap:12}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div style={{height:40, width:40, borderRadius:16, background:'#2563eb', color:'#fff', display:'grid', placeItems:'center', fontWeight:700}}>✈︎</div>
            <div>
              <h1 style={{fontSize:22, fontWeight:600}}>Buscador de Passagens — Brasil → Mundo</h1>
              <p style={{fontSize:13, color:'#6b7280'}}>Conectado ao seu backend em <code>/api/search</code>.</p>
            </div>
          </div>
          <div style={{fontSize:12, color:'#6b7280'}}>Prov.: <strong>{provider.toUpperCase()}</strong></div>
        </div>

        {/* search box */}
        <div style={{...card, marginBottom:16}}>
          <div style={pad}>
            <form onSubmit={runSearch} style={{display:'grid', gridTemplateColumns:'repeat(12, minmax(0,1fr))', gap:12, alignItems:'end'}}>
              <div style={{gridColumn:'span 2'}}>
                <span style={lbl}>Origem</span>
                <select value={origin} onChange={(e)=> setOrigin(e.target.value)} style={inputBase as any}>
                  {BR_AIRPORTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{gridColumn:'span 3'}}>
                <span style={lbl}>Destino</span>
                <div style={{display:'flex', gap:8}}>
                  <select
                    value={anywhere ? 'ANY' : destination}
                    onChange={(e)=>{
                      const v = e.target.value;
                      if (v==='ANY') { setAnywhere(true); }
                      else { setAnywhere(false); setDestination(v); }
                    }}
                    style={{...inputBase, flex:1}}
                  >
                    <option value="ANY">Qualquer lugar</option>
                    {POP_DESTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{gridColumn:'span 2'}}>
                <span style={lbl}>Data</span>
                <input type="date" value={date} onChange={(e)=> setDate(e.target.value)} style={inputBase}/>
              </div>

              <div style={{gridColumn:'span 2'}}>
                <span style={lbl}>Passageiros</span>
                <input type="number" min={1} max={9} value={adults} onChange={(e)=> setAdults(parseInt(e.target.value || '1'))} style={inputBase}/>
              </div>

              <div style={{gridColumn:'span 2'}}>
                <span style={lbl}>Cabine</span>
                <select value={cabin} onChange={(e)=> setCabin(e.target.value as Cabin)} style={inputBase as any}>
                  <option value="economy">Econômica</option>
                  <option value="premium_economy">Econômica Premium</option>
                  <option value="business">Executiva</option>
                  <option value="first">Primeira</option>
                </select>
              </div>

              <div style={{gridColumn:'span 1'}}>
                <button type="submit" disabled={loading} style={{...buttonPrimary, width:'100%'}}>
                  {loading ? 'Buscando…' : 'Buscar'}
                </button>
              </div>

              <div style={{gridColumn:'span 12', display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12, marginTop:8}}>
                <div>
                  <span style={lbl}>Provedor</span>
                  <select value={provider} onChange={(e)=> setProvider(e.target.value as Provider)} style={inputBase as any}>
                    <option value="amadeus">Amadeus (rota exata)</option>
                    <option value="tequila">Kiwi Tequila (anywhere)</option>
                  </select>
                </div>
                <div>
                  <span style={lbl}>Máx. escalas</span>
                  <select value={String(maxStops)} onChange={(e)=> setMaxStops(parseInt(e.target.value))} style={inputBase as any}>
                    <option value="0">Direto</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
                <div>
                  <span style={lbl}>Ordenar por</span>
                  <select value={sortBy} onChange={(e)=> setSortBy(e.target.value as any)} style={inputBase as any}>
                    <option value="price">Preço</option>
                    <option value="duration">Duração</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* date matrix */}
        <div style={{...card, marginBottom:16}}>
          <div style={pad}>
            <div style={{fontSize:13, color:'#6b7280', marginBottom:10}}>Datas próximas (±3 dias)</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(7, minmax(0,1fr))', gap:8}}>
              {matrixDates.map(d => (
                <button
                  key={d}
                  onClick={()=> setDate(d)}
                  style={{
                    border:'1px solid', borderColor: d===date ? '#2563eb' : '#e5e7eb',
                    background: d===date ? '#eff6ff' : '#fff', borderRadius:12, padding:'8px 10px', textAlign:'left'
                  }}
                >
                  <div style={{fontSize:12, color:'#6b7280'}}>
                    {new Date(d).toLocaleDateString('pt-BR', {weekday:'short', day:'2-digit', month:'2-digit'})}
                  </div>
                  <div style={{fontWeight:600}}>
                    {fmtBRL(Math.round(1200 + (new Date(d).getDate()%7)*150))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* results */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <div style={{fontSize:13, color:'#6b7280'}}>
            {origin} → {anywhere?'Qualquer lugar':destination} • {new Date(date).toLocaleDateString('pt-BR')} • {adults} adulto(s)
          </div>
          <div style={{fontSize:12, color:'#6b7280'}}>Resultados: {results.length}</div>
        </div>

        <div style={card}>
          <div style={pad}>
            {error && <div style={{color:'#b91c1c', marginBottom:12}}>Erro: {error}</div>}

            {loading ? (
              <div style={{display:'grid', gap:12}}>
                {Array.from({length:5}).map((_,i)=>
                  <div key={i} style={{height:80, borderRadius:12, background:'#f3f4f6', animation:'pulse 1.5s ease-in-out infinite'}} />
                )}
              </div>
            ) : results.length === 0 ? (
              <div style={{color:'#6b7280', textAlign:'center', padding:'40px 0'}}>Sem ofertas (tente outra data, origem ou provedor).</div>
            ) : (
              <div style={{display:'grid', gap:12}}>
                {results.map((o:any)=>(
                  <div key={o.id} style={{border:'1px solid #e5e7eb', borderRadius:16, padding:16}}>
                    <div style={{display:'flex', flexWrap:'wrap', justifyContent:'space-between', gap:12}}>
                      <div>
                        <div style={{fontWeight:600, fontSize:18}}>{origin} → {o.dest}</div>
                        <div style={{fontSize:12, color:'#6b7280'}}>
                          {(o.itineraries?.[0]?.segments||[]).map((s:any)=>
                            `${s.carrier}${s.flight} ${s.from}→${s.to}`
                          ).join(' · ')}
                        </div>
                      </div>
                      <div style={{textAlign:'right', minWidth:140}}>
                        <div style={{fontSize:22, fontWeight:800}}>{fmtBRL(o.total || 0)}</div>
                        <div style={{fontSize:12, color:'#6b7280'}}>{o.bagIncluded ? '1ª mala incluída' : 'Somente mão'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{fontSize:12, color:'#6b7280', textAlign:'center', marginTop:20}}>
          Se aparecer vazio no modo Live, adicione as chaves na Vercel (Amadeus/Tequila) e teste o endpoint abrindo-o no navegador com parâmetros.
        </div>
      </div>
    </main>
  );
}
