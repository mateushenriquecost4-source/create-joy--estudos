import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Plus, Repeat, X } from "lucide-react";
import { PageHeader, Panel } from "@/components/AppShell";
import { useStore, uid, type CalEvent } from "@/lib/store";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planejamento")({
  head: () => ({
    meta: [
      { title: "Planejamento e Ciclo — PRF OPS" },
      { name: "description", content: "Ciclo de estudos por peso e dificuldade, e calendário semanal de revisões e simulados." },
      { property: "og:title", content: "Planejamento e Ciclo — PRF OPS" },
      { property: "og:description", content: "Monte seu ciclo de estudos da PRF." },
    ],
  }),
  component: Plan,
});

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const kindCls: Record<CalEvent["kind"], string> = { Estudo: "border-primary/50 bg-primary/15", Revisão: "border-success/50 bg-success/15", Simulado: "border-warning/50 bg-warning/15" };

function Plan() {
  const { state, set } = useStore();
  const [hours, setHours] = useState(30);
  const [ev, setEv] = useState({ day: 1, title: "", kind: "Estudo" as CalEvent["kind"] });
  const scores = state.subjects.map((s) => ({ s, score: s.weight * s.difficulty }));
  const total = scores.reduce((a, x) => a + x.score, 0);
  const upd = (id: string, k: "weight" | "difficulty", v: number) => set((st) => ({ ...st, subjects: st.subjects.map((x) => x.id === id ? { ...x, [k]: v } : x) }));

  return (
    <>
      <PageHeader title="Planejamento" subtitle="Ciclo de estudos e agenda semanal" />
      <Panel title="Matriz do ciclo (peso × dificuldade)" icon={Repeat} action={
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Horas/ciclo<Input type="number" value={hours} onChange={(e) => setHours(+e.target.value)} className="h-8 w-20 bg-secondary" /></label>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground"><th className="p-2">Disciplina</th><th className="p-2">Peso no edital</th><th className="p-2">Dificuldade</th><th className="p-2 text-right">Tempo no ciclo</th></tr></thead>
            <tbody>
              {scores.map(({ s, score }) => { const share = score / total; return (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2"><div className="flex items-center gap-3"><Slider min={1} max={5} step={1} value={[s.weight]} onValueChange={([v]) => upd(s.id, "weight", v)} className="w-28" /><span className="tabular w-4">{s.weight}</span></div></td>
                  <td className="p-2"><div className="flex items-center gap-3"><Slider min={1} max={5} step={1} value={[s.difficulty]} onValueChange={([v]) => upd(s.id, "difficulty", v)} className="w-28" /><span className="tabular w-4">{s.difficulty}</span></div></td>
                  <td className="p-2 text-right"><div className="ml-auto flex items-center justify-end gap-2"><div className="h-1.5 w-24 overflow-hidden rounded bg-muted"><div className="h-full bg-brand" style={{ width: `${share * 100 * 3}%` }} /></div><span className="tabular w-14">{(share * hours).toFixed(1)}h</span></div></td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Calendário semanal" icon={CalendarDays} className="mt-4">
        <form className="mb-4 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (!ev.title.trim()) return; set((s) => ({ ...s, events: [...s.events, { id: uid(), ...ev }] })); setEv({ ...ev, title: "" }); }}>
          <select value={ev.day} onChange={(e) => setEv({ ...ev, day: +e.target.value })} className="h-9 rounded-md border border-input bg-secondary px-2 text-sm">{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          <select value={ev.kind} onChange={(e) => setEv({ ...ev, kind: e.target.value as CalEvent["kind"] })} className="h-9 rounded-md border border-input bg-secondary px-2 text-sm">{["Estudo", "Revisão", "Simulado"].map((k) => <option key={k}>{k}</option>)}</select>
          <Input value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} placeholder="Ex.: Revisão 7d CTB" className="min-w-48 flex-1 bg-secondary" />
          <button className="flex items-center gap-1 rounded-md bg-primary px-3 text-sm text-primary-foreground"><Plus className="size-4" />Agendar</button>
        </form>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <div key={d} className={cn("min-h-40 rounded-lg border border-border p-2", (d === 0 || d === 6) && "bg-warning/5")}>
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{DAYS[d]}</div>
              <div className="space-y-1.5">
                {state.events.filter((e) => e.day === d).map((e) => (
                  <div key={e.id} className={cn("group flex items-start justify-between gap-1 rounded-md border px-2 py-1.5 text-xs", kindCls[e.kind])}>
                    <span>{e.title}</span>
                    <button onClick={() => set((s) => ({ ...s, events: s.events.filter((x) => x.id !== e.id) }))} className="opacity-0 group-hover:opacity-100"><X className="size-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
