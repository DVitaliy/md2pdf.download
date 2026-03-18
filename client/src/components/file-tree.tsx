import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Repository, GitHubFile } from "@/../../shared/schema";

interface FileTreeProps {
  repositories: Repository[];
  selectedRepo: Repository | null;
  onRepoSelect: (repo: Repository) => void;
  selectedFile: string;
  onFileSelect: (file: string) => void;
  isLoading: boolean;
  onRefreshRepositories: () => void;
}

export default function FileTree({
  repositories,
  selectedRepo,
  onRepoSelect,
  selectedFile,
  onFileSelect,
  isLoading,
  onRefreshRepositories,
}: FileTreeProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: files,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = useQuery<GitHubFile[]>({
    queryKey: ["/api/repositories", selectedRepo?.id, "files"],
    enabled: !!selectedRepo && !!selectedRepo.id,
  });

  const filteredFiles =
    files?.filter((file: GitHubFile) =>
      file.path.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="w-80 bg-slate-50/50 text-slate-900 border-r border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-200">
          <Skeleton className="h-10 w-full mb-3 bg-slate-200" />
          <Skeleton className="h-10 w-full bg-slate-200" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="p-5 border-b border-slate-200 bg-white">
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
            Repository
          </label>
          <Select
            value={selectedRepo?.id?.toString()}
            onValueChange={(value) => {
              const repo = repositories.find((r) => r.id.toString() === value);
              if (repo) onRepoSelect(repo);
            }}
          >
            <SelectTrigger className="w-full bg-white border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 transition-colors">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              {repositories.map((repo) => (
                <SelectItem key={repo.id} value={repo.id.toString()}>
                  {repo.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-slate-200 text-slate-900 pl-9 shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-3 px-2 mt-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Markdown Files
            </div>
            <Button
              onClick={() => {
                onRefreshRepositories();
                if (selectedRepo?.id) {
                  refetchFiles();
                }
              }}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border border-transparent hover:border-slate-300"
              disabled={filesLoading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${filesLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {filesLoading ? (
            <div className="space-y-2 px-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-full bg-slate-200 rounded-md" />
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              <FileText className="h-8 w-8 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">No markdown files found</p>
            </div>
          ) : (
            filteredFiles.map((file: GitHubFile) => (
              <div
                key={file.path}
                onClick={() => onFileSelect(file.path)}
                className={`cursor-pointer px-3 py-2.5 my-0.5 rounded-md transition-all duration-150 ${
                  selectedFile === file.path
                    ? "bg-blue-600 text-white shadow-sm font-medium"
                    : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileText
                    className={`h-4 w-4 ${
                      selectedFile === file.path
                        ? "text-blue-200"
                        : "text-slate-400"
                    }`}
                  />
                  <span className="text-sm truncate leading-none pt-0.5">{file.path}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-3 border-t border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
          <span>{filteredFiles.length} markdown file{filteredFiles.length !== 1 && 's'}</span>
        </div>
      </div>
    </div>
  );
}
