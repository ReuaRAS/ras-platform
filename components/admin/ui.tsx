import type { ReactNode } from "react";

/* عناصر واجهة بسيطة (Server-safe) تُستخدم في صفحات لوحة الإدارة */

export const inputCls =
  "w-full rounded-xl border border-white/[0.08] bg-[#0b0b0c] px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-[#5b6472] focus:border-[var(--sector-main)]";

export const labelCls = "mb-1 block text-[11px] font-bold text-[#94a3b8]";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-extrabold sm:text-xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-[#94a3b8]">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const tones = {
    info: "border-white/10 bg-white/[0.03] text-[#cbd5e1]",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  } as const;
  return (
    <div className={`mb-4 rounded-xl border px-3 py-2 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.06] bg-[#141416] p-4 ${className}`}
    >
      {title ? (
        <header className="mb-3">
          <h2 className="text-sm font-extrabold">{title}</h2>
          {description ? (
            <p className="mt-1 text-[11px] leading-relaxed text-[#94a3b8]">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[10px] text-[#64748b]">{hint}</span> : null}
    </label>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-[11px] leading-relaxed text-[#94a3b8]">
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "success" | "warning" | "danger" | "main";
}) {
  const tones = {
    muted: "bg-white/5 text-[#94a3b8]",
    success: "bg-emerald-500/15 text-emerald-300",
    warning: "bg-amber-500/15 text-amber-300",
    danger: "bg-red-500/15 text-red-300",
    main: "bg-[var(--sector-main)] text-white",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function DangerButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-lg border border-red-500/30 px-2 py-1 text-[10px] font-bold text-red-300 transition-colors hover:bg-red-500/10"
    >
      {children}
    </button>
  );
}

export function SubmitButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="submit" className={`btn btn-primary !px-4 !py-2 text-xs ${className}`}>
      {children}
    </button>
  );
}
