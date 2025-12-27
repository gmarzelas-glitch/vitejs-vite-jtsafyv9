import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeReceipt(imagesBase64: string[]) {
  try {
    if (!API_KEY) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ΣΩΣΤΟ FORMAT ΜΕ PARTS (ISSUE 1 FIX)
    const imageParts = imagesBase64.map(img => ({
      inlineData: { 
        data: img.includes(',') ? img.split(',')[1] : img, 
        mimeType: "image/jpeg" 
      }
    }));

    const prompt = `Analyze ALL pages. Return a VALID JSON object. 
    DO NOT include explanations or markdown. If info missing, use null.
    
    Fields:
    1. merchantName: Full legal entity (e.g. AEGEAN AIRLINES S.A.).
    2. date: YYYY-MM-DD.
    3. totalAmount: FIND THE FINAL PAYABLE TOTAL. 
       - Look for 'ΤΕΛΙΚΟ ΠΛΗΡΩΤΕΟ' or 'TOTAL PAYABLE'.
       - Pick the absolute final charged sum (e.g. 291.12).
    4. category: One of [Meals, Transportation, Accommodation, Subscriptions & Memberships, Other Cost].`;

    const parts = [{ text: prompt }, ...imageParts];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }]
    });

    // ΑΣΦΑΛΕΣ PARSING (ISSUE 2 FIX)
    const response = result.response;
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates from Gemini");
    }

    const text = response.candidates[0].content.parts.map(p => p.text || "").join("").trim();
    
    // ΚΑΘΑΡΙΣΜΟΣ JSON (ISSUE 3 FIX)
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.error("RAW OUTPUT ERROR:", text);
      throw new Error("Invalid JSON returned");
    }

    return parsed;
  } catch (error) {
    console.error("Gemini Critical Error:", error);
    return null;
  }
}