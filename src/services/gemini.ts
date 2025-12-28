// src/services/gemini.ts

export async function scanWithGemini(_file: File) {
  console.warn("Gemini disabled on static hosting");
  return {
    date: "",
    category: "",
    vendor: "",
    amount: ""
  };
}
