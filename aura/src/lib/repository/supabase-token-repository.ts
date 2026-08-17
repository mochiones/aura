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

/** Rzuca błąd z kodem HTTP + fragmentem body — żeby przyczyna była widoczna. */
async function fail(op: string, res: Response): Promise<never> {
  let body = "";
  try {
    body = (await res.text()).slice(0, 200);
  } catch {
    /* ignore */
  }
  throw new Error(`SUPABASE_${op}_FAILED ${res.status} ${body}`);
}

/** TokenRepository na Supabase (PostgREST). Przechowuje HASH, nie jawny token. */
class SupabaseTokenRepository implements TokenRepository {
  async list(userId: string): Promise<PublicToken[]> {
    const res = await supabaseRest(
      `api_tokens?select=id,prefix,created_at&user_id=eq.${encodeURIComponent(
        userId
      )}&order=created_at.desc`
    );
    if (!res.ok) await fail("LIST", res);
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
    if (!res.ok) await fail("CREATE", res);
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
    if (!res.ok) await fail("REVOKE", res);
    const rows = (await res.json()) as Row[];
    return rows.length > 0;
  }
}

export const supabaseTokenRepository: TokenRepository =
  new SupabaseTokenRepository();
