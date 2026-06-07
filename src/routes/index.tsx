import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Phone, Clock, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Telephonic Waze" },
      { name: "description", content: "Admin dashboard for the Telephonic Waze voice navigation system." },
    ],
  }),
  component: DashboardPage,
});

const mockData = {
  totalCallsToday: 1247,
  avgResponseTime: "2.4s",
  errorRate: "0.8%",
};

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClasses = {
    default: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${toneClasses[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of system health and call metrics.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Total Calls Today"
            value={mockData.totalCallsToday.toLocaleString()}
            icon={Phone}
            tone="success"
          />
          <KpiCard
            label="Avg Response Time"
            value={mockData.avgResponseTime}
            icon={Clock}
            tone="warning"
          />
          <KpiCard
            label="Error Rate"
            value={mockData.errorRate}
            icon={AlertTriangle}
            tone="destructive"
          />
        </div>
      </div>
    </AppLayout>
  );
}
