// src/services/gemini.ts

export type GeminiScanResult = {
  merchantName: string;
  date: string;
  totalAmount: number;
  category: string;
};

export async function scanWithGemini(
  _file: File
): Promise<GeminiScanResult | null> {
  // ❌ Gemini DISABLED on static hosting
  // ✅ App must NOT crash

  console.warn("Gemini disabled (no API key). Returning mock data.");

  // ΕΠΙΣΤΡΕΦΟΥΜΕ SAFE MOCK
  return {
    merchantName: "MANUAL ENTRY",
    date: new Date().toISOString().slice(0, 10),
    totalAmount: 0,
    category: "Other",
  };
}
