import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeReceipt(imagesBase64: string[]) {
  if (!API_KEY) {
    console.warn("Gemini disabled: missing API key");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageParts = imagesBase64.map(img => ({
      inlineData: {
        data: img.split(",")[1],
        mimeType: "image/jpeg",
      },
    }));

    const prompt = `
Return JSON only:
{
  "merchantName": "",
  "date": "YYYY-MM-DD",
  "totalAmount": "",
  "category": ""
}
`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini error", e);
    return null;
  }
}
