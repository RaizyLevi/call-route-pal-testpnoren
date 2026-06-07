import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { CallLogTable, type CallRecord } from "@/components/CallLogTable";

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
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Call Logs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review recent call activity and outcomes.
          </p>
        </div>
        <CallLogTable data={mockCalls} />
      </div>
    </AppLayout>
  );
}
