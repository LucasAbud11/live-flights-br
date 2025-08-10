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

// ---------- UI atoms ----------
const Box: React.FC<React.PropsWithChildren<{className?: string}>> = ({className='', children}) =>
  <div className={`rounded-2xl border border-[#e5e7eb] bg-white ${className}`} style={{boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>{children}</div>;

const Row: React.FC<React.PropsWithChildren<{className?: string}>> = ({className='', children}) =>
  <div className={`flex flex-col gap-2 sm:flex-row sm:items-end ${className}`}>{children}</div>;

const Label: React.FC<React.PropsWithChildren> = ({children}) =>
  <label style={{fontSize:12, color:'#6b7280'}}>{children}</label>;

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) =>
  <input {...p} className={`w-full rounded-xl border border-[#d1d5db] px-3 py-2 focus:outline-none`} />;

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (p) =>
  <select {...p} className="w-full rounded-xl border border-[#d1d5db] px-3 py-2 bg-white focus:outline-none" />;

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary'|'ghost'}> = ({variant='primary', className='', ...p}) =>
  <button {...p} className={`rounded-2xl px-4 py-2 font-medium border ${variant==='primary'?'bg-[#2563eb] text-white border-[#1d4ed8]':'bg-white text-[#111827] border-[#e5e7eb]'} ${className}`} />;

// ---------- page ----------
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
    <main style={{minHeight:'100vh', background:'linear-gradient(#eff6ff, #fff)', color:'#111827'}}>
      <div style={{maxWidth:1200, margin:'0 auto', padding:'24px 16px'}}>
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div style={{height:40, width:40}} className="rounded-2xl bg-[#2563eb] text-white grid place-items-center font-bold">✈︎</div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">Buscador de Passagens — Brasil → Mundo</h1>
              <p className="text-sm text-[#6b7280]">Conectado ao seu backend em <code>/api/search</code>.</p>
            </div>
          </div>
          <div className="hidden sm:block text-sm text-[#6b7280]">Prov.: <strong>{provider.toUpperCase()}</strong></div>
        </div>

        {/* search box */}
        <Box className="mb-5">
          <div className="p-4 sm:p-5">
            <form onSubmit={runSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-2">
                <Label>Origem</Label>
                <Select value={origin} onChange={(e)=> setOrigin(e.target.value)}>
                  {BR_AIRPORTS.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>

              <div className="md:col-span-3">
                <Label>Destino</Label>
                <div className="flex gap-2">
                  <Select
                    value={anywhere ? 'ANY' : destination}
                    onChange={(e)=>{
                      const v = e.target.value;
                      if (v==='ANY') { setAnywhere(true); }
                      else { setAnywhere(false); setDestination(v); }
                    }}
                  >
                    <option value="ANY">Qualquer lugar</option>
                    {POP_DESTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e)=> setDate(e.target.value)} />
              </div>

              <div className="md:col-span-2">
                <Label>Passageiros</Label>
                <Input type="number" min={1} max={9} value={adults} onChange={(e)=> setAdults(parseInt(e.target.value || '1'))}/>
              </div>

              <div className="md:col-span-2">
                <Label>Cabine</Label>
                <Select value={cabin} onChange={(e)=> setCabin(e.target.value as Cabin)}>
                  <option value="economy">Econômica</option>
                  <option value="premium_economy">Econômica Premium</option>
                  <option value="business">Executiva</option>
                  <option value="first">Primeira</option>
                </Select>
              </div>

              <div className="md:col-span-1">
                <Label>&nbsp;</Label>
                <Button type="submit" disabled={loading} className="w-full">{loading ? 'Buscando…' : 'Buscar'}</Button>
              </div>

              <div className="md:col-span-12 grid sm:grid-cols-4 gap-3 mt-2">
                <Row>
                  <Label>Provedor</Label>
                  <Select value={provider} onChange={(e)=> setProvider(e.target.value as Provider)}>
                    <option value="amadeus">Amadeus (rota exata)</option>
                    <option value="tequila">Kiwi Tequila (anywhere)</option>
                  </Select>
                </Row>
                <Row>
                  <Label>Máx. escalas</Label>
                  <Select value={String(maxStops)} onChange={(e)=> setMaxStops(parseInt(e.target.value))}>
                    <option value="0">Direto</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </Select>
                </Row>
                <Row>
                  <Label>Ordenar por</Label>
                  <Select value={sortBy} onChange={(e)=> setSortBy(e.target.value as any)}>
                    <option value="price">Preço</option>
                    <option value="duration">Duração</option>
                  </Select>
                </Row>
              </div>
            </form>
          </div>
        </Box>

        {/* date matrix */}
        <Box className="mb-5">
          <div className="p-4 sm:p-5">
            <div className="text-sm text-[#6b7280] mb-3">Datas próximas (±3 dias)</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {matrixDates.map(d => (
                <button
                  key={d}
                  onClick={()=> setDate(d)}
                  className={`rounded-xl border px-3 py-2 text-left ${d===date? 'border-[#2563eb] bg-[#eff6ff]':'border-[#e5e7eb] bg-white hover:bg-[#f9fafb]'}`}
                >
                  <div className="text-xs text-[#6b7280]">
                    {new Date(d).toLocaleDateString('pt-BR', {weekday:'short', day:'2-digit', month:'2-digit'})}
                  </div>
                  <div className="font-semibold">
                    {/* fake preview price (client-side) just for the small matrix */}
                    {fmtBRL(Math.round(1200 + (new Date(d).getDate()%7)*150))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Box>

        {/* results */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-[#6b7280]">
            {origin} → {anywhere?'Qualquer lugar':destination} • {new Date(date).toLocaleDateString('pt-BR')} • {adults} adulto(s)
          </div>
          <div className="text-xs text-[#6b7280]">Resultados: {results.length}</div>
        </div>

        <Box>
          <div className="p-4 sm:p-5">
            {error && <div className="text-[#b91c1c] mb-3">Erro: {error}</div>}

            {loading ? (
              <div className="grid gap-3">
                {Array.from({length:5}).map((_,i)=>
                  <div key={i} className="animate-pulse h-20 rounded-xl bg-[#f3f4f6]" />
                )}
              </div>
            ) : results.length === 0 ? (
              <div className="text-[#6b7280] text-center py-10">Sem ofertas (tente outra data, origem ou provedor).</div>
            ) : (
              <div className="grid gap-3">
                {results.map((o:any)=>(
                  <div key={o.id} className="rounded-2xl border border-[#e5e7eb] p-4 hover:shadow-sm transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="font-semibold text-lg">{origin} → {o.dest}</div>
                        <div className="text-xs text-[#6b7280]">
                          {(o.itineraries?.[0]?.segments||[]).map((s:any)=>
                            `${s.carrier}${s.flight} ${s.from}→${s.to}`
                          ).join(' · ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fmtBRL(o.total || 0)}</div>
                        <div className="text-xs text-[#6b7280]">{o.bagIncluded ? '1ª mala incluída' : 'Somente mão'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Box>

        <div className="text-xs text-[#6b7280] text-center mt-6">
          Se aparecer vazio no modo Live, adicione as chaves na Vercel (Amadeus/Tequila) e teste o endpoint abrindo-o no navegador com parâmetros.
        </div>
      </div>
    </main>
  );
}
