"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { TokenManager } from "@/components/docs/token-manager";
import { Skeleton } from "@/components/ui/skeleton";

/** Panel tokenów wymaga realnej sesji — bez niej pokazujemy zachętę do logowania. */
export function TokenManagerGate() {
  const { user, isLoading } = useSupabaseUser();

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-[#EBEBF0] bg-[#F7F6F3] p-5 sm:p-6">
        <h2 className="text-lg font-bold text-[#1A1A2E]">Twój token dostępu</h2>
        <p className="mt-2 text-[13px] text-[#5A5A6E]">
          Zaloguj się, aby wygenerować token dostępu do swoich danych.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#1A1A2E] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#333333]"
        >
          <LogIn className="h-4 w-4" />
          Zaloguj się
        </Link>
      </section>
    );
  }

  return <TokenManager />;
}
