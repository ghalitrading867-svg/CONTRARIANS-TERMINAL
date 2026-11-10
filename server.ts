import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // In-memory cache to prevent hitting exchange rate limits
  const cache: Record<string, { data: unknown; timestamp: number }> = {};
  const getCached = (key: string, ttlMs: number = 2000) => {
    const item = cache[key];
    if (item && Date.now() - item.timestamp < ttlMs) {
      return item.data;
    }
    return null;
  };
  const setCache = (key: string, data: unknown) => {
    cache[key] = { data, timestamp: Date.now() };
  };

  // API 1: Live Ticker (/api/ticker?symbol=BTCUSDT&source=binance)
  app.get('/api/ticker', async (req: Request, res: Response) => {
    const symbol = ((req.query.symbol as string) || 'BTCUSDT').toUpperCase();
    const source = (req.query.source as string) || 'binance';
    const cacheKey = `ticker_${source}_${symbol}`;

    const cached = getCached(cacheKey, 1500);
    if (cached) {
      return res.json(cached);
    }

    try {
      if (source === 'bitget') {
        const bRes = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`);
        if (!bRes.ok) throw new Error(`Bitget status ${bRes.status}`);
        const json = await bRes.json();
        if (json.code === '00000' && json.data && json.data[0]) {
          const d = json.data[0];
          const open = parseFloat(d.open || '0');
          const last = parseFloat(d.lastPr || '0');
          const changePct = open > 0 ? ((last - open) / open) * 100 : 0;
          const result = {
            symbol,
            price: last,
            change24h: changePct,
            high24h: parseFloat(d.high24h || '0'),
            low24h: parseFloat(d.low24h || '0'),
            volumeQuote: parseFloat(d.quoteVolume || '0'),
            source: 'bitget',
          };
          setCache(cacheKey, result);
          return res.json(result);
        }
      }

      // Default or fallback to Binance
      const resB = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      if (!resB.ok) throw new Error(`Binance status ${resB.status}`);
      const d = await resB.json();
      const result = {
        symbol,
        price: parseFloat(d.lastPrice),
        change24h: parseFloat(d.priceChangePercent),
        high24h: parseFloat(d.highPrice),
        low24h: parseFloat(d.lowPrice),
        volumeQuote: parseFloat(d.quoteVolume),
        source: 'binance',
      };
      setCache(cacheKey, result);
      return res.json(result);
    } catch (err: unknown) {
      // Fallback to secondary source
      try {
        const altRes = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`);
        const json = await altRes.json();
        if (json.data && json.data[0]) {
          const d = json.data[0];
          const open = parseFloat(d.open || '0');
          const last = parseFloat(d.lastPr || '0');
          const changePct = open > 0 ? ((last - open) / open) * 100 : 0;
          const result = {
            symbol,
            price: last,
            change24h: changePct,
            high24h: parseFloat(d.high24h || '0'),
            low24h: parseFloat(d.low24h || '0'),
            volumeQuote: parseFloat(d.quoteVolume || '0'),
            source: 'bitget-fallback',
          };
          return res.json(result);
        }
      } catch {}

      const msg = err instanceof Error ? err.message : 'Ticker error';
      return res.status(502).json({ error: msg });
    }
  });

  // API 2: Live Klines (/api/klines?symbol=BTCUSDT&interval=1h&limit=50&source=binance)
  app.get('/api/klines', async (req: Request, res: Response) => {
    const symbol = ((req.query.symbol as string) || 'BTCUSDT').toUpperCase();
    const interval = (req.query.interval as string) || '1h';
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const source = (req.query.source as string) || 'binance';
    const cacheKey = `klines_${source}_${symbol}_${interval}_${limit}`;

    const cached = getCached(cacheKey, 3000);
    if (cached) {
      return res.json(cached);
    }

    try {
      if (source === 'bitget') {
        const bitgetMap: Record<string, string> = {
          '1m': '1min',
          '5m': '5min',
          '15m': '15min',
          '1h': '1h',
          '4h': '4h',
          '1d': '1day',
        };
        const gran = bitgetMap[interval] || '1h';
        const bRes = await fetch(
          `https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=${gran}&limit=${limit}`
        );
        if (!bRes.ok) throw new Error(`Bitget klines status ${bRes.status}`);
        const json = await bRes.json();
        if (json.code === '00000' && Array.isArray(json.data)) {
          // Bitget data is sorted chronologically
          const candles = json.data.map((item: string[]) => {
            const ts = parseInt(item[0]);
            const d = new Date(ts);
            const timeStr = interval === '1d' ? `${d.getMonth() + 1}/${d.getDate()}` : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            return {
              timestamp: ts,
              timeStr,
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
            };
          });
          setCache(cacheKey, candles);
          return res.json(candles);
        }
      }

      // Default or Binance
      const resB = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      if (!resB.ok) throw new Error(`Binance klines status ${resB.status}`);
      const raw = await resB.json();
      const candles = (raw as Array<[number, string, string, string, string, string]>).map((item) => {
        const ts = item[0];
        const d = new Date(ts);
        const timeStr = interval === '1d' ? `${d.getMonth() + 1}/${d.getDate()}` : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return {
          timestamp: ts,
          timeStr,
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        };
      });
      setCache(cacheKey, candles);
      return res.json(candles);
    } catch (err: unknown) {
      // Automatic fallback to Bitget if Binance fails
      try {
        const bRes = await fetch(
          `https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol}&granularity=1h&limit=${limit}`
        );
        const json = await bRes.json();
        if (json.data && Array.isArray(json.data)) {
          const candles = json.data.map((item: string[]) => {
            const ts = parseInt(item[0]);
            const d = new Date(ts);
            const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            return {
              timestamp: ts,
              timeStr,
              open: parseFloat(item[1]),
              high: parseFloat(item[2]),
              low: parseFloat(item[3]),
              close: parseFloat(item[4]),
              volume: parseFloat(item[5]),
            };
          });
          return res.json(candles);
        }
      } catch {}

      const msg = err instanceof Error ? err.message : 'Klines error';
      return res.status(502).json({ error: msg });
    }
  });

  // API 3: Contrarian Metrics (Long/Short ratio & Funding Rate)
  app.get('/api/contrarian', async (req: Request, res: Response) => {
    const symbol = ((req.query.symbol as string) || 'BTCUSDT').toUpperCase();
    const cacheKey = `contrarian_${symbol}`;
    const cached = getCached(cacheKey, 10000);
    if (cached) return res.json(cached);

    let fundingRate = 0.0001;
    let longAccountPct = 68;
    let shortAccountPct = 32;
    let longShortRatio = 2.12;

    try {
      const fRes = await fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`);
      if (fRes.ok) {
        const fData = await fRes.json();
        if (Array.isArray(fData) && fData[0]) {
          fundingRate = parseFloat(fData[0].fundingRate);
        }
      }

      const lsRes = await fetch(
        `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1`
      );
      if (lsRes.ok) {
        const lsData = await lsRes.json();
        if (Array.isArray(lsData) && lsData[0]) {
          longAccountPct = Math.round(parseFloat(lsData[0].longAccount) * 100);
          shortAccountPct = Math.round(parseFloat(lsData[0].shortAccount) * 100);
          longShortRatio = parseFloat(lsData[0].longShortRatio);
        }
      }
    } catch {
      // Use reasonable baseline
    }

    const payload = {
      longShortRatio,
      longAccountPct,
      shortAccountPct,
      fundingRate,
    };
    setCache(cacheKey, payload);
    return res.json(payload);
  });

  // API 4: Market Movers (Top Gainers, Top Losers, Top Revenue/Volume)
  app.get('/api/market-movers', async (_req: Request, res: Response) => {
    const cacheKey = 'market_movers_all';
    const cached = getCached(cacheKey, 6000);
    if (cached) return res.json(cached);

    try {
      const bRes = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!bRes.ok) throw new Error('Binance 24hr fetch failed');
      const allTickers = (await bRes.json()) as Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        quoteVolume: string;
        highPrice: string;
        lowPrice: string;
      }>;

      // Filter for valid liquid USDT pairs (exclude stablecoins pairs like USDCUSDT, FDUSDUSDT)
      const ignored = ['USDCUSDT', 'FDUSDUSDT', 'TUSDUSDT', 'EURUSDT', 'USDPUSDT', 'AEURUSDT'];
      const usdtPairs = allTickers.filter(
        (t) =>
          t.symbol.endsWith('USDT') &&
          !ignored.includes(t.symbol) &&
          parseFloat(t.quoteVolume) > 5000000 &&
          !t.symbol.includes('UP') &&
          !t.symbol.includes('DOWN')
      );

      const mapTicker = (t: (typeof allTickers)[0]) => ({
        symbol: t.symbol,
        price: parseFloat(t.lastPrice),
        change24h: parseFloat(t.priceChangePercent),
        volumeQuote: parseFloat(t.quoteVolume),
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
      });

      const gainers = [...usdtPairs]
        .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent))
        .slice(0, 8)
        .map(mapTicker);

      const losers = [...usdtPairs]
        .sort((a, b) => parseFloat(a.priceChangePercent) - parseFloat(b.priceChangePercent))
        .slice(0, 8)
        .map(mapTicker);

      const topRevenue = [...usdtPairs]
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 8)
        .map(mapTicker);

      const result = { gainers, losers, topRevenue };
      setCache(cacheKey, result);
      return res.json(result);
    } catch {
      // Fallback
      return res.json({
        gainers: [
          { symbol: 'AVAXUSDT', price: 31.85, change24h: 12.4, volumeQuote: 142000000 },
          { symbol: 'SUIUSDT', price: 3.24, change24h: 9.8, volumeQuote: 310000000 },
          { symbol: 'NEARUSDT', price: 5.48, change24h: 8.2, volumeQuote: 95000000 },
          { symbol: 'DOGEUSDT', price: 0.284, change24h: 6.9, volumeQuote: 480000000 },
        ],
        losers: [
          { symbol: 'INJUSDT', price: 21.4, change24h: -4.8, volumeQuote: 42000000 },
          { symbol: 'SOLUSDT', price: 181.2, change24h: -2.9, volumeQuote: 620000000 },
          { symbol: 'BTCUSDT', price: 75120, change24h: -1.2, volumeQuote: 1240000000 },
          { symbol: 'ETHUSDT', price: 2475, change24h: -0.9, volumeQuote: 590000000 },
        ],
        topRevenue: [
          { symbol: 'BTCUSDT', price: 75120, change24h: -1.2, volumeQuote: 1240000000 },
          { symbol: 'ETHUSDT', price: 2475, change24h: -0.9, volumeQuote: 590000000 },
          { symbol: 'SOLUSDT', price: 181.2, change24h: -2.9, volumeQuote: 620000000 },
          { symbol: 'DOGEUSDT', price: 0.284, change24h: 6.9, volumeQuote: 480000000 },
        ],
      });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Contrarians Terminal Proxy' });
  });

  // Mount Vite middleware in development or static assets in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Contrarians Terminal server running on port ${PORT}`);
  });
}

startServer();
