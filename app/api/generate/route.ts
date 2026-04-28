import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Ordered fallback models - tries each until one works
const GOOGLE_FALLBACK_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-2.0-flash",
  "gemini-pro",
];

async function generateWithGoogle(apiKey: string, modelName: string, prompt: string): Promise<string> {
  // KEY FIX: Force stable v1 API endpoint instead of the default v1beta
  // This resolves the 404 "model not found for v1beta" error
  const genAI = new GoogleGenerativeAI(apiKey);

  // Try provided model first, then fallback chain
  const modelsToTry = [modelName, ...GOOGLE_FALLBACK_MODELS.filter(m => m !== modelName)];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[GoogleAI] Trying model: ${model}`);
      const generativeModel = genAI.getGenerativeModel(
        { model },
        // Force v1 stable API - this is the key fix for the 404 error
        { apiVersion: "v1" }
      );

      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) {
        console.log(`[GoogleAI] ✅ Success with model: ${model}`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[GoogleAI] ❌ Model ${model} failed: ${err.message}`);
      lastError = err;
      // Only continue fallback on 404 (model not found), not on 401 (auth error)
      if (err.message?.includes("401") || err.message?.includes("API key")) {
        throw new Error(`Authentication failed. Please check your Google API key. (${err.message})`);
      }
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed. Please check your API key and try again.");
}

async function generateWithOpenAI(apiKey: string, modelName: string, prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey });
  
  const OPENAI_FALLBACK_MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
  const modelsToTry = [modelName, ...OPENAI_FALLBACK_MODELS.filter(m => m !== modelName)];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[OpenAI] Trying model: ${model}`);
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const text = response.choices[0].message.content || "";
      if (text) {
        console.log(`[OpenAI] ✅ Success with model: ${model}`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[OpenAI] ❌ Model ${model} failed: ${err.message}`);
      lastError = err;
      if (err.status === 401) {
        throw new Error(`Authentication failed. Please check your OpenAI API key. (${err.message})`);
      }
      continue;
    }
  }

  throw lastError || new Error("All OpenAI models failed. Please check your API key and try again.");
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { provider, model, prompt, apiKey } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt cannot be empty." }, { status: 400 });
    }

    // Use key from request OR fall back to server-side env variable
    const activeKey = apiKey || (
      provider === "google" 
        ? process.env.GOOGLE_API_KEY 
        : process.env.OPENAI_API_KEY
    );

    if (!activeKey) {
      return NextResponse.json(
        { error: "No API key provided. Please enter your API key in the settings panel." },
        { status: 401 }
      );
    }

    // Validate key format before calling the API
    if (provider === "google" && !activeKey.startsWith("AIza")) {
      return NextResponse.json(
        { error: "Invalid API key format. Google Gemini keys start with 'AIza...'. Get yours at https://aistudio.google.com/app/apikey" },
        { status: 401 }
      );
    }

    if (provider === "openai" && !activeKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Invalid API key format. OpenAI keys start with 'sk-...'. Get yours at https://platform.openai.com/account/api-keys" },
        { status: 401 }
      );
    }

    let text = "";

    if (provider === "google") {
      text = await generateWithGoogle(activeKey, model || "gemini-1.5-flash", prompt);
    } else {
      text = await generateWithOpenAI(activeKey, model || "gpt-4o-mini", prompt);
    }

    const duration = Date.now() - startTime;
    console.log(`[API] Generation completed in ${duration}ms`);

    return NextResponse.json({ text, duration });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API] Error after ${duration}ms:`, error.message);

    return NextResponse.json(
      { error: error.message || "An unexpected error occurred. Please try again." },
      { status: error.message?.includes("Authentication") ? 401 : 500 }
    );
  }
}
