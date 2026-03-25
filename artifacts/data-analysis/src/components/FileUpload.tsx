import { useState, useCallback } from "react";
import { UploadCloud, File, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUpload: (file: File) => void;
  loading?: boolean;
}

export function FileUpload({ onUpload, loading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.endsWith(".csv")) {
          setSelectedFile(file);
          onUpload(file);
        }
      }
    },
    [onUpload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onUpload(file);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardContent className="p-0">
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-40 cursor-pointer rounded-lg transition-colors ${
            isDragging ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
          } ${loading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading}
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-primary">
                <File className="w-8 h-8" />
                <span className="font-medium text-lg">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 rounded-full"
                  onClick={clearFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              {loading && <p className="text-sm text-primary animate-pulse mt-2">Analyzing...</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="p-3 bg-background rounded-full shadow-sm mb-2">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Click or drag and drop a CSV file
              </p>
              <p className="text-sm">Maximum file size 50MB</p>
            </div>
          )}
        </label>
      </CardContent>
    </Card>
  );
}
