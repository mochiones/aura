# PRD — Aura
## Product Requirements Document | Etap 1: Fundament

---

**Wersja:** 1.1  
**Data:** 2026-06-14  
**Status:** Draft  
**Autor:** Gregory (Product Owner)  
**Platforma docelowa:** Web + Mobile (responsywny)  
**Stack UI:** shadcn/ui · Tailwind CSS · better-auth

| Wersja | Data | Zmiany |
|---|---|---|
| 1.0 | 2026-06-11 | Wersja inicjalna |
| 1.1 | 2026-06-14 | Doprecyzowanie: autoryzacja (Wariant A), lokalizacja JSON, schemat danych (`userId`), wymagania niefunkcjonalne, nawigacja mobile, obsługa błędów, środowiska dev/prod, bezpieczeństwo danych, dostępność Tiptap |

---

## 1. Cel produktu

Aura to prywatna aplikacja do prowadzenia dzienniczka myśli. Umożliwia użytkownikowi szybkie zapisywanie wpisów — tekstowych, ustrukturyzowanych — w jednym, spójnym miejscu. Etap 1 buduje szkielet aplikacji: interfejs, lokalny zapis danych i kompletny CRUD wpisów. W kolejnych etapach zostanie dodana baza danych (backend) oraz warstwa AI analizująca treści wpisów.

---

## 2. Kontekst i uzasadnienie

| Problem | Rozwiązanie (Etap 1) |
|---|---|
| Myśli i refleksje rozpraszają się po notatkach, wiadomościach, kartkach | Jedno miejsce do zapisywania wpisów |
| Brak struktury przy notowaniu nastrojów i kategorii | Ustrukturyzowany wpis: tytuł, treść, tagi, mood |
| Brak możliwości analizy własnych wzorców myślowych | Fundament pod AI w kolejnym etapie |

---

## 3. Użytkownicy

### 3.1 Etap 1 — Single-user bez ekranu logowania (Wariant A)

**Decyzja podjęta:** Etap 1 działa jako aplikacja lokalna, single-user, **bez ekranu logowania i bez sesji**. Użytkownik otwiera aplikację i od razu ma dostęp do swoich wpisów — bez podawania hasła.

`better-auth` zostaje zainstalowane i skonfigurowane w Etapie 1 wyłącznie jako fundament architektoniczny — bez aktywnego flow logowania. Przygotowuje to grunt pod **Etap 2 (multi-user z pełną rejestracją)** bez konieczności przepisywania warstwy autoryzacji.

**Konsekwencja dla schematu danych:** każdy wpis zawiera pole `userId: null` w Etapie 1. W Etapie 2 pole to zostanie wypełnione rzeczywistym ID zalogowanego użytkownika — bez migracji struktury.

### 3.2 Persona
> **Gregory** — projektant, 30–40 lat. Chce zapisywać myśli, refleksje i nastroje w jednym miejscu. Potrzebuje szybkiego dostępu zarówno z komputera, jak i telefonu. Ceni czysty interfejs i nie chce walczyć z narzędziem.

---

## 4. Zakres — Etap 1

### 4.1 In Scope ✅
- Dodawanie nowego wpisu (tytuł, treść rich text, tagi, mood)
- Przeglądanie listy wszystkich wpisów (feed chronologiczny)
- Edytowanie istniejącego wpisu
- Usuwanie wpisu
- Filtrowanie wpisów po tagach i nastroju
- Zapis danych lokalnie w plikach JSON
- Responsywny UI (web + mobile)
- Integracja `better-auth` (szkielet autoryzacji)
- Edytor WYSIWYG (rich text)

### 4.2 Out of Scope ❌ (Etap 2+)
- Backend / baza danych (PostgreSQL, Supabase itp.)
- Synchronizacja między urządzeniami
- Analiza AI / podsumowania
- Multi-user z pełnym flow rejestracji
- Powiadomienia / przypomnienia
- Export danych (PDF, CSV)
- Wyszukiwanie pełnotekstowe

