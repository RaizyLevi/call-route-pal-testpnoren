import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Telephonic Waze" },
      { name: "description", content: "Configure system preferences for Telephonic Waze." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Settings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your console preferences and system configuration.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Settings panel coming soon.
        </div>
      </div>
    </AppLayout>
  );
}
