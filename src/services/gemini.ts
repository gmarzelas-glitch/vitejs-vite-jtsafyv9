import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeReceipt(imageBase64: string) {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp", 
      generationConfig: { responseMimeType: "application/json" }
    });

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const prompt = `You are a Senior International Financial Auditor. 
    Analyze this document (Invoice or Airline Ticket). 

    RULES:
    1. merchantName: FULL LEGAL NAME (e.g., AEGEAN AIRLINES S.A.). 
    2. date: Format YYYY-MM-DD.
    3. totalAmount: CRITICAL! Look at the FINAL page for the "TOTAL PAYABLE" or "ΤΕΛΙΚΟ ΠΛΗΡΩΤΕΟ". 
       - If you see a Fare of 201.00 and a Total Payable of 291.12, you MUST pick 291.12.
       - NEVER pick intermediate fare amounts or sub-totals.
    4. category: Strictly: Meals, Transportation, Accommodation, Subscriptions & Memberships, Other Cost.

    Return ONLY a JSON object.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return null;
  }
}