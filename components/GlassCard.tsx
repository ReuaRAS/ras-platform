import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5",
        hover && "glass-card-hover",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** بطاقة قابلة للنقر (رابط) */
export function GlassLinkCard({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "glass-card glass-card-hover group block rounded-2xl p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        className,
      )}
    >
      {children}
    </Link>
  );
}
