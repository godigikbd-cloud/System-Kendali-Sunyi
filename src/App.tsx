import React, { useState, useEffect } from 'react';
import { 
  fetchCryptoData, 
  fetchStockData, 
  getMarketPressure, 
  detectOrderWalls 
} from './services/portfolioService';

const TARGET_IDR = 8000000;

const App = () => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [inputStock, setInputStock] = useState('');
  const [inputCrypto, setInputCrypto] = useState('');
  const [units, setUnits] = useState({ stock: 0, crypto: 0, rdn: 0 });

  const refreshAllData = async () => {
    if (!inputStock && !inputCrypto) {
      setData({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const stockRes = inputStock ? await fetchStockData(inputStock) : null;
      const cryptoRes = inputCrypto ? await fetchCryptoData(inputCrypto) : null;
      
      const stockPressure = stockRes?.orderBook ? getMarketPressure(stockRes.orderBook) : "NEUTRAL";
      const stockWall = stockRes?.orderBook ? detectOrderWalls(stockRes.orderBook) : null;

      setData({
        stock: { ticker: inputStock, ...stockRes, pressure: stockPressure, wall: stockWall },
        crypto: { ticker: inputCrypto, ...cryptoRes }
      });
    } catch (error) {
      console.error("Gagal sinkronisasi.");
    }
    setLoading(false);
  };

  const calculateMaxLots = (price: number, rdn: number) => {
    if (!price || price <= 0 || !rdn || rdn <= 0) return 0;
    return Math.floor(rdn / (price * 100));
  };

  const generateAISuggestion = (asset: any, isCrypto: boolean = false) => {
    const { price, ma20, ma100, ticker, wall } = asset || {};
    if (!price || !ma20 || !ma100) return { text: `Menghubungkan bursa...`, color: '#94a3b8', label: '[SYNCING]' };

    const isAboveMA = price > ma20 && price > ma100;
    if (!isAboveMA) return {
      label: '[MONITORING]',
      text: `DILARANG ENTRI: ${ticker} di bawah MA 20/100. Tetap dalam mode sunyi.`,
      color: '#f87171'
    };

    if (!isCrypto && wall) return {
      label: '[WAITING - WALL DETECTED]',
      text: `Ada TEMBOK ${wall.lot.toLocaleString()} lot di ${wall.price}. Tunggu tembok jebol.`,
      color: '#fbbf24'
    };

    return {
      label: '[ACCUMULATE]',
      text: `PROTOKOL TERPENUHI: Jalur bersih. Lakukan akumulasi bertahap.`,
      color: '#4ade80'
    };
  };

  const stockAI = generateAISuggestion(data.stock);
  const cryptoAI = generateAISuggestion(data.crypto, true);
  const totalEquity = (units.stock * (data.stock?.price || 0)) + (units.crypto * (data.crypto?.price || 0)) + units.rdn;
  const targetGap = Math.max(TARGET_IDR - totalEquity, 0);

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f1f5f9', minHeight: '100vh', padding: '30px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
          <h1 style={{ color: '#38bdf8', fontSize: '1.2rem' }}>SISTEM KENDALI SUNYI v2.2</h1>
          <button onClick={refreshAllData} style={{ background: '#38bdf8', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'ANALYZING...' : 'REFRESH SYSTEM'}
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', background: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
          <input placeholder="Stock" value={inputStock} onChange={(e) => setInputStock(e.target.value.toUpperCase())} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px' }} />
          <input placeholder="Crypto" value={inputCrypto} onChange={(e) => setInputCrypto(e.target.value.toUpperCase())} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px' }} />
          <input type="number" value={units.rdn} onChange={(e) => setUnits({...units, rdn: Number(e.target.value)})} placeholder="Cash RDN" style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px' }} />
        </div>

        <div style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#334155', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>INDIKATOR</th>
                <th style={{ padding: '15px' }}>SAHAM</th>
                <th style={{ padding: '15px' }}>KRIPTO</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '15px', color: '#94a3b8' }}>STATUS</td>
                <td style={{ padding: '15px', color: stockAI.color, fontWeight: 'bold' }}>{stockAI.label}</td>
                <td style={{ padding: '15px', color: cryptoAI.color, fontWeight: 'bold' }}>{cryptoAI.label}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '15px', color: '#94a3b8' }}>HARGA RIIL</td>
                <td style={{ padding: '15px' }}>IDR {data.stock?.price?.toLocaleString() || '0'}</td>
                <td style={{ padding: '15px' }}>IDR {data.crypto?.price?.toLocaleString() || '0'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '15px', color: '#94a3b8' }}>TARGET JUNI 2026</td>
                <td colSpan={2} style={{ padding: '15px' }}>
                  Sisa Kekurangan: <span style={{ color: '#fbbf24' }}>IDR {targetGap.toLocaleString()}</span>
                </td>
              </tr>
              
              {/* BARIS 6: INSTRUKSI FINAL DENGAN LOT & SL */}
              <tr>
                <td style={{ padding: '20px', color: '#94a3b8' }}>6. INSTRUKSI</td>
                <td colSpan={2} style={{ padding: '20px', backgroundColor: '#0f172a' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    {/* SAHAM: FORE / ADRO */}
                    {data.stock?.price > 0 && (
                      <div style={{ padding: '15px', borderLeft: `4px solid ${stockAI.color}`, background: '#1e293b' }}>
                        <div style={{ fontWeight: 'bold', color: stockAI.color, marginBottom: '5px' }}>PERINTAH SAHAM ({inputStock}):</div>
                        <div>
                          {stockAI.label === '[ACCUMULATE]' ? (
                            <>
                              <div style={{ color: '#4ade80', marginBottom: '5px' }}>
                                HAJAR KANAN: Maksimal <span style={{ fontWeight: 'bold' }}>{calculateMaxLots(data.stock.price, units.rdn)} Lot</span>.
                              </div>
                              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                PROTEKSI: Pasang SL di <span style={{ color: '#f87171', fontWeight: 'bold' }}>IDR {Math.floor(data.stock.price * 0.96).toLocaleString()}</span> (Cut Loss 4%) atau di bawah MA 20 (IDR {data.stock.ma20?.toLocaleString() || '-'}).
                              </div>
                            </>
                          ) : `MONITORING: ${stockAI.text}`}
                        </div>
                      </div>
                    )}

                    {/* KRIPTO: POL / BTC */}
                    {data.crypto?.price > 0 && (
                      <div style={{ padding: '15px', borderLeft: `4px solid ${cryptoAI.color}`, background: '#1e293b' }}>
                        <div style={{ fontWeight: 'bold', color: cryptoAI.color, marginBottom: '5px' }}>PERINTAH KRIPTO ({inputCrypto}):</div>
                        <div>
                          {cryptoAI.label === '[ACCUMULATE]' ? (
                            <>
                              <div style={{ color: '#38bdf8', marginBottom: '5px' }}>EKSEKUSI BERTAHAP.</div>
                              <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                                PROTEKSI: Batasi risiko maksimal 5% di <span style={{ color: '#f87171', fontWeight: 'bold' }}>IDR {Math.floor(data.crypto.price * 0.95).toLocaleString()}</span>.
                              </div>
                            </>
                          ) : "MONITORING SAJA."}
                        </div>
                      </div>
                    )}

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
