import { useMemo } from "react";
import { Correlation } from "../types";

export function CorrelationMatrix({ correlations, columns }: { correlations: Correlation[], columns: string[] }) {
  const matrix = useMemo(() => {
    const mat: Record<string, Record<string, number>> = {};
    columns.forEach((c1) => {
      mat[c1] = {};
      columns.forEach((c2) => {
        mat[c1][c2] = c1 === c2 ? 1 : 0;
      });
    });

    correlations.forEach((corr) => {
      if (mat[corr.col1] && mat[corr.col1][corr.col2] !== undefined) {
        mat[corr.col1][corr.col2] = corr.value;
      }
      if (mat[corr.col2] && mat[corr.col2][corr.col1] !== undefined) {
        mat[corr.col2][corr.col1] = corr.value;
      }
    });

    return mat;
  }, [correlations, columns]);

  const getColor = (value: number) => {
    // Red for negative, green for positive, white/gray for 0
    if (value > 0) {
      return `rgba(0, 145, 24, ${Math.abs(value)})`;
    } else if (value < 0) {
      return `rgba(166, 8, 8, ${Math.abs(value)})`;
    }
    return `rgba(0,0,0,0.02)`;
  };

  const getTextColor = (value: number) => {
    return Math.abs(value) > 0.5 ? "#ffffff" : "inherit";
  };

  if (columns.length === 0) {
    return <div className="p-4 text-center text-muted-foreground text-sm">No numeric columns available for correlation</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-2 border font-medium text-left bg-muted/30 min-w-[120px]"></th>
            {columns.map((col) => (
              <th key={col} className="p-2 border font-medium text-center bg-muted/30 truncate max-w-[120px]" title={col}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((rowCol) => (
            <tr key={rowCol}>
              <td className="p-2 border font-medium bg-muted/30 truncate max-w-[120px]" title={rowCol}>
                {rowCol}
              </td>
              {columns.map((col) => {
                const val = matrix[rowCol][col];
                return (
                  <td
                    key={col}
                    className="p-2 border text-center font-mono text-xs transition-colors"
                    style={{
                      backgroundColor: getColor(val),
                      color: getTextColor(val),
                    }}
                    title={`${rowCol} & ${col}: ${val.toFixed(4)}`}
                  >
                    {val.toFixed(2)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
