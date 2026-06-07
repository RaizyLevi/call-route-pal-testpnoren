import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "IVR Simulator · Telephonic Waze" },
      { name: "description", content: "Simulate the voice IVR flow with mock origin and destination." },
    ],
  }),
  component: SimulatorPage,
});

function SimulatorPage() {
  return (
    <AppLayout>
      <div className="rounded-xl border border-border bg-card p-8 text-card-foreground">
        <h2 className="text-xl font-semibold">IVR Simulator</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Mock voice interface coming in Phase 3.
        </p>
      </div>
    </AppLayout>
  );
}
