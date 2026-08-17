"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToVisibleId } from "./scroll";

/**
 * Po wejściu na /docs lub /docs/mcp z kotwicą (#create, #narzedzia, ...) —
 * np. z drugiej podstrony — skroluje do sekcji. Same-page kliknięcia obsługuje
 * już DocsSidebar; to pokrywa nawigację między podstronami.
 */
export function HashScroller() {
  const pathname = usePathname();
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const id = decodeURIComponent(hash);
    // Poczekaj na render treści przed skrolem.
    requestAnimationFrame(() => scrollToVisibleId(id));
  }, [pathname]);
  return null;
}
