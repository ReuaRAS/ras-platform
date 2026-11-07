import { SECTORS, getSectorMeta } from "@/lib/sectors";

/**
 * خريطة القطاع → البريد الإداري.
 * كلمة المرور لا تُخزَّن في الكود ولا في قاعدة البيانات: الحساب يُنشأ عبر
 * `supabase.auth.admin.createUser` ويُدار عبر Supabase Auth.
 */
export const SECTOR_EMAILS: Record<string, string> = SECTORS.reduce(
  (acc, meta) => {
    acc[meta.slug] = meta.admin_email;
    return acc;
  },
  {} as Record<string, string>,
);

export function emailForSector(slug: string): string | null {
  return SECTOR_EMAILS[slug] ?? null;
}

export function sectorForEmail(email: string): string | null {
  const found = Object.entries(SECTOR_EMAILS).find(
    ([, e]) => e.toLowerCase() === email.toLowerCase(),
  );
  return found?.[0] ?? null;
}

export const LOGIN_SECTORS = SECTORS.map((s) => ({
  slug: s.slug,
  name: s.name,
  code: s.sector_code,
  color: s.primary_color,
})).map((s) => ({ ...s, label: `${s.name} (${s.code})` }));

export { getSectorMeta };
