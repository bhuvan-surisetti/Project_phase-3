import { GoogleGenAI } from "@google/genai";
import { MarketData } from "../types";

export async function fetchNews(): Promise<string[]> {
  const res = await fetch("/api/news");
  const data = await res.json();
  return data.articles.map((a: any) => a.title);
}

export async function fetchSentiment(headlines: string[]): Promise<number> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found, using mock sentiment");
    return 0.15;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are FinBERT, a financial sentiment analysis model. 
      Analyze the following headlines and return a single average sentiment score between -1 (extremely negative) and +1 (extremely positive).
      0 is neutral. 
      
      Headlines:
      ${headlines.join("\n")}
      
      Return ONLY the numerical score.`,
    });

    const text = response.text?.trim() || "0";
    const score = parseFloat(text);
    return isNaN(score) ? 0 : score;
  } catch (error) {
    console.error("Sentiment Analysis Error:", error);
    return 0;
  }
}

export async function fetchMarketData(symbol: string): Promise<MarketData> {
  const res = await fetch(`/api/market/${symbol}`);
  return await res.json();
}
