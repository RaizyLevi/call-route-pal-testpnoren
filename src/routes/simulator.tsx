import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Loader2,
  Phone,
  Volume2,
  Code2,
  MapPin,
  Navigation,
  Sparkles,
  Terminal,
  Settings2,
  User,
  Bot,
  AlertCircle,
  Languages,
} from "lucide-react";
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

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "IVR Simulator · Telephonic Waze" },
      { name: "description", content: "Simulate the voice IVR flow against the live routing API." },
    ],
  }),
  component: SimulatorPage,
});

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const MOCK_RESPONSE =
  "id_list_message=t-כדי להגיע ליעד, גשו לתחנת רבי עקיבא וקחו את קו 402. נסיעה טובה!";

interface ParsedIvr {
  key: string | null;
  text: string;
  segments: string[];
}

/**
 * Parses the IVR text response. Examples:
 *   id_list_message=t-כדי להגיע ליעד...
 *   read=t-אנא אמרו את עיר היעד...,foo=bar
 * Returns the Hebrew text after `t-` and before the next `=` or `,`.
 */
function parseIvrResponse(raw: string): ParsedIvr {
  const trimmed = raw.trim();
  // Find first occurrence of `t-` (the prefix marking the spoken text).
  const tIdx = trimmed.indexOf("t-");
  if (tIdx === -1) {
    return { key: null, text: trimmed, segments: splitSegments(trimmed) };
  }
  // The key is whatever comes before the `=` that precedes `t-`.
  const before = trimmed.slice(0, tIdx);
  const eqIdx = before.lastIndexOf("=");
  const key = eqIdx >= 0 ? before.slice(0, eqIdx).split(",").pop()?.trim() ?? null : null;

  // Slice from after `t-` until the next `,` followed by `key=` pattern, or end.
  const rest = trimmed.slice(tIdx + 2);
  // Stop at the first `,<something>=` (next key/value pair) — Hebrew text shouldn't contain `=`.
  const stopMatch = rest.match(/,[^,=]*=/);
  const text = (stopMatch ? rest.slice(0, stopMatch.index) : rest).trim();

  return { key, text, segments: splitSegments(text) };
}

function splitSegments(text: string): string[] {
  return text
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function SimulatorPage() {
  const [origin, setOrigin] = useState("תל אביב");
  const [destination, setDestination] = useState("ירושלים");
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [parsed, setParsed] = useState<ParsedIvr | null>(null);
  const [rawResponse, setRawResponse] = useState<string>("");
  const [requestUrl, setRequestUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const now = () => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const pushTranscript = (entry: Omit<TranscriptEntry, "time">) =>
    setTranscript((prev) => [...prev, { ...entry, time: now() }]);

  const runCall = async () => {
    setLoading(true);
    setParsed(null);
    setRawResponse("");
    setError("");
    setTranscript([]);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    pushTranscript({ speaker: "system", text: "📞 Incoming call accepted." });
    await wait(200);
    pushTranscript({
      speaker: "user",
      text: `Origin: ${origin || "(empty)"} · Destination: ${destination || "(empty)"}`,
    });
    await wait(150);
    if (scenario !== "normal") {
      pushTranscript({
        speaker: "system",
        text: `Scenario flag: ${scenarioLabels[scenario]} (sent for context)`,
      });
    }
    pushTranscript({ speaker: "system", text: "Calling live routing API…" });

    const url = `${API_ENDPOINT}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
      destination,
    )}`;
    setRequestUrl(url);

    try {
      const res = await fetch(url);
      const raw = await res.text();
      setRawResponse(raw);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} — ${raw.slice(0, 200) || res.statusText}`);
      }
      const p = parseIvrResponse(raw);
      setParsed(p);
      pushTranscript({
        speaker: "system",
        text: p.text || "(empty response)",
      });
      pushTranscript({ speaker: "system", text: "📴 Call ended." });
    } catch (e: any) {
      const msg = e?.message ?? "Request failed";
      setError(msg);
      pushTranscript({ speaker: "system", text: `❌ ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">IVR Simulator</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live test against{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{API_ENDPOINT}</code>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="scenario" className="text-xs font-medium text-muted-foreground">
              <Settings2 className="mr-1 inline h-3.5 w-3.5" />
              Advanced Settings — Scenario
            </Label>
            <Select
              value={scenario}
              onValueChange={(v) => setScenario(v as Scenario)}
              disabled={loading}
            >
              <SelectTrigger id="scenario" className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(scenarioLabels) as Scenario[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {scenarioLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                placeholder="e.g. תל אביב"
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
                placeholder="e.g. ירושלים"
                disabled={loading}
              />
            </div>
          </div>

          <Button onClick={runCall} disabled={loading} className="w-full sm:w-auto">
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

        {/* Transcript / log */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Simulation Transcript</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {transcript.length} {transcript.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto bg-muted/10 p-4 font-mono text-xs">
            {transcript.length === 0 ? (
              <p className="text-muted-foreground italic">
                Start a simulation to see the conversation log appear here…
              </p>
            ) : (
              <ul className="space-y-2">
                {transcript.map((t, i) => {
                  const isUser = t.speaker === "user";
                  const Icon = isUser ? User : Bot;
                  return (
                    <li key={i} className="flex gap-2">
                      <span className="text-muted-foreground/70 shrink-0">[{t.time}]</span>
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isUser ? "text-warning" : "text-primary"}`}
                      />
                      <span
                        className={`shrink-0 font-semibold ${isUser ? "text-warning" : "text-primary"}`}
                      >
                        {isUser ? "USER" : "SYS "}:
                      </span>
                      <span className="text-foreground/90 leading-relaxed break-words">
                        {t.text}
                      </span>
                    </li>
                  );
                })}
                {loading && (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="italic">Waiting for API response…</span>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {error && !loading && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">API request failed</div>
              <div className="mt-1 text-destructive/80 break-all">{error}</div>
            </div>
          </div>
        )}

        {(parsed || rawResponse) && !loading && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Raw response */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Raw API Response</h3>
                {parsed?.key && (
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                    {parsed.key}
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                {requestUrl && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Request
                    </div>
                    <pre className="overflow-x-auto rounded-md bg-muted/40 p-2 text-[11px] leading-relaxed text-foreground/80">
                      <code>GET {requestUrl}</code>
                    </pre>
                  </div>
                )}
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Body (text/plain)
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-muted/40 p-2 text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
                    <code>{rawResponse || "(empty)"}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Parsed Hebrew TTS */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
                <Volume2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">LLM &amp; TTS Output</h3>
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Languages className="h-3 w-3" />
                  עברית
                </span>
              </div>

              <div className="space-y-5 p-5">
                <section>
                  <div className="mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Spoken message
                    </span>
                  </div>
                  <div
                    dir="rtl"
                    lang="he"
                    className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-base leading-relaxed text-foreground"
                  >
                    {parsed?.text || "—"}
                  </div>
                </section>

                {parsed && parsed.segments.length > 1 && (
                  <>
                    <div className="h-px bg-border" />
                    <section>
                      <div className="mb-3 flex items-center gap-1.5">
                        <Navigation className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                          Step-by-step
                        </span>
                      </div>
                      <ol className="space-y-2.5" dir="rtl" lang="he">
                        {parsed.segments.map((seg, i) => (
                          <li key={i} className="flex gap-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {i + 1}
                            </div>
                            <p className="flex-1 text-sm leading-relaxed text-foreground">{seg}</p>
                          </li>
                        ))}
                      </ol>
                    </section>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
