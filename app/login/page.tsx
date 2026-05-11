"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { setSessionCookies } from "../lib/session";

export default function LoginPage() {
  const login = useMutation(api.users.login);
  const [redirectPath] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get("from");
  });
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    try {
      const user = await login({
        phone: phone.trim(),
        password: password.trim(),
      });

      setSessionCookies(user.userId, user.role);
      const safeRedirect =
        redirectPath && redirectPath.startsWith("/") ? redirectPath : `/${user.role}`;
      window.location.href = safeRedirect;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed. Please try again.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 pb-16 pt-12">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--leaf)]">
          Phase 1
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
          Login
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Access role-based dashboards as Farmer, Buyer, or Admin.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-black/10 bg-white/80 p-6"
      >
        <div className="grid gap-4">
          <label className="text-sm font-medium text-black/70">
            Mobile number
            <input
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="e.g. +91 90000 00000"
              required
            />
          </label>

          <label className="text-sm font-medium text-black/70">
            Password
            <input
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-full bg-[color:var(--forest)] px-6 py-3 text-sm font-semibold text-white"
          >
            Login
          </button>
          <a
            className="rounded-full border border-black/15 px-5 py-3 text-sm text-black/70"
            href="/register"
          >
            Create account
          </a>
        </div>
        <p className="mt-3 text-sm text-black/60">{status ?? "Enter your phone and password."}</p>
      </form>
    </div>
  );
}
