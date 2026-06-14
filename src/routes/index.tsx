import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Phone, Clock, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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
  totalCallsTrend: 12,
  avgResponseTime: "2.4s",
  avgResponseTrend: -8,
  errorRate: 0.8,
};

const callVolume = [
  { hour: "00", calls: 12 },
  { hour: "02", calls: 6 },
  { hour: "04", calls: 4 },
  { hour: "06", calls: 18 },
  { hour: "08", calls: 74 },
  { hour: "10", calls: 132 },
  { hour: "12", calls: 168 },
  { hour: "14", calls: 154 },
  { hour: "16", calls: 178 },
  { hour: "18", calls: 142 },
  { hour: "20", calls: 88 },
  { hour: "22", calls: 41 },
];

function Trend({ value, invert = false }: { value: number; invert?: boolean }) {
  if (value === 0) return null;
  const isUp = value > 0;
  const isGood = invert ? !isUp : isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const cls = isGood ? "text-success" : "text-destructive";
  return (
    <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {isUp ? "↑" : "↓"} {Math.abs(value)}% from yesterday
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  valueClassName,
  children,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone?: "default" | "success" | "warning" | "destructive";
  valueClassName?: string;
  children?: React.ReactNode;
}) {
  const toneClasses = {
    default: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${valueClassName ?? ""}`}>
            {value}
          </p>
          {children}
        </div>
        <div className={`rounded-lg p-3 ${toneClasses[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const errorHigh = mockData.errorRate > 1.0;

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
          >
            <Trend value={mockData.totalCallsTrend} />
          </KpiCard>
          <KpiCard
            label="Avg Response Time"
            value={mockData.avgResponseTime}
            icon={Clock}
            tone="warning"
          >
            <Trend value={mockData.avgResponseTrend} invert />
          </KpiCard>
          <KpiCard
            label="Error Rate"
            value={`${mockData.errorRate.toFixed(1)}%`}
            icon={AlertTriangle}
            tone="destructive"
            valueClassName={errorHigh ? "text-destructive" : "text-success"}
          >
            <div className="mt-2 text-xs text-muted-foreground">
              Threshold: 1.0%
            </div>
          </KpiCard>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h2 className="text-base font-semibold">Call Volume</h2>
              <p className="text-xs text-muted-foreground">Calls per hour, today</p>
            </div>
            <span className="text-xs text-muted-foreground">Last 24h</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={callVolume} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="hour"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--color-foreground)",
                  }}
                  labelStyle={{ color: "var(--color-muted-foreground)" }}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--color-primary)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
