import { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Voicemail,
  PhoneForwarded,
  PhoneMissed,
  PauseCircle,
  CalendarCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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

const statusIcons: Record<string, React.ElementType> = {
  Completed: CheckCircle2,
  Failed: XCircle,
  "In Progress": Loader2,
};

const resultIcons: Record<string, React.ElementType> = {
  Resolved: CheckCircle2,
  Voicemail: Voicemail,
  "No Answer": PhoneMissed,
  Transferred: PhoneForwarded,
  "Appointment Set": CalendarCheck,
  Dropped: XCircle,
  "On Hold": PauseCircle,
};

const resultTone: Record<string, string> = {
  Resolved: "text-success",
  "Appointment Set": "text-success",
  Voicemail: "text-muted-foreground",
  Transferred: "text-primary",
  "On Hold": "text-warning",
  "No Answer": "text-destructive",
  Dropped: "text-destructive",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

// Mock per-caller history
function getCallerHistory(caller: string): CallRecord[] {
  const base = caller.slice(-4);
  return [
    {
      id: `CL-${base}1`,
      caller,
      direction: "Inbound",
      status: "Completed",
      duration: "3m 12s",
      timestamp: "2026-06-05 14:22",
      result: "Resolved",
    },
    {
      id: `CL-${base}2`,
      caller,
      direction: "Outbound",
      status: "Failed",
      duration: "0m 22s",
      timestamp: "2026-06-03 09:51",
      result: "No Answer",
    },
    {
      id: `CL-${base}3`,
      caller,
      direction: "Inbound",
      status: "Completed",
      duration: "1m 47s",
      timestamp: "2026-05-29 17:08",
      result: "Voicemail",
    },
  ];
}

export function CallLogTable({
  data,
  totalCount,
  startIndex = 0,
}: {
  data: CallRecord[];
  totalCount: number;
  startIndex?: number;
}) {
  const [sort, setSort] = useState<SortState>({ key: "timestamp", dir: "desc" });
  const [drawerCaller, setDrawerCaller] = useState<string | null>(null);
  const [detailsCall, setDetailsCall] = useState<CallRecord | null>(null);

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

  const history = drawerCaller ? getCallerHistory(drawerCaller) : [];

  return (
    <>
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
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((row) => {
                const StatusIcon = statusIcons[row.status];
                const ResultIcon = resultIcons[row.result] ?? CheckCircle2;
                return (
                  <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {row.id}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <button
                        onClick={() => setDrawerCaller(row.caller)}
                        className="text-primary hover:underline focus:outline-none focus-visible:underline"
                      >
                        {row.caller}
                      </button>
                    </td>
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
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[row.status]}`}
                      >
                        <StatusIcon
                          className={`h-3 w-3 ${row.status === "In Progress" ? "animate-spin" : ""}`}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.duration}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.timestamp}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${resultTone[row.result] ?? "text-foreground"}`}
                      >
                        <ResultIcon className="h-3.5 w-3.5" />
                        {row.result}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDetailsCall(row)}
                          title="View details"
                          aria-label={`View details for ${row.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => console.log("Play audio", row.id)}
                          title="Play audio"
                          aria-label={`Play audio for ${row.id}`}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground bg-muted/20">
          Showing {startIndex + 1}-{Math.min(startIndex + sorted.length, totalCount)} of{" "}
          {totalCount} records
        </div>
      </div>

      <Sheet open={drawerCaller !== null} onOpenChange={(o) => !o && setDrawerCaller(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Caller History</SheetTitle>
            <SheetDescription>
              Recent calls from <span className="font-mono">{drawerCaller}</span>
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {history.map((h) => {
              const ResultIcon = resultIcons[h.result] ?? CheckCircle2;
              return (
                <div
                  key={h.id}
                  className="rounded-lg border border-border bg-muted/20 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">{h.id}</span>
                    <span className="text-xs text-muted-foreground">{h.timestamp}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${resultTone[h.result] ?? ""}`}
                    >
                      <ResultIcon className="h-3.5 w-3.5" />
                      {h.result}
                    </span>
                    <span className="text-xs text-muted-foreground">{h.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={detailsCall !== null} onOpenChange={(o) => !o && setDetailsCall(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Call Details</SheetTitle>
            <SheetDescription>
              <span className="font-mono">{detailsCall?.id}</span>
            </SheetDescription>
          </SheetHeader>
          {detailsCall && (
            <dl className="mt-6 space-y-3 text-sm">
              {[
                ["Caller", detailsCall.caller],
                ["Direction", detailsCall.direction],
                ["Status", detailsCall.status],
                ["Duration", detailsCall.duration],
                ["Timestamp", detailsCall.timestamp],
                ["Result", detailsCall.result],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border pb-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
