import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dumbbell, Plus, Trash2, Trophy } from "lucide-react";
import { PageHeader, Panel } from "@/components/AppShell";
import { useStore, uid } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulados")({
  head: () => ({
    meta: [
      { title: "Simulados e TAF — PRF OPS" },
      { name: "description", content: "Notas de simulados no padrão Cebraspe e controle do Teste de Aptidão Física da PRF." },
      { property: "og:title", content: "Simulados e TAF — PRF OPS" },
      { property: "og:description", content: "Desempenho em simulados e no TAF." },
    ],
  }),
  component: Simulados,
});

function Simulados() {
  const { state, set } = useStore();
  const [f, setF] = useState({ name: "", date: new Date().toISOString().slice(0, 10), certas: 0, erradas: 0, brancos: 0, redacao: 0, posicao: 0 });
  const data = state.simulados.map((s) => ({ name: s.name.replace("Simulado ", ""), liquida: s.certas - s.erradas }));

  return (
    <>
      <PageHeader title="Simulados & TAF" subtitle="Padrão Cebraspe: uma errada anula uma certa" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Novo simulado" icon={Plus}>
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); set((s) => ({ ...s, simulados: [...s.simulados, { id: uid(), ...f, name: f.name || "Simulado" }] })); setF({ ...f, name: "", certas: 0, erradas: 0, brancos: 0 }); }}>
            <Input placeholder="Nome do simulado" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="bg-secondary" />
            <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className="bg-secondary" />
            <div className="grid grid-cols-3 gap-2">
              {(["certas", "erradas", "brancos"] as const).map((k) => <label key={k} className="text-xs capitalize text-muted-foreground">{k}<Input type="number" min={0} value={f[k]} onChange={(e) => setF({ ...f, [k]: +e.target.value })} className="mt-1 bg-secondary" /></label>)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">Redação (0-10)<Input type="number" step="0.1" value={f.redacao} onChange={(e) => setF({ ...f, redacao: +e.target.value })} className="mt-1 bg-secondary" /></label>
              <label className="text-xs text-muted-foreground">Posição estimada<Input type="number" value={f.posicao} onChange={(e) => setF({ ...f, posicao: +e.target.value })} className="mt-1 bg-secondary" /></label>
            </div>
            <div className="flex justify-between rounded-md bg-secondary/60 px-3 py-2 text-sm"><span className="text-muted-foreground">Nota líquida</span><span className="tabular font-bold">{f.certas - f.erradas}</span></div>
            <button className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-primary-foreground">Registrar</button>
          </form>
        </Panel>
        <Panel title="Evolução da nota líquida" icon={Trophy} className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={data}>
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="liquida" stroke="var(--chart-2)" strokeWidth={3} dot={{ fill: "var(--chart-2)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-widest text-muted-foreground"><th className="p-2">Simulado</th><th className="p-2 text-center">C/E/B</th><th className="p-2 text-center">Líquida</th><th className="p-2 text-center">Redação</th><th className="p-2 text-center">Posição</th><th /></tr></thead>
              <tbody>{state.simulados.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="p-2"><div>{s.name}</div><div className="text-xs text-muted-foreground">{new Date(s.date + "T12:00").toLocaleDateString("pt-BR")}</div></td>
                  <td className="tabular p-2 text-center text-xs"><span className="text-success">{s.certas}</span>/<span className="text-destructive">{s.erradas}</span>/{s.brancos}</td>
                  <td className="tabular p-2 text-center font-bold">{s.certas - s.erradas}</td>
                  <td className="tabular p-2 text-center">{s.redacao.toFixed(1)}</td>
                  <td className="tabular p-2 text-center">{s.posicao}º</td>
                  <td className="p-2"><button onClick={() => set((st) => ({ ...st, simulados: st.simulados.filter((x) => x.id !== s.id) }))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></td>
                </tr>))}</tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Controle de TAF" icon={Dumbbell} className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {state.taf.map((t) => {
            const ok = t.higherBetter ? t.current >= t.goal : t.current <= t.goal;
            const upd = (k: "goal" | "current", v: number) => set((s) => ({ ...s, taf: s.taf.map((x) => x.id === t.id ? { ...x, [k]: v } : x) }));
            return (
              <div key={t.id} className={cn("rounded-xl border p-4", ok ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10")}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>{ok ? "Aprovado" : "Reprovado"}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-[11px] text-muted-foreground">Atual ({t.unit})<Input type="number" step="0.01" value={t.current} onChange={(e) => upd("current", +e.target.value)} className="mt-1 h-8 bg-secondary tabular" /></label>
                  <label className="text-[11px] text-muted-foreground">Meta ({t.unit})<Input type="number" step="0.01" value={t.goal} onChange={(e) => upd("goal", +e.target.value)} className="mt-1 h-8 bg-secondary tabular" /></label>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{t.higherBetter ? "Mínimo exigido" : "Tempo máximo"}</p>
              </div>
            );
          })}
        </div>
      </Panel>
    </>
  );
}
