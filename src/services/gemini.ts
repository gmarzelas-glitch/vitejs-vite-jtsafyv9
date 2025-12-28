import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Αν δεν υπάρχει key	at build/runtime (GitHub Pages/Hostinger), ΜΗΝ σκάει όλο το app.
export async function analyzeReceipt(imagesBase64: string[]) {
  if (!API_KEY) return null;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageParts = imagesBase64.map((img) => ({
      inlineData: { data: img.split(",")[1], mimeType: "image/jpeg" },
    }));

    const prompt = `Return JSON ONLY: {"merchantName":"...","date":"YYYY-MM-DD","totalAmount":"...","category":"Meals|Transportation|Accommodation|Subscriptions & Memberships|Other Cost"}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Gemini OCR Error:", e);
    return null;
  }
}
