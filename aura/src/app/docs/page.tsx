import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Dokumentacja API — Aura",
};

/** Znaczek metody HTTP (GET/POST). */
function Method({ method }: { method: "GET" | "POST" }) {
  const color =
    method === "GET"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-indigo-100 text-indigo-800";
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide ${color}`}
    >
      {method}
    </span>
  );
}

/** Blok kodu (curl / JSON) — ciemne tło, przewijalny w poziomie. */
function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[#1A1A2E] px-4 py-3 text-[12.5px] leading-relaxed text-[#E8E6DF]">
      <code>{children}</code>
    </pre>
  );
}

/** Sekcja-karta. */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#EBEBF0] bg-white p-5 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-[#EBEBF0] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="border-b border-[#EBEBF0]/70 px-3 py-2 align-top text-[13px] text-[#1A1A2E]">
      {children}
    </td>
  );
}

/** Fragment kodu inline. */
function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[12.5px] text-[#1A1A2E]">
      {children}
    </code>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      {/* Nagłówek */}
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-[#9B9BAD] transition-colors hover:text-[#1A1A2E]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Powrót do wpisów
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A2E]">
          Dokumentacja API
        </h1>
        <p className="mt-2 text-[15px] text-[#5A5A6E]">
          Endpointy do programistycznego sterowania Aurą. Trzy proste operacje,
          każda <strong>per użytkownik</strong>: dodanie wpisu, zapytanie do
          psychoterapeuty (Freud) oraz odczyt wpisu na konkretny dzień.
        </p>
        <p className="mt-2 text-[13px] text-[#9B9BAD]">
          Bazowy URL (dev): <Mono>http://localhost:3002</Mono> · Format: JSON
        </p>
      </div>

      <div className="space-y-6">
        {/* Autoryzacja */}
        <Card>
          <h2 className="text-lg font-bold text-[#1A1A2E]">Autoryzacja</h2>
          <p className="mt-2 text-[14px] text-[#5A5A6E]">
            Każdy endpoint identyfikuje użytkownika po nagłówku:
          </p>
          <div className="mt-3">
            <Code>{`Authorization: Bearer <token>`}</Code>
          </div>
          <p className="mt-3 text-[14px] text-[#5A5A6E]">
            Token jest mapowany na <Mono>userId</Mono> przez zmienną środowiskową{" "}
            <Mono>AURA_API_TOKENS</Mono> (JSON <Mono>token → userId</Mono>, w{" "}
            <Mono>.env.local</Mono>, poza repo).
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Sytuacja</Th>
                  <Th>Zachowanie</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>Nagłówek poprawny (token znany)</Td>
                  <Td>
                    Tryb <strong>user</strong> — operacje tylko na wpisach tego
                    użytkownika.
                  </Td>
                </tr>
                <tr>
                  <Td>Nagłówek jest, token nieznany</Td>
                  <Td>
                    <Mono>401 Unauthorized</Mono>.
                  </Td>
                </tr>
                <tr>
                  <Td>Brak nagłówka</Td>
                  <Td>
                    Tryb <strong>lokalny</strong> — tylko wpisy współdzielone (
                    <Mono>userId = null</Mono>, dane z Etapu 1).
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-lg bg-[#F2F1EC] px-4 py-3 text-[13px] text-[#5A5A6E]">
            Etap 1 nie ma jeszcze bazy użytkowników ani logowania — statyczna mapa
            token→userId to pomost do czasu Fazy 2 (Supabase Auth). W przykładach{" "}
            <Mono>TOKEN</Mono> oznacza wartość Twojego tokenu.
          </p>
        </Card>

        {/* Endpoint 1 */}
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Method method="POST" />
            <Mono>/api/entries</Mono>
          </div>
          <h2 className="mt-3 text-lg font-bold text-[#1A1A2E]">
            1. Dodanie wpisu
          </h2>
          <p className="mt-1 text-[14px] text-[#5A5A6E]">
            Tworzy nowy wpis. Domyślnie na dziś; opcjonalnie z oceną nastroju.
          </p>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Body
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Pole</Th>
                  <Th>Typ</Th>
                  <Th>Wymagane</Th>
                  <Th>Opis</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>
                    <Mono>content</Mono>
                  </Td>
                  <Td>string</Td>
                  <Td>tak</Td>
                  <Td>Treść wpisu (tekst lub HTML).</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>mood</Mono>
                  </Td>
                  <Td>int 1–5 | null</Td>
                  <Td>nie</Td>
                  <Td>Ocena nastroju. Gdy brak — zapisywane null.</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>date</Mono>
                  </Td>
                  <Td>YYYY-MM-DD</Td>
                  <Td>nie</Td>
                  <Td>Dzień wpisu. Domyślnie dziś.</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>title</Mono>
                  </Td>
                  <Td>string</Td>
                  <Td>nie</Td>
                  <Td>Tytuł. Domyślnie „Wpis z dnia &lt;data&gt;".</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>tags</Mono>
                  </Td>
                  <Td>string[]</Td>
                  <Td>nie</Td>
                  <Td>Lista tagów.</Td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Odpowiedzi
          </h3>
          <ul className="mt-2 space-y-1 text-[13px] text-[#5A5A6E]">
            <li>
              <Mono>201</Mono> — utworzony wpis.
            </li>
            <li>
              <Mono>400</Mono> — brak <Mono>content</Mono>, zły <Mono>mood</Mono>{" "}
              lub zła <Mono>date</Mono>.
            </li>
            <li>
              <Mono>401</Mono> — nieznany token.
            </li>
          </ul>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Przykład
          </h3>
          <div className="mt-2 space-y-2">
            <Code>{`curl -X POST http://localhost:3002/api/entries \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"content":"Dziś było spokojnie","mood":4}'`}</Code>
            <Code>{`{
  "id": "26f345ec-...",
  "title": "Wpis z dnia 2026-08-17",
  "content": "Dziś było spokojnie",
  "tags": [],
  "mood": 4,
  "createdAt": "2026-08-17T12:00:00.000Z",
  "updatedAt": "2026-08-17T20:32:26.766Z",
  "userId": "669b081e-..."
}`}</Code>
          </div>
        </Card>

        {/* Endpoint 2 */}
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Method method="POST" />
            <Mono>/api/therapist/ask</Mono>
          </div>
          <h2 className="mt-3 text-lg font-bold text-[#1A1A2E]">
            2. Zapytanie do psychoterapeuty
          </h2>
          <p className="mt-1 text-[14px] text-[#5A5A6E]">
            Zadaje pytanie cyfrowemu terapeucie (Freud) i zwraca gotową odpowiedź
            tekstową (bez streamingu). Model sam sięga po wpisy jako kontekst.
          </p>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Body
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Pole</Th>
                  <Th>Typ</Th>
                  <Th>Wymagane</Th>
                  <Th>Opis</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>
                    <Mono>question</Mono>
                  </Td>
                  <Td>string</Td>
                  <Td>tak</Td>
                  <Td>Pytanie do agenta.</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>day</Mono>
                  </Td>
                  <Td>YYYY-MM-DD</Td>
                  <Td>nie</Td>
                  <Td>
                    Dzień jako kontekst rozmowy. Domyślnie <strong>dzisiejszy</strong>.
                  </Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>persona</Mono>
                  </Td>
                  <Td>string</Td>
                  <Td>nie</Td>
                  <Td>Persona agenta (domyślnie „freud").</Td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Odpowiedzi
          </h3>
          <ul className="mt-2 space-y-1 text-[13px] text-[#5A5A6E]">
            <li>
              <Mono>200</Mono> —{" "}
              <Mono>{`{ answer: string, persona: string }`}</Mono>.
            </li>
            <li>
              <Mono>400</Mono> — brak <Mono>question</Mono> lub zły format{" "}
              <Mono>day</Mono>.
            </li>
            <li>
              <Mono>401</Mono> — nieznany token.
            </li>
            <li>
              <Mono>500</Mono> — brak klucza <Mono>XAI_API_KEY</Mono> lub błąd
              modelu.
            </li>
          </ul>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Przykład
          </h3>
          <div className="mt-2 space-y-2">
            <Code>{`curl -X POST http://localhost:3002/api/therapist/ask \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"question":"Jak zmieniał się mój nastrój?","day":"2026-08-14"}'`}</Code>
            <Code>{`{ "answer": "Spojrzałem na twój tydzień...", "persona": "freud" }`}</Code>
          </div>
        </Card>

        {/* Endpoint 3 */}
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Method method="GET" />
            <Mono>/api/entries/day/{`{date}`}</Mono>
          </div>
          <h2 className="mt-3 text-lg font-bold text-[#1A1A2E]">
            3. Wpis na konkretny dzień
          </h2>
          <p className="mt-1 text-[14px] text-[#5A5A6E]">
            Zwraca informację, czy na dany dzień jest wpis, wraz z treścią i
            nastrojem. <strong>Zawsze 200</strong> — brak wpisu to{" "}
            <Mono>exists: false</Mono>, nie błąd. <Mono>{`{date}`}</Mono> w
            formacie YYYY-MM-DD; przy wielu wpisach zwracany jest najnowszy.
          </p>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Odpowiedzi
          </h3>
          <ul className="mt-2 space-y-1 text-[13px] text-[#5A5A6E]">
            <li>
              <Mono>200</Mono> —{" "}
              <Mono>{`{ date, exists: boolean, entry: Entry | null }`}</Mono>.
            </li>
            <li>
              <Mono>400</Mono> — zły format daty.
            </li>
            <li>
              <Mono>401</Mono> — nieznany token.
            </li>
          </ul>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Przykłady
          </h3>
          <div className="mt-2 space-y-2">
            <Code>{`curl http://localhost:3002/api/entries/day/2026-08-10 \\
  -H "Authorization: Bearer TOKEN"`}</Code>
            <Code>{`{
  "date": "2026-08-10",
  "exists": true,
  "entry": { "id": "b2c8...", "title": "Poniedziałkowy rozruch", "mood": 3, ... }
}`}</Code>
            <Code>{`{ "date": "1999-01-01", "exists": false, "entry": null }`}</Code>
          </div>
        </Card>

        {/* Entry shape */}
        <Card>
          <h2 className="text-lg font-bold text-[#1A1A2E]">
            Kształt obiektu <Mono>Entry</Mono>
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Pole</Th>
                  <Th>Typ</Th>
                  <Th>Opis</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>
                    <Mono>id</Mono>
                  </Td>
                  <Td>string (UUID)</Td>
                  <Td>Identyfikator wpisu.</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>title</Mono>
                  </Td>
                  <Td>string</Td>
                  <Td>Tytuł.</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>content</Mono>
                  </Td>
                  <Td>string</Td>
                  <Td>Treść (tekst lub HTML z edytora).</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>tags</Mono>
                  </Td>
                  <Td>string[]</Td>
                  <Td>Tagi.</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>mood</Mono>
                  </Td>
                  <Td>1–5 | null</Td>
                  <Td>Nastrój (lub null).</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>createdAt</Mono>
                  </Td>
                  <Td>ISO 8601</Td>
                  <Td>Data utworzenia. Dzień = createdAt[0:10].</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>updatedAt</Mono>
                  </Td>
                  <Td>ISO 8601</Td>
                  <Td>Data ostatniej modyfikacji.</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>userId</Mono>
                  </Td>
                  <Td>string | null</Td>
                  <Td>Właściciel (null = wpis współdzielony z Etapu 1).</Td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Kody błędów */}
        <Card>
          <h2 className="text-lg font-bold text-[#1A1A2E]">Kody błędów</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Kod</Th>
                  <Th>Znaczenie</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>
                    <Mono>400</Mono>
                  </Td>
                  <Td>
                    Niepoprawne dane wejściowe (brak wymaganego pola, zły mood,
                    zła data).
                  </Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>401</Mono>
                  </Td>
                  <Td>Nieznany token w nagłówku Authorization.</Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>500</Mono>
                  </Td>
                  <Td>
                    Błąd serwera (np. brak XAI_API_KEY dla endpointu 2, uszkodzone
                    dane).
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
