import React from "react";
import { Difficulty, ProblemData } from "@/lib/types";
import { BookOpen, Settings, History, Loader2, Key, Trash2, Cpu } from "lucide-react";
import { clearHistory } from "@/lib/storage";


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
    <div className="w-85 glass border-r flex flex-col h-full z-20">
      <div className="p-8 border-b">
        <h1 className="text-2xl font-black flex items-center gap-3 text-primary tracking-tight">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          MathGenius
        </h1>
        <p className="text-xs font-medium text-muted-foreground mt-3 uppercase tracking-widest opacity-70">
          Applied Math Engine
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Recent History
            </h2>
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("Clear all history?")) {
                    clearHistory();
                    window.location.reload();
                  }
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {history.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed rounded-xl opacity-50">
                <p className="text-xs text-muted-foreground italic">Your mathematical journey starts here.</p>
              </div>
            ) : (
              history.map((prob) => (
                <button
                  key={prob.id}
                  onClick={() => onLoadHistory(prob)}
                  className="w-full text-left p-4 rounded-xl border bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group relative overflow-hidden"
                >
                  <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{prob.topic}</div>
                  <div className="text-[10px] text-muted-foreground flex justify-between mt-2 font-medium">
                    <span className="truncate opacity-70">{prob.subtopic || "General"}</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded uppercase tracking-tighter">{prob.difficulty}</span>
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
