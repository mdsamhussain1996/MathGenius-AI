import React from "react";
import { Difficulty, ProblemData } from "@/lib/types";
import { BookOpen, Settings, History, Loader2, Key } from "lucide-react";

interface SidebarProps {
  topic: string;
  setTopic: (v: string) => void;
  subtopic: string;
  setSubtopic: (v: string) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  history: ProblemData[];
  onLoadHistory: (prob: ProblemData) => void;
}

export function Sidebar({
  topic,
  setTopic,
  subtopic,
  setSubtopic,
  difficulty,
  setDifficulty,
  apiKey,
  setApiKey,
  onGenerate,
  isGenerating,
  history,
  onLoadHistory,
}: SidebarProps) {
  const difficulties: Difficulty[] = ["Easy", "Medium", "Hard", "Research"];

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold flex items-center gap-2 text-primary">
          <BookOpen className="w-6 h-6" />
          MathGenius AI
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Applied Mathematics Problem & Solution Generator
        </p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Key className="w-4 h-4" /> API Configuration
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">Stored locally. Required for generation.</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" /> Parameters
          </h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic (e.g., Linear Algebra)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter main topic..."
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subtopic (Optional)</label>
            <input
              type="text"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              placeholder="e.g., Eigenvalues"
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={!topic || !apiKey || isGenerating}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
          {isGenerating ? "Generating..." : "Generate Problem"}
        </button>

        <div className="pt-6 border-t">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
            <History className="w-4 h-4" /> Recent History
          </h2>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No recent history.</p>
            ) : (
              history.map((prob) => (
                <button
                  key={prob.id}
                  onClick={() => onLoadHistory(prob)}
                  className="w-full text-left p-3 rounded-md border bg-background hover:border-primary transition-colors text-sm"
                >
                  <div className="font-medium truncate">{prob.topic}</div>
                  <div className="text-xs text-muted-foreground flex justify-between mt-1">
                    <span className="truncate">{prob.subtopic || "General"}</span>
                    <span>{prob.difficulty}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
