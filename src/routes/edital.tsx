import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useStore, subjectProgress, uid, type Topic } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/edital")({
  head: () => ({
    meta: [
      { title: "Edital Verticalizado — PRF OPS" },
      { name: "description", content: "Edital verticalizado da PRF com teoria, questões e revisões por tópico." },
      { property: "og:title", content: "Edital Verticalizado — PRF OPS" },
      { property: "og:description", content: "Acompanhe cada tópico do edital da PRF." },
    ],
  }),
  component: Edital,
});

const flags: [keyof Topic, string][] = [["teoria", "Teoria"], ["questoes", "Questões"], ["r24", "Rev 24h"], ["r7", "Rev 7d"], ["r30", "Rev 30d"]];

function Edital() {
  const { state, set } = useStore();
  const [open, setOpen] = useState<string | null>(state.subjects[0].id);
  const [newTopic, setNewTopic] = useState("");

  const upd = (sid: string, tid: string, patch: Partial<Topic>) =>
    set((s) => ({ ...s, subjects: s.subjects.map((x) => x.id !== sid ? x : { ...x, topics: x.topics.map((t) => t.id === tid ? { ...t, ...patch } : t) }) }));

  return (
    <>
      <PageHeader title="Edital Verticalizado" subtitle="Último edital PRF · Cebraspe" />
      <div className="space-y-3">
        {state.subjects.map((s) => {
          const p = subjectProgress(s); const isOpen = open === s.id;
          return (
            <div key={s.id} className="glass overflow-hidden">
              <button onClick={() => setOpen(isOpen ? null : s.id)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-accent/30">
                <span className="w-16 shrink-0 rounded bg-primary/15 py-1 text-center font-mono text-[11px] font-bold text-primary">{s.short}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.topics.filter((t) => t.teoria).length}/{s.topics.length} tópicos lidos</div>
                </div>
                <div className="hidden w-48 items-center gap-3 sm:flex"><Progress value={p} className="h-2" /><span className="tabular w-10 text-right text-sm">{p}%</span></div>
                <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="border-t border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead><tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                        <th className="p-3">Tópico</th>{flags.map(([, l]) => <th key={l} className="p-3 text-center">{l}</th>)}<th className="p-3 text-center">% Acertos</th><th />
                      </tr></thead>
                      <tbody>
                        {s.topics.map((t) => (
                          <tr key={t.id} className="border-t border-border/60 hover:bg-accent/20">
                            <td className="p-3">{t.name}</td>
                            {flags.map(([k]) => <td key={k} className="p-3 text-center"><Checkbox checked={!!t[k]} onCheckedChange={(v) => upd(s.id, t.id, { [k]: !!v })} /></td>)}
                            <td className="p-3 text-center">
                              <Input type="number" min={0} max={100} value={t.acertos} onChange={(e) => upd(s.id, t.id, { acertos: Math.min(100, +e.target.value) })}
                                className={cn("mx-auto h-8 w-16 bg-secondary text-center tabular", t.questoes && t.acertos < 70 && "border-destructive text-destructive")} />
                            </td>
                            <td className="p-3"><button onClick={() => set((st) => ({ ...st, subjects: st.subjects.map((x) => x.id !== s.id ? x : { ...x, topics: x.topics.filter((y) => y.id !== t.id) }) }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); if (!newTopic.trim()) return; set((st) => ({ ...st, subjects: st.subjects.map((x) => x.id !== s.id ? x : { ...x, topics: [...x.topics, { id: uid(), name: newTopic.trim(), teoria: false, questoes: false, acertos: 0, r24: false, r7: false, r30: false }] }) })); setNewTopic(""); }}>
                    <Input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Novo tópico…" className="bg-secondary" />
                    <button className="flex items-center gap-1 rounded-md bg-primary px-3 text-sm text-primary-foreground"><Plus className="size-4" />Adicionar</button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
