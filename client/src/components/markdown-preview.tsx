import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Repository } from "@/../../shared/schema";

interface MarkdownPreviewProps {
  content: string;
  currentRepo: Repository | null;
}

export default function MarkdownPreview({
  content,
  currentRepo,
}: MarkdownPreviewProps) {
  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="bg-github-light border-b border-github-border px-6 py-3 flex items-center justify-between print:hidden">
        <span className="font-medium text-github-dark">Preview</span>
        <Button
          onClick={downloadPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 shadow-sm"
          size="sm"
        >
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="markdown-preview markdown-content p-6">
          <ReactMarkdown
            children={content}
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed">{children}</p>
              ),
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold mb-4 border-b border-github-border pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mb-3 border-b border-github-border pb-1">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold mb-2">{children}</h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 ml-4">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 ml-4">
                  {children}
                </ol>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <pre className="bg-github-light p-4 rounded-lg mb-4 overflow-x-auto">
                      <code className="font-mono text-sm">{children}</code>
                    </pre>
                  );
                }
                return (
                  <code className="bg-github-light px-1 rounded text-sm font-mono">
                    {children}
                  </code>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-github-border pl-4 italic mb-4 text-github-gray">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a href={href} className="text-github-blue hover:underline">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
