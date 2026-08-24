import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Logowanie/rejestracja mają własny, pełnoekranowy layout — bez chrome'u appki. */
export function isAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/auth");
}
