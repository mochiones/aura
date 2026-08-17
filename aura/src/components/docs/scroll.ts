/**
 * Skroluje do sekcji o danym id. Layout renderuje treść dwukrotnie (osobny
 * <main> dla desktopu i mobile), więc to samo id istnieje w DOM podwójnie —
 * wybieramy WIDOCZNĄ kopię (ukryta przez `display:none` ma `offsetParent === null`).
 *
 * Uwaga: używamy scrollu natychmiastowego (`behavior: "auto"`). `behavior: "smooth"`
 * bywa ignorowane dla zagnieżdżonych kontenerów `overflow-y-auto` (nasz przypadek —
 * scroll-kontenerem jest <main>, nie okno), więc smooth potrafi nic nie zrobić.
 */
export function scrollToVisibleId(id: string): void {
  const nodes = document.querySelectorAll(`[id="${id}"]`);
  const el = Array.from(nodes).find(
    (n) => (n as HTMLElement).offsetParent !== null
  ) as HTMLElement | undefined;
  el?.scrollIntoView({ behavior: "auto", block: "start" });
}
