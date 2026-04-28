"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";
import { ProblemData, Difficulty, UserPreferences } from "@/lib/types";
import { getHistory, saveProblem, getPreferences, savePreferences } from "@/lib/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";


export default function Home() {
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [history, setHistory] = useState<ProblemData[]>([]);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const [provider, setProvider] = useState<"google" | "openai">("google");
  const [prefs, setPrefs] = useState<UserPreferences>({ defaultDifficulty: "Medium", darkMode: false, apiKey: "", preferredModel: "gemini-1.5-flash", provider: "google" });



  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(getHistory());
    const savedPrefs = getPreferences();
    setPrefs(savedPrefs);
    setDifficulty(savedPrefs.defaultDifficulty);
    if (savedPrefs.apiKey) {
      setApiKey(savedPrefs.apiKey);
    }
    if (savedPrefs.preferredModel) {
      setSelectedModel(savedPrefs.preferredModel);
    }
    if (savedPrefs.provider) {
      setProvider(savedPrefs.provider);
    }
    if (savedPrefs.darkMode) {

      document.documentElement.classList.add("dark");
    }
  }, []);


  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    const newPrefs = { ...prefs, apiKey: val };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
  };

  const handleModelChange = (val: string) => {
    setSelectedModel(val);
    const newPrefs = { ...prefs, preferredModel: val };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
  };

  const handleProviderChange = (val: "google" | "openai") => {
    setProvider(val);
    // Set sensible default model for new provider
    const defaultModel = val === "google" ? "gemini-1.5-flash" : "gpt-4o-mini";
    setSelectedModel(defaultModel);
    const newPrefs = { ...prefs, provider: val, preferredModel: defaultModel };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
  };



  const toggleDarkMode = () => {
    const newDarkMode = !prefs.darkMode;
    const newPrefs = { ...prefs, darkMode: newDarkMode };
    setPrefs(newPrefs);
    savePreferences(newPrefs);
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleGenerate = async () => {
    if (!topic || !apiKey) return;

    // PRE-CHECK: Prevent mismatched keys from causing 401/404 errors
    const isGoogleKey = apiKey.startsWith("AIza");
    const isOpenAIKey = apiKey.startsWith("sk-");

    if (provider === "google" && !isGoogleKey) {
      alert("❌ Invalid Key: You are trying to use an OpenAI key for the Gemini (Google) engine. Please switch the provider to OpenAI or use a Gemini key.");
      return;
    }
    if (provider === "openai" && isGoogleKey) {
      alert("❌ Invalid Key: You are trying to use a Google Gemini key for the OpenAI engine. Please switch the provider to GEMINI or use an OpenAI (sk-...) key.");
      return;
    }

    setIsGenerating(true);

    setCurrentResult(null);

    try {
      const difficultyPromptMap: Record<string, string> = {
        Easy: "Focus on fundamentals, direct application of formulas or theorems, and clear straightforward computation. Avoid heavy abstract proofs.",
        Medium: "Include multi-step reasoning, combination of concepts, and slightly more complex algebraic manipulations. Can include basic introductory proofs.",
        Hard: "Focus on advanced multi-step reasoning, non-obvious applications of theorems, and rigorous proofs. Problems should require synthesizing multiple concepts.",
        Research: "Create an open-ended or proof-heavy problem typical of advanced postgraduate coursework or introductory research level. It should be highly conceptual and challenging."
      };

      const diffGuide = difficultyPromptMap[difficulty] || difficultyPromptMap["Medium"];

      const prompt = `You are an expert professor in Applied Mathematics. Generate a high-quality mathematical problem and its detailed, step-by-step solution.

Topic: ${topic}
Subtopic (if provided): ${subtopic || "Any relevant subtopic"}
Difficulty Level: ${difficulty}

Difficulty Guidelines:
${diffGuide}

Requirements:
1. The problem must be academically rigorous and non-trivial.
2. Provide a fully detailed step-by-step solution with reasoning (why each step is taken).
3. Identify key concepts used.
4. Output MUST be formatted entirely in clean Markdown.
5. Use proper LaTeX for all math formatting. Use $...$ for inline equations and $$...$$ for block equations. Do NOT use \\( \\) or \\[ \\].
6. Use LaTeX align environments (e.g., \\begin{align*} ... \\end{align*}) for multi-line equations inside block equations.

Structure your response EXACTLY like this:

### Problem
[State the problem clearly here]

### Solution
[Detailed step-by-step solution here]

### Key Concepts
- [Concept 1]
- [Concept 2]
`;

      /**
       * SECURITY NOTE: 
       * For production apps deployed on Vercel/Node, calls should be made to our 
       * backend (/api/generate) to keep keys and system prompts hidden.
       */
      let text = "";


      if (provider === "google") {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: selectedModel });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
      } else {
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        const response = await openai.chat.completions.create({
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });
        text = response.choices[0].message.content || "";
      }

      if (!text) throw new Error("No content generated. Please check your API key.");

      setCurrentResult(text);
      
      const newProblem: ProblemData = {
        id: Math.random().toString(36).substr(2, 9),
        topic,
        subtopic,
        difficulty,
        problem: text,
        solution: text,
        createdAt: Date.now(),
      };

      saveProblem(newProblem);
      setHistory(getHistory());
    } catch (err: unknown) {
      console.error("Generation Error:", err);
      const errorMsg = err instanceof Error ? err.message : "An error occurred during generation.";
      alert(`⚠️ Generation Failed\n\n${errorMsg}\n\nTroubleshooting:\n1. Verify your API key is valid for ${provider.toUpperCase()}.\n2. Ensure the selected model is available in your region.\n3. Check your internet connection.`);
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
        />




      </main>
    </div>
  );
}
