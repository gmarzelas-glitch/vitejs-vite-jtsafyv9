import { GoogleGenerativeAI } from "@google/generative-ai";

// Βάζουμε το κλειδί απευθείας εδώ για να είμαστε σίγουροι ότι το βλέπει
const HARDCODED_KEY = "AIzaSyDh9RuXuIU4oBI6z0PC-mOvpe28KmgQ-lA";

export async function analyzeReceipt(imagesBase64: string[]) {
  try {
    const genAI = new GoogleGenerativeAI(HARDCODED_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageParts = imagesBase64.map(img => ({
      inlineData: { 
        data: img.includes(',') ? img.split(',')[1] : img, 
        mimeType: "image/jpeg" 
      }
    }));

    const prompt = `Analyze ALL provided pages. Find the ABSOLUTE FINAL TOTAL PAYABLE AMOUNT. 
    On Aegean Invoices, DO NOT pick the fare (e.g. 201.00). Pick the final charged sum (e.g. 291.12).
    Extract:
    1. merchantName: Full legal entity (e.g. AEGEAN AIRLINES S.A.)
    2. date: YYYY-MM-DD
    3. totalAmount: Final payable sum (number only)
    4. category: Strictly one of [Meals, Transportation, Accommodation, Subscriptions & Memberships, Other Cost]

    Return JSON ONLY: {"merchantName": "...", "date": "...", "totalAmount": "...", "category": "..."}`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    return JSON.parse(response.text().replace(/```json|```/g, ""));
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
}