import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";

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
      <div className="rounded-xl border border-border bg-card p-8 text-card-foreground">
        <h2 className="text-xl font-semibold">Call Logs</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Requests table will appear here in Phase 2.
        </p>
      </div>
    </AppLayout>
  );
}
