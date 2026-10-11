import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel } from "@/components/AppShell";
import { useStore, fmtH, subjectProgress, pct } from "@/lib/store";

export const Route = createFileRoute("/estatisticas")({
  head: () => ({
    meta: [
      { title: "Estatísticas — PRF OPS" },
      { name: "description", content: "Gráficos de horas estudadas, tempo por disciplina, edital e acertos." },
      { property: "og:title", content: "Estatísticas — PRF OPS" },
      { property: "og:description", content: "Seus números de estudo em detalhe." },
    ],
  }),
  component: Stats,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 };

function Stats() {
  const { state } = useStore();
  const m = useMemo(() => {
    const now = new Date(); const day = (d: Date) => d.toDateString();
    const sum = (f: (d: Date) => boolean) => state.sessions.filter((s) => f(new Date(s.date))).reduce((a, s) => a + s.minutes, 0);
    const days = new Set(state.sessions.map((s) => day(new Date(s.date))));
    let streak = 0; const c = new Date();
    if (!days.has(day(c))) c.setDate(c.getDate() - 1);
    while (days.has(day(c))) { streak++; c.setDate(c.getDate() - 1); }
    const q = state.batteries.reduce((a, b) => [a[0] + b.correct, a[1] + b.total], [0, 0]);
    const bySub = state.subjects.map((s) => ({ name: s.short, value: state.sessions.filter((x) => x.subjectId === s.id).reduce((a, x) => a + x.minutes, 0) })).filter((x) => x.value).sort((a, b) => b.value - a.value);
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { name: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""), horas: +(sum((x) => day(x) === day(d)) / 60).toFixed(1) };
    });
    return {
      week: sum((d) => now.getTime() - d.getTime() < 7 * 864e5), month: sum((d) => d.getMonth() === now.getMonth()), total: sum(() => true), streak,
      edital: Math.round(state.subjects.reduce((a, s) => a + subjectProgress(s), 0) / state.subjects.length), acc: pct(q[0], q[1]), bySub, last7,
    };
  }, [state]);

  const stats = [["Semana", fmtH(m.week)], ["Mês", fmtH(m.month)], ["Total", fmtH(m.total)], ["Sequência", `${m.streak} dias`], ["Edital", `${m.edital}%`], ["Acertos", `${m.acc}%`]];
  return (
    <>
      <PageHeader title="Estatísticas" subtitle="Os números completos, longe da tela de foco." />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(([l, v]) => <div key={l} className="glass p-5"><div className="text-xs uppercase tracking-widest text-muted-foreground">{l}</div><div className="tabular mt-2 text-2xl font-bold">{v}</div></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Tempo por disciplina" className="lg:col-span-2">
          <div className="h-64"><ResponsiveContainer><PieChart>
            <Pie data={m.bySub} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">{m.bySub.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
            <Tooltip formatter={(v: number) => fmtH(v)} contentStyle={tip} itemStyle={{ color: "var(--foreground)" }} />
          </PieChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Últimos 7 dias (horas)" className="lg:col-span-3">
          <div className="h-64"><ResponsiveContainer><BarChart data={m.last7}>
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={28} />
            <Tooltip cursor={{ fill: "var(--accent)" }} contentStyle={tip} />
            <Bar dataKey="horas" radius={[6, 6, 0, 0]} fill="var(--chart-1)" />
          </BarChart></ResponsiveContainer></div>
        </Panel>
      </div>
    </>
  );
}
