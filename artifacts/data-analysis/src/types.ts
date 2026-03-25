export interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical" | "datetime" | "unknown";
  nullCount: number;
  uniqueCount: number;
  sample: any[];
}

export interface UploadResponse {
  filename: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  previewRows: any[];
}

export interface ValueCount {
  value: any;
  count: number;
}

export interface ColumnStatDetails {
  name: string;
  type: string;
  count: number;
  nullCount: number;
  uniqueCount: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  q25?: number;
  q75?: number;
  topValues?: ValueCount[];
}

export interface Correlation {
  col1: string;
  col2: string;
  value: number;
}

export interface StatsResponse {
  columnStats: ColumnStatDetails[];
  correlations: Correlation[];
}