---

## 5. Wymagania funkcjonalne

### 5.1 Wpis (Entry)

Każdy wpis składa się z następujących pól:

| Pole | Typ | Wymagane | Opis |
|---|---|---|---|
| `id` | UUID | auto | Unikalny identyfikator |
| `title` | string | tak | Tytuł wpisu (max 120 znaków) |
| `content` | rich text (HTML) | tak | Treść z edytora WYSIWYG |
| `tags` | string[] | nie | Lista tagów (użytkownik dodaje własne) |
| `mood` | enum | nie | Nastrój (patrz §5.2) |
| `createdAt` | ISO 8601 | auto | Data i godzina utworzenia |
| `updatedAt` | ISO 8601 | auto | Data i godzina ostatniej edycji |
| `userId` | string \| null | auto | `null` w Etapie 1; ID użytkownika w Etapie 2 (multi-user) |

### 5.2 Skala nastroju (Mood)

Pięciostopniowa skala z emoji jako wizualnym wskaźnikiem:

| Wartość | Etykieta | Emoji |
|---|---|---|
| `1` | Bardzo zły | 😞 |
| `2` | Zły | 😕 |
| `3` | Neutralny | 😐 |
| `4` | Dobry | 🙂 |
| `5` | Bardzo dobry | 😄 |

### 5.3 CRUD — wymagania szczegółowe

**Tworzenie wpisu**
- Formularz dostępny z głównego widoku (przycisk CTA — `+ Nowy wpis`)
- Wymagana walidacja: pole `title` i `content` nie mogą być puste
- Po zapisaniu: powrót do listy, wpis pojawia się na górze (sortowanie malejące po `createdAt`)

**Przeglądanie wpisów**
- Widok listy: karta z tytułem, datą, tagami, emoji nastroju i fragmentem treści (max 150 znaków plain text)
- Widok szczegółowy: pełna treść wpisu po kliknięciu karty
- Domyślne sortowanie: od najnowszego do najstarszego

**Edycja wpisu**
- Dostępna z widoku szczegółowego (przycisk `Edytuj`)
- Formularz identyczny jak przy tworzeniu, wstępnie uzupełniony danymi wpisu
- `updatedAt` aktualizuje się automatycznie

**Usuwanie wpisu**
- Dostępne z widoku szczegółowego (przycisk `Usuń`)
- Wymagane potwierdzenie przez dialog modalny: „Czy na pewno chcesz usunąć ten wpis? Tej operacji nie można cofnąć."

### 5.4 Filtrowanie

- Filtrowanie po tagu: kliknięcie tagu na karcie lub w widoku szczegółowym filtruje listę
- Filtrowanie po nastroju: pasek filtrów emoji nad listą wpisów
- Oba filtry mogą być aktywne jednocześnie (AND)
- Przycisk `Wyczyść filtry` przy aktywnym filtrze

### 5.5 Edytor WYSIWYG — Tiptap

We wszystkich miejscach aplikacji, gdzie użytkownik wprowadza lub przegląda sformatowaną treść wpisu, używana jest biblioteka **Tiptap** — jako jedyne i obowiązkowe narzędzie do obsługi rich textu.

**Dotyczy ekranów:**
- Ekran 1 — Dodaj wpis (`/entries/new`) — tryb edycji
- Ekran 1 — Edytuj wpis (`/entries/[id]/edit`) — tryb edycji z wczytaną treścią
- Ekran 3 — Szczegóły wpisu (`/entries/[id]`) — tryb tylko do odczytu (Tiptap read-only, bez toolbara)

**Integracja techniczna:**

