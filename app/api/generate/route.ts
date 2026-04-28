import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// ─── Model Fallback Chains ────────────────────────────────────────────────────
// Listed in priority order — tries each until one works
const GOOGLE_MODELS = [
  "gemini-1.5-flash-latest",   // ✅ Best free-tier option
  "gemini-1.5-pro-latest",     // ✅ Smarter, same quota tier
  "gemini-1.5-flash",
  "gemini-pro",
];

const OPENAI_MODELS = [
  "gpt-4o-mini",
  "gpt-3.5-turbo",
];

// ─── Quota / Error Classifier ─────────────────────────────────────────────────
function classifyGoogleError(message: string): { status: number; userMessage: string } {
  if (message.includes("RESOURCE_EXHAUSTED") || message.toLowerCase().includes("quota")) {
    return {
      status: 429,
      userMessage:
        "QUOTA_EXCEEDED: Your Google AI free-tier quota is exhausted (limit: 0).\n\n" +
        "🔧 How to fix:\n" +
        "1. Go to: https://console.cloud.google.com/billing\n" +
        "2. Attach a billing account to your project.\n" +
        "3. Enable the 'Generative Language API' in the API library.\n" +
        "4. Or wait until your daily quota resets (midnight Pacific time).\n\n" +
        "Alternatively, switch to OpenAI in the provider toggle and use a free sk-... API key.",
    };
  }
  if (message.includes("401") || message.toLowerCase().includes("api key")) {
    return {
      status: 401,
      userMessage:
        "INVALID_KEY: Your Google API key is invalid or not activated.\n\n" +
        "🔧 Get a free key at: https://aistudio.google.com/app/apikey\n" +
        "Make sure you are using a Google AI Studio key (starts with AIza...), NOT an OpenAI key.",
    };
  }
  if (message.includes("404") || message.toLowerCase().includes("not found")) {
    return {
      status: 404,
      userMessage: `MODEL_NOT_FOUND: The selected model is not available on your account. Trying fallback models automatically.`,
    };
  }
  return { status: 500, userMessage: message };
}

// ─── Google Generation with Fallback ─────────────────────────────────────────
async function generateWithGoogle(
  apiKey: string,
  preferredModel: string,
  prompt: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = [preferredModel, ...GOOGLE_MODELS.filter((m) => m !== preferredModel)];

  let lastError: { status: number; userMessage: string } | null = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Google] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel(
        { model: modelName },
        { apiVersion: "v1" } // ✅ Force stable v1 endpoint — avoids v1beta 404 errors
      );
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        console.log(`[Google] ✅ Success: ${modelName}`);
        return text;
      }
    } catch (err: any) {
      const classified = classifyGoogleError(err.message || "");
      console.warn(`[Google] ❌ ${modelName}: ${classified.userMessage}`);
      lastError = classified;

      // Quota errors won't be fixed by trying another model — surface immediately
      if (classified.status === 429 || classified.status === 401) {
        throw new Error(classified.userMessage);
      }
      // 404 = model not available → continue to next fallback
      continue;
    }
  }

  throw new Error(
    lastError?.userMessage ||
      "All Gemini models failed. Please check your API key and billing status."
  );
}

// ─── OpenAI Generation with Fallback ─────────────────────────────────────────
async function generateWithOpenAI(
  apiKey: string,
  preferredModel: string,
  prompt: string
): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const modelsToTry = [preferredModel, ...OPENAI_MODELS.filter((m) => m !== preferredModel)];

  for (const modelName of modelsToTry) {
    try {
      console.log(`[OpenAI] Trying model: ${modelName}`);
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      const text = response.choices[0].message.content || "";
      if (text) {
        console.log(`[OpenAI] ✅ Success: ${modelName}`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[OpenAI] ❌ ${modelName}: ${err.message}`);
      if (err.status === 401) {
        throw new Error(
          "INVALID_KEY: Your OpenAI API key is invalid.\n\n" +
          "🔧 Get a key at: https://platform.openai.com/account/api-keys\n" +
          "OpenAI keys start with sk-..."
        );
      }
      if (err.status === 429) {
        throw new Error(
          "QUOTA_EXCEEDED: Your OpenAI quota is exhausted.\n\n" +
          "🔧 Add billing at: https://platform.openai.com/account/billing"
        );
      }
    }
  }

  throw new Error("All OpenAI models failed. Please check your API key and billing.");
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { provider, model, prompt, apiKey } = await req.json();

    // 1. Validate prompt
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt cannot be empty." }, { status: 400 });
    }

    // 2. Limit prompt size to prevent quota burn
    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: "Prompt too large (max 4000 characters). Please shorten your request." },
        { status: 400 }
      );
    }

    // 3. Resolve API key (request key → env variable fallback)
    const activeKey =
      apiKey ||
      (provider === "google" ? process.env.GOOGLE_API_KEY : process.env.OPENAI_API_KEY);

    if (!activeKey) {
      return NextResponse.json(
        { error: "No API key provided. Please enter your API key in the settings panel." },
        { status: 401 }
      );
    }

    // 4. Validate key format server-side
    if (provider === "google" && !activeKey.startsWith("AIza")) {
      return NextResponse.json(
        {
          error:
            "WRONG_KEY_TYPE: You are using an OpenAI key for Google Gemini.\n" +
            "Google keys start with AIza... — get yours at https://aistudio.google.com/app/apikey",
        },
        { status: 401 }
      );
    }
    if (provider === "openai" && activeKey.startsWith("AIza")) {
      return NextResponse.json(
        {
          error:
            "WRONG_KEY_TYPE: You are using a Google key for OpenAI.\n" +
            "OpenAI keys start with sk-... — get yours at https://platform.openai.com/account/api-keys",
        },
        { status: 401 }
      );
    }

    // 5. Generate
    let text = "";
    if (provider === "google") {
      text = await generateWithGoogle(activeKey, model || "gemini-1.5-flash-latest", prompt);
    } else {
      text = await generateWithOpenAI(activeKey, model || "gpt-4o-mini", prompt);
    }

    const duration = Date.now() - startTime;
    console.log(`[API] ✅ Done in ${duration}ms`);

    return NextResponse.json({ text, duration });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[API] ❌ Failed after ${duration}ms:`, error.message);

    const status = error.message?.includes("QUOTA") ? 429 
      : error.message?.includes("INVALID_KEY") || error.message?.includes("WRONG_KEY") ? 401 
      : 500;

    return NextResponse.json({ error: error.message }, { status });
  }
}
