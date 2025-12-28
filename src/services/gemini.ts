// src/services/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Βάλε εδώ το μοντέλο που χρησιμοποιούσες. Αν δεν ξέρεις, άστο έτσι.
const DEFAULT_MODEL = "gemini-1.5-flash";

export type GeminiScanResult = {
  merchantName?: string;
  date?: string;
  totalAmount?: number;
  category?: string;
  documentType?: string;
  documentNumber?: string;
  supplierVat?: string;
  rawText?: string;
};

export async function scanExpenseWithGemini(prompt: string): Promise<GeminiScanResult | null> {
  // Αν δεν υπάρχει key, ΜΗΝ σκάσεις – απλά γύρνα null.
  if (!API_KEY) {
    console.warn("[Gemini] Disabled: missing VITE_GEMINI_API_KEY");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? "";

    // προσπάθεια parse JSON αν το prompt σου γυρνά JSON
    try {
      const cleaned = text
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

      const obj = JSON.parse(cleaned);
      return { ...obj, rawText: text };
    } catch {
      return { rawText: text };
    }
  } catch (err: any) {
    // ΔΕΝ πετάμε "AI fail" – τυπώνουμε το πραγματικό error
    const status = err?.status || err?.response?.status;
    const message =
      err?.message ||
      err?.response?.statusText ||
      (typeof err === "string" ? err : "Unknown error");

    console.error("[Gemini] Request failed", { status, message, err });

    // Αν θες να συνεχίσει το app χωρίς popup:
    return null;
  }
}
