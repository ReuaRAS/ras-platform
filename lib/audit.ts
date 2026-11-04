import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditEntry = {
  actorId?: string | null;
  sectorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/** تسجيل إجراء في audit_logs — لا يُفشل العملية الأساسية إذا فشل التسجيل. */
export async function logAudit(admin: SupabaseClient, entry: AuditEntry): Promise<void> {
  try {
    await admin.from("audit_logs").insert({
      actor_id: entry.actorId ?? null,
      sector_id: entry.sectorId ?? null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    });
  } catch {
    // تجاهل: السجل ليس حرجًا لنجاح العملية
  }
}
