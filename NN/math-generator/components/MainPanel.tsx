import React, { useState, useRef } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Moon, Sun, Download, FileText, FileDown, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface MainPanelProps {
  result: string | null;
  isGenerating: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  topic: string;
  difficulty: string;
}

export function MainPanel({
  result,
  isGenerating,
  darkMode,
  toggleDarkMode,
  topic,
  difficulty,
}: MainPanelProps) {
  const [showSolution, setShowSolution] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

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
            <>
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
            </>
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
        ) : result ? (
          <div 
            ref={contentRef} 
            className="max-w-4xl mx-auto bg-card border rounded-lg shadow-sm p-8 lg:p-12 print:border-none print:shadow-none"
          >
            <MarkdownRenderer content={displayContent} />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Download className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Ready to Generate</h3>
            <p className="max-w-md text-center opacity-80">
              Select a topic and difficulty from the sidebar, then click "Generate Problem" to create a new mathematical challenge.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
