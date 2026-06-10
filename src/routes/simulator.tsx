import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Phone, Volume2, Code2, MapPin, Navigation } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransitLeg {
  mode: "Walk" | "Bus" | "Train" | "Subway";
  line?: string;
  from: string;
  to: string;
  durationMin: number;
  stops?: number;
}

interface TransitPlan {
  origin: string;
  destination: string;
  totalDurationMin: number;
  departAt: string;
  arriveAt: string;
  legs: TransitLeg[];
}

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "IVR Simulator · Telephonic Waze" },
      { name: "description", content: "Simulate the voice IVR flow with mock origin and destination." },
    ],
  }),
  component: SimulatorPage,
});

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function generateMockPlan(origin: string, destination: string): TransitPlan {
  const now = new Date();
  const depart = new Date(now.getTime() + 5 * 60_000);
  const totalMin = 20 + Math.floor(Math.random() * 30);
  const arrive = new Date(depart.getTime() + totalMin * 60_000);
  const busLines = ["18", "47", "72", "104", "239"];
  const line = busLines[Math.floor(Math.random() * busLines.length)];

  const walk1 = 4 + Math.floor(Math.random() * 4);
  const ride = totalMin - walk1 - 5;

  return {
    origin,
    destination,
    totalDurationMin: totalMin,
    departAt: `${pad(depart.getHours())}:${pad(depart.getMinutes())}`,
    arriveAt: `${pad(arrive.getHours())}:${pad(arrive.getMinutes())}`,
    legs: [
      { mode: "Walk", from: origin, to: "Main St Station", durationMin: walk1 },
      { mode: "Bus", line, from: "Main St Station", to: "Central Square", durationMin: ride, stops: 6 + Math.floor(Math.random() * 5) },
      { mode: "Walk", from: "Central Square", to: destination, durationMin: 5 },
    ],
  };
}

function planToSpeech(plan: TransitPlan): string {
  const bus = plan.legs.find((l) => l.mode === "Bus");
  const walk1 = plan.legs[0];
  const walk2 = plan.legs[plan.legs.length - 1];
  return (
    `To get from ${plan.origin} to ${plan.destination}, ` +
    `walk ${walk1.durationMin} minutes to ${walk1.to}, ` +
    `then take bus ${bus?.line} for about ${bus?.durationMin} minutes — that's ${bus?.stops} stops — ` +
    `and finish with a ${walk2.durationMin} minute walk to your destination. ` +
    `Departing at ${plan.departAt}, you'll arrive around ${plan.arriveAt}. ` +
    `Total travel time is approximately ${plan.totalDurationMin} minutes.`
  );
}

function SimulatorPage() {
  const [origin, setOrigin] = useState("Home");
  const [destination, setDestination] = useState("Downtown Office");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TransitPlan | null>(null);
  const [speech, setSpeech] = useState<string>("");

  const runCall = async () => {
    setLoading(true);
    setPlan(null);
    setSpeech("");
    await new Promise((res) => setTimeout(res, 2000));
    const p = generateMockPlan(origin.trim() || "Home", destination.trim() || "Downtown Office");
    setPlan(p);
    setSpeech(planToSpeech(p));
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">IVR Simulator</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulate an incoming call asking for transit directions.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="origin" className="text-xs font-medium text-muted-foreground">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                Origin
              </Label>
              <Input
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Home"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-xs font-medium text-muted-foreground">
                <Navigation className="mr-1 inline h-3.5 w-3.5" />
                Destination
              </Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Downtown Office"
                disabled={loading}
              />
            </div>
          </div>

          <Button onClick={runCall} disabled={loading} className="mt-4 w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                <Phone className="h-4 w-4" />
                Simulate Incoming Call
              </>
            )}
          </Button>
        </div>

        {loading && (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-primary" />
            Routing engine is computing the best path…
          </div>
        )}

        {plan && !loading && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">System Data</h3>
                <span className="ml-auto text-xs text-muted-foreground">JSON response</span>
              </div>
              <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-foreground/90">
                <code>{JSON.stringify(plan, null, 2)}</code>
              </pre>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                <Volume2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">User Experience</h3>
                <span className="ml-auto text-xs text-muted-foreground">What the caller hears</span>
              </div>
              <div className="p-5">
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm leading-relaxed">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-primary">
                    Voice response
                  </span>
                  "{speech}"
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Depart</div>
                    <div className="text-sm font-medium">{plan.departAt}</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Arrive</div>
                    <div className="text-sm font-medium">{plan.arriveAt}</div>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-sm font-medium">{plan.totalDurationMin} min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
