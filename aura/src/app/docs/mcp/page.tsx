import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, Code, Mono, Td, Th } from "@/components/docs/ui";

export const metadata = {
  title: "Dokumentacja MCP — Aura",
};

export default function DocsMcpPage() {
  return (
    <div className="max-w-3xl">
      {/* Nagłówek */}
      <div className="mb-8">
        {/* Na desktopie przycisk powrotu jest w pasku bocznym (DocsSidebar). */}
        <Link
          href="/"
          className="mb-4 md:hidden inline-flex items-center gap-1.5 text-[13px] text-[#9B9BAD] transition-colors hover:text-[#1A1A2E]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Powrót do wpisów
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1A2E]">
          Dokumentacja MCP
        </h1>
        <p className="mt-2 text-[15px] text-[#5A5A6E]">
          Serwer <strong>MCP</strong> (Model Context Protocol) daje agentom
          bezpośredni dostęp do tych samych 3 operacji co API — jako narzędzia.
          Wystawiony jako endpoint w aplikacji: <Mono>/api/mcp</Mono> (Streamable
          HTTP).
        </p>
        <p className="mt-2 text-[13px] text-[#9B9BAD]">
          Endpoint: <Mono>https://aura-eightup.vercel.app/api/mcp</Mono> · Transport:
          Streamable HTTP
        </p>
      </div>

      <div className="space-y-6">
        {/* Konfiguracja */}
        <Card id="konfiguracja">
          <h2 className="text-lg font-bold text-[#1A1A2E]">Konfiguracja</h2>
          <p className="mt-2 text-[14px] text-[#5A5A6E]">
            Autoryzacja jest taka sama jak w API — nagłówek{" "}
            <Mono>Authorization: Bearer &lt;token&gt;</Mono> (mapa{" "}
            <Mono>token → userId</Mono> z <Mono>AURA_API_TOKENS</Mono>). Bez
            tokenu serwer działa w trybie lokalnym (wpisy współdzielone).
          </p>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Claude Code (CLI)
          </h3>
          <div className="mt-2">
            <Code>{`claude mcp add --transport http aura \\
  https://aura-eightup.vercel.app/api/mcp \\
  --header "Authorization: Bearer TOKEN"`}</Code>
          </div>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Klient z plikiem konfiguracyjnym (JSON)
          </h3>
          <div className="mt-2">
            <Code>{`{
  "mcpServers": {
    "aura": {
      "type": "http",
      "url": "https://aura-eightup.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer TOKEN" }
    }
  }
}`}</Code>
          </div>
          <p className="mt-3 text-[13px] text-[#9B9BAD]">
            <Mono>TOKEN</Mono> to wartość Twojego tokenu z <Mono>.env.local</Mono>.
          </p>

          <p className="mt-4 rounded-lg bg-[#F2F1EC] px-4 py-3 text-[13px] text-[#5A5A6E]">
            <strong>Wymagany nagłówek Accept.</strong> Transport Streamable HTTP
            wymaga, aby żądanie deklarowało akceptację obu formatów:{" "}
            <Mono>Accept: application/json, text/event-stream</Mono>. Klienci MCP
            (np. Claude Code) ustawiają go automatycznie — ale przy ręcznym
            teście przez <Mono>curl</Mono> trzeba dodać go samodzielnie, inaczej
            serwer odrzuci żądanie z błędem <Mono>406 Not Acceptable</Mono> (co
            wygląda jak awaria serwera, a jest tylko brakiem tego nagłówka).
          </p>
          <div className="mt-2">
            <Code>{`curl -X POST https://aura-eightup.vercel.app/api/mcp \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_day_entry","arguments":{"date":"2026-08-10"}}}'`}</Code>
          </div>
        </Card>

        {/* Limity zapytań */}
        <Card id="limity">
          <h2 className="text-lg font-bold text-[#1A1A2E]">Limity zapytań</h2>
          <p className="mt-2 text-[14px] text-[#5A5A6E]">
            Serwer MCP nie ma własnego rate limitingu (brak limitu liczby
            zapytań na minutę per token czy per IP). W praktyce obowiązują dwa
            inne ograniczenia:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-[#5A5A6E]">
            <li>
              <strong>Timeout funkcji (Vercel):</strong> każde żądanie ma
              maksymalnie <Mono>30 s</Mono> (<Mono>maxDuration = 30</Mono>) —
              po tym czasie funkcja jest przerywana i klient dostaje błąd.
            </li>
            <li>
              <strong>Limity dostawcy modelu:</strong> narzędzie{" "}
              <Mono>ask_therapist</Mono> woła API xAI (Grok) — jeśli ten
              provider zwróci błąd przekroczenia limitu, propaguje się on jako
              błąd narzędzia (nie jest to ograniczenie nałożone przez Aurę).
            </li>
          </ul>
        </Card>

        {/* Narzędzia */}
        <Card id="narzedzia">
          <h2 className="text-lg font-bold text-[#1A1A2E]">Narzędzia</h2>
          <p className="mt-2 text-[14px] text-[#5A5A6E]">
            Serwer udostępnia 3 narzędzia (odpowiedniki endpointów API). Każde
            działa per użytkownik i zwraca wynik jako tekst (JSON).
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Narzędzie</Th>
                  <Th>Argumenty</Th>
                  <Th>Odpowiednik API</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>
                    <Mono>create_entry</Mono>
                  </Td>
                  <Td>
                    <Mono>content</Mono> (wym.), <Mono>mood</Mono> 1–5,{" "}
                    <Mono>date</Mono> YYYY-MM-DD
                  </Td>
                  <Td>
                    <Mono>POST /api/entries</Mono>
                  </Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>ask_therapist</Mono>
                  </Td>
                  <Td>
                    <Mono>question</Mono> (wym.), <Mono>day</Mono> YYYY-MM-DD
                  </Td>
                  <Td>
                    <Mono>POST /api/therapist/ask</Mono>
                  </Td>
                </tr>
                <tr>
                  <Td>
                    <Mono>get_day_entry</Mono>
                  </Td>
                  <Td>
                    <Mono>date</Mono> YYYY-MM-DD (wym.)
                  </Td>
                  <Td>
                    <Mono>GET /api/entries/day/[date]</Mono>
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
            Przykład (JSON-RPC tools/call)
          </h3>
          <div className="mt-2">
            <Code>{`{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_entry",
    "arguments": { "content": "Dziś było spokojnie", "mood": 4 }
  }
}`}</Code>
          </div>

          <p className="mt-4 rounded-lg bg-[#F2F1EC] px-4 py-3 text-[13px] text-[#5A5A6E]">
            <strong>Strefa czasowa dnia wpisu.</strong> Gdy nie podasz{" "}
            <Mono>date</Mono>/<Mono>day</Mono>, „dziś" liczone jest według
            zegara serwera w <Mono>UTC</Mono>, nie w Twojej strefie lokalnej —
            blisko północy czasu polskiego może to więc wskazywać inny dzień
            niż na Twoim zegarku. Gdy podasz <Mono>date</Mono> jawnie, wpis
            zapisywany jest z <Mono>createdAt</Mono> ustawionym na{" "}
            <Mono>12:00:00 UTC</Mono> tego dnia (południe), co chroni przed
            przesunięciem daty przy późniejszej konwersji na strefy lokalne.
          </p>

          <p className="mt-3 text-[13px] text-[#9B9BAD]">
            Szczegóły pól i kody błędów — patrz{" "}
            <Link
              href="/docs"
              className="text-[#1A1A2E] underline underline-offset-2"
            >
              dokumentacja API
            </Link>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
