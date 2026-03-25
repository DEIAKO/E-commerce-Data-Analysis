import { Router, type IRouter } from "express";
import multer from "multer";
import Papa from "papaparse";
import type { Request, Response } from "express";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

type ColumnType = "numeric" | "categorical" | "datetime" | "unknown";

interface ColumnInfo {
  name: string;
  type: ColumnType;
  nullCount: number;
  uniqueCount: number;
  sample: unknown[];
}

interface ValueCount {
  value: string;
  count: number;
}

interface ColumnStats {
  name: string;
  type: string;
  count: number;
  nullCount: number;
  uniqueCount: number;
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  q25: number | null;
  q75: number | null;
  topValues: ValueCount[];
}

interface Correlation {
  col1: string;
  col2: string;
  value: number;
}

function detectColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "unknown";

  const numericCount = nonNull.filter((v) => typeof v === "number" || (typeof v === "string" && !isNaN(Number(v)) && v.trim() !== "")).length;
  if (numericCount / nonNull.length > 0.8) return "numeric";

  const datePatterns = [/^\d{4}-\d{2}-\d{2}/, /^\d{1,2}\/\d{1,2}\/\d{2,4}/, /^\d{1,2}-\d{1,2}-\d{2,4}/];
  const dateCount = nonNull.filter((v) => datePatterns.some((p) => p.test(String(v)))).length;
  if (dateCount / nonNull.length > 0.7) return "datetime";

  return "categorical";
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

function computeColumnStats(name: string, values: unknown[], colType: ColumnType): ColumnStats {
  const nullCount = values.filter((v) => v === null || v === undefined || v === "").length;
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  const unique = new Set(nonNull.map(String));

  const topValuesMap: Record<string, number> = {};
  for (const v of nonNull) {
    const key = String(v);
    topValuesMap[key] = (topValuesMap[key] || 0) + 1;
  }
  const topValues = Object.entries(topValuesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({ value, count }));

  if (colType === "numeric") {
    const nums = nonNull.map((v) => (typeof v === "number" ? v : Number(v))).filter((n) => !isNaN(n));
    const sorted = [...nums].sort((a, b) => a - b);
    const mean = nums.length > 0 ? nums.reduce((s, n) => s + n, 0) / nums.length : null;
    const median = sorted.length > 0 ? quantile(sorted, 0.5) : null;
    const q25 = sorted.length > 0 ? quantile(sorted, 0.25) : null;
    const q75 = sorted.length > 0 ? quantile(sorted, 0.75) : null;
    const min = sorted.length > 0 ? sorted[0] : null;
    const max = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const std = mean !== null && nums.length > 1
      ? Math.sqrt(nums.reduce((s, n) => s + Math.pow(n - mean, 2), 0) / nums.length)
      : null;
    return { name, type: colType, count: values.length, nullCount, uniqueCount: unique.size, mean, median, std, min, max, q25, q75, topValues };
  }

  return { name, type: colType, count: values.length, nullCount, uniqueCount: unique.size, mean: null, median: null, std: null, min: null, max: null, q25: null, q75: null, topValues };
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const meanX = xs.reduce((s, x) => s + x, 0) / n;
  const meanY = ys.reduce((s, y) => s + y, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const denX = Math.sqrt(xs.reduce((s, x) => s + Math.pow(x - meanX, 2), 0));
  const denY = Math.sqrt(ys.reduce((s, y) => s + Math.pow(y - meanY, 2), 0));
  if (denX === 0 || denY === 0) return 0;
  return Math.round((num / (denX * denY)) * 1000) / 1000;
}

router.post("/analysis/upload", upload.single("file"), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const ext = req.file.originalname.toLowerCase();
  if (!ext.endsWith(".csv")) {
    res.status(400).json({ error: "Only CSV files are supported" });
    return;
  }

  const csvText = req.file.buffer.toString("utf-8");
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    res.status(400).json({ error: `CSV parse error: ${parsed.errors[0]?.message}` });
    return;
  }

  const rows = parsed.data;
  const fieldNames = parsed.meta.fields ?? [];

  const columns: ColumnInfo[] = fieldNames.map((name) => {
    const values = rows.map((r) => r[name]);
    const type = detectColumnType(values);
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
    const unique = new Set(nonNull.map(String));
    const sample = nonNull.slice(0, 5);
    const nullCount = values.length - nonNull.length;
    return { name, type, nullCount, uniqueCount: unique.size, sample };
  });

  const previewRows = rows.slice(0, 10);

  res.json({
    filename: req.file.originalname,
    rowCount: rows.length,
    columnCount: fieldNames.length,
    columns,
    previewRows,
  });
});

router.post("/analysis/stats", (req: Request, res: Response): void => {
  const { data, columns } = req.body as { data: Record<string, unknown>[]; columns: ColumnInfo[] };

  if (!data || !columns) {
    res.status(400).json({ error: "Missing data or columns" });
    return;
  }

  const columnStats: ColumnStats[] = columns.map((col) => {
    const values = data.map((r) => r[col.name]);
    return computeColumnStats(col.name, values, col.type as ColumnType);
  });

  const numericCols = columns.filter((c) => c.type === "numeric");
  const correlations: Correlation[] = [];

  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const col1 = numericCols[i].name;
      const col2 = numericCols[j].name;
      const pairs = data
        .map((r) => [r[col1], r[col2]] as [unknown, unknown])
        .filter(([a, b]) => a !== null && a !== undefined && a !== "" && b !== null && b !== undefined && b !== "");
      const xs = pairs.map(([a]) => Number(a));
      const ys = pairs.map(([, b]) => Number(b));
      if (xs.length >= 3) {
        correlations.push({ col1, col2, value: pearsonCorrelation(xs, ys) });
      }
    }
  }

  correlations.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  res.json({ columnStats, correlations });
});

export default router;
