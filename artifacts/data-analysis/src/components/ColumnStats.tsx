import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColumnStatDetails } from "../types";

export function ColumnStats({ stats }: { stats: ColumnStatDetails }) {
  const isNumeric = stats.type === "numeric";

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <span className="truncate pr-2" title={stats.name}>{stats.name}</span>
          <span className="text-xs font-normal px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
            {stats.type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valid</span>
            <span className="font-medium">{stats.count - stats.nullCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Missing</span>
            <span className="font-medium text-red-500">{stats.nullCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Unique</span>
            <span className="font-medium">{stats.uniqueCount}</span>
          </div>
        </div>

        {isNumeric ? (
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mean</span>
                <span className="font-medium">{stats.mean?.toFixed(2) ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Median</span>
                <span className="font-medium">{stats.median?.toFixed(2) ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min</span>
                <span className="font-medium">{stats.min?.toFixed(2) ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max</span>
                <span className="font-medium">{stats.max?.toFixed(2) ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Std Dev</span>
                <span className="font-medium">{stats.std?.toFixed(2) ?? "-"}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">Distribution</p>
              <div className="flex justify-between text-xs font-medium">
                <span>{stats.min?.toFixed(1) ?? "-"}</span>
                <span>{stats.median?.toFixed(1) ?? "-"}</span>
                <span>{stats.max?.toFixed(1) ?? "-"}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full mt-1 relative overflow-hidden">
                {stats.min !== undefined && stats.max !== undefined && stats.q25 !== undefined && stats.q75 !== undefined && stats.median !== undefined && stats.max > stats.min && (
                  <>
                    <div 
                      className="absolute h-full bg-primary/20" 
                      style={{ 
                        left: `${((stats.q25 - stats.min) / (stats.max - stats.min)) * 100}%`,
                        width: `${((stats.q75 - stats.q25) / (stats.max - stats.min)) * 100}%` 
                      }} 
                    />
                    <div 
                      className="absolute h-full w-1 bg-primary" 
                      style={{ 
                        left: `${((stats.median - stats.min) / (stats.max - stats.min)) * 100}%`
                      }} 
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs text-muted-foreground mb-1">Top Values</p>
            {stats.topValues && stats.topValues.length > 0 ? (
              <div className="space-y-1.5">
                {stats.topValues.slice(0, 5).map((tv, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="truncate w-3/4 pr-2" title={String(tv.value)}>
                      {String(tv.value) || <span className="italic text-muted-foreground">empty</span>}
                    </span>
                    <span className="font-medium">{tv.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
