import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
} from "recharts";
import { ColumnStatDetails, ValueCount } from "../types";

const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

const CHART_COLOR_LIST = [
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.green,
  CHART_COLORS.red,
  CHART_COLORS.pink,
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "6px",
        padding: "10px 14px",
        border: "1px solid #e0e0e0",
        color: "#1a1a1a",
        fontSize: "13px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      }}
    >
      <div style={{ marginBottom: "6px", fontWeight: 500 }}>{label}</div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              backgroundColor: entry.color || CHART_COLORS.blue,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "#444" }}>Count:</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DistributionChart({
  data,
  stats,
  isDark,
}: {
  data: any[];
  stats: ColumnStatDetails;
  isDark: boolean;
}) {
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const isNumeric = stats.type === "numeric";

  const chartData = useMemo(() => {
    if (!isNumeric) {
      if (!stats.topValues) return [];
      return stats.topValues.slice(0, 10).map((tv) => ({
        name: String(tv.value),
        count: tv.count,
      }));
    }

    // For numeric, approximate bins client-side if we have data
    // We only have the full data if passed, but here data might be full dataset
    if (!data || data.length === 0) return [];
    
    const vals = data.map((d) => Number(d[stats.name])).filter((v) => !isNaN(v));
    if (vals.length === 0) return [];

    const min = stats.min ?? Math.min(...vals);
    const max = stats.max ?? Math.max(...vals);
    
    if (min === max) {
      return [{ name: min.toFixed(2), count: vals.length }];
    }

    const binCount = 20;
    const binSize = (max - min) / binCount;
    const bins = Array(binCount).fill(0).map((_, i) => ({
      name: (min + i * binSize).toFixed(1) + " - " + (min + (i + 1) * binSize).toFixed(1),
      minVal: min + i * binSize,
      maxVal: min + (i + 1) * binSize,
      count: 0,
    }));

    vals.forEach((v) => {
      let idx = Math.floor((v - min) / binSize);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });

    return bins;
  }, [data, stats, isNumeric]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        Insufficient data for visualization
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300} debounce={0}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: tickColor }}
          stroke={tickColor}
          angle={isNumeric ? -45 : -45}
          textAnchor="end"
          height={60}
          tickFormatter={(val) => (val.length > 15 ? val.substring(0, 15) + "..." : val)}
        />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} stroke={tickColor} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} isAnimationActive={false} />
        <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {!isNumeric && chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
