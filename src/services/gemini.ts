import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeReceipt(imagesBase64: string[]) {
  try {
    if (!API_KEY) throw new Error("Missing API Key");
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Μετατροπή όλων των σελίδων για το AI
    const imageParts = imagesBase64.map(img => ({
      inlineData: { 
        data: img.includes(',') ? img.split(',')[1] : img, 
        mimeType: "image/jpeg" 
      }
    }));

    const prompt = `Analyze ALL provided pages of this document. 
    Find the ABSOLUTE FINAL TOTAL PAYABLE AMOUNT. 
    On Aegean Invoices, DO NOT pick the fare (e.g. 201.00). Pick the final charged sum (e.g. 291.12).
    
    Extract:
    1. merchantName: Full legal entity (e.g. AEGEAN AIRLINES S.A.)
    2. date: YYYY-MM-DD
    3. totalAmount: Final payable sum (number only)
    4. category: One of [Meals, Transportation, Accommodation, Subscriptions & Memberships, Other Cost]

    Return JSON ONLY: {"merchantName": "...", "date": "...", "totalAmount": "...", "category": "..."}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return JSON.parse(response.text().replace(/```json|```/g, ""));
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
}