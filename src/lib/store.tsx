import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type StudyType = "Teoria" | "Questões" | "Revisão" | "Leitura da Lei";
export type Topic = { id: string; name: string; teoria: boolean; questoes: boolean; acertos: number; r24: boolean; r7: boolean; r30: boolean };
export type Subject = { id: string; name: string; short: string; weight: number; difficulty: number; topics: Topic[] };
export type Session = { id: string; date: string; subjectId: string; topic: string; type: StudyType; minutes: number };
export type Battery = { id: string; date: string; subjectId: string; topic: string; total: number; correct: number; banca: string };
export type ErrorNote = { id: string; date: string; subjectId: string; text: string };
export type CalEvent = { id: string; day: number; title: string; kind: "Estudo" | "Revisão" | "Simulado" };
export type Simulado = { id: string; date: string; name: string; certas: number; erradas: number; brancos: number; redacao: number; posicao: number };
export type TafTest = { id: string; name: string; unit: string; goal: number; current: number; higherBetter: boolean };

export type DiscStatus = "A Fazer" | "Em andamento" | "Concluída";
export type Assessment = { id: string; title: string; kind: "Trabalho" | "Atividade Prática" | "Prova"; due: string; grade: number | null; submitted: boolean };
export type Discipline = { id: string; name: string; semester: 1 | 2 | 3; module: number; status: DiscStatus; assessments: Assessment[] };
export type CourseLink = { id: string; label: string; url: string; kind: "Aula" | "PDF" | "Portal" };
export type Faculdade = { startDate: string; months: number; disciplines: Discipline[]; links: CourseLink[] };

export type State = {
  examDate: string;
  dailyGoalMin: number;
  faculdade: Faculdade;
  subjects: Subject[];
  sessions: Session[];
  batteries: Battery[];
  notes: ErrorNote[];
  events: CalEvent[];
  simulados: Simulado[];
  taf: TafTest[];
};

const uid = () => Math.random().toString(36).slice(2, 10);
export { uid };

const raw: [string, string, number, number, string[]][] = [
  ["Língua Portuguesa", "PORT", 3, 3, ["Interpretação de textos", "Ortografia e acentuação", "Classes de palavras", "Sintaxe da oração", "Concordância verbal e nominal", "Regência e crase", "Pontuação", "Reescrita de frases"]],
  ["Raciocínio Lógico-Matemático", "RLM", 2, 4, ["Proposições e conectivos", "Equivalências lógicas", "Conjuntos", "Análise combinatória", "Probabilidade", "Porcentagem e juros"]],
  ["Informática", "INFO", 2, 3, ["Redes e internet", "Segurança da informação", "Windows e Linux", "Pacote Office / LibreOffice", "Computação em nuvem", "Banco de dados e Big Data"]],
  ["Física", "FIS", 2, 5, ["Cinemática", "Leis de Newton", "Trabalho e energia", "Quantidade de movimento e colisões", "Movimento circular", "Ondulatória e efeito Doppler"]],
  ["Ética e Cidadania", "ÉTICA", 1, 1, ["Ética e moral", "Decreto 1.171/94", "Lei 8.112/90 – regime disciplinar", "Lei de Acesso à Informação"]],
  ["Direitos Humanos", "DH", 1, 2, ["Teoria geral dos DH", "Declaração Universal", "Pacto de San José", "Tratados internacionais"]],
  ["Legislação de Trânsito (CTB)", "CTB", 4, 3, ["Sistema Nacional de Trânsito", "Normas gerais de circulação", "Habilitação", "Infrações e penalidades", "Medidas administrativas", "Crimes de trânsito", "Resoluções do CONTRAN"]],
  ["Direito Administrativo", "ADM", 2, 3, ["Princípios da Administração", "Poderes administrativos", "Atos administrativos", "Agentes públicos", "Responsabilidade civil do Estado", "Licitações (Lei 14.133)"]],
  ["Direito Constitucional", "CONST", 2, 2, ["Direitos e garantias fundamentais", "Remédios constitucionais", "Organização do Estado", "Segurança pública (art. 144)", "Poder Executivo"]],
  ["Direito Penal", "PENAL", 2, 4, ["Aplicação da lei penal", "Teoria do crime", "Crimes contra a pessoa", "Crimes contra o patrimônio", "Crimes contra a Administração", "Legislação especial"]],
  ["Direito Processual Penal", "PPENAL", 2, 3, ["Inquérito policial", "Ação penal", "Prisões e liberdade provisória", "Provas", "Abuso de autoridade"]],
  ["Geopolítica", "GEO", 1, 2, ["Malha rodoviária brasileira", "Fronteiras e regiões", "Geopolítica mundial", "Integração econômica"]],
];

function seedFaculdade(): Faculdade {
  const d: [string, 1 | 2 | 3, number, DiscStatus][] = [
    ["Fundamentos de Administração", 1, 1, "Concluída"], ["Matemática Financeira", 1, 1, "Concluída"], ["Contabilidade Básica", 1, 2, "Concluída"], ["Economia", 1, 2, "Concluída"],
    ["Análise das Demonstrações Contábeis", 2, 1, "Concluída"], ["Gestão de Custos", 2, 1, "Em andamento"], ["Estatística Aplicada", 2, 2, "Em andamento"], ["Mercado Financeiro e de Capitais", 2, 2, "A Fazer"],
    ["Orçamento Empresarial", 3, 1, "A Fazer"], ["Administração Financeira", 3, 1, "A Fazer"], ["Planejamento Tributário", 3, 2, "A Fazer"], ["Projeto Integrador", 3, 2, "A Fazer"],
  ];
  const day = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  return {
    startDate: "2026-02-02", months: 18,
    disciplines: d.map(([name, semester, module, status], i) => ({
      id: `d${i}`, name, semester, module, status,
      assessments: status === "Concluída"
        ? [{ id: `d${i}a`, title: "Atividade prática", kind: "Atividade Prática", due: day(-60 - i * 10), grade: 7 + ((i * 3) % 3), submitted: true }, { id: `d${i}b`, title: "Prova final", kind: "Prova", due: day(-45 - i * 10), grade: 6.5 + ((i * 7) % 4) * 0.8, submitted: true }]
        : status === "Em andamento"
          ? [{ id: `d${i}a`, title: "Trabalho individual", kind: "Trabalho", due: day(3 + i), grade: null, submitted: false }, { id: `d${i}b`, title: "Prova N1", kind: "Prova", due: day(12 + i), grade: null, submitted: false }]
          : [],
    })),
    links: [
      { id: "l1", label: "Portal do Aluno", url: "https://", kind: "Portal" },
      { id: "l2", label: "Aulas gravadas – Gestão de Custos", url: "https://", kind: "Aula" },
      { id: "l3", label: "Apostila Estatística (PDF)", url: "https://", kind: "PDF" },
    ],
  };
}

export function courseProgress(f: Faculdade, now = new Date()) {
  const start = new Date(f.startDate + "T00:00:00");
  const end = new Date(start); end.setMonth(end.getMonth() + f.months);
  const elapsed = Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime())));
  const monthsLeft = Math.max(0, (end.getFullYear() - now.getFullYear()) * 12 + end.getMonth() - now.getMonth());
  return { pct: Math.round(elapsed * 100), monthsLeft, end };
}
export function gpa(f: Faculdade) {
  const g = f.disciplines.flatMap((d) => d.assessments).map((a) => a.grade).filter((x): x is number => x !== null);
  return g.length ? +(g.reduce((a, b) => a + b, 0) / g.length).toFixed(2) : 0;
}

function seed(): State {
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const subjects: Subject[] = raw.map(([name, short, weight, difficulty, topics], i) => ({
    id: `s${i}`, name, short, weight, difficulty,
    topics: topics.map((t, j) => {
      const done = rnd() < 0.55;
      return { id: `s${i}t${j}`, name: t, teoria: done, questoes: done && rnd() < 0.8, acertos: done ? Math.round(55 + rnd() * 40) : 0, r24: done && rnd() < 0.7, r7: done && rnd() < 0.45, r30: done && rnd() < 0.2 };
    }),
  }));
  const types: StudyType[] = ["Teoria", "Questões", "Revisão", "Leitura da Lei"];
  const sessions: Session[] = [];
  for (let d = 0; d < 40; d++) {
    if (d > 0 && rnd() < 0.12) continue;
    const n = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const sub = subjects[Math.floor(rnd() * subjects.length)];
      const dt = new Date(); dt.setDate(dt.getDate() - d); dt.setHours(8 + k * 3);
      sessions.push({ id: uid(), date: dt.toISOString(), subjectId: sub.id, topic: sub.topics[0].name, type: types[Math.floor(rnd() * 4)], minutes: 30 + Math.floor(rnd() * 70) });
    }
  }
  const batteries: Battery[] = subjects.flatMap((sub, i) =>
    sub.topics.slice(0, 2).map((t, j) => {
      const total = 20 + Math.floor(rnd() * 30);
      const dt = new Date(); dt.setDate(dt.getDate() - (i + j * 3));
      return { id: uid(), date: dt.toISOString(), subjectId: sub.id, topic: t.name, total, correct: Math.round(total * (0.5 + rnd() * 0.45)), banca: "Cebraspe" };
    }),
  );
  const exam = new Date(); exam.setDate(exam.getDate() + 118);
  return {
    examDate: exam.toISOString().slice(0, 10),
    dailyGoalMin: 240,
    faculdade: seedFaculdade(),
    subjects, sessions, batteries,
    notes: [
      { id: uid(), date: new Date().toISOString(), subjectId: "s6", text: "Art. 165 CTB: recusa ao bafômetro (165-A) tem a MESMA penalidade da embriaguez — gravíssima x10, suspensão 12 meses." },
      { id: uid(), date: new Date().toISOString(), subjectId: "s9", text: "Peculato culposo: reparação do dano ANTES da sentença irrecorrível extingue a punibilidade; DEPOIS reduz a pena pela metade." },
      { id: uid(), date: new Date().toISOString(), subjectId: "s3", text: "Cebraspe adora: em colisão perfeitamente inelástica a quantidade de movimento se conserva, a energia cinética NÃO." },
    ],
    events: [
      { id: uid(), day: 1, title: "CTB – Infrações", kind: "Estudo" },
      { id: uid(), day: 1, title: "Revisão 24h Penal", kind: "Revisão" },
      { id: uid(), day: 2, title: "Física – Colisões", kind: "Estudo" },
      { id: uid(), day: 3, title: "Português – Crase", kind: "Estudo" },
      { id: uid(), day: 4, title: "Revisão 7d Constitucional", kind: "Revisão" },
      { id: uid(), day: 5, title: "Informática – Segurança", kind: "Estudo" },
      { id: uid(), day: 6, title: "Simulado PRF completo", kind: "Simulado" },
      { id: uid(), day: 0, title: "Correção do simulado", kind: "Revisão" },
    ],
    simulados: [
      { id: uid(), date: "2026-08-02", name: "Simulado Nacional #1", certas: 78, erradas: 22, brancos: 20, redacao: 6.8, posicao: 812 },
      { id: uid(), date: "2026-08-30", name: "Simulado Nacional #2", certas: 85, erradas: 19, brancos: 16, redacao: 7.4, posicao: 534 },
      { id: uid(), date: "2026-09-27", name: "Simulado Nacional #3", certas: 92, erradas: 15, brancos: 13, redacao: 8.1, posicao: 301 },
    ],
    taf: [
      { id: "t1", name: "Corrida 12 min", unit: "m", goal: 2400, current: 2350, higherBetter: true },
      { id: "t2", name: "Barra fixa", unit: "rep", goal: 3, current: 5, higherBetter: true },
      { id: "t3", name: "Impulsão horizontal", unit: "m", goal: 2.0, current: 2.15, higherBetter: true },
      { id: "t4", name: "Shuttle Run", unit: "s", goal: 12.5, current: 12.1, higherBetter: false },
      { id: "t5", name: "Natação 50 m", unit: "s", goal: 60, current: 64, higherBetter: false },
    ],
  };
}

type Ctx = { state: State; set: (fn: (s: State) => State) => void; reset: () => void };
const StoreCtx = createContext<Ctx | null>(null);
const KEY = "prf-study-v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seed);
  const loaded = useRef(false);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setState({ ...seed(), ...JSON.parse(v) });
    } catch { /* ignore */ }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);
  return (
    <StoreCtx.Provider value={{ state, set: (fn) => setState(fn), reset: () => setState(seed()) }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
export function topicProgress(t: Topic) {
  return [t.teoria, t.questoes, t.r24, t.r7, t.r30].filter(Boolean).length / 5;
}
export function subjectProgress(s: Subject) {
  return s.topics.length ? Math.round((s.topics.reduce((a, t) => a + topicProgress(t), 0) / s.topics.length) * 100) : 0;
}
export const fmtH = (min: number) => `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, "0")}`;