Tiptap jest używany w połączeniu z:
- **Next.js** (App Router) — komponent edytora musi być oznaczony jako `"use client"`, ponieważ Tiptap wymaga środowiska przeglądarki
- **shadcn/ui** — toolbar edytora budowany z komponentów shadcn (`Toggle`, `Button`, `Separator`, `Tooltip`) dla spójności wizualnej z resztą aplikacji
- **Tailwind CSS** — stylowanie obszaru edytora i toolbara przez klasy utility; zawartość edytora stylowana przez `@tailwindcss/typography` (klasa `prose`)

**Wymagane pakiety:**
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-link @tailwindcss/typography
```

**Minimalny zestaw rozszerzeń Tiptap (Etap 1):**

| Rozszerzenie | Pakiet | Funkcja |
|---|---|---|
| `StarterKit` | `@tiptap/starter-kit` | Bold, Italic, Strike, Listy, Nagłówki, Blockquote, Historia (undo/redo) |
| `Underline` | `@tiptap/extension-underline` | Podkreślenie |
| `Link` | `@tiptap/extension-link` | Wstawianie i edycja linków |

**Format zapisu treści:**

Tiptap zapisuje treść jako **HTML** (`editor.getHTML()`). Ten format jest przechowywany w polu `content` w pliku JSON i renderowany bezpośrednio w widoku szczegółowym przez Tiptap w trybie `editable: false`.

**Toolbar edytora — elementy:**

```
[ B ] [ I ] [ U ] [ S ]  |  [ H2 ] [ H3 ]  |  [ • ] [ 1. ]  |  [ " ]  |  [ 🔗 ]  |  [ ↩ ] [ ↪ ]
Bold  Ital  Undl  Strike   Heading            Lists            Quote     Link       Undo  Redo
```

Toolbar renderowany jako sticky pasek nad obszarem edytora; na mobile zwijany do jednej linii z przewijaniem poziomym.

**Tryb tylko do odczytu (Ekran 3):**

W widoku szczegółowym wpisu Tiptap inicjalizowany z `editable: false` i `content: entry.content`. Brak toolbara. Treść stylowana przez klasę `prose prose-neutral` z `@tailwindcss/typography`, dopasowaną kolorystycznie do palety Aury.

---

## 6. Wymagania niefunkcjonalne

| Kategoria | Wymaganie |
|---|---|
| **Responsywność** | Pełna obsługa ekranów od 375px (mobile) do 1440px+ (desktop) |
| **Wydajność (Etap 1)** | Ładowanie listy wpisów < 300ms przy lokalnym JSON (do ~500 wpisów) |
| **Wydajność (Etap 2)** | Ładowanie listy wpisów < 500ms przy zapytaniu do bazy danych; paginacja po 20 wpisów |
| **Dostępność** | WCAG 2.1 AA — szczegóły w §6.1 |
| **Persystencja** | Dane w pliku `/data/entries.json` (serwer Next.js); nie resetują się po odświeżeniu strony; niedostępne publicznie przez przeglądarkę |
| **Rozszerzalność** | Interfejs `EntryRepository` jako jedyna warstwa dostępu do danych — podmiana JSON → DB nie wymaga zmian w UI ani logice biznesowej |
| **Bezpieczeństwo danych** | Etap 1: dane przechowywane lokalnie, nie są wysyłane do żadnego zewnętrznego serwisu. Etap 2: transmisja wyłącznie przez HTTPS; dane w bazie szyfrowane at-rest |
| **Środowiska** | `development`: lokalny serwer Next.js, plik `/data/entries.json` na dysku. `production` (Etap 1): **wyłącznie lokalnie** — Vercel i podobne platformy nie mają trwałego systemu plików, co wyklucza JSON na produkcji; deploy na Vercel dopiero od Etapu 2 (baza danych) |

### 6.1 Dostępność — szczegóły (WCAG 2.1 AA)

| Element | Wymaganie |
|---|---|
| **Kontrast tekstu** | Minimum 4.5:1 dla tekstu normalnego, 3:1 dla tekstu dużego (weryfikacja przez Tailwind color tokens) |
| **Fokus klawiaturowy** | Wszystkie interaktywne elementy osiągalne przez Tab; widoczny outline focusu (shadcn/ui dostarcza domyślnie) |
| **Mood picker** | `ToggleGroup` z atrybutami `role="radiogroup"` i `aria-label="Wybierz nastrój"`; każde emoji opatrzone `aria-label` (np. „Bardzo dobry nastrój") |
| **Edytor Tiptap** | Toolbar z atrybutami `aria-label` na każdym przycisku (np. „Pogrubienie", „Kursywa"); obszar edytora z `role="textbox"` i `aria-multiline="true"` |
| **Dialogi** | `AlertDialog` (usuwanie) z `aria-labelledby` i `aria-describedby`; fokus przenoszony automatycznie do dialogu przy otwarciu |
| **Toasty** | `role="status"` lub `aria-live="polite"` — czytnik ekranu ogłasza potwierdzenie bez przerywania pracy |

---

## 7. Architektura danych (Etap 1 — lokalny JSON)

### 7.1 Lokalizacja i dostęp do pliku

Plik `entries.json` przechowywany jest w katalogu `/data/entries.json` względem korzenia projektu Next.js. **Nie jest umieszczany w `/public`** — pliki w `/public` są dostępne publicznie przez przeglądarkę, co stanowiłoby poważne naruszenie prywatności danych dziennika.

Dostęp do pliku odbywa się **wyłącznie przez API Routes Next.js** (`/app/api/entries/route.ts`) z użyciem Node.js `fs/promises`. Klient (przeglądarka) nigdy nie czyta ani nie zapisuje pliku bezpośrednio — wszystkie operacje przechodzą przez API.

```
projekt/
├── app/
│   └── api/
│       └── entries/
│           ├── route.ts          # GET (lista), POST (nowy wpis)
│           └── [id]/
│               └── route.ts     # GET, PUT, DELETE dla pojedynczego wpisu
├── data/
│   └── entries.json              # Plik danych — NIGDY w /public
└── ...
```

### 7.2 Struktura pliku `entries.json`

```json
{
  "entries": [
    {
      "id": "uuid-v4",
      "title": "Tytuł wpisu",
      "content": "<p>Treść w formacie HTML z edytora WYSIWYG</p>",
      "tags": ["praca", "refleksja"],
      "mood": 4,
      "createdAt": "2026-06-11T08:30:00.000Z",
      "updatedAt": "2026-06-11T09:00:00.000Z",
      "userId": null
    }
  ]
}
```

### 7.2 Warstwa dostępu do danych (Data Layer)

Należy zdefiniować abstrakcyjny interfejs `EntryRepository` z metodami:

```
getAll(): Promise<Entry[]>
getById(id: string): Promise<Entry | null>
create(data: NewEntry): Promise<Entry>
update(id: string, data: Partial<Entry>): Promise<Entry>
delete(id: string): Promise<void>
```

W Etapie 1 implementacja tego interfejsu korzysta z JSON. W Etapie 2 zostaje podmieniona na implementację bazodanową — UI i logika biznesowa nie wymagają zmian.

---

## 8. Stack technologiczny

| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| Framework | **Next.js 14+** (App Router) | SSR/SSG, routing, API routes — naturalny wybór przy shadcn/ui |
| UI Components | **shadcn/ui** | Gotowe, dostępne komponenty; pełna kontrola nad kodem |
| Style | **Tailwind CSS** | Utility-first, spójny z shadcn/ui |
| Autoryzacja | **better-auth** | Fundament pod multi-user w Etapie 2 |
| Edytor rich text | **Tiptap** | Modularny, React-friendly, rozszerzalny |
| Persystencja (Etap 1) | **JSON + fs (Node.js)** | Prostota; wymiana na DB bez zmiany interfejsu |
| Zarządzanie stanem | **React Context / Zustand** | Lokalne operacje CRUD |
| Język | **TypeScript** | Typowanie danych, bezpieczeństwo refaktoryzacji |

---

## 9. Nawigacja i widoki

Aplikacja Aura składa się z **trzech głównych ekranów** w Etapie 1.

**Nawigacja mobilna (≤ 768px) — Bottom Navigation Bar:**

Stały pasek na dole ekranu z trzema pozycjami:

| Ikona | Etykieta | Cel |
|---|---|---|
| 📋 (List) | Wpisy | Ekran 2 — Lista wpisów (`/`) |
| ✏️ (PenLine) | Nowy wpis | Ekran 1 — Dodaj wpis (`/entries/new`) |
| 👤 (User) | Profil | Placeholder — aktywny od Etapu 2 |

Aktywna pozycja wyróżniona kolorem akcentu `#7C6FCD`. Ikony z biblioteki `lucide-react` (już dostępna w shadcn/ui).

**Nawigacja desktop (≥ 769px) — Sticky Header:**

Poziomy pasek na górze z nazwą aplikacji „Aura" po lewej i przyciskiem `+ Nowy wpis` po prawej. Bez bocznego sidebara w Etapie 1.

---

### Ekran 1 — Dodaj wpis (`/entries/new`)

**Cel:** Szybkie uchwycenie myśli i nastroju z dzisiaj.

Ekran skupiony na jednej akcji — stworzeniu nowego wpisu. Domyślnie wypełnia pole daty wartością „dziś". Układ prosty i skupiony, bez rozpraszaczy.

**Elementy ekranu:**
- Nagłówek: „Jak się dziś czujesz?" + aktualna data (generowana automatycznie)
- **Mood picker** — 5 emoji w rzędzie, wybór jednym tapnięciem; wybrany nastrój podświetlony kolorem akcentu z palety §14.2
- Pole `Tytuł` — input tekstowy (max 120 znaków)
- Pole `Treść` — edytor WYSIWYG (Tiptap), zajmuje większość ekranu
- Pole `Tagi` — input z chipami (wpisz + Enter aby dodać tag)
- Przycisk `Zapisz wpis` — pill-shape, kolor akcentu `#7C6FCD`, pełna szerokość na mobile

**Zachowanie:**
- Po zapisaniu: toast potwierdzający + przekierowanie na Ekran 2 (lista wpisów)
- Walidacja inline: tytuł i treść wymagane; błąd pojawia się pod polem bez page reload
- Ekran dostępny też jako edycja istniejącego wpisu (`/entries/[id]/edit`) — formularz identyczny, wstępnie wypełniony

**Routing:** `/entries/new` · `/entries/[id]/edit`

---

### Ekran 2 — Lista wpisów (`/`)

**Cel:** Przegląd wszystkich wpisów w formie chronologicznego feedu.

Główny widok aplikacji, punkt startowy po otwarciu. Widoczna historia wpisów posortowana od najnowszego.

**Elementy ekranu:**
- Nagłówek: „Twoje wpisy" + liczba wszystkich wpisów
- **Pasek filtrów** — 5 emoji nastrojów (kliknięcie filtruje listę) + chipy tagów
- Przycisk `+ Nowy wpis` — sticky, widoczny zawsze (FAB na mobile, przycisk w headerze na desktop)
- **Karty wpisów** — każda karta zawiera:
  - Lewy kolorowy pasek w kolorze nastroju (z palety §14.2)
  - Tytuł wpisu (`text-lg font-semibold`)
  - Data + emoji nastroju (`text-sm text-muted-foreground`)
  - Fragment treści (max 2 linie, `line-clamp-2`)
  - Tagi jako Badge chipy
- **Pusty stan:** ilustracja + komunikat „Brak wpisów. Zacznij od dodania pierwszego." + CTA

**Zachowanie:**
- Kliknięcie karty → Ekran 3 (szczegóły wpisu)
- Filtry mogą być łączone (mood AND tag)
- Przycisk `Wyczyść filtry` pojawia się gdy filtr jest aktywny

**Routing:** `/`

---

### Ekran 3 — Szczegóły wpisu (`/entries/[id]`)

**Cel:** Przeglądanie pełnej treści poprzedniego wpisu.

Widok tylko do odczytu z pełną treścią wpisu. Czyste, przestronne — jak kartka dziennika.

**Elementy ekranu:**
- Nagłówek: strzałka powrotu `←` + data wpisu
- Emoji nastroju + kolorowy chip z nazwą nastroju (np. „😄 Bardzo dobry")
- Tytuł wpisu (`text-2xl font-bold`)
- Tagi jako Badge chipy
- Pełna treść wpisu (renderowany HTML z edytora WYSIWYG)
- Separator
- Przyciski akcji: `Edytuj` (ghost button) · `Usuń` (destructive, czerwony)

**Zachowanie:**
- `Edytuj` → Ekran 1 w trybie edycji (`/entries/[id]/edit`)
- `Usuń` → AlertDialog z potwierdzeniem → usunięcie → powrót na Ekran 2 z toastem
- `←` → powrót na Ekran 2

**Routing:** `/entries/[id]`

---

### Schemat nawigacji

```
[Ekran 2] Lista wpisów  /
  ├── [+ Nowy wpis] ────────────→ [Ekran 1] /entries/new
  │     └── [Zapisz] ───────────→ [Ekran 2] /
  ├── [Karta wpisu] ────────────→ [Ekran 3] /entries/[id]
  │     ├── [Edytuj] ───────────→ [Ekran 1] /entries/[id]/edit → zapis → [Ekran 3]
  │     ├── [Usuń + potwierdź] ─→ [Ekran 2] /
  │     └── [←] ────────────────→ [Ekran 2] /
  └── [Filtr mood / tag] ───────→ [Ekran 2] filtrowany (ten sam widok)
```

---

## 10. Wymagania UI / UX

- **Nawigacja:** sticky header z nazwą aplikacji i przyciskiem `+ Nowy wpis`
- **Karty wpisów:** czytelna hierarchia: tytuł (duży) → data + mood emoji → tagi → fragment treści
- **Tagi:** klikalne chipy z możliwością dodania nowych w formularzu (input + Enter)
- **Mood picker:** 5 emoji w rzędzie, wybierane kliknięciem; aktywny stan wyraźnie zaznaczony
- **Puste stany:** jeśli brak wpisów lub brak wyników filtrowania — czytelna ilustracja/komunikat z CTA
- **Walidacja formularza:** inline, bez pełnego page reload; błędy pokazane pod polem
- **Loader:** spinner lub skeleton przy operacjach async (odczyt/zapis JSON)
- **Toast notifications:** potwierdzenie po zapisaniu, edycji i usunięciu wpisu

---

## 11. Autoryzacja — better-auth (Etap 1)

**Decyzja: Wariant A — brak ekranu logowania.**

W Etapie 1 aplikacja działa bez sesji i bez formularza logowania. `better-auth` zostaje zainstalowane i skonfigurowane minimalnie — gotowe do rozbudowy w Etapie 2.

**Konfiguracja Etap 1:**
```bash
npm install better-auth
```

Plik konfiguracyjny `lib/auth.ts` tworzony z minimalną konfiguracją (credentials provider wyłączony, brak aktywnych providerów). Nie generujemy żadnych ekranów logowania/rejestracji.

**Wersja:** better-auth `^1.x` (najnowsza stabilna). Sprawdź aktualną wersję na [better-auth.com](https://better-auth.com).

**Przygotowanie pod Etap 2:**
- Pole `userId: null` obecne w każdym wpisie od Etapu 1
- API Routes zabezpieczone przez middleware `better-auth` (zwraca 401 gdy brak sesji) — aktywowane w Etapie 2
- Planowane providery w Etapie 2: **Email + hasło** (credentials) jako podstawowy; OAuth (Google) opcjonalnie

**Czego NIE robimy w Etapie 1:**
- Brak ekranu `/login`, `/register`, `/forgot-password`
- Brak middleware chroniącego trasy (wszystkie trasy publiczne)
- Brak tokenów sesji ani cookies autoryzacyjnych

---

## 12. Obsługa błędów

Każda operacja na pliku JSON może zakończyć się niepowodzeniem. Poniżej minimalne wymagania obsługi błędów dla Etapu 1:

| Scenariusz | Zachowanie aplikacji |
|---|---|
| Brak pliku `entries.json` przy starcie | Aplikacja tworzy pusty plik automatycznie (`{ "entries": [] }`) |
| Błąd zapisu (np. brak uprawnień do dysku) | Toast z komunikatem „Nie udało się zapisać wpisu. Spróbuj ponownie." Dane w formularzu nie są kasowane |
| Uszkodzony JSON (nieprawidłowy format) | Strona błędu z komunikatem „Dane są uszkodzone. Skontaktuj się z administratorem." + logowanie błędu do konsoli serwera |
| Wpis o podanym `id` nie istnieje (GET/PUT/DELETE) | API zwraca `404`; UI pokazuje komunikat „Wpis nie został znaleziony" i przekierowuje na listę |
| Próba zapisu pustego tytułu lub treści | Blokada po stronie klienta (walidacja inline) — request do API nie jest wysyłany |
| Timeout lub brak odpowiedzi API | Toast „Coś poszło nie tak. Sprawdź połączenie i spróbuj ponownie." po 10 sekundach |

---

## 13. Roadmapa etapów

| Etap | Zakres | Status |
|---|---|---|
| **Etap 1** | Szkielet aplikacji, CRUD, lokalny JSON, UI, better-auth | 🔵 Planowany |
| **Etap 2** | Backend + baza danych (PostgreSQL / Supabase), multi-user, synchronizacja | ⬜ Przyszły |
| **Etap 3** | Warstwa AI: analiza wpisów, podsumowania, wzorce nastrojów | ⬜ Przyszły |

---

## 14. Kryteria akceptacji — Etap 1

Etap 1 jest zakończony, gdy spełnione są **wszystkie** poniższe warunki:

- [ ] Użytkownik może dodać wpis z tytułem, treścią rich text, tagami i nastrojem
- [ ] Wpisy zapisują się do pliku JSON i przetrwają odświeżenie strony
- [ ] Lista wpisów wyświetla karty posortowane od najnowszego
- [ ] Filtrowanie po tagu i nastroju działa poprawnie
- [ ] Użytkownik może edytować i usunąć wpis (z potwierdzeniem)
- [ ] Aplikacja jest responsywna na mobile (375px) i desktop (1280px+)
- [ ] Edytor WYSIWYG obsługuje: bold, italic, listy, nagłówki, cytaty, linki
- [ ] better-auth jest zainstalowane i skonfigurowane (nawet jeśli Etap 1 nie wymaga pełnego logowania)
- [ ] Struktura `EntryRepository` umożliwia podmianę JSON → DB w Etapie 2 bez zmiany warstwy UI
- [ ] Brak błędów TypeScript w trybie strict

---

## 15. Referencje wizualne

### 14.1 Kierunek stylistyczny

Aura ma wyglądać jak spokojna, osobista przestrzeń — nie jak produktywna aplikacja do zadań. Wzorzec wizualny to **minimalizm z pasytelowymi akcentami**: dużo białego tła, miękkie kolory tła sekcji, kolorowe akcenty zarezerwowane wyłącznie dla elementów funkcjonalnych (ikony nastrojów, przyciski CTA, tagi).

Referencja dostarczona przez Product Ownera (wellness app UI):
- Jasne, kremowo-białe tło całej aplikacji
- Karty z delikatnym cieniem i zaokrąglonymi rogami (border-radius: 16–20px)
- Kolorowe ikony/akcenty na neutralnym tle — nie odwrotnie
- Typografia: duży, pogrubiony tytuł sekcji + mniejszy, szary podtytuł
- Przyciski CTA w kolorze akcentu z białym tekstem, mocno zaokrąglone (pill shape)
- Brak ostrych krawędzi, brak ciemnych tła sekcji

### 14.2 Paleta kolorów — Mood Colors

Każdy nastrój ma przypisany kolor akcentu. Kolory używane wyłącznie jako akcenty (ikona, obramowanie karty, chip tagu) — **nigdy jako pełne tło ekranu**.

| Nastrój | Emoji | Nazwa | Hex | Zastosowanie |
|---|---|---|---|---|
| Bardzo zły | 😞 | Dusty Rose | `#F2A7A7` | Ikona, lewy pasek karty |
| Zły | 😕 | Soft Peach | `#F7C59F` | Ikona, lewy pasek karty |
| Neutralny | 😐 | Lavender Mist | `#C5B8F0` | Ikona, lewy pasek karty |
| Dobry | 🙂 | Sky Blue | `#A8D5E2` | Ikona, lewy pasek karty |
| Bardzo dobry | 😄 | Sage Green | `#A8D5B5` | Ikona, lewy pasek karty |

**Kolory neutralne (UI base):**

| Rola | Hex | Opis |
|---|---|---|
| Tło aplikacji | `#F7F6F3` | Ciepła biel / kremowe tło |
| Tło karty | `#FFFFFF` | Czysta biel |
| Tekst główny | `#1A1A2E` | Głęboki granat zamiast czarnego |
| Tekst pomocniczy | `#9B9BAD` | Szary dla dat, podtytułów |
| Obramowanie / divider | `#EBEBF0` | Bardzo jasny szary |
| CTA / akcent główny | `#7C6FCD` | Miękki fiolet — kolor przewodni Aury |

### 14.3 Komponenty shadcn/ui — mapowanie na widoki

| Widok / element | Komponent shadcn/ui |
|---|---|
| Karta wpisu | `Card`, `CardHeader`, `CardContent` |
| Formularz nowego wpisu | `Dialog` lub osobna strona z `Form` |
| Tagi | `Badge` (variant: outline) |
| Mood picker | `ToggleGroup` |
| Potwierdzenie usunięcia | `AlertDialog` |
| Powiadomienia (toast) | `Sonner` / `Toast` |
| Filtrowanie | `Button` (variant: ghost, aktywny: secondary) |
| Loader | `Skeleton` |
| Nawigacja | `Sheet` (mobile drawer) / sticky header |

Dokumentacja komponentów: [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)

### 14.4 Typografia

- **Font:** Geist Sans (domyślny w Next.js) lub Inter — oba dobrze współpracują z shadcn/ui
- **Tytuł wpisu na karcie:** `text-lg font-semibold` (ok. 18px, semi-bold)
- **Data i mood:** `text-sm text-muted-foreground` (ok. 13px, szary)
- **Treść preview:** `text-sm` (14px), max 2 linie z `line-clamp-2`
- **CTA button:** `text-sm font-medium`

---

## 16. Otwarte decyzje

| # | Decyzja | Opcje | Termin |
|---|---|---|---|
| ~~1~~ | ~~Autoryzacja w Etapie 1~~ | ✅ **Podjęta:** Wariant A (bez logowania) | — |
| ~~2~~ | ~~Hosting Etap 1~~ | ✅ **Podjęta:** wyłącznie lokalnie (Vercel od Etapu 2) | — |
| 3 | Biblioteka do zarządzania stanem | React Context / Zustand / TanStack Query | Sprint 1 |
| 4 | Font aplikacji | Geist Sans (domyślny Next.js) / Inter | Sprint 1 |
| 5 | OAuth provider w Etapie 2 | Google / GitHub / tylko credentials | Przed startem Etapu 2 |

---

*Dokument będzie aktualizowany po podjęciu otwartych decyzji i na starcie każdego kolejnego etapu.*
