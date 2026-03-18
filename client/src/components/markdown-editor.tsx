import { useMutation, useQueryClient } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { Badge } from "@/components/ui/badge";
import { Edit, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import { Repository } from "@/../../shared/schema";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  fileName: string;
  isLoading: boolean;
  selectedRepo: Repository | null;
  originalContent?: string;
}

export default function MarkdownEditor({
  content,
  onChange,
  fileName,
  isLoading,
  selectedRepo,
  originalContent,
}: MarkdownEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasChangesFromOriginal =
    originalContent !== undefined && content !== originalContent;

  const autoSaveMutation = useMutation({
    mutationFn: (data: { repoId: number; filePath: string; content: string }) =>
      apiRequest(
        "PUT",
        `/api/repositories/${data.repoId}/files/${data.filePath}`,
        {
          content: data.content,
        }
      ),
    onSuccess: () => {
      setHasUnsavedChanges(false);
    },
    onError: () => {
      console.error("Auto-save failed");
    },
  });

  const pushToGitHubMutation = useMutation({
    mutationFn: (data: { repoId: number; filePath: string; content: string }) =>
      apiRequest(
        "POST",
        `/api/repositories/${data.repoId}/files/${data.filePath}/push`,
        {
          content: data.content,
        }
      ),
    onSuccess: () => {
      toast({
        title: "Pushed to GitHub",
        description: "Your changes have been synced to GitHub repository.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/repositories", selectedRepo?.id, "files", fileName],
      });
    },
    onError: () => {
      toast({
        title: "Push failed",
        description: "Failed to sync with GitHub. File saved locally only.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!selectedRepo || !fileName || content === originalContent) return;

    setHasUnsavedChanges(true);

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveMutation.mutate({
        repoId: selectedRepo.id,
        filePath: fileName,
        content: content,
      });
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, selectedRepo, fileName, originalContent]);

  const handlePushToGitHub = () => {
    if (!selectedRepo) {
      toast({
        title: "No repository selected",
        description: "Please select a repository first.",
        variant: "destructive",
      });
      return;
    }

    pushToGitHubMutation.mutate({
      repoId: selectedRepo.id,
      filePath: fileName,
      content: content,
    });
  };

  const wordCount = content
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const charCount = content.length;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-white border-r border-slate-200">
        <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <Skeleton className="h-6 w-48 bg-slate-200" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-full w-full bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 markdown-editor">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10 w-full relative">
        <div className="flex items-center space-x-3">
          <Edit className="h-4 w-4 text-slate-400" />
          {fileName && (
            <span className="font-semibold text-sm text-slate-700 tracking-wide">{fileName}</span>
          )}
          {hasUnsavedChanges && (
            <Badge
              variant="secondary"
              className="bg-amber-100/80 text-amber-700 border border-amber-200/50 shadow-sm"
            >
              Auto-saving...
            </Badge>
          )}
          {hasChangesFromOriginal && !hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border border-blue-200 shadow-sm">
              Modified
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
          </div>

          <Button
            onClick={handlePushToGitHub}
            disabled={pushToGitHubMutation.isPending || !hasChangesFromOriginal}
            size="sm"
            className={`shadow-sm h-8 ${
              hasChangesFromOriginal
                ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Upload className="mr-2 h-3.5 w-3.5" />
            {pushToGitHubMutation.isPending ? "Pushing..." : "Push to GitHub"}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative bg-white w-full">
        {fileName ? (
          <div className="absolute inset-0">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              language="markdown"
              theme="light"
              value={content}
              onChange={(value) => onChange(value || "")}
              options={{
                minimap: { enabled: false },
                wordWrap: "on",
                padding: { top: 24, bottom: 24 },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono, Menlo, monospace",
                fontSize: 14,
                lineHeight: 1.6,
                renderLineHighlight: "all",
                hideCursorInOverviewRuler: true,
                smoothScrolling: true,
              }}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Edit className="h-10 w-10 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">Select a markdown file to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
