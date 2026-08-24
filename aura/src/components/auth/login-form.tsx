"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type Mode = "signin" | "signup";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = "E-mail jest wymagany";
    if (!password) newErrors.password = "Hasło jest wymagane";
    else if (mode === "signup" && password.length < 6)
      newErrors.password = "Hasło musi mieć co najmniej 6 znaków";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast.error("Nie udało się zalogować przez Google. Spróbuj ponownie.");
      setIsGoogleLoading(false);
    }
    // Sukces: przeglądarka jest przekierowywana do Google, nic więcej tu się nie dzieje.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const supabase = createBrowserSupabaseClient();
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("Nieprawidłowy e-mail lub hasło.");
          return;
        }
        window.location.href = "/";
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          toast.error(error.message || "Nie udało się utworzyć konta.");
          return;
        }
        if (data.session) {
          window.location.href = "/";
        } else {
          toast.success("Sprawdź skrzynkę e-mail, aby potwierdzić rejestrację.");
          setMode("signin");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F3] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Aura</h1>
          <p className="mt-1 text-sm text-[#9B9BAD]">
            {mode === "signin" ? "Zaloguj się do swojego dziennika" : "Załóż konto"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#EBEBF0] bg-white p-6 shadow-sm">
          <Button
            type="button"
            variant="outline"
            disabled={isGoogleLoading}
            onClick={handleGoogleLogin}
            className="w-full h-11 rounded-xl border-[#DDDBD6] text-[#1A1A2E]"
          >
            {isGoogleLoading ? "Łączenie z Google…" : "Zaloguj się przez Google"}
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#EBEBF0]" />
            <span className="text-xs text-[#9B9BAD]">lub e-mailem</span>
            <div className="h-px flex-1 bg-[#EBEBF0]" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#1A1A2E]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="ty@przyklad.pl"
                className={`rounded-xl border-[#EBEBF0] bg-white h-11 text-base ${errors.email ? "border-destructive" : ""}`}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#1A1A2E]">
                Hasło
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={`rounded-xl border-[#EBEBF0] bg-white h-11 text-base ${errors.password ? "border-destructive" : ""}`}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[#1A1A2E] hover:bg-[#333333] text-white h-11 text-base font-medium"
            >
              {isSubmitting
                ? "Chwileczkę…"
                : mode === "signin"
                  ? "Zaloguj się"
                  : "Zarejestruj się"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setErrors({});
            }}
            className="mt-4 w-full text-center text-sm text-[#9B9BAD] hover:text-[#1A1A2E] transition-colors"
          >
            {mode === "signin"
              ? "Nie masz konta? Zarejestruj się"
              : "Masz już konto? Zaloguj się"}
          </button>
        </div>
      </div>
    </div>
  );
}
