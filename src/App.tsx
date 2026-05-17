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
    <div style={{ backgroundColor: '#0f172a', color: '#f1f5f9', minHeight: '100vh', padding: '15px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h1 style={{ color: '#38bdf8', fontSize: '1.1rem', margin: 0 }}>SISTEM KENDALI SUNYI v2.2</h1>
          <button onClick={refreshAllData} style={{ background: '#38bdf8', border: 'none', padding: '10px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
            {loading ? 'ANALYZING...' : 'REFRESH SYSTEM'}
          </button>
        </header>

        <div style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
          {/* tableLayout fixed membagi kolom simetris 33% rata kanan-kiri */}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              {/* BARIS INPUT BARU: Urutan Saldo (RDN) - Stock - Crypto */}
              <tr style={{ background: '#1e293b' }}>
                <td style={{ padding: '10px 8px' }}>
                  <input 
                    type="number" 
                    value={units.rdn || ''} 
                    onChange={(e) => setUnits({...units, rdn: Number(e.target.value)})} 
                    placeholder="Cash RDN" 
                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 4px', width: '100%', boxSizing: 'border-box', textAlign: 'center', fontSize: '0.85rem', borderRadius: '4px' }} 
                  />
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <input 
                    placeholder="Stock" 
                    value={inputStock} 
                    onChange={(e) => setInputStock(e.target.value.toUpperCase())} 
                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 4px', width: '100%', boxSizing: 'border-box', textAlign: 'center', fontSize: '0.85rem', borderRadius: '4px' }} 
                  />
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <input 
                    placeholder="Crypto" 
                    value={inputCrypto} 
                    onChange={(e) => setInputCrypto(e.target.value.toUpperCase())} 
                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 4px', width: '100%', boxSizing: 'border-box', textAlign: 'center', fontSize: '0.85rem', borderRadius: '4px' }} 
                  />
                </td>
              </tr>

              {/* HEADER NAMA KOLOM */}
              <tr style={{ background: '#334155', textAlign: 'left', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 10px' }}>INDIKATOR</th>
                <th style={{ padding: '12px 10px' }}>SAHAM</th>
                <th style={{ padding: '12px 10px' }}>KRIPTO</th>
              </tr>
            </thead>
            
            <tbody style={{ fontSize: '0.85rem' }}>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px 10px', color: '#94a3b8' }}>STATUS</td>
                <td style={{ padding: '12px 10px', color: stockAI.color, fontWeight: 'bold' }}>{stockAI.label}</td>
                <td style={{ padding: '12px 10px', color: cryptoAI.color, fontWeight: 'bold' }}>{cryptoAI.label}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px 10px', color: '#94a3b8' }}>HARGA RIIL</td>
                <td style={{ padding: '12px 10px' }}>IDR {data.stock?.price?.toLocaleString() || '0'}</td>
                <td style={{ padding: '12px 10px' }}>IDR {data.crypto?.price?.toLocaleString() || '0'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '12px 10px', color: '#94a3b8' }}>TARGET JUNI 2026</td>
                <td colSpan={2} style={{ padding: '12px 10px' }}>
                  Sisa Kekurangan: <span style={{ color: '#fbbf24' }}>IDR {targetGap.toLocaleString()}</span>
                </td>
              </tr>
              
              <tr>
                <td style={{ padding: '15px 10px', color: '#94a3b8', verticalAlign: 'top' }}>INSTRUKSI</td>
                <td colSpan={2} style={{ padding: '15px 10px', backgroundColor: '#0f172a' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    {/* SAHAM */}
                    {data.stock?.price > 0 && (
                      <div style={{ padding: '12px', borderLeft: `4px solid ${stockAI.color}`, background: '#1e293b' }}>
                        <div style={{ fontWeight: 'bold', color: stockAI.color, marginBottom: '5px', fontSize: '0.85rem' }}>PERINTAH SAHAM ({inputStock}):</div>
                        <div style={{ fontSize: '0.8rem' }}>
                          {stockAI.label === '[ACCUMULATE]' ? (
                            <>
                              <div style={{ color: '#4ade80', marginBottom: '5px' }}>
                                HAJAR KANAN: Maksimal <span style={{ fontWeight: 'bold' }}>{calculateMaxLots(data.stock.price, units.rdn)} Lot</span>.
                              </div>
                              <div style={{ color: '#94a3b8' }}>
                                PROTEKSI: Pasang SL di <span style={{ color: '#f87171', fontWeight: 'bold' }}>IDR {Math.floor(data.stock.price * 0.96).toLocaleString()}</span> (Cut Loss 4%) atau di bawah MA 20 (IDR {data.stock.ma20?.toLocaleString() || '-'}).
                              </div>
                            </>
                          ) : `MONITORING: ${stockAI.text}`}
                        </div>
                      </div>
                    )}

                    {/* KRIPTO (SUDAH DI-UPGRADE DINAMIS) */}
{data.crypto?.price > 0 && (
  <div style={{ padding: '12px', borderLeft: `4px solid ${cryptoAI.color}`, background: '#1e293b' }}>
    <div style={{ fontWeight: 'bold', color: cryptoAI.color, marginBottom: '5px', fontSize: '0.85rem' }}>
      PERINTAH KRIPTO ({inputCrypto}):
    </div>
    <div style={{ fontSize: '0.8rem' }}>
      {cryptoAI.label === '[ACCUMULATE]' ? (
        <>
          <div style={{ color: '#4ade80', marginBottom: '5px' }}>
            HAJAR KANAN: Maksimal <span style={{ fontWeight: 'bold' }}>{(units.rdn / data.crypto.price).toFixed(4)} {inputCrypto}</span>.
          </div>
          <div style={{ color: '#38bdf8', marginBottom: '5px' }}>
            TAKE PROFIT (TP): Jual di <span style={{ fontWeight: 'bold' }}>IDR {Math.floor(data.crypto.price * 1.10).toLocaleString()}</span> (Target +10%).
          </div>
          <div style={{ color: '#94a3b8' }}>
            PROTEKSI: Pasang SL di <span style={{ color: '#f87171', fontWeight: 'bold' }}>IDR {Math.floor(data.crypto.price * 0.95).toLocaleString()}</span> (Cut Loss 5%).
          </div>
        </>
      ) : (
        <div style={{ color: '#94a3b8' }}>MONITORING: {cryptoAI.text}</div>
      )}
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
