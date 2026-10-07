import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, BookX, Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/AppShell";
import { useStore, uid, pct } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/questoes")({
  head: () => ({
    meta: [
      { title: "Central de Questões — PRF OPS" },
      { name: "description", content: "Registre baterias de questões, veja seu aproveitamento e mantenha um caderno de erros." },
      { property: "og:title", content: "Central de Questões — PRF OPS" },
      { property: "og:description", content: "Baterias de questões e caderno de erros." },
    ],
  }),
  component: Questoes,
});

const sel = "h-9 w-full rounded-md border border-input bg-secondary px-3 text-sm";

function Questoes() {
  const { state, set } = useStore();
  const [f, setF] = useState({ subjectId: state.subjects[0].id, topic: state.subjects[0].topics[0].name, total: 20, correct: 14, banca: "Cebraspe" });
  const [note, setNote] = useState({ subjectId: state.subjects[0].id, text: "" });
  const sub = state.subjects.find((s) => s.id === f.subjectId)!;
  const name = (id: string) => state.subjects.find((s) => s.id === id)?.short ?? "?";

  const weak = useMemo(() => {
    const map = new Map<string, { sid: string; topic: string; c: number; t: number }>();
    state.batteries.forEach((b) => { const k = b.subjectId + b.topic; const v = map.get(k) ?? { sid: b.subjectId, topic: b.topic, c: 0, t: 0 }; v.c += b.correct; v.t += b.total; map.set(k, v); });
    return [...map.values()].filter((v) => pct(v.c, v.t) < 70).sort((a, b) => pct(a.c, a.t) - pct(b.c, b.t));
  }, [state.batteries]);

  return (
    <>
      <PageHeader title="Central de Questões" subtitle="Qconcursos · Tec Concursos · Cebraspe" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Registrar bateria" icon={Plus}>
          <form className="space-y-2" onSubmit={(e) => {
            e.preventDefault();
            if (f.correct > f.total) return toast.error("Acertos maior que o total.");
            set((s) => ({ ...s, batteries: [{ id: uid(), date: new Date().toISOString(), ...f }, ...s.batteries] }));
            toast.success(`Bateria registrada: ${pct(f.correct, f.total)}% de aproveitamento`);
          }}>
            <select className={sel} value={f.subjectId} onChange={(e) => { const s = state.subjects.find((x) => x.id === e.target.value)!; setF({ ...f, subjectId: s.id, topic: s.topics[0]?.name ?? "" }); }}>
              {state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select className={sel} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>{sub.topics.map((t) => <option key={t.id}>{t.name}</option>)}</select>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-muted-foreground">Questões<Input type="number" min={1} value={f.total} onChange={(e) => setF({ ...f, total: +e.target.value })} className="mt-1 bg-secondary" /></label>
              <label className="text-xs text-muted-foreground">Acertos<Input type="number" min={0} value={f.correct} onChange={(e) => setF({ ...f, correct: +e.target.value })} className="mt-1 bg-secondary" /></label>
              <label className="text-xs text-muted-foreground">Erros<Input disabled value={Math.max(0, f.total - f.correct)} className="mt-1 bg-secondary" /></label>
            </div>
            <select className={sel} value={f.banca} onChange={(e) => setF({ ...f, banca: e.target.value })}>{["Cebraspe", "Cespe", "FGV", "Outra"].map((b) => <option key={b}>{b}</option>)}</select>
            <div className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Aproveitamento</span>
              <span className={cn("tabular font-bold", pct(f.correct, f.total) < 70 ? "text-destructive" : "text-success")}>{pct(f.correct, f.total)}%</span>
            </div>
            <button className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-primary-foreground">Salvar bateria</button>
          </form>
        </Panel>

        <Panel title="Alerta: abaixo de 70%" icon={AlertTriangle} className="lg:col-span-2">
          {weak.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum tópico abaixo da meta. Excelente!</p> : (
            <div className="grid gap-2 sm:grid-cols-2">
              {weak.map((w) => (
                <div key={w.sid + w.topic} className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <div className="min-w-0"><div className="text-[11px] font-bold text-destructive">{name(w.sid)}</div><div className="truncate text-sm">{w.topic}</div></div>
                  <span className="tabular text-lg font-bold text-destructive">{pct(w.c, w.t)}%</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Histórico de baterias" icon={Target} className="lg:col-span-2">
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card"><tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground"><th className="p-2">Data</th><th className="p-2">Matéria / tópico</th><th className="p-2 text-center">Q</th><th className="p-2 text-center">✓</th><th className="p-2 text-center">✗</th><th className="p-2 text-right">%</th><th /></tr></thead>
              <tbody>
                {state.batteries.map((b) => { const p = pct(b.correct, b.total); return (
                  <tr key={b.id} className="border-t border-border/60">
                    <td className="p-2 text-xs text-muted-foreground">{new Date(b.date).toLocaleDateString("pt-BR")}</td>
                    <td className="p-2"><span className="mr-2 font-mono text-[11px] text-primary">{name(b.subjectId)}</span>{b.topic}<Badge variant="outline" className="ml-2 text-[10px]">{b.banca}</Badge></td>
                    <td className="tabular p-2 text-center">{b.total}</td><td className="tabular p-2 text-center text-success">{b.correct}</td><td className="tabular p-2 text-center text-destructive">{b.total - b.correct}</td>
                    <td className="p-2 text-right"><span className={cn("tabular rounded px-2 py-0.5 text-xs font-bold", p < 70 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success")}>{p}%</span></td>
                    <td className="p-2"><button onClick={() => set((s) => ({ ...s, batteries: s.batteries.filter((x) => x.id !== b.id) }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Caderno de erros" icon={BookX}>
          <form className="mb-3 space-y-2" onSubmit={(e) => { e.preventDefault(); if (!note.text.trim()) return; set((s) => ({ ...s, notes: [{ id: uid(), date: new Date().toISOString(), ...note }, ...s.notes] })); setNote({ ...note, text: "" }); }}>
            <select className={sel} value={note.subjectId} onChange={(e) => setNote({ ...note, subjectId: e.target.value })}>{state.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <Textarea value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} placeholder="Pegadinha, erro ou macete…" className="bg-secondary" rows={3} />
            <button className="w-full rounded-md bg-primary py-2 text-sm text-primary-foreground">Anotar</button>
          </form>
          <div className="max-h-[300px] space-y-2 overflow-auto">
            {state.notes.map((n) => (
              <div key={n.id} className="group rounded-lg border-l-2 border-warning bg-secondary/50 p-3 text-sm">
                <div className="mb-1 flex justify-between text-[11px]"><span className="font-bold text-warning">{name(n.subjectId)}</span>
                  <button onClick={() => set((s) => ({ ...s, notes: s.notes.filter((x) => x.id !== n.id) }))} className="opacity-0 group-hover:opacity-100"><Trash2 className="size-3.5" /></button></div>
                {n.text}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
