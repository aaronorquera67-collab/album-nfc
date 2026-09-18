"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.replace("/app");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-arena px-4">
      <div className="w-full max-w-md rounded-3xl border border-surface-border bg-blanco p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-foreground">
            Album <span className="text-tierra">NFC</span>
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Acceso de administrador
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full rounded-xl border border-surface-border bg-white px-4 py-3 text-sm outline-none transition focus:border-tierra"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-foreground"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full rounded-xl border border-surface-border bg-white px-4 py-3 text-sm outline-none transition focus:border-tierra"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-borde bg-blanco px-4 py-3 text-center text-sm text-lust"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex min-h-[48px] items-center justify-center rounded-full bg-tierra px-6 text-sm font-semibold text-blanco transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}