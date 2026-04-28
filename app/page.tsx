"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";
import { ProblemData, Difficulty, UserPreferences } from "@/lib/types";
import { getHistory, saveProblem, getPreferences, savePreferences } from "@/lib/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// ─── Prompt Builder ──────────────────────────────────────────────────────────
function buildPrompt(topic: string, subtopic: string, difficulty: string): string {
  const difficultyGuide: Record<string, string> = {
    Easy:     "Focus on fundamentals, direct application of formulas, and clear computation. Avoid abstract proofs.",
    Medium:   "Include multi-step reasoning and combination of concepts. Can include basic proofs.",
    Hard:     "Focus on advanced reasoning, non-obvious theorem applications, and rigorous proofs.",
    Research: "Create a proof-heavy, open-ended problem typical of postgraduate coursework or introductory research.",
  };

  return `You are an expert professor in Applied Mathematics. Generate a high-quality mathematical problem and a fully detailed, step-by-step solution.

Topic: ${topic}
Subtopic (if provided): ${subtopic || "Any relevant subtopic"}
Difficulty Level: ${difficulty}

Difficulty Guidelines:
${difficultyGuide[difficulty] || difficultyGuide["Medium"]}

Requirements:
1. The problem must be academically rigorous and non-trivial.
2. Provide a fully detailed step-by-step solution with reasoning for each step.
3. Identify key concepts used.
4. Output MUST be formatted entirely in clean Markdown.
5. Use LaTeX for all math: $...$ for inline, $$...$$ for block equations.
   Do NOT use \\( \\) or \\[ \\] notation.
6. Use align* environments for multi-line equations: \\begin{align*} ... \\end{align*}

Structure your response EXACTLY like this:

### Problem
[State the problem clearly here]

### Solution
[Detailed step-by-step solution here]

### Key Concepts
- [Concept 1]
- [Concept 2]
`;
}

