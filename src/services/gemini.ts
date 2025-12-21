import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDh9RuXuIU4oBI6z0PC-mOvpe28KmgQ-lA";

export async function analyzeReceipt(imageBase64: string) {
  try {
    console.log("Using Gemini 3 Flash for High-Precision OCR...");
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // ΑΛΛΑΓΗ ΜΟΝΤΕΛΟΥ ΣΕ GEMINI 3 FLASH
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp", // Αυτό είναι το τεχνικό όνομα για την τελευταία έκδοση
      generationConfig: { responseMimeType: "application/json" }
    });

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const prompt = `You are a specialized Greek Receipt OCR. 
    Read the image and extract:
    - merchantName (e.g., ΑΝΔΡΙΑΣ ΖΑΧΑΡΟΠΛΑΣΤΕΙΟ)
    - date (YYYY-MM-DD)
    - totalAmount (as a number, e.g., 19.30)
    - currency (EUR)
    - category (Meals, Transportation, Accommodation, Subscriptions & Memberships, Other Cost)
    
    Return ONLY JSON. If you see Greek text, keep the merchant name in Greek.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);

    const response = await result.response;
    return JSON.parse(response.text());

  } catch (error) {
    console.error("Gemini 3 OCR Error:", error);
    return null; // Πλέον αν αποτύχει, θα ξέρουμε ότι είναι θέμα σύνδεσης
  }
}
