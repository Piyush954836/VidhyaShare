import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ No API Key found in .env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    console.log("🔍 Checking available models for your API Key...");
    // This works because we are using the lower-level model manager
    // Note: The SDK doesn't expose listModels directly on the main class easily in all versions,
    // so we try a direct fetch to be 100% sure what the API sees.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.error) {
      console.error("❌ API Error:", data.error);
      return;
    }

    console.log("\n✅ AVAILABLE MODELS:");
    const availableNames = [];
    data.models.forEach(model => {
      if (model.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${model.name} (Display: ${model.displayName})`);
        // Strip "models/" prefix for the SDK
        availableNames.push(model.name.replace("models/", ""));
      }
    });

    console.log("\n👉 USE THIS STRING IN YOUR CODE:", availableNames[0]);
  } catch (error) {
    console.error("❌ Network/Script Error:", error);
  }
}

listModels();