// ─── Client-Side Fallback (GitHub Pages / Static Hosting) ────────────────────
// KEY FIX: Pass { apiVersion: "v1" } to force the stable v1 endpoint,
// bypassing the v1beta 404 "model not found" error.
async function generateClientSide(
  provider: "google" | "openai",
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  if (provider === "google") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const generativeModel = genAI.getGenerativeModel(
      { model },
      { apiVersion: "v1" } // ✅ KEY FIX: Force stable v1 API
    );
    const result = await generativeModel.generateContent(prompt);
    return result.response.text();
  } else {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0].message.content || "";
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const [topic, setTopic]                     = useState("");
  const [subtopic, setSubtopic]               = useState("");
  const [difficulty, setDifficulty]           = useState<Difficulty>("Medium");
  const [apiKey, setApiKey]                   = useState("");
  const [isGenerating, setIsGenerating]       = useState(false);
  const [currentResult, setCurrentResult]     = useState<string | null>(null);
  const [errorMessage, setErrorMessage]       = useState<string | null>(null);
  const [history, setHistory]                 = useState<ProblemData[]>([]);
  const [selectedModel, setSelectedModel]     = useState("gemini-1.5-flash-latest");
  const [provider, setProvider]               = useState<"google" | "openai">("google");
  const [prefs, setPrefs]                     = useState<UserPreferences>({
    defaultDifficulty: "Medium",
    darkMode: false,
    apiKey: "",
    preferredModel: "gemini-1.5-flash-latest",
    provider: "google",
  });


  // Load persisted preferences on mount
  useEffect(() => {
    setHistory(getHistory());
    const saved = getPreferences();
    setPrefs(saved);
    setDifficulty(saved.defaultDifficulty);
    if (saved.apiKey)       setApiKey(saved.apiKey);
    if (saved.preferredModel) setSelectedModel(saved.preferredModel);
    if (saved.provider)     setProvider(saved.provider as "google" | "openai");
    if (saved.darkMode)     document.documentElement.classList.add("dark");
  }, []);

  // ─── Preference Handlers ───────────────────────────────────────────────────
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    const updated = { ...prefs, apiKey: val };
    setPrefs(updated);
    savePreferences(updated);
  };

  const handleModelChange = (val: string) => {
    setSelectedModel(val);
    const updated = { ...prefs, preferredModel: val };
    setPrefs(updated);
    savePreferences(updated);
  };

  const handleProviderChange = (val: "google" | "openai") => {
    const defaultModel = val === "google" ? "gemini-1.5-flash-latest" : "gpt-4o-mini";
    setProvider(val);
    setSelectedModel(defaultModel);
    const updated = { ...prefs, provider: val, preferredModel: defaultModel };
    setPrefs(updated);
    savePreferences(updated);
  };


  const toggleDarkMode = () => {
    const newDark = !prefs.darkMode;
    const updated = { ...prefs, darkMode: newDark };
    setPrefs(updated);
    savePreferences(updated);
    document.documentElement.classList.toggle("dark", newDark);
  };

  // ─── Core Generate Handler ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim() || !apiKey.trim()) return;

    // Guard: Prompt size limit (prevent quota burn)
    const builtPrompt = buildPrompt(topic, subtopic, difficulty);
    if (builtPrompt.length > 4000) {
      setErrorMessage("⚠️ Prompt too large. Please shorten your topic or subtopic.");
      return;
    }

    // Guard: Prevent mismatched key/provider before network call
    if (provider === "google" && !apiKey.startsWith("AIza")) {
      setErrorMessage("❌ Wrong key type: Gemini keys start with 'AIza...'. Please switch the provider to OpenAI or use a Gemini key from https://aistudio.google.com/app/apikey");
      return;
    }
    if (provider === "openai" && apiKey.startsWith("AIza")) {
      setErrorMessage("❌ Wrong key type: OpenAI keys start with 'sk-...'. Please switch the provider to GEMINI or use an OpenAI key from https://platform.openai.com/account/api-keys");
      return;
    }

    setIsGenerating(true);
    setCurrentResult(null);
    setErrorMessage(null);

    const prompt = builtPrompt;
    let text = "";

    try {
      // ── Strategy 1: Backend proxy (production/Vercel – forces v1 API server-side)
      try {
        const res = await fetch("/MathGenius-AI/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, model: selectedModel, prompt, apiKey }),
        });
        if (res.ok) {
          const data = await res.json();
          text = data.text || "";
        } else {
          const data = await res.json();
          if (data.error) throw new Error(data.error);
        }
      } catch (proxyErr) {
        console.warn("Backend proxy unavailable, using client-side generation.", proxyErr);
      }

      // ── Strategy 2: Client-side fallback with v1 forced (GitHub Pages / static hosting)
      if (!text) {
        // Client-side also uses fallback chain: flash-latest → pro-latest → flash
        const GOOGLE_FALLBACKS = ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash"];
        const modelsToTry = provider === "google"
          ? [selectedModel, ...GOOGLE_FALLBACKS.filter(m => m !== selectedModel)]
          : [selectedModel];

        for (const modelName of modelsToTry) {
          try {
            text = await generateClientSide(provider, apiKey, modelName, prompt);
            if (text) break;
          } catch (modelErr: any) {
            // Surface quota errors immediately — switching models won't help
            if (modelErr.message?.includes("RESOURCE_EXHAUSTED") || modelErr.message?.toLowerCase().includes("quota")) {
              throw new Error(
                "QUOTA_EXCEEDED: Your free-tier API quota is exhausted (limit: 0).\n\n" +
                "🔧 To fix:\n" +
                "1. Visit: https://console.cloud.google.com/billing\n" +
                "2. Attach billing to your project.\n" +
                "3. Enable 'Generative Language API'.\n" +
                "4. Or wait until quota resets (midnight Pacific Time).\n\n" +
                "💡 Alternatively, switch to OpenAI using the provider toggle."
              );
            }
            console.warn(`[Client] Model ${modelName} failed:`, modelErr.message);
          }
        }
      }
      if (!text) throw new Error("No content was returned. Please try again.");

      setCurrentResult(text);

      const entry: ProblemData = {
        id: Math.random().toString(36).substring(2, 9),
        topic,
        subtopic,
        difficulty,
        problem: text,
        solution: text,
        createdAt: Date.now(),
      };
      saveProblem(entry);
      setHistory(getHistory());

    } catch (err: unknown) {
      console.error("Generation Error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(`⚠️ ${msg}\n\nTroubleshooting:\n• Verify your API key is valid for ${provider.toUpperCase()}.\n• Try a different model in the sidebar.\n• Check your internet connection.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadFromHistory = (prob: ProblemData) => {
    setTopic(prob.topic);
    setSubtopic(prob.subtopic);
    setDifficulty(prob.difficulty);
    setCurrentResult(prob.problem);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        topic={topic}
        setTopic={setTopic}
        subtopic={subtopic}
        setSubtopic={setSubtopic}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        apiKey={apiKey}
        setApiKey={handleApiKeyChange}
        selectedModel={selectedModel}
        setSelectedModel={handleModelChange}
        provider={provider}
        setProvider={handleProviderChange}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        history={history}
        onLoadHistory={loadFromHistory}
      />
      <main className="flex-1 overflow-y-auto">
        <MainPanel
          result={currentResult}
          isGenerating={isGenerating}
          darkMode={prefs.darkMode}
          toggleDarkMode={toggleDarkMode}
          topic={topic}
          difficulty={difficulty}
          apiKey={apiKey}
          setApiKey={handleApiKeyChange}
          selectedModel={selectedModel}
          provider={provider}
          setProvider={handleProviderChange}
          errorMessage={errorMessage}
        />
      </main>
    </div>
  );
}
