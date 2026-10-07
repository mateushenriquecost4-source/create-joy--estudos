import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, BrainCircuit, CalendarCheck, ClipboardList, Lightbulb, Send, User } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useStore, pct } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "PRF AI Coach — PRF OPS" },
      { name: "description", content: "Assistente de estudos: simuladinhos Cebraspe, explicações, planos de revisão e mnemônicos." },
      { property: "og:title", content: "PRF AI Coach — PRF OPS" },
      { property: "og:description", content: "Seu coach de estudos para a PRF." },
    ],
  }),
  component: Coach,
});

type Mode = "Professor" | "Tutor Operacional" | "Criador de Questões";
type Q = { s: string; a: boolean; j: string };
type Msg = { id: number; role: "user" | "ai"; text: string; quiz?: Q[] };

const BANK: Q[] = [
  { s: "Conforme o CTB, conduzir veículo sob influência de álcool é infração gravíssima, com multa multiplicada por dez e suspensão do direito de dirigir por 12 meses.", a: true, j: "Art. 165 do CTB: gravíssima, multa (x10) e suspensão por 12 meses, além de recolhimento do documento e retenção do veículo." },
  { s: "O crime de peculato é classificado como crime comum, podendo ser praticado por qualquer pessoa.", a: false, j: "Peculato (art. 312 CP) é crime PRÓPRIO: exige a qualidade de funcionário público, admitindo coautoria de particular que conheça essa condição." },
  { s: "Em uma colisão perfeitamente inelástica entre dois veículos, a quantidade de movimento total do sistema se conserva.", a: true, j: "Em sistemas isolados a quantidade de movimento sempre se conserva; o que não se conserva na colisão inelástica é a energia cinética." },
  { s: "A Polícia Rodoviária Federal é órgão permanente, organizado e mantido pela União e estruturado em carreira, destinado ao patrulhamento ostensivo das rodovias federais.", a: true, j: "Literalidade do art. 144, §2º, da CF/88." },
  { s: "A prisão em flagrante só pode ser efetuada por autoridade policial.", a: false, j: "Art. 301 CPP: qualquer do povo PODERÁ e as autoridades policiais e seus agentes DEVERÃO prender quem quer que seja encontrado em flagrante delito." },
  { s: "Os atos administrativos gozam de presunção absoluta de legitimidade.", a: false, j: "A presunção de legitimidade é RELATIVA (juris tantum), admitindo prova em contrário." },
  { s: "Dobrando-se a velocidade de um veículo, sua energia cinética também dobra.", a: false, j: "Ec = m·v²/2. Dobrando v, a energia cinética QUADRUPLICA — por isso a distância de frenagem cresce tanto." },
];

const EXPLAIN: Record<Mode, string> = {
  "Professor": "📘 **Velocidade e impacto (Física)**\n\nA energia cinética é Ec = ½·m·v². Como depende do QUADRADO da velocidade, um carro a 100 km/h carrega quase o dobro (1,96x) da energia de um a 72 km/h.\n\nNa frenagem, essa energia é dissipada pelo atrito: d = v² / (2·μ·g). Ou seja, a distância de frenagem também cresce com v².\n\n**Para a prova:** o Cebraspe costuma afirmar que dobrar a velocidade dobra a distância de frenagem — ERRADO, ela quadruplica.",
  "Tutor Operacional": "🚔 **Na pista:** imagine uma abordagem na BR-116. Um veículo a 110 km/h numa pista com μ = 0,7 precisa de cerca de 68 m só para frear (sem contar o tempo de reação ~1 s ≈ 30 m).\n\nNa perícia de acidentes, a marca de frenagem permite estimar a velocidade: v = √(2·μ·g·d). Marca de 50 m em asfalto seco → ~95 km/h.\n\n**Lembre:** crimes próprios (peculato, concussão) exigem qualidade especial do agente; crimes comuns (furto, homicídio) qualquer um pode praticar.",
  "Criador de Questões": "🧩 Explicação em formato de itens:\n\n1. (C) A distância de frenagem é proporcional ao quadrado da velocidade.\n2. (E) Crimes próprios admitem apenas autoria de funcionário público, vedada coautoria de particular. — Errado: o particular responde se conhecer a condição (art. 30 CP).\n3. (C) Art. 302 CTB: homicídio culposo na direção de veículo automotor tem pena de detenção de 2 a 4 anos.",
};

