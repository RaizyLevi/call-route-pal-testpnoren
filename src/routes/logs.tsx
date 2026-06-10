import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon, Download, Search, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { CallLogTable, type CallRecord } from "@/components/CallLogTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const mockCalls: CallRecord[] = [
  { id: "CL-8921", caller: "+1 (555) 019-2834", direction: "Inbound", status: "Completed", duration: "2m 14s", timestamp: "2026-06-07 09:12", result: "Resolved" },
  { id: "CL-8922", caller: "+1 (555) 042-9912", direction: "Inbound", status: "Completed", duration: "1m 48s", timestamp: "2026-06-07 09:45", result: "Voicemail" },
  { id: "CL-8923", caller: "+1 (555) 117-3301", direction: "Outbound", status: "Failed", duration: "0m 32s", timestamp: "2026-06-07 10:03", result: "No Answer" },
  { id: "CL-8924", caller: "+1 (555) 883-2210", direction: "Inbound", status: "In Progress", duration: "4m 05s", timestamp: "2026-06-07 10:21", result: "Transferred" },
  { id: "CL-8925", caller: "+1 (555) 305-7742", direction: "Inbound", status: "Completed", duration: "3m 22s", timestamp: "2026-06-07 11:07", result: "Resolved" },
  { id: "CL-8926", caller: "+1 (555) 660-1198", direction: "Outbound", status: "Completed", duration: "1m 15s", timestamp: "2026-06-07 11:34", result: "Appointment Set" },
  { id: "CL-8927", caller: "+1 (555) 774-0055", direction: "Inbound", status: "Failed", duration: "0m 18s", timestamp: "2026-06-07 12:01", result: "Dropped" },
  { id: "CL-8928", caller: "+1 (555) 228-9941", direction: "Inbound", status: "Completed", duration: "5m 09s", timestamp: "2026-06-07 12:28", result: "Resolved" },
  { id: "CL-8929", caller: "+1 (555) 441-6677", direction: "Outbound", status: "In Progress", duration: "2m 56s", timestamp: "2026-06-07 13:15", result: "On Hold" },
  { id: "CL-8930", caller: "+1 (555) 556-3380", direction: "Inbound", status: "Completed", duration: "1m 02s", timestamp: "2026-06-07 13:42", result: "Voicemail" },
];

function getRecordDate(timestamp: string): Date {
  const [datePart] = timestamp.split(" ");
  return new Date(datePart + "T00:00:00");
}

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Call Logs · Telephonic Waze" },
      { name: "description", content: "Incoming requests and call history." },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [exportOpen, setExportOpen] = useState(false);
  const defaultFilename = `call-logs-${new Date().toISOString().slice(0, 10)}`;
  const [exportFilename, setExportFilename] = useState(defaultFilename);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockCalls.filter((record) => {
      if (q) {
        const text = `${record.id} ${record.caller} ${record.result}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      if (directionFilter !== "all" && record.direction !== directionFilter) return false;

      const recordDate = getRecordDate(record.timestamp);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (recordDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (recordDate > to) return false;
      }
      return true;
    });
  }, [search, statusFilter, directionFilter, fromDate, toDate]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, directionFilter, fromDate, toDate, pageSize]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    search || statusFilter !== "all" || directionFilter !== "all" || fromDate || toDate;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDirectionFilter("all");
    setFromDate(undefined);
    setToDate(undefined);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const exportCsv = () => {
    const headers = ["Call ID", "Caller", "Direction", "Status", "Duration", "Timestamp", "Result"];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = filtered.map((r) =>
      [r.id, r.caller, r.direction, r.status, r.duration, r.timestamp, r.result].map(escape).join(",")
    );
    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Call Logs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review recent call activity and outcomes.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={totalFiltered === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by caller, ID, or result…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Direction
              </label>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Inbound">Inbound</SelectItem>
                  <SelectItem value="Outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                From Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                To Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {totalFiltered} result{totalFiltered !== 1 ? "s" : ""}
            </span>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto px-2 py-1 text-xs">
              Clear filters
            </Button>
          </div>
        )}

        <CallLogTable data={paginated} totalCount={totalFiltered} startIndex={startIndex} />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className={safePage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {pageNumbers.map((n) => (
                <PaginationItem key={n}>
                  <PaginationLink
                    href="#"
                    isActive={n === safePage}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(n);
                    }}
                  >
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className={safePage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </AppLayout>
  );
}
