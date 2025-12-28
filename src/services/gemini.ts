import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY (.dev)");

const genAI = new GoogleGenerativeAI(apiKey);

export type ReceiptResult = {
  merchantName: string | null;
  date: string | null; // YYYY-MM-DD
  totalAmount: number | null;
  category:
    | "Meals"
    | "Transportation"
    | "Accommodation"
    | "Subscriptions & Memberships"
    | "Other Cost"
    | null;
  documentNumber: string | null; // ✅ NEW
};

function cleanJson(text: string) {
  return text.replace(/```json|```/g, "").trim();
}

function safeText(result: any): string {
  const parts = result?.response?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join("").trim();
}

async function pickWorkingModelId(): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(`ListModels failed: ${res.status} ${JSON.stringify(json)}`);

  const models: any[] = json?.models ?? [];
  const candidates = models.filter(
    (m) =>
      Array.isArray(m?.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes("generateContent")
  );
  if (!candidates.length) throw new Error("No model supports generateContent.");

  const score = (m: any) => {
    const n = String(m?.name ?? "").toLowerCase();
    if (n.includes("flash")) return 0;
    if (n.includes("pro")) return 1;
    if (n.includes("vision")) return 2;
    return 3;
  };

  candidates.sort((a, b) => score(a) - score(b));
  const fullName = String(candidates[0].name);
  return fullName.startsWith("models/") ? fullName.slice("models/".length) : fullName;
}

let cachedModelId: string | null = null;

const normDoc = (s: string | null | undefined) =>
  (s ?? "").toString().trim().toUpperCase().replace(/\s+/g, "");

function mergeResults(all: ReceiptResult[]): ReceiptResult {
  const merchantName = all.map((x) => x.merchantName).find((v) => v && v.trim()) ?? null;
  const date = all.map((x) => x.date).find((v) => v && v.trim()) ?? null;

  const amounts = all
    .map((x) => x.totalAmount)
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  const totalAmount = amounts.length ? Math.max(...amounts) : null;

  const category = all.map((x) => x.category).find((v) => v) ?? null;

  const documentNumber =
    all.map((x) => x.documentNumber).find((v) => v && v.trim()) ?? null;

  return {
    merchantName,
    date,
    totalAmount,
    category,
    documentNumber: documentNumber ? normDoc(documentNumber) : null
  };
}

export async function analyzeReceipt(imagesBase64: string[]): Promise<ReceiptResult | null> {
  try {
    if (!cachedModelId) cachedModelId = await pickWorkingModelId();
    const model = genAI.getGenerativeModel({ model: cachedModelId });

    const prompt = `
You are a Senior Financial Auditor.

You will be given ONE PAGE IMAGE of a receipt/invoice (possibly multi-page overall).
Extract ONLY what appears on THIS page.

Return ONLY a raw JSON object with:
{
  "merchantName": string|null,
  "date": "YYYY-MM-DD"|null,
  "totalAmount": number|null,
  "category": "Meals"|"Transportation"|"Accommodation"|"Subscriptions & Memberships"|"Other Cost"|null,
  "documentNumber": string|null
}

Rules:
- documentNumber = receipt/invoice number / "ΑΡ. ΠΑΡΑΣΤΑΤΙΚΟΥ" / "Αριθμός" / "No." / "Invoice No"
- totalAmount = FINAL payable total IF it appears on this page, else null
- No markdown. No text outside JSON.
`.trim();

    const perPage: ReceiptResult[] = [];

    for (let i = 0; i < imagesBase64.length; i++) {
      const img = imagesBase64[i];
      const base64 = img.includes(",") ? img.split(",")[1] : img;

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: `${prompt}\n\nPAGE ${i + 1} / ${imagesBase64.length}` },
              { inlineData: { data: base64, mimeType: "image/jpeg" } },
            ],
          },
        ],
      });

      const text = safeText(result);
      if (!text) continue;

      const parsedText = cleanJson(text);

      try {
        const parsed = JSON.parse(parsedText) as ReceiptResult;

        // normalize doc number
        if (parsed.documentNumber) parsed.documentNumber = normDoc(parsed.documentNumber);

        perPage.push(parsed);
      } catch {
        console.error("Invalid JSON on page", i + 1, parsedText);
      }
    }

    if (!perPage.length) return null;

    return mergeResults(perPage);
  } catch (e) {
    console.error("❌ Gemini analyzeReceipt error:", e);
    return null;
  }
}
