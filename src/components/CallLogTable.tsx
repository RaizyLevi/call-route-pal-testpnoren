import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface CallRecord {
  id: string;
  caller: string;
  direction: "Inbound" | "Outbound";
  status: "Completed" | "Failed" | "In Progress";
  duration: string;
  timestamp: string;
  result: string;
}

type SortKey = keyof CallRecord;
type SortDir = "asc" | "desc";

interface SortState {
  key: SortKey;
  dir: SortDir;
}

const statusTone: Record<string, string> = {
  Completed: "text-success bg-success/10",
  Failed: "text-destructive bg-destructive/10",
  "In Progress": "text-warning bg-warning/10",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

export function CallLogTable({ data, totalCount }: { data: CallRecord[]; totalCount: number }) {
  const [sort, setSort] = useState<SortState>({ key: "timestamp", dir: "desc" });

  const sorted = useMemo(() => {
    const { key, dir } = sort;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const headers: { key: SortKey; label: string }[] = [
    { key: "id", label: "Call ID" },
    { key: "caller", label: "Caller" },
    { key: "direction", label: "Direction" },
    { key: "status", label: "Status" },
    { key: "duration", label: "Duration" },
    { key: "timestamp", label: "Timestamp" },
    { key: "result", label: "Result" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => toggleSort(h.key)}
                  className="cursor-pointer select-none px-4 py-3 text-left font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {h.label}
                    <SortIcon active={sort.key === h.key} dir={sort.dir} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.id}</td>
                <td className="px-4 py-3 font-medium">{row.caller}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.direction === "Inbound"
                        ? "text-primary bg-primary/10"
                        : "text-secondary-foreground bg-secondary"
                    }`}
                  >
                    {row.direction}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.duration}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.timestamp}</td>
                <td className="px-4 py-3">{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground bg-muted/20">
        Showing {sorted.length} of {totalCount} records
      </div>
    </div>
  );
}