const MNEMO = "🧠 **Mnemônicos para a prova**\n\n• **LIMPE** – Princípios da Administração (art. 37 CF): Legalidade, Impessoalidade, Moralidade, Publicidade, Eficiência.\n\n• **PRF no art. 144 – \"PPFFPP\"**: Polícia Federal, Polícia Rodoviária Federal, Polícia Ferroviária Federal, Polícias civis, Polícias militares e bombeiros, Polícias penais.\n\n• **Infrações CTB – \"7-5-4-3\"**: pontos por gravidade → Gravíssima 7, Grave 5, Média 4, Leve 3.\n\n• **Peculato \"AD-AP-FU\"**: Apropriar-se, Desviar (peculato-apropriação/desvio), Furtar (peculato-furto).";

function Coach() {
  const { state } = useStore();
  const [mode, setMode] = useState<Mode>("Professor");
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, role: "ai", text: "Pronto para a missão, futuro PRF. Escolha uma ação rápida ou me pergunte algo sobre o edital." }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => { if (!typing) inputRef.current?.focus(); }, [typing]);

  function reply(user: string, build: () => Omit<Msg, "id" | "role">) {
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: user }]);
    setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { id: Date.now() + 1, role: "ai", ...build() }]); setTyping(false); }, 900 + Math.random() * 700);
  }

  const plan = () => {
    const weak = state.batteries.map((b) => ({ s: state.subjects.find((x) => x.id === b.subjectId)?.short, t: b.topic, p: pct(b.correct, b.total) })).filter((x) => x.p < 70).sort((a, b) => a.p - b.p).slice(0, 4);
    if (!weak.length) return { text: "✅ Nenhum tópico abaixo de 70%. Mantenha revisões espaçadas de 24h/7d/30d e aumente o volume de questões." };
    const days = ["Seg", "Ter", "Qua", "Qui"];
    return { text: `📅 **Plano de Revisão Ativa** (tópicos com menor rendimento)\n\n${weak.map((w, i) => `• **${days[i]}** – ${w.s}: ${w.t} (${w.p}%)\n   → 20 min de resumo ativo + 30 questões Cebraspe + anotar erros no caderno`).join("\n\n")}\n\n• **Sáb** – Simulado misto com esses tópicos\n• **Dom** – Revisão do caderno de erros` };
  };

  const actions = [
    { icon: ClipboardList, label: "Simuladinho 5 questões", run: () => reply("Gere um simuladinho de 5 questões Cebraspe", () => ({ text: "Simuladinho Cebraspe (Certo/Errado). Marque sua resposta:", quiz: [...BANK].sort(() => Math.random() - 0.5).slice(0, 5) })) },
    { icon: BrainCircuit, label: "Explicar tópico complexo", run: () => reply("Explique velocidade e impacto / crimes próprios vs comuns", () => ({ text: EXPLAIN[mode] })) },
    { icon: CalendarCheck, label: "Plano de revisão ativa", run: () => reply("Gere um plano de revisão para meus pontos fracos", plan) },
    { icon: Lightbulb, label: "Criar mnemônico", run: () => reply("Crie mnemônicos para leis e artigos", () => ({ text: MNEMO })) },
  ];

  function send() {
    const t = input.trim(); if (!t) return; setInput("");
    const l = t.toLowerCase();
    reply(t, () => l.includes("simul") || l.includes("quest") ? { text: "Aqui vão itens para treinar:", quiz: [...BANK].sort(() => Math.random() - 0.5).slice(0, 3) }
      : l.includes("mnem") ? { text: MNEMO } : l.includes("plano") || l.includes("revis") ? plan()
      : { text: `(${mode}) Boa pergunta sobre "${t}". Foque na literalidade da lei, resolva ao menos 30 questões Cebraspe sobre o tema e registre cada erro no caderno. Quer que eu gere um simuladinho sobre isso?` });
  }

  return (
    <>
      <PageHeader title="PRF AI Coach" subtitle="Assistente simulado no navegador">
        <div className="flex rounded-lg border border-border bg-secondary p-1 text-xs">
          {(["Professor", "Tutor Operacional", "Criador de Questões"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn("rounded-md px-3 py-1.5 transition", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{m}</button>
          ))}
        </div>
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:content-start">
          {actions.map((a) => (
            <button key={a.label} disabled={typing} onClick={a.run} className="glass flex items-center gap-3 p-3 text-left text-sm transition hover:border-primary/50 disabled:opacity-50">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 text-primary"><a.icon className="size-4" /></span>{a.label}
            </button>
          ))}
        </div>
        <div className="glass flex h-[calc(100vh-220px)] min-h-[480px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", m.role === "ai" ? "bg-brand text-primary-foreground" : "bg-secondary")}>{m.role === "ai" ? <Bot className="size-4" /> : <User className="size-4" />}</span>
                <div className={cn("max-w-[85%] text-sm", m.role === "user" ? "rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground" : "")}>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text.split("**").map((p, i) => i % 2 ? <strong key={i}>{p}</strong> : p)}</div>
                  {m.quiz && <Quiz items={m.quiz} />}
                </div>
              </div>
            ))}
            {typing && <div className="flex gap-3"><span className="grid size-8 place-items-center rounded-full bg-brand text-primary-foreground"><Bot className="size-4" /></span><div className="flex items-center gap-1">{[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 0.15}s` }} />)}</div></div>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2 border-t border-border p-3">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder={`Pergunte ao ${mode}…`} className="max-h-32 flex-1 resize-none rounded-lg border border-input bg-secondary px-3 py-2 text-sm outline-none focus:border-primary" />
            <button disabled={typing || !input.trim()} className="grid size-10 place-items-center rounded-lg bg-brand text-primary-foreground disabled:opacity-40"><Send className="size-4" /></button>
          </form>
        </div>
      </div>
    </>
  );
}

function Quiz({ items }: { items: Q[] }) {
  const [ans, setAns] = useState<Record<number, boolean>>({});
  const done = Object.keys(ans).length;
  const score = items.reduce((a, q, i) => a + (i in ans ? (ans[i] === q.a ? 1 : -1) : 0), 0);
  return (
    <div className="mt-3 space-y-3">
      {items.map((q, i) => {
        const a = ans[i]; const answered = a !== undefined; const ok = a === q.a;
        return (
          <div key={i} className={cn("rounded-lg border p-3", answered ? (ok ? "border-success/50 bg-success/10" : "border-destructive/50 bg-destructive/10") : "border-border bg-secondary/50")}>
            <p className="text-sm"><span className="mr-1 font-mono text-xs text-primary">{i + 1}.</span>{q.s}</p>
            <div className="mt-2 flex gap-2">
              {[true, false].map((v) => (
                <button key={String(v)} disabled={answered} onClick={() => setAns({ ...ans, [i]: v })} className={cn("rounded-md border px-3 py-1 text-xs font-semibold", answered && v === q.a ? "border-success bg-success text-success-foreground" : answered && a === v ? "border-destructive bg-destructive text-destructive-foreground" : "border-border hover:border-primary")}>{v ? "CERTO" : "ERRADO"}</button>
              ))}
            </div>
            {answered && <p className="mt-2 text-xs text-muted-foreground"><strong className={ok ? "text-success" : "text-destructive"}>{ok ? "Correto! " : "Errou. "}</strong>Gabarito: {q.a ? "CERTO" : "ERRADO"}. {q.j}</p>}
          </div>
        );
      })}
      {done === items.length && <div className="rounded-lg bg-primary/15 p-3 text-sm">Nota líquida Cebraspe: <strong className="tabular">{score}</strong> / {items.length}</div>}
    </div>
  );
}
