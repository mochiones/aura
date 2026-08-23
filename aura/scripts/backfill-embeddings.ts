/**
 * Jednorazowy backfill embeddingów dla istniejących wpisów.
 * Idempotentny: pomija wpisy, które już mają embedding — bezpieczny do
 * ponownego uruchomienia po błędzie w połowie (sieć, rate limit).
 */
// Statyczne importy są hoistowane przed kod modułu (ESM) — gdyby
// entries.ts/supabase.ts zaimportować statycznie, odczytałyby process.env
// ZANIM loadEnvFile zdąży go wypełnić, i repozytorium błędnie wybrałoby
// tryb lokalny (json) zamiast Supabase. Dlatego importy dynamiczne w main().
process.loadEnvFile(".env.local");

const BATCH_SIZE = 100;

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Brak OPENAI_API_KEY — przerywam.");
    process.exit(1);
  }

  const { entryRepository } = await import("../src/lib/repository/entries");
  const { stripHtml } = await import("../src/lib/therapist/entry-context");
  const { computeEmbeddings } = await import("../src/lib/embeddings");

  const all = await entryRepository.getAll(undefined);
  const todo = all.filter((e) => e.embedding === null);

  console.log(`Do przetworzenia: ${todo.length} / ${all.length}`);

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    const texts = batch.map((e) => stripHtml(e.content) || e.title);
    const vectors = await computeEmbeddings(texts);

    await Promise.all(
      batch.map((entry, j) =>
        entryRepository.update(entry.id, { embedding: vectors[j] })
      )
    );

    console.log(`✅ ${Math.min(i + BATCH_SIZE, todo.length)}/${todo.length}`);
  }

  console.log("Gotowe.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
