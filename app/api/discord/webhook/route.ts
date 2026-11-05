import { NextResponse } from "next/server";
import { createPublicKey, verify as verifySignature } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** بادئة DER لمفتاح Ed25519 العام (SPKI) */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function verifyDiscord(rawBody: string, signatureHex: string, timestamp: string, publicKeyHex: string) {
  try {
    const rawKey = Buffer.from(publicKeyHex, "hex");
    if (rawKey.length !== 32) return false;
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, rawKey]),
      format: "der",
      type: "spki",
    });
    return verifySignature(
      null,
      Buffer.from(timestamp + rawBody, "utf8"),
      key,
      Buffer.from(signatureHex, "hex"),
    );
  } catch {
    return false;
  }
}

const INTERACTION_TYPES: Record<number, string> = {
  1: "ping",
  2: "application_command",
  3: "message_component",
  4: "autocomplete",
  5: "modal_submit",
};

export async function POST(request: Request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json(
      { error: "DISCORD_PUBLIC_KEY غير مضبوط — الطلبات مرفوضة." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("x-signature-ed25519") ?? "";
  const timestamp = request.headers.get("x-signature-timestamp") ?? "";
  const rawBody = await request.text();

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "توقيع مفقود" }, { status: 401 });
  }

  if (!verifyDiscord(rawBody, signature, timestamp, publicKey)) {
    return NextResponse.json({ error: "توقيع غير صالح" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  // فحص Discord الإلزامي عند تسجيل رابط التفاعل
  if (payload.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  const guildId = typeof payload.guild_id === "string" ? payload.guild_id : null;
  const interactionType = INTERACTION_TYPES[Number(payload.type)] ?? `type_${String(payload.type)}`;

  try {
    const admin = createAdminClient();

    let sectorId: string | null = null;
    if (guildId) {
      const { data: sector } = await admin
        .from("sectors")
        .select("id")
        .eq("discord_guild_id", guildId)
        .maybeSingle();
      sectorId = (sector?.id as string | undefined) ?? null;
    }

    const { error } = await admin.from("discord_events").insert({
      sector_id: sectorId,
      event_type: interactionType,
      payload: {
        guild_id: guildId,
        type: payload.type ?? null,
        data: payload.data ?? null,
        member: payload.member ?? null,
        user: payload.user ?? null,
      },
    });

    if (error) {
      return NextResponse.json({ error: `تعذّر تسجيل الحدث: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      type: 4,
      data: {
        content: guildId
          ? "تم تسجيل الحدث في منصة قطاعات الرس."
          : "تم التسجيل، لكن هذا السيرفر غير مرتبط بأي قطاع (discord_guild_id).",
        flags: 64,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطأ غير معروف" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "استخدم POST فقط" }, { status: 405 });
}
