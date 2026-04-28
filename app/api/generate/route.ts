import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { provider, model, prompt, apiKey } = await req.json();

    // Use provided key or fallback to environment variable (for production)
    const activeKey = apiKey || (provider === "google" ? process.env.GOOGLE_API_KEY : process.env.OPENAI_API_KEY);

    if (!activeKey) {
      return NextResponse.json({ error: "No API key provided." }, { status: 401 });
    }

    let text = "";

    if (provider === "google") {
      const genAI = new GoogleGenerativeAI(activeKey);
      const generativeModel = genAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    } else {
      const openai = new OpenAI({ apiKey: activeKey });
      const response = await openai.chat.completions.create({
        model: model || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });
      text = response.choices[0].message.content || "";
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
