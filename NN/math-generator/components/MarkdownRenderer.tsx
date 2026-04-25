import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: ({ ...props }) => <h2 className="text-xl font-semibold mt-5 mb-3" {...props} />,
          h3: ({ ...props }) => <h3 className="text-lg font-medium mt-4 mb-2" {...props} />,
          p: ({ ...props }) => <p className="my-2 leading-relaxed" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc pl-6 my-2" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal pl-6 my-2" {...props} />,
          li: ({ ...props }) => <li className="mb-1" {...props} />,
          code: ({ ...props }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
          pre: ({ ...props }) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4" {...props} />,
          blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary pl-4 italic my-4" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
