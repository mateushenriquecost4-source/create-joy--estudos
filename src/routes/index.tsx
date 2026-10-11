import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Square, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useStore, uid, fmtH, pct, courseProgress, type StudyType } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoje — PRF OPS" },
      { name: "description", content: "Foco do dia: cronômetro, meta de horas, próximas atividades e desempenho em questões." },
      { property: "og:title", content: "Hoje — PRF OPS" },
      { property: "og:description", content: "Painel de foco diário para PRF e Gestão Financeira." },
    ],
  }),
  component: Today,
});

const sel = "h-10 w-full rounded-lg border border-input bg-secondary/60 px-3 text-sm";
type Ctx = "prf" | "fac";

function Ring({ value, size = 120, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = 50 - stroke / 2; const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} className="transition-all duration-1000" />
      </svg>
      <div className="text-center">{children}</div>
    </div>
  );
}

function Focus() {
  const { state, set } = useStore();
  const [ctx, setCtx] = useState<Ctx>("prf");
  const [mode, setMode] = useState<"pomodoro" | "livre">("pomodoro");
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(0);
  const [subjectId, setSubjectId] = useState(state.subjects[0].id);
  const subject = state.subjects.find((s) => s.id === subjectId) ?? state.subjects[0];
  const active = state.faculdade.disciplines.filter((d) => d.status === "Em andamento");
  const [discId, setDiscId] = useState(active[0]?.id ?? "");
  const [type, setType] = useState<StudyType>("Teoria");
  const POMO = 25 * 60;

  useEffect(() => { if (!running) return; const t = setInterval(() => setSecs((x) => x + 1), 1000); return () => clearInterval(t); }, [running]);
  useEffect(() => { if (mode === "pomodoro" && secs >= POMO && running) { setRunning(false); toast.success("Pomodoro concluído! Pausa de 5 min."); save(); } }, [secs]); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    const minutes = Math.round(secs / 60);
    if (minutes < 1) { setSecs(0); return toast("Sessão muito curta para registrar."); }
    if (ctx === "prf") set((s) => ({ ...s, sessions: [...s.sessions, { id: uid(), date: new Date().toISOString(), subjectId, topic: subject.topics[0].name, type, minutes }] }));
    else set((s) => ({ ...s, sessions: [...s.sessions, { id: uid(), date: new Date().toISOString(), subjectId: "fac:" + discId, topic: active.find((d) => d.id === discId)?.name ?? "Faculdade", type: "Teoria", minutes }] }));
    toast.success(`${minutes} min registrados`);
    setSecs(0); setRunning(false);
  }
  const shown = mode === "pomodoro" ? Math.max(0, POMO - secs) : secs;
  const hh = Math.floor(shown / 3600), mm = Math.floor(shown / 60) % 60, ss = shown % 60;

  return (
    <section className="glass flex flex-col items-center gap-8 px-6 py-10 md:py-14">
      <div className="flex rounded-full bg-secondary p-1 text-sm">
        {([["prf", "🛡️ Estudar para PRF"], ["fac", "🎓 Estudar para Faculdade"]] as const).map(([k, l]) => (
          <button key={k} disabled={running} onClick={() => setCtx(k)} className={cn("rounded-full px-4 py-2 font-medium transition", ctx === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{l}</button>
        ))}
      </div>
      <div className="text-center">
        <div className="tabular text-7xl font-bold tracking-tight md:text-8xl">{hh > 0 && `${hh}:`}{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}</div>
        <div className="mt-3 flex justify-center gap-4 text-xs uppercase tracking-widest">
          {(["pomodoro", "livre"] as const).map((m) => <button key={m} disabled={running} onClick={() => { setMode(m); setSecs(0); }} className={mode === m ? "text-primary" : "text-muted-foreground hover:text-foreground"}>{m}</button>)}
        </div>
      </div>
      <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
        {ctx === "prf" ? (<>
          <select className={sel} value={subjectId} disabled={running} onChange={(e) => setSubjectId(e.target.value)}>{state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <select className={sel} value={type} disabled={running} onChange={(e) => setType(e.target.value as StudyType)}>{["Teoria", "Questões", "Revisão", "Leitura da Lei"].map((t) => <option key={t}>{t}</option>)}</select>
        </>) : (
          <select className={cn(sel, "sm:col-span-2")} value={discId} disabled={running} onChange={(e) => setDiscId(e.target.value)}>{active.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setRunning(!running)} className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          {running ? <><Pause className="size-4" /> Pausar</> : <><Play className="size-4" /> {secs ? "Retomar" : "Iniciar foco"}</>}
        </button>
        <button onClick={save} disabled={!secs} className="flex items-center gap-2 rounded-full border border-border px-6 text-sm disabled:opacity-30"><Square className="size-4" /> Salvar</button>
      </div>
    </section>
  );
}

function Today() {
  const { state } = useStore();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const m = useMemo(() => {
    const d = new Date(); const day = (x: Date) => x.toDateString();
    const today = state.sessions.filter((s) => day(new Date(s.date)) === day(d)).reduce((a, s) => a + s.minutes, 0);
    const wk = state.batteries.filter((b) => d.getTime() - new Date(b.date).getTime() < 7 * 864e5);
    const q = (wk.length ? wk : state.batteries).reduce((a, b) => [a[0] + b.correct, a[1] + b.total], [0, 0]);
    const todayEvents = state.events.filter((e) => e.day === d.getDay()).map((e) => ({ id: e.id, title: e.title, tag: e.kind }));
    const facDue = state.faculdade.disciplines.flatMap((x) => x.assessments.filter((a) => !a.submitted).map((a) => ({ id: a.id, title: `${a.title} · ${x.name}`, tag: new Date(a.due + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }), due: a.due })))
      .sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
    return { today, acc: pct(q[0], q[1]), qTotal: q[1], items: [...todayEvents, ...facDue].slice(0, 5) };
  }, [state]);
  const days = now ? Math.max(0, Math.ceil((new Date(state.examDate + "T08:00").getTime() - now.getTime()) / 864e5)) : 0;
  const course = courseProgress(state.faculdade, now ?? new Date());
  const hour = now?.getHours() ?? 9;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize text-muted-foreground">{now?.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) ?? "…"}</span>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">{hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"}, Mateus.</h1>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span>🚔 Prova PRF: <strong className="tabular text-foreground">{days}</strong> dias</span>
          <span>🎓 Tecnólogo: <strong className="tabular text-foreground">{course.monthsLeft}</strong> meses</span>
        </div>
      </header>

      <Focus />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass flex items-center gap-5 p-6">
          <Ring value={m.today / state.dailyGoalMin}><div className="tabular text-xl font-bold">{pct(m.today, state.dailyGoalMin)}%</div></Ring>
          <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Meta diária</div><div className="tabular mt-1 text-2xl font-bold">{fmtH(m.today)}</div><div className="text-sm text-muted-foreground">de {fmtH(state.dailyGoalMin)}</div></div>
        </div>
        <div className="glass p-6">
          <div className="mb-4 flex items-center justify-between"><span className="text-xs uppercase tracking-widest text-muted-foreground">Próximas atividades</span><Link to="/planejamento" className="text-muted-foreground hover:text-primary"><ArrowRight className="size-4" /></Link></div>
          <ul className="space-y-3">
            {m.items.length ? m.items.map((i) => <li key={i.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{i.title}</span><span className="shrink-0 text-xs text-muted-foreground">{i.tag}</span></li>) : <li className="text-sm text-muted-foreground">Nada agendado hoje.</li>}
          </ul>
        </div>
        <div className="glass p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Questões da semana</div>
          <div className={cn("tabular mt-3 text-5xl font-bold", m.acc >= 70 ? "text-success" : "text-warning")}>{m.acc}%</div>
          <div className="mt-1 text-sm text-muted-foreground">{m.qTotal} questões resolvidas</div>
          <Link to="/estatisticas" className="mt-4 inline-flex items-center gap-1 text-sm text-primary">Ver estatísticas <ArrowRight className="size-3" /></Link>
        </div>
      </div>
    </div>
  );
}
