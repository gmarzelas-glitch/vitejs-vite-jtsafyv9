// src/services/gemini.ts

export type ScanResult = {
  date: string;
  category: string;
  vendor: string;
  amount: number;
};

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 👉 FAKE RESULT για static hosting
const MOCK_RESULT: ScanResult = {
  date: new Date().toISOString().slice(0, 10),
  category: "OTHER",
  vendor: "MANUAL ENTRY",
  amount: 0,
};

export async function scanExpenseWithGemini(
  _imageBase64: string
): Promise<ScanResult> {
  // ⛔ ΧΩΡΙΣ KEY → ΔΕΝ ΚΡΑΣΑΡΟΥΜΕ
  if (!GEMINI_KEY) {
    console.warn("Gemini disabled (no API key) – using mock result");
    return MOCK_RESULT;
  }

  // ⛔ ΑΝ ΚΑΠΟΤΕ ΒΑΛΕΙΣ BACKEND
  // εδώ μπαίνει κανονικό Gemini logic
  // προς το παρόν:
  return MOCK_RESULT;
}
