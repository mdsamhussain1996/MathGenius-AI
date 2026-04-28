import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:border prose-pre:rounded-2xl">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ ...props }) => <h1 className="text-3xl font-black mt-8 mb-6 pb-2 border-b text-foreground" {...props} />,
          h2: ({ ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground/90" {...props} />,
          h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground/80" {...props} />,
          p: ({ ...props }) => <p className="my-4 leading-relaxed text-foreground/70 selection:bg-primary/20" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-6 my-4 space-y-2 text-foreground/70" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-6 my-4 space-y-2 text-foreground/70" {...props} />,
          li: ({ ...props }) => <li className="pl-1" {...props} />,
          code: ({ ...props }) => <code className="bg-primary/5 text-primary px-1.5 py-0.5 rounded-md text-[0.9em] font-mono font-medium" {...props} />,
          pre: ({ ...props }) => <pre className="bg-muted/30 p-6 rounded-2xl overflow-x-auto my-6 border shadow-sm" {...props} />,
          blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary/30 pl-6 py-1 italic my-6 text-foreground/60 bg-primary/5 rounded-r-xl" {...props} />,
          table: ({ ...props }) => <div className="overflow-x-auto my-6 rounded-xl border"><table className="w-full text-sm" {...props} /></div>,
          th: ({ ...props }) => <th className="bg-muted/50 p-3 text-left font-bold border-b" {...props} />,
          td: ({ ...props }) => <td className="p-3 border-b border-muted/50" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
