import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Phone, Volume2, Code2, MapPin, Navigation, Footprints, Bus, Train, Clock, Sparkles, Terminal, Settings2, User, Bot } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Scenario = "normal" | "heavy-traffic" | "road-closed" | "rainy" | "rush-hour";

const scenarioLabels: Record<Scenario, string> = {
  normal: "Normal conditions",
  "heavy-traffic": "Heavy Traffic",
  "road-closed": "Road Closed",
  rainy: "Rainy Weather",
  "rush-hour": "Rush Hour",
};

interface TranscriptEntry {
  speaker: "system" | "user";
  text: string;
  time: string;
}

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
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<TransitPlan | null>(null);
  const [speech, setSpeech] = useState<string>("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const now = () => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const pushTranscript = (entry: Omit<TranscriptEntry, "time">) =>
    setTranscript((prev) => [...prev, { ...entry, time: now() }]);

  const runCall = async () => {
    setLoading(true);
    setPlan(null);
    setSpeech("");
    setTranscript([]);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    pushTranscript({ speaker: "system", text: "📞 Incoming call accepted." });
    await wait(500);
    pushTranscript({ speaker: "system", text: "Hello! Where would you like to go today?" });
    await wait(700);
    pushTranscript({ speaker: "user", text: `I'm at ${origin}. I need to get to ${destination}.` });
    await wait(600);
    if (scenario !== "normal") {
      pushTranscript({
        speaker: "system",
        text: `Heads up — ${scenarioLabels[scenario].toLowerCase()} detected on your route. Recalculating…`,
      });
      await wait(800);
    } else {
      pushTranscript({ speaker: "system", text: "Got it. Calculating the fastest route…" });
      await wait(700);
    }

    const p = generateMockPlan(origin.trim() || "Home", destination.trim() || "Downtown Office");
    if (scenario === "heavy-traffic" || scenario === "rush-hour") {
      p.totalDurationMin += 12;
    }
    if (scenario === "road-closed") {
      p.totalDurationMin += 20;
    }
    const s = planToSpeech(p);
    setPlan(p);
    setSpeech(s);
    pushTranscript({ speaker: "system", text: s });
    await wait(400);
    pushTranscript({ speaker: "user", text: "Thanks!" });
    pushTranscript({ speaker: "system", text: "📴 Call ended." });
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
                <h3 className="text-sm font-medium">LLM &amp; TTS Output</h3>
                <span className="ml-auto text-xs text-muted-foreground">What the caller hears</span>
              </div>

              <div className="space-y-5 p-5">
                {/* Intro / summary */}
                <section>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Summary
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    Here's the best way to get from{" "}
                    <span className="font-medium">{plan.origin}</span> to{" "}
                    <span className="font-medium">{plan.destination}</span>. It should take about{" "}
                    <span className="font-medium">{plan.totalDurationMin} minutes</span> in total.
                  </p>
                </section>

                <div className="h-px bg-border" />

                {/* Step-by-step instructions */}
                <section>
                  <div className="mb-3 flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Step-by-step directions
                    </span>
                  </div>
                  <ol className="space-y-3">
                    {plan.legs.map((leg, i) => {
                      const Icon =
                        leg.mode === "Walk" ? Footprints : leg.mode === "Bus" ? Bus : Train;
                      return (
                        <li key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {i + 1}
                            </div>
                            {i < plan.legs.length - 1 && (
                              <div className="mt-1 w-px flex-1 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {leg.mode === "Walk"
                                  ? `Walk ${leg.durationMin} min`
                                  : `Take ${leg.mode} ${leg.line ?? ""}`.trim()}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {leg.durationMin} min
                              </span>
                              {leg.stops != null && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                  {leg.stops} stops
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              From <span className="text-foreground/80">{leg.from}</span> to{" "}
                              <span className="text-foreground/80">{leg.to}</span>
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>

                <div className="h-px bg-border" />

                {/* Schedule */}
                <section>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Schedule
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md border border-border bg-muted/30 p-2">
                      <div className="text-[11px] text-muted-foreground">Depart</div>
                      <div className="text-sm font-semibold">{plan.departAt}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/30 p-2">
                      <div className="text-[11px] text-muted-foreground">Arrive</div>
                      <div className="text-sm font-semibold">{plan.arriveAt}</div>
                    </div>
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-2">
                      <div className="text-[11px] text-muted-foreground">Total</div>
                      <div className="text-sm font-semibold text-primary">
                        {plan.totalDurationMin} min
                      </div>
                    </div>
                  </div>
                </section>

                {/* Raw spoken transcript */}
                <details className="group rounded-lg border border-border bg-muted/20 open:bg-muted/30">
                  <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                    Spoken transcript
                  </summary>
                  <p className="border-t border-border px-3 py-3 text-sm italic leading-relaxed text-foreground/80">
                    "{speech}"
                  </p>
                </details>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
