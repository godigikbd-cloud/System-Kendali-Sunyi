// src/services/portfolioService.ts

const proxy = (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

// DI DALAM portfolioService.ts

export const fetchStockData = async (ticker: string) => {
  try {
    if (!ticker) return { price: 0, ma20: 0, ma100: 0 };
    
    const symbol = ticker.includes('.') ? ticker : `${ticker}.JK`;
    
    // 1. UBAH range dari '1mo' ke '6mo' agar datanya cukup untuk hitung MA 100
    const response = await fetch(proxy(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`));
    const raw = await response.json();
    const data = JSON.parse(raw.contents);
    
    const result = data.chart.result[0];
    const price = result.meta.regularMarketPrice;
    
    // 2. AMBIL SEMUA DATA CLOSE YANG VALID
    const closePrices = result.indicators.quote[0].close.filter((p: any) => p !== null);
    
    // 3. HITUNG KEDUA MA (Jangan Dihapus!)
    const ma20 = closePrices.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
    const ma100 = closePrices.slice(-100).reduce((a: number, b: number) => a + b, 0) / 100;

    // 4. KIRIM SEMUA DATA KE APP.TSX
    return { 
      price: Math.round(price), 
      ma20: Math.round(ma20),
      ma100: Math.round(ma100)
    };
  } catch (error) {
    console.error("Gagal ambil saham:", error);
    return { price: 0, ma20: 0, ma100: 0 };
  }
};

export const fetchCryptoData = async (ticker: string) => {
  try {
    if (!ticker) return { price: 0, ma20: 0, ma100: 0 };
    
    const listRes = await fetch(proxy(`https://api.coingecko.com/api/v3/search?query=${ticker}`));
    const listData = await listRes.json();
    const coinId = JSON.parse(listData.contents).coins[0].id;

    // Ambil data 100 hari terakhir untuk Kripto
    const marketRes = await fetch(proxy(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=idr&days=100&interval=daily`));
    const marketData = await marketRes.json();
    const prices = JSON.parse(marketData.contents).prices.map((p: any) => p[1]);

    const latestPrice = prices[prices.length - 1];
    const ma20 = prices.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
    const ma100 = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;

    return { 
      price: Math.round(latestPrice), 
      ma20: Math.round(ma20),
      ma100: Math.round(ma100)
    };
  } catch (error) {
    console.error("Gagal ambil kripto:", error);
    return { price: 0, ma20: 0, ma100: 0 };
  }
};
/** * LOGIKA GATEKEEPER - SISTEM KENDALI SUNYI
 * Analisis Order Book untuk validasi eksekusi final.
 */

// 1. Menghitung Tekanan Pasar (Market Pressure)
export const getMarketPressure = (orderBook: { bids: any[], asks: any[] }) => {
  try {
    if (!orderBook || !orderBook.bids || !orderBook.asks) return "NEUTRAL";
    
    // Total Volume di sisi Bid (Hijau) vs Ask (Merah)
    const totalBid = orderBook.bids.reduce((sum, item) => sum + item.lot, 0);
    const totalAsk = orderBook.asks.reduce((sum, item) => sum + item.lot, 0);
    
    const pressureRatio = totalBid / totalAsk;

    if (pressureRatio > 1.5) return "BULLISH_SUPPORT"; // Pembeli dominan
    if (pressureRatio < 0.7) return "BEARISH_PRESSURE"; // Penjual dominan
    return "NEUTRAL";
  } catch (error) {
    return "NEUTRAL";
  }
};

// 2. Deteksi Tembok (Wall Detection)
export const detectOrderWalls = (orderBook: { asks: any[] }) => {
  try {
    if (!orderBook || !orderBook.asks || orderBook.asks.length === 0) return null;
    
    // Menghitung rata-rata volume di kolom Ask untuk mencari anomali batang panjang
    const allAskVolumes = orderBook.asks.map(item => item.lot);
    const avgVolume = allAskVolumes.reduce((a, b) => a + b, 0) / allAskVolumes.length;
    
    // Mencari harga dengan volume > 3x rata-rata (Tembok Penahan)
    const wall = orderBook.asks.find(item => item.lot > (avgVolume * 3));
    
    return wall ? { price: wall.price, lot: wall.lot } : null;
  } catch (error) {
    return null;
  }
};
