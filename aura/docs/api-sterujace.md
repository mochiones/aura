# API sterujące Aury

Zestaw endpointów do programistycznego sterowania aplikacją Aura. Trzy proste
operacje, każda **per użytkownik**: dodanie wpisu, zapytanie do psychoterapeuty
(Freud), odczyt wpisu na konkretny dzień.

- Bazowy URL: `https://aura-eightup.vercel.app`
- Format: JSON (`Content-Type: application/json`)

---

## Autoryzacja

Każdy endpoint identyfikuje użytkownika po nagłówku:

```
Authorization: Bearer <token>
```

Token jest mapowany na `userId` przez zmienną środowiskową `AURA_API_TOKENS`
(w `.env.local`, poza repo). Jest to JSON `token → userId`:

```
AURA_API_TOKENS={"twoj-sekretny-token":"669b081e-c8fd-4ef0-aeda-e9953c6b0b53"}
```

Tryby:

| Sytuacja | Zachowanie |
| --- | --- |
| Nagłówek poprawny (token znany) | Tryb **user** — operacje tylko na wpisach tego użytkownika. |
| Nagłówek jest, token nieznany | **401 Unauthorized**. |
| Brak nagłówka | Tryb **lokalny** — operacje tylko na wpisach współdzielonych (`userId = null`, dane z Etapu 1). |

> Dlaczego token, a nie sesja: Etap 1 nie ma jeszcze bazy użytkowników ani
> logowania w kodzie. Statyczna mapa token→userId to pomost do czasu Fazy 2
> (Supabase Auth). `userId` jest już zmapowany na `SUPABASE_OWNER_ID` dla spójności.

W przykładach poniżej `TOKEN` = wartość Twojego tokenu.

---

## Limity zapytań

API nie ma własnego rate limitingu (brak limitu liczby zapytań na minutę per
token czy per IP). W praktyce obowiązują dwa inne ograniczenia:

- **Timeout funkcji (Vercel):** endpoint `POST /api/therapist/ask` ma
  maksymalnie `30 s` (`maxDuration = 30`) — po tym czasie funkcja jest
  przerywana i klient dostaje błąd.
- **Limity dostawcy modelu:** ten sam endpoint woła API xAI (Grok) — jeśli
  provider zwróci błąd przekroczenia limitu, propaguje się on jako `500`
  (nie jest to ograniczenie nałożone przez Aurę).

---

## 1. Dodanie wpisu

Tworzy nowy wpis. Domyślnie na dziś; opcjonalnie z oceną nastroju.

```
POST /api/entries
```

### Body

| Pole | Typ | Wymagane | Domyślnie | Opis |
| --- | --- | --- | --- | --- |
| `content` | string | tak | — | Treść wpisu (tekst lub HTML). |
| `mood` | int 1–5 \| null | nie | `null` | Ocena nastroju. Gdy brak — zapisywane `null`. |
| `date` | string `YYYY-MM-DD` | nie | dziś | Dzień wpisu. Nadpisuje domyślne „dziś". |
| `title` | string | nie | `Wpis z dnia <data>` | Tytuł wpisu. |
| `tags` | string[] | nie | `[]` | Lista tagów. |

### Odpowiedzi

- `201 Created` — utworzony wpis (patrz kształt niżej).
- `400 Bad Request` — brak `content`, `mood` spoza 1–5, lub zły format `date`.
- `401 Unauthorized` — nieznany token.

### Przykład

```bash
curl -X POST https://aura-eightup.vercel.app/api/entries \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Dziś było spokojnie","mood":4}'
```

```json
{
  "id": "26f345ec-9608-491d-ac1c-cfb0a5062bc9",
  "title": "Wpis z dnia 2026-08-17",
  "content": "Dziś było spokojnie",
  "tags": [],
  "mood": 4,
  "createdAt": "2026-08-17T12:00:00.000Z",
  "updatedAt": "2026-08-17T20:32:26.766Z",
  "userId": "669b081e-c8fd-4ef0-aeda-e9953c6b0b53"
}
```

> **Strefa czasowa dnia wpisu.** Gdy nie podasz `date`, „dziś" liczone jest
> według zegara serwera w **UTC**, nie w Twojej strefie lokalnej — blisko
> północy czasu polskiego może to wskazywać inny dzień niż na Twoim zegarku.
> Gdy podasz `date` jawnie, `createdAt` ustawiane jest na
> `<date>T12:00:00.000Z` (południe UTC — unika przesunięcia dnia przy
> konwersji stref czasowych).

---

## 2. Zapytanie do psychoterapeuty

Zadaje pytanie cyfrowemu terapeucie (Freud) i zwraca gotową odpowiedź tekstową
(bez streamingu). Model sam sięga po wpisy użytkownika jako kontekst.

