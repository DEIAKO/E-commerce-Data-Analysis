import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Sun, Moon, Printer, Download, BarChart3, ListTree, Calculator } from "lucide-react";
import { FileUpload } from "../components/FileUpload";
import { DataPreview } from "../components/DataPreview";
import { ColumnStats } from "../components/ColumnStats";
import { DistributionChart } from "../components/Charts";
import { CorrelationMatrix } from "../components/CorrelationMatrix";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadResponse, StatsResponse, ColumnInfo } from "../types";

// Helper to export CSV
function exportCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function DataAnalysis() {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [fullData, setFullData] = useState<any[] | null>(null);
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);

  const [selectedColumn, setSelectedColumn] = useState<string>("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setUploadData(null);
    setFullData(null);
    setStatsData(null);

    try {
      // 1. Send to /upload
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/analysis/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      const uploadJson: UploadResponse = await uploadRes.json();
      setUploadData(uploadJson);

      if (uploadJson.columns.length > 0) {
        setSelectedColumn(uploadJson.columns[0].name);
      }

      // 2. Parse file locally to get full data for /stats
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const parsedData = results.data;
          setFullData(parsedData);

          try {
            const statsRes = await fetch("/api/analysis/stats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data: parsedData,
                columns: uploadJson.columns,
              }),
            });

            if (!statsRes.ok) {
              throw new Error("Failed to generate statistics");
            }

            const statsJson: StatsResponse = await statsRes.json();
            setStatsData(statsJson);
          } catch (err: any) {
            setError(err.message || "Error computing stats");
          } finally {
            setLoading(false);
          }
        },
        error: (err) => {
          setError(`Failed to parse CSV: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const numericColumns = uploadData?.columns.filter((c) => c.type === "numeric").map((c) => c.name) || [];
  const catColumns = uploadData?.columns.filter((c) => c.type === "categorical").map((c) => c.name) || [];

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-8">
          <div className="pt-2">
            <h1 className="font-bold text-[32px] flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Data Analysis
            </h1>
            <p className="text-muted-foreground mt-1.5 text-[14px]">
              Client-side CSV explorer and statistical dashboard
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
              aria-label="Print report"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsDark((d) => !d)}
              className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Upload Section */}
        <section>
          <FileUpload onUpload={handleUpload} loading={loading} />
          {error && <div className="mt-4 p-4 text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg">{error}</div>}
        </section>

        {/* Results */}
        {uploadData && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                    <ListTree className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Rows</p>
                    <p className="text-2xl font-bold" style={{ color: "#0079F2" }}>
                      {uploadData.rowCount.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Columns</p>
                    <p className="text-2xl font-bold" style={{ color: "#0079F2" }}>
                      {uploadData.columnCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Numeric Columns</p>
                    <p className="text-2xl font-bold" style={{ color: "#009118" }}>
                      {numericColumns.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-600 dark:text-amber-400">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Categorical Columns</p>
                    <p className="text-2xl font-bold" style={{ color: "#A60808" }}>
                      {catColumns.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="columns">Column Inspector</TabsTrigger>
                <TabsTrigger value="correlations">Correlations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Preview</CardTitle>
                    <CardDescription>First 10 rows of the dataset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataPreview data={uploadData.previewRows} columns={uploadData.columns} />
                  </CardContent>
                </Card>

                {statsData && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {statsData.columnStats.slice(0, 6).map((stat) => (
                        <ColumnStats key={stat.name} stats={stat} />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="columns" className="space-y-6 mt-6">
                <div className="flex items-center gap-4">
                  <span className="font-medium">Select Column:</span>
                  <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select a column" />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadData.columns.map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name} <span className="text-xs text-muted-foreground ml-2">({col.type})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {statsData && selectedColumn && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      {statsData.columnStats.filter((s) => s.name === selectedColumn).map((stat) => (
                        <ColumnStats key={stat.name} stats={stat} />
                      ))}
                    </div>
                    <div className="lg:col-span-2">
                      <Card className="h-full">
                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-base">Distribution: {selectedColumn}</CardTitle>
                          {fullData && fullData.length > 0 && (
                            <button
                              onClick={() => {
                                const stat = statsData.columnStats.find(s => s.name === selectedColumn);
                                if (!stat) return;
                                let exportData = [];
                                if (stat.type === 'numeric' && fullData) {
                                  exportData = fullData.map(r => ({ [selectedColumn]: r[selectedColumn] }));
                                } else if (stat.topValues) {
                                  exportData = stat.topValues;
                                }
                                exportCSV(exportData, `${selectedColumn}-distribution.csv`);
                              }}
                              className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                              title="Export chart data"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </CardHeader>
                        <CardContent className="pt-4">
                          {fullData ? (
                            <DistributionChart
                              data={fullData}
                              stats={statsData.columnStats.find((s) => s.name === selectedColumn)!}
                              isDark={isDark}
                            />
                          ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart data...</div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="correlations" className="mt-6">
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-base">Correlation Matrix</CardTitle>
                      <CardDescription>Pearson correlation coefficients between numeric columns</CardDescription>
                    </div>
                    {statsData && statsData.correlations.length > 0 && (
                      <button
                        onClick={() => exportCSV(statsData.correlations, 'correlations.csv')}
                        className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                        style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                        title="Export correlations"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4">
                    {statsData ? (
                      <CorrelationMatrix correlations={statsData.correlations} columns={numericColumns} />
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading correlations...</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
