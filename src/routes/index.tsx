import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Clock, Flame, Target, ListChecks, Play, Pause, Square, Timer, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/AppShell";
import { useStore, uid, fmtH, subjectProgress, pct, type StudyType } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PRF OPS" },
      { name: "description", content: "Visão geral dos estudos para a PRF: horas, edital, acertos e sequência." },
      { property: "og:title", content: "Dashboard — PRF OPS" },
      { property: "og:description", content: "Visão geral dos estudos para a PRF." },
    ],
  }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.5 0.08 250)", "oklch(0.45 0.08 165)"];
const sel = "h-9 w-full rounded-md border border-input bg-secondary px-3 text-sm";

function Countdown() {
  const { state, set } = useStore();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = now ? Math.max(0, new Date(state.examDate + "T08:00:00").getTime() - now) : 0;
  const parts = [["dias", Math.floor(diff / 864e5)], ["horas", Math.floor(diff / 36e5) % 24], ["min", Math.floor(diff / 6e4) % 60], ["seg", Math.floor(diff / 1e3) % 60]] as const;
  return (
    <Panel title="Contagem para a prova" icon={CalendarClock} className="lg:col-span-2"
      action={<Input type="date" value={state.examDate} onChange={(e) => set((s) => ({ ...s, examDate: e.target.value }))} className="h-8 w-40 bg-secondary text-xs" />}>
      <div className="grid grid-cols-4 gap-3">
        {parts.map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
            <div className="tabular text-3xl font-bold md:text-5xl">{String(v).padStart(2, "0")}</div>
            <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StudyTimer() {
  const { state, set } = useStore();
  const [mode, setMode] = useState<"pomodoro" | "livre">("pomodoro");
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(0);
  const [subjectId, setSubjectId] = useState(state.subjects[0].id);
  const subject = state.subjects.find((s) => s.id === subjectId) ?? state.subjects[0];
  const [topic, setTopic] = useState(subject.topics[0].name);
  const [type, setType] = useState<StudyType>("Teoria");
  const POMO = 25 * 60;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (mode === "pomodoro" && secs >= POMO && running) { setRunning(false); toast.success("Pomodoro concluído! Faça uma pausa de 5 min."); save(); }
  }, [secs]); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    const minutes = Math.round(secs / 60);
    if (minutes < 1) { setSecs(0); return toast("Sessão muito curta para registrar."); }
    set((s) => ({ ...s, sessions: [...s.sessions, { id: uid(), date: new Date().toISOString(), subjectId, topic, type, minutes }] }));
    toast.success(`${minutes} min de ${subject.short} registrados`);
    setSecs(0); setRunning(false);
  }
  const shown = mode === "pomodoro" ? Math.max(0, POMO - secs) : secs;
  const hh = Math.floor(shown / 3600), mm = Math.floor(shown / 60) % 60, ss = shown % 60;
  const progress = mode === "pomodoro" ? secs / POMO : (secs % 3600) / 3600;

  return (
    <Panel title="Módulo de estudo" icon={Timer} className="lg:row-span-2"
      action={<div className="flex rounded-md bg-secondary p-0.5 text-xs">
        {(["pomodoro", "livre"] as const).map((m) => <button key={m} disabled={running} onClick={() => { setMode(m); setSecs(0); }} className={cn("rounded px-2.5 py-1 capitalize", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{m}</button>)}
      </div>}>
      <div className="relative mx-auto my-2 grid size-48 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--muted)" strokeWidth="5" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#g)" strokeWidth="5" strokeLinecap="round" strokeDasharray={283} strokeDashoffset={283 * (1 - progress)} className="transition-all duration-1000" />
          <defs><linearGradient id="g"><stop offset="0" stopColor="var(--chart-1)" /><stop offset="1" stopColor="var(--chart-2)" /></linearGradient></defs>
        </svg>
        <div className="text-center">
          <div className="tabular text-4xl font-bold">{hh > 0 && `${hh}:`}{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{running ? "em foco" : "pronto"}</div>
        </div>
      </div>
      <div className="space-y-2">
        <select className={sel} value={subjectId} disabled={running} onChange={(e) => { setSubjectId(e.target.value); const s = state.subjects.find((x) => x.id === e.target.value)!; setTopic(s.topics[0].name); }}>
          {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={sel} value={topic} disabled={running} onChange={(e) => setTopic(e.target.value)}>
          {subject.topics.map((t) => <option key={t.id}>{t.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-1.5">
          {(["Teoria", "Questões", "Revisão", "Leitura da Lei"] as StudyType[]).map((t) => (
            <button key={t} disabled={running} onClick={() => setType(t)} className={cn("rounded-md border px-2 py-1.5 text-xs", type === t ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground")}>{t}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => setRunning(!running)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          {running ? <><Pause className="size-4" /> Pausar</> : <><Play className="size-4" /> {secs ? "Retomar" : "Iniciar"}</>}
        </button>
        <button onClick={save} disabled={!secs} className="flex items-center gap-2 rounded-lg border border-border px-4 text-sm disabled:opacity-40"><Square className="size-4" /> Salvar</button>
      </div>
    </Panel>
  );
}

function Stat({ icon: Icon, label, value, hint, tone = "primary" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint?: string; tone?: "primary" | "success" | "warning" }) {
  const c = { primary: "text-primary bg-primary/15", success: "text-success bg-success/15", warning: "text-warning bg-warning/15" }[tone];
  return (
    <div className="glass p-4 transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-md", c)}><Icon className="size-4" /></span>
      </div>
      <div className="tabular mt-2 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Dashboard() {
  const { state } = useStore();
  const m = useMemo(() => {
    const now = new Date(); const day = (d: Date) => d.toDateString();
    const sum = (f: (d: Date) => boolean) => state.sessions.filter((s) => f(new Date(s.date))).reduce((a, s) => a + s.minutes, 0);
    const today = sum((d) => day(d) === day(now));
    const week = sum((d) => now.getTime() - d.getTime() < 7 * 864e5);
    const month = sum((d) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear());
    const total = sum(() => true);
    const days = new Set(state.sessions.map((s) => day(new Date(s.date))));
    let streak = 0; const c = new Date();
    if (!days.has(day(c))) c.setDate(c.getDate() - 1);
    while (days.has(day(c))) { streak++; c.setDate(c.getDate() - 1); }
    const edital = Math.round(state.subjects.reduce((a, s) => a + subjectProgress(s), 0) / state.subjects.length);
    const q = state.batteries.reduce((a, b) => [a[0] + b.correct, a[1] + b.total], [0, 0]);
    const bySub = state.subjects.map((s) => ({ name: s.short, value: state.sessions.filter((x) => x.subjectId === s.id).reduce((a, x) => a + x.minutes, 0) })).filter((x) => x.value).sort((a, b) => b.value - a.value);
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { name: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""), horas: +(state.sessions.filter((s) => day(new Date(s.date)) === day(d)).reduce((a, s) => a + s.minutes, 0) / 60).toFixed(1) };
    });
    return { today, week, month, total, streak, edital, acc: pct(q[0], q[1]), qTotal: q[1], bySub, last7 };
  }, [state]);

  return (
    <>
      <PageHeader title="Visão Geral" subtitle="Disciplina é o que te leva à farda." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Countdown />
        <StudyTimer />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2 xl:grid-cols-4">
          <Stat icon={Clock} label="Hoje" value={fmtH(m.today)} hint={`Semana ${fmtH(m.week)} · Mês ${fmtH(m.month)}`} />
          <Stat icon={Clock} label="Total líquido" value={fmtH(m.total)} hint={`${state.sessions.length} sessões`} />
          <Stat icon={ListChecks} label="Edital" value={`${m.edital}%`} hint="verticalizado concluído" tone="success" />
          <Stat icon={Target} label="Acertos" value={`${m.acc}%`} hint={`${m.qTotal} questões`} tone={m.acc >= 70 ? "success" : "warning"} />
          <Stat icon={Flame} label="Streak" value={`${m.streak} dias`} hint="sequência atual" tone="warning" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title="Tempo por disciplina" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={m.bySub} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
                  {m.bySub.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtH(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} itemStyle={{ color: "var(--foreground)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {m.bySub.map((s, i) => <span key={s.name} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.name}</span>)}
          </div>
        </Panel>
        <Panel title="Últimos 7 dias (horas)" className="lg:col-span-3">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={m.last7}>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={28} />
                <Tooltip cursor={{ fill: "var(--accent)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="horas" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}