```
POST /api/therapist/ask
```

### Body

| Pole | Typ | Wymagane | Domyślnie | Opis |
| --- | --- | --- | --- | --- |
| `question` | string | tak | — | Pytanie do agenta. |
| `day` | string `YYYY-MM-DD` | nie | dziś | Dzień jako kontekst rozmowy. Domyślnie dzisiejszy. |
| `persona` | string | nie | `"freud"` | Persona agenta. |

Domyślnie pytanie zadawane jest w kontekście **dzisiejszego** dnia (tak jakby
użytkownik miał otwarty dzisiejszy wpis). „Dzisiejszy" liczony jest według
zegara serwera w **UTC** (patrz uwaga o strefie czasowej przy endpoincie 1).
Podanie `day` przełącza kontekst na inny dzień. Jeśli na wskazany dzień nie ma
wpisu, agent jest o tym informowany i może sięgnąć po szerszą historię.

### Odpowiedzi

- `200 OK` — `{ "answer": string, "persona": string }`.
- `400 Bad Request` — brak `question` lub zły format `day`.
- `401 Unauthorized` — nieznany token.
- `500` — brak klucza `XAI_API_KEY` w środowisku lub błąd modelu.

### Przykład

```bash
curl -X POST https://aura-eightup.vercel.app/api/therapist/ask \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Jak zmieniał się mój nastrój w tym tygodniu?","day":"2026-08-14"}'
```

```json
{
  "answer": "Spojrzałem na twój tydzień...",
  "persona": "freud"
}
```

---

## 3. Wpis na konkretny dzień

Zwraca informację, czy na dany dzień jest wpis, wraz z jego treścią i nastrojem.
**Zawsze 200** — brak wpisu to `exists: false`, nie błąd.

```
GET /api/entries/day/{date}
```

`{date}` w formacie `YYYY-MM-DD`. Dzień może mieć wiele wpisów — zwracany jest
**najnowszy**.

### Odpowiedzi

- `200 OK` — `{ "date": string, "exists": boolean, "entry": Entry | null }`.
- `400 Bad Request` — zły format daty.
- `401 Unauthorized` — nieznany token.

### Przykłady

```bash
curl https://aura-eightup.vercel.app/api/entries/day/2026-08-10 \
  -H "Authorization: Bearer TOKEN"
```

Jest wpis:

```json
{
  "date": "2026-08-10",
  "exists": true,
  "entry": {
    "id": "b2c8d5f3-0a42-4e79-9b31-2d4e6f708192",
    "title": "Poniedziałkowy rozruch",
    "content": "<p>Ciężko było wstać...</p>",
    "tags": ["praca"],
    "mood": 3,
    "createdAt": "2026-08-10T18:40:33.000Z",
    "updatedAt": "2026-08-10T18:40:33.000Z",
    "userId": "669b081e-c8fd-4ef0-aeda-e9953c6b0b53"
  }
}
```

Brak wpisu:

```json
{ "date": "1999-01-01", "exists": false, "entry": null }
```

---

## Kształt obiektu `Entry`

| Pole | Typ | Opis |
| --- | --- | --- |
| `id` | string (UUID) | Identyfikator wpisu. |
| `title` | string | Tytuł. |
| `content` | string | Treść (tekst lub HTML z edytora). |
| `tags` | string[] | Tagi. |
| `mood` | 1–5 \| null | Nastrój (lub `null`, gdy nie podano). |
| `createdAt` | string (ISO 8601) | Data utworzenia. Dzień = `createdAt[0:10]`. |
| `updatedAt` | string (ISO 8601) | Data ostatniej modyfikacji. |
| `userId` | string \| null | Właściciel (`null` = wpis współdzielony z Etapu 1). |

## Kody błędów (zbiorczo)

| Kod | Znaczenie |
| --- | --- |
| `400` | Niepoprawne dane wejściowe (brak wymaganego pola, zły `mood`, zła data). |
| `401` | Podano nieznany token w nagłówku `Authorization`. |
| `500` | Błąd serwera (np. brak `XAI_API_KEY` dla endpointu 2, uszkodzone dane). |

## Uwagi

- Endpointy są rozszerzeniem istniejących tras `/api/*` (nie osobna wersja `/v1`).
- Izolacja per-user: bez tokenu widać tylko wpisy współdzielone (`userId = null`);
  z tokenem — tylko wpisy danego użytkownika.
- Pliki: `src/lib/api-auth.ts`, `src/app/api/entries/route.ts`,
  `src/app/api/therapist/ask/route.ts`, `src/app/api/entries/day/[date]/route.ts`.
