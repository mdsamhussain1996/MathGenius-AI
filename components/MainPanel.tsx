import React, { useState, useRef } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Moon, Sun, Download, FileText, FileDown, Loader2, Copy, Check, Printer, Sparkles, Key } from "lucide-react";


import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface MainPanelProps {
  result: string | null;
  isGenerating: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  topic: string;
  difficulty: string;
  apiKey: string;
  setApiKey: (v: string) => void;
  selectedModel: string;
  provider: "google" | "openai";
  setProvider: (v: "google" | "openai") => void;
  errorMessage: string | null;
}





export function MainPanel({
  result,
  isGenerating,
  darkMode,
  toggleDarkMode,
  topic,
  difficulty,
  apiKey,
  setApiKey,
  selectedModel,
  provider,
  setProvider,
  errorMessage,
}: MainPanelProps) {





  const [showSolution, setShowSolution] = useState(true);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printProblem = () => {
    window.print();
  };


  // Split result into Problem and Solution (assuming markdown has headings)
  // We can just use standard MarkdownRenderer, but optionally hide the Solution section.
  // A simple heuristic: everything after "### Solution" or "## Solution"
  
  let displayContent = result || "";
  
  if (!showSolution && result) {
    const solutionRegex = /#+\s+Solution/i;
    const match = result.match(solutionRegex);
    if (match && match.index !== undefined) {
      displayContent = result.substring(0, match.index);
    }
  }

  const exportPDF = async () => {
    if (!contentRef.current) return;
    
    // Create a temporary clone for printing to avoid dark mode issues in PDF
    const element = contentRef.current;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: darkMode ? "#1a1a1a" : "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Math_Problem_${topic.replace(/\s+/g, "_")}_${difficulty}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF.");
    }
  };

  const exportLatex = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Math_Problem_${topic.replace(/\s+/g, "_")}_${difficulty}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <header className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Workspace</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{provider === "google" ? "GEMINI" : "OPENAI"}: {selectedModel}</span>
          </div>


          {result && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground border-l pl-4">
                Toggle Solution:
              </span>
              <button
                onClick={() => setShowSolution(!showSolution)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  showSolution
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {showSolution ? "Visible" : "Hidden"}
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={exportLatex}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <FileText className="w-4 h-4" /> LaTeX
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <FileDown className="w-4 h-4" /> PDF
              </button>
              <button
                onClick={printProblem}
                className="p-1.5 border rounded-md hover:bg-accent transition-colors"
                title="Print"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          )}


          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-accent transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        {isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
            <p className="text-lg">Generating problem mathematically...</p>
            <p className="text-sm mt-2 opacity-70">Synthesizing concepts, formulating equations, deriving solutions.</p>
          </div>
        ) : errorMessage ? (
          <div className="h-full flex flex-col items-center justify-center px-8">
            <div className="w-full max-w-xl bg-destructive/10 border border-destructive/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-destructive font-black text-sm">!</span>
                </div>
                <h3 className="font-bold text-destructive">Generation Failed</h3>
              </div>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{errorMessage}</pre>
              <div className="pt-2 border-t border-destructive/20">
                <p className="text-[11px] text-muted-foreground">💡 <strong>Quick Fix</strong>: Get a free Gemini key at{" "}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-primary">
                    aistudio.google.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        ) : result ? (
          <div 
            ref={contentRef} 
            className="max-w-4xl mx-auto bg-card border rounded-lg shadow-sm p-8 lg:p-12 print:border-none print:shadow-none"
          >
            <MarkdownRenderer content={displayContent} />
          </div>
        ) : !apiKey ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-24 h-24 mb-8 rounded-3xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/5">
              <Key className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-3xl font-black mb-3 text-foreground tracking-tight text-center">Welcome to MathGenius AI</h3>
            <p className="max-w-md text-center opacity-70 mb-10 text-lg leading-relaxed">
              To begin generating expert-level mathematics problems, please enter your Gemini API Key.
            </p>
            
            <div className="w-full max-w-md p-8 glass rounded-3xl border shadow-2xl space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-widest opacity-60">Provider</label>
                  <div className="flex bg-muted p-0.5 rounded-lg border">
                    <button
                      onClick={() => setProvider("google")}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        provider === "google" ? "bg-background shadow-sm text-primary" : "text-muted-foreground opacity-50"
                      }`}
                    >
                      GEMINI
                    </button>
                    <button
                      onClick={() => setProvider("openai")}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        provider === "openai" ? "bg-background shadow-sm text-primary" : "text-muted-foreground opacity-50"
                      }`}
                    >
                      OPENAI
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-widest opacity-60">
                    {provider === "google" ? "Gemini API Key" : "OpenAI API Key"}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={provider === "google" ? "AIzaSy..." : "sk-..."}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-inner ${
                        apiKey && (
                          (provider === "google" && !apiKey.startsWith("AIza")) ||
                          (provider === "openai" && apiKey.startsWith("AIza"))
                        ) ? "border-destructive ring-destructive" : ""
                      }`}
                    />
                  </div>
                  {apiKey && provider === "openai" && apiKey.startsWith("AIza") && (
                    <p className="text-[10px] text-destructive font-bold mt-1">
                      ⚠️ This looks like a Google key. OpenAI keys start with &quot;sk-&quot;.
                    </p>
                  )}
                  {apiKey && provider === "google" && apiKey.startsWith("sk-") && (
                    <p className="text-[10px] text-destructive font-bold mt-1">
                      ⚠️ This looks like an OpenAI key. Gemini keys start with &quot;AIza...&quot;.
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground italic mt-2">
                    Keys are stored safely in your browser&apos;s local storage.
                  </p>
                </div>
              </div>
              
              <a 
                href={provider === "google" ? "https://aistudio.google.com/app/apikey" : "https://platform.openai.com/account/api-keys"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Get a free {provider === "google" ? "Gemini" : "OpenAI"} Key <Sparkles className="w-4 h-4" />
              </a>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 mb-8 rounded-3xl bg-primary/10 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500 shadow-inner">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-3xl font-black mb-3 text-foreground tracking-tight">Ready to Innovate</h3>
            <p className="max-w-md text-center opacity-70 mb-10 text-lg leading-relaxed">
              Explore complex applied mathematics through AI-powered problem generation. Select your parameters to begin.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
              {["Linear Algebra", "Calculus", "Probability", "Graph Theory", "Numerical Analysis", "Optimization"].map((t) => (
                <div key={t} className="p-4 rounded-2xl border bg-card/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-default text-center group">
                  <div className="text-xs font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all mb-1">Topic</div>
                  <div className="font-semibold text-sm">{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
