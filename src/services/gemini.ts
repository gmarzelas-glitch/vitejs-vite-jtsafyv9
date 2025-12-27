import { GoogleGenerativeAI } from "@google/generative-ai";

// ΤΟ ΚΛΕΙΔΙ ΣΟΥ ΕΙΝΑΙ ΕΔΩ - ΔΕΝ ΧΡΕΙΑΖΕΤΑΙ ΤΟ .env ΤΩΡΑ
const API_KEY = "AIzaSyDh9RuXuIU4oBI6z0PC-mOvpe28KmgQ-lA";

export async function analyzeReceipt(imagesBase64: string[]) {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Χρησιμοποιούμε το 1.5 Flash για ταχύτητα και αξιοπιστία
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageParts = imagesBase64.map(img => ({
      inlineData: { 
        data: img.includes(',') ? img.split(',')[1] : img, 
        mimeType: "image/jpeg" 
      }
    }));

    const prompt = `You are a Senior Financial Auditor. Analyze ALL pages of this document.
    1. merchantName: Full legal entity (e.g., AEGEAN AIRLINES S.A.). Keep Greek if present.
    2. date: Extract in YYYY-MM-DD format.
    3. totalAmount: CRITICAL! Look for the FINAL PAYABLE TOTAL. 
       - On Aegean tickets, IGNORE net fares (e.g. 201.00). 
       - PICK THE FINAL SUM (e.g. 291.12).
    4. category: Strictly one of: Meals, Transportation, Accommodation, Subscriptions & Memberships, Other Cost.

    Return ONLY a raw JSON object. No markdown.`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text().trim();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return null;
  }
}