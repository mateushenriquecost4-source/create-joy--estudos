import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, ListChecks, Target, Bot, CalendarDays, Trophy, ChevronsLeft, Menu, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/edital", label: "Edital Verticalizado", icon: ListChecks },
  { to: "/questoes", label: "Central de Questões", icon: Target },
  { to: "/coach", label: "PRF AI Coach", icon: Bot },
  { to: "/planejamento", label: "Planejamento", icon: CalendarDays },
  { to: "/simulados", label: "Simulados & TAF", icon: Trophy },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)} title={n.label}
            className={cn("group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_var(--primary)]" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
            <n.icon className={cn("size-4 shrink-0", active && "text-primary")} />
            {!collapsed && <span className="truncate">{n.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand"><Shield className="size-5 text-primary-foreground" /></div>
      {!collapsed && <div className="leading-tight"><div className="font-display text-lg font-bold tracking-wider">PRF · OPS</div><div className="text-[11px] uppercase tracking-widest text-muted-foreground">Controle de estudos</div></div>}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 md:flex", collapsed ? "w-[72px]" : "w-64")}>
        {brand}
        <div className="flex-1 overflow-y-auto">{items}</div>
        <button onClick={() => setCollapsed(!collapsed)} className="m-3 flex items-center justify-center gap-2 rounded-lg border border-sidebar-border py-2 text-xs text-muted-foreground hover:text-foreground">
          <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Recolher"}
        </button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 border-r border-sidebar-border bg-sidebar">
            <button className="absolute right-3 top-5" onClick={() => setOpen(false)}><X className="size-5" /></button>
            {brand}{items}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <button onClick={() => setOpen(true)}><Menu className="size-5" /></button>
          <span className="font-display text-lg font-bold tracking-wider">PRF · OPS</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold uppercase md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, icon: Icon, action, className, children }: { title?: string; icon?: React.ComponentType<{ className?: string }>; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn("glass p-5", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {Icon && <Icon className="size-4 text-primary" />}{title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
