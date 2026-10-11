import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ExternalLink, FileText, Link2, PlayCircle, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useStore, uid, courseProgress, gpa, type DiscStatus, type Discipline, type Assessment, type CourseLink } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/faculdade")({
  head: () => ({
    meta: [
      { title: "Gestão Financeira (Graduação) — PRF OPS" },
      { name: "description", content: "Acompanhe o Tecnólogo em Gestão Financeira: semestres, disciplinas, trabalhos, provas e média." },
      { property: "og:title", content: "Gestão Financeira (Graduação) — PRF OPS" },
      { property: "og:description", content: "Linha do tempo de 18 meses, disciplinas e notas do tecnólogo." },
    ],
  }),
  component: Faculdade,
});

const STATUS: DiscStatus[] = ["A Fazer", "Em andamento", "Concluída"];
const tone: Record<DiscStatus, string> = { "A Fazer": "bg-secondary text-muted-foreground", "Em andamento": "bg-primary/15 text-primary", "Concluída": "bg-success/15 text-success" };

function Faculdade() {
  const { state, set } = useStore();
  const f = state.faculdade;
  const c = courseProgress(f);
  const [sem, setSem] = useState<1 | 2 | 3>(() => (f.disciplines.find((d) => d.status === "Em andamento")?.semester ?? 1));
  const done = f.disciplines.filter((d) => d.status === "Concluída").length;
  const upd = (fn: (d: Discipline[]) => Discipline[]) => set((s) => ({ ...s, faculdade: { ...s.faculdade, disciplines: fn(s.faculdade.disciplines) } }));
  const setLinks = (fn: (l: CourseLink[]) => CourseLink[]) => set((s) => ({ ...s, faculdade: { ...s.faculdade, links: fn(s.faculdade.links) } }));

  return (
    <>
      <PageHeader title="Gestão Financeira" subtitle="Tecnólogo · 18 meses · 3 semestres">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Início <Input type="date" value={f.startDate} onChange={(e) => set((s) => ({ ...s, faculdade: { ...s.faculdade, startDate: e.target.value } }))} className="h-9 w-40 bg-secondary" /></label>
      </PageHeader>

      <section className="glass mb-8 p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Progresso do curso</div><div className="tabular mt-1 text-5xl font-bold">{c.pct}%</div></div>
          <div className="flex gap-10 text-sm">
            <div><div className="tabular text-2xl font-bold">{c.monthsLeft}</div><div className="text-muted-foreground">meses restantes</div></div>
            <div><div className="tabular text-2xl font-bold">{gpa(f).toFixed(2)}</div><div className="text-muted-foreground">média (CR)</div></div>
            <div><div className="tabular text-2xl font-bold">{done}/{f.disciplines.length}</div><div className="text-muted-foreground">disciplinas</div></div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map((s) => {
            const fill = Math.min(1, Math.max(0, (c.pct / 100) * 3 - (s - 1)));
            return (
              <button key={s} onClick={() => setSem(s)} className="text-left">
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${fill * 100}%` }} /></div>
                <div className={cn("mt-2 text-sm", sem === s ? "font-semibold text-foreground" : "text-muted-foreground")}>{s}º Semestre</div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {[1, 2].map((mod) => {
            const list = f.disciplines.filter((d) => d.semester === sem && d.module === mod);
            if (!list.length) return null;
            return (
              <div key={mod}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{sem}º Semestre · Módulo {mod}</h2>
                <div className="space-y-3">{list.map((d) => <DisciplineRow key={d.id} d={d} upd={upd} />)}</div>
              </div>
            );
          })}
        </div>
        <aside className="glass h-fit p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Links rápidos</h2>
          <ul className="space-y-2">
            {f.links.map((l) => {
              const Icon = l.kind === "PDF" ? FileText : l.kind === "Aula" ? PlayCircle : Link2;
              return (
                <li key={l.id} className="group flex items-center gap-3 text-sm">
                  <Icon className="size-4 shrink-0 text-primary" />
                  <a href={l.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:text-primary">{l.label}</a>
                  <button onClick={() => setLinks((x) => x.filter((y) => y.id !== l.id))} className="opacity-0 group-hover:opacity-100"><Trash2 className="size-3.5 text-muted-foreground" /></button>
                </li>
              );
            })}
          </ul>
          <LinkForm onAdd={(l) => setLinks((x) => [...x, l])} />
        </aside>
      </div>
    </>
  );
}

function LinkForm({ onAdd }: { onAdd: (l: CourseLink) => void }) {
  const [label, setLabel] = useState(""); const [url, setUrl] = useState(""); const [kind, setKind] = useState<CourseLink["kind"]>("Aula");
  return (
    <form className="mt-5 space-y-2 border-t border-border pt-5" onSubmit={(e) => { e.preventDefault(); if (!label || !url) return; onAdd({ id: uid(), label, url, kind }); setLabel(""); setUrl(""); }}>
      <Input placeholder="Nome" value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 bg-secondary" />
      <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} className="h-9 bg-secondary" />
      <div className="flex gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as CourseLink["kind"])} className="h-9 flex-1 rounded-md border border-input bg-secondary px-2 text-sm">{["Aula", "PDF", "Portal"].map((k) => <option key={k}>{k}</option>)}</select>
        <button className="flex items-center gap-1 rounded-md bg-primary px-3 text-sm text-primary-foreground"><Plus className="size-4" /> Adicionar</button>
      </div>
    </form>
  );
}

function DisciplineRow({ d, upd }: { d: Discipline; upd: (fn: (d: Discipline[]) => Discipline[]) => void }) {
  const [open, setOpen] = useState(d.status === "Em andamento");
  const patch = (p: Partial<Discipline>) => upd((all) => all.map((x) => (x.id === d.id ? { ...x, ...p } : x)));
  const patchA = (id: string, p: Partial<Assessment>) => patch({ assessments: d.assessments.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  const grades = d.assessments.map((a) => a.grade).filter((g): g is number => g !== null);
  const avg = grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : "–";
  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => setOpen(!open)} className="flex flex-1 items-center gap-3 text-left">
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
          <span className="font-medium">{d.name}</span>
        </button>
        <span className="tabular text-sm text-muted-foreground">{avg}</span>
        <select value={d.status} onChange={(e) => patch({ status: e.target.value as DiscStatus })} className={cn("rounded-full border-0 px-3 py-1 text-xs font-medium", tone[d.status])}>
          {STATUS.map((s) => <option key={s} className="bg-popover text-foreground">{s}</option>)}
        </select>
      </div>
      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {d.assessments.length === 0 && <p className="py-2 text-sm text-muted-foreground">Nenhuma avaliação cadastrada.</p>}
          {d.assessments.map((a) => (
            <div key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 text-sm sm:grid-cols-[1fr_130px_80px_110px_24px]">
              <div><div>{a.title}</div><div className="text-xs text-muted-foreground">{a.kind}</div></div>
              <Input type="date" value={a.due} onChange={(e) => patchA(a.id, { due: e.target.value })} className="h-8 bg-secondary text-xs" />
              <Input type="number" step="0.1" min={0} max={10} placeholder="Nota" value={a.grade ?? ""} onChange={(e) => patchA(a.id, { grade: e.target.value === "" ? null : +e.target.value })} className="h-8 bg-secondary text-xs" />
              <button onClick={() => patchA(a.id, { submitted: !a.submitted })} className={cn("rounded-full px-3 py-1 text-xs", a.submitted ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{a.submitted ? "Enviado" : "Pendente"}</button>
              <button onClick={() => patch({ assessments: d.assessments.filter((x) => x.id !== a.id) })}><Trash2 className="size-3.5 text-muted-foreground" /></button>
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-2">
            {(["Trabalho", "Atividade Prática", "Prova"] as const).map((k) => (
              <button key={k} onClick={() => patch({ assessments: [...d.assessments, { id: uid(), title: k, kind: k, due: new Date().toISOString().slice(0, 10), grade: null, submitted: false }] })} className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"><Plus className="size-3" /> {k}</button>
            ))}
            <ExternalLink className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
