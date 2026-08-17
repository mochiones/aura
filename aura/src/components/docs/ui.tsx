/** Współdzielone komponenty prezentacyjne dokumentacji (API + MCP). */
import type React from "react";

/** Znaczek metody HTTP (GET/POST). */
export function Method({ method }: { method: "GET" | "POST" }) {
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
export function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[#1A1A2E] px-4 py-3 text-[12.5px] leading-relaxed text-[#E8E6DF]">
      <code>{children}</code>
    </pre>
  );
}

/** Sekcja-karta. */
export function Card({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-6 rounded-2xl border border-[#EBEBF0] bg-white p-5 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-[#EBEBF0] px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9B9BAD]">
      {children}
    </th>
  );
}

export function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="border-b border-[#EBEBF0]/70 px-3 py-2 align-top text-[13px] text-[#1A1A2E]">
      {children}
    </td>
  );
}

/** Fragment kodu inline. */
export function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[12.5px] text-[#1A1A2E]">
      {children}
    </code>
  );
}
