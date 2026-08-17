import { createHash, randomBytes, randomUUID } from "crypto";
import { supabaseRest } from "@/lib/supabase";
import type { PublicToken } from "@/types/token";
import type { TokenRepository } from "./token-repository";

const TOKEN_PREFIX = "aura_";

interface Row {
  id: string;
  prefix: string;
  created_at: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toPublic(r: Row): PublicToken {
  return { id: r.id, prefix: r.prefix, createdAt: r.created_at };
}

/** TokenRepository na Supabase (PostgREST). Przechowuje HASH, nie jawny token. */
class SupabaseTokenRepository implements TokenRepository {
  async list(userId: string): Promise<PublicToken[]> {
    const res = await supabaseRest(
      `api_tokens?select=id,prefix,created_at&user_id=eq.${encodeURIComponent(
        userId
      )}&order=created_at.desc`
    );
    if (!res.ok) throw new Error("SUPABASE_LIST_FAILED");
    const rows = (await res.json()) as Row[];
    return rows.map(toPublic);
  }

  async create(
    userId: string
  ): Promise<{ token: string; record: PublicToken }> {
    const token = `${TOKEN_PREFIX}${randomBytes(24).toString("hex")}`;
    const insert = {
      id: randomUUID(),
      hash: hashToken(token),
      prefix: token.slice(0, 12),
      user_id: userId,
    };
    const res = await supabaseRest("api_tokens?select=id,prefix,created_at", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(insert),
    });
    if (!res.ok) throw new Error("SUPABASE_CREATE_FAILED");
    const [created] = (await res.json()) as Row[];
    return { token, record: toPublic(created) };
  }

  async findUserId(token: string): Promise<string | null> {
    const hash = hashToken(token);
    const res = await supabaseRest(
      `api_tokens?select=user_id&hash=eq.${hash}&limit=1`
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { user_id: string }[];
    return rows[0]?.user_id ?? null;
  }

  async revoke(id: string, userId: string): Promise<boolean> {
    const res = await supabaseRest(
      `api_tokens?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(
        userId
      )}&select=id`,
      { method: "DELETE", headers: { Prefer: "return=representation" } }
    );
    if (!res.ok) throw new Error("SUPABASE_REVOKE_FAILED");
    const rows = (await res.json()) as Row[];
    return rows.length > 0;
  }
}

export const supabaseTokenRepository: TokenRepository =
  new SupabaseTokenRepository();
