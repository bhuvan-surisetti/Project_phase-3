import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Mock Data Fallbacks
const MOCK_HEADLINES = [
  "NIFTY hits record high as tech stocks surge",
  "RBI maintains status quo on interest rates",
  "Global markets rally on cooling inflation data",
  "Corporate earnings exceed analyst expectations",
  "FII inflows strengthen Indian rupee",
  "Sector rotation observed towards banking and finance",
  "Infrastructure spending boost expected in upcoming budget",
  "Oil prices stabilize amid geopolitical tensions",
  "New manufacturing policy to drive industrial growth",
  "Consumer sentiment improves ahead of festive season"
];

// --- API Routes ---

// News API Proxy
app.get("/api/news", async (req, res) => {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return res.json({ articles: MOCK_HEADLINES.map(title => ({ title })) });
  }
  
  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=Indian%20stock%20market&pageSize=10&apiKey=${apiKey}`);
    const data = await response.json();
    if (data.status === "ok") {
      res.json(data);
    } else {
      throw new Error(data.message || "NewsAPI Error");
    }
  } catch (error) {
    res.json({ articles: MOCK_HEADLINES.map(title => ({ title })) });
  }
});

// Market Data Proxy (Upstox Proxy)
app.get("/api/market/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const token = process.env.UPSTOX_ACCESS_TOKEN;

  // Mock data generator for demo stability
  const getMockData = (sym: string) => {
    const base = sym === "NIFTY" ? 22000 : 2500;
    const change = (Math.random() - 0.4) * 2; // Bias slightly positive
    const last = base * (1 + change / 100);
    return {
      last_price: last,
      previous_close: base,
      volume: Math.floor(Math.random() * 1000000) + 500000,
      change_percent: change
    };
  };

  if (!token) {
    return res.json(getMockData(symbol));
  }

  // Real Upstox implementation would go here
  // For hackathon stability, we use mock if token is placeholder
  res.json(getMockData(symbol));
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuantIntel Server running on http://localhost:${PORT}`);
  });
}

startServer();
