import { betterAuth } from "better-auth";

// Phase 1: minimal skeleton — no active providers, no session enforcement.
// Phase 2: add database adapter, emailAndPassword, and optional OAuth providers.
export const auth = betterAuth({});
