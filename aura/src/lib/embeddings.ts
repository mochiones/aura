/**
 * Embeddingi treści wpisów (OpenAI text-embedding-3-small).
 * Jeden wpis = jeden wektor, bez chunkowania.
 */
import OpenAI from "openai";
import { ConfigError } from "@/lib/errors";

const EMBEDDING_MODEL = "text-embedding-3-small";

function client(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new ConfigError("Brak OPENAI_API_KEY");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function computeEmbedding(text: string): Promise<number[]> {
  const res = await client().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

/** Batch — jedno wywołanie API na wiele tekstów naraz (backfill). */
export async function computeEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await client().embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}
