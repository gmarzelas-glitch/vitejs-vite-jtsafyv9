import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeReceipt(imagesBase64: string[]) {
  try {
    if (!API_KEY) throw new Error("Missing API Key");
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageParts = imagesBase64.map(img => ({
      inlineData: { 
        data: img.includes(',') ? img.split(',')[1] : img, 
        mimeType: "image/jpeg" 
      }
    }));

    const prompt = `Analyze ALL pages of this document.
    Find the ABSOLUTE FINAL TOTAL PAYABLE AMOUNT. 
    On Aegean Invoices, ignore fares (e.g. 201.00). Pick the final charged sum (e.g. 291.12).
    
    Return JSON ONLY: 
    {"merchantName": "...", "date": "YYYY-MM-DD", "totalAmount": "...", "category": "..."}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    return JSON.parse(result.response.text().replace(/```json|```/g, ""));
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
}