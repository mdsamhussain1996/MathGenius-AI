"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";
import { ProblemData, Difficulty, UserPreferences } from "@/lib/types";
import { getHistory, saveProblem, getPreferences, savePreferences } from "@/lib/storage";
import { GoogleGenAI } from "@google/genai";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<string | null>(null);
  const [history, setHistory] = useState<ProblemData[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>({ defaultDifficulty: "Medium", darkMode: false, apiKey: "" });

  useEffect(() => {
    setHistory(getHistory());
    const savedPrefs = getPreferences();
    setPrefs(savedPrefs);
    setDifficulty(savedPrefs.defaultDifficulty);
    if (savedPrefs.apiKey) {
      setApiKey(savedPrefs.apiKey);
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
    setIsGenerating(true);
    setCurrentResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
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

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const text = response.text || "";

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
    } catch (err: any) {
      console.error(err);
      alert("An error occurred during generation. Please check your API key.");
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
        />
      </main>
    </div>
  );
}
