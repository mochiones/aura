import fs from "fs/promises";
import path from "path";
import { createHash, randomBytes, randomUUID } from "crypto";
import type { PublicToken, TokenRecord } from "@/types/token";
import type { TokenRepository } from "./token-repository";

const DATA_PATH = path.join(process.cwd(), "data", "tokens.json");
const TOKEN_PREFIX = "aura_";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toPublic(r: TokenRecord): PublicToken {
  return { id: r.id, prefix: r.prefix, createdAt: r.createdAt };
}

async function readFile(): Promise<TokenRecord[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as { tokens: TokenRecord[] };
    return parsed.tokens;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      await fs.writeFile(DATA_PATH, JSON.stringify({ tokens: [] }), "utf-8");
      return [];
    }
    console.error("[Aura] Failed to read tokens.json:", err);
    throw new Error("DATA_CORRUPTED");
  }
}

async function writeFile(tokens: TokenRecord[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify({ tokens }, null, 2), "utf-8");
}

class JsonTokenRepository implements TokenRepository {
  async list(userId: string): Promise<PublicToken[]> {
    const tokens = await readFile();
    return tokens
      .filter((t) => t.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map(toPublic);
  }

  async create(userId: string): Promise<{ token: string; record: PublicToken }> {
    const tokens = await readFile();
    const token = `${TOKEN_PREFIX}${randomBytes(24).toString("hex")}`;
    const record: TokenRecord = {
      id: randomUUID(),
      hash: hashToken(token),
      prefix: token.slice(0, 12),
      userId,
      createdAt: new Date().toISOString(),
    };
    tokens.push(record);
    await writeFile(tokens);
    return { token, record: toPublic(record) };
  }

  async findUserId(token: string): Promise<string | null> {
    const hash = hashToken(token);
    const tokens = await readFile();
    return tokens.find((t) => t.hash === hash)?.userId ?? null;
  }

  async revoke(id: string, userId: string): Promise<boolean> {
    const tokens = await readFile();
    const next = tokens.filter((t) => !(t.id === id && t.userId === userId));
    if (next.length === tokens.length) return false;
    await writeFile(next);
    return true;
  }
}

export const tokenRepository: TokenRepository = new JsonTokenRepository();
