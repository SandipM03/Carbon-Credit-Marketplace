"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { setSessionCookies, type Role } from "../lib/session";

export default function RegisterPage() {
  const register = useMutation(api.users.register);
  const users = useQuery(api.users.list);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("farmer");
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!name.trim() || !phone.trim()) {
      setStatus("Name and phone are required.");
      return;
    }

    if (password.trim().length < 6) {
      setStatus("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    try {
      const userId = await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() ? email.trim() : undefined,
        role,
        password: password.trim(),
      });

      setSessionCookies(userId, role);
      window.location.href = `/${role}`;
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Registration failed. Please try again.",
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 pb-16 pt-12">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--leaf)]">
          Phase 1
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
          Register account
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Create a Farmer, Buyer, or Admin account, then continue with role-based access.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/10 bg-white/80 p-6"
        >
          <div className="grid gap-4">
            <label className="text-sm font-medium text-black/70">
              Full name
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Priya Sharma"
                required
              />
            </label>

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
              Email (optional)
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="e.g. name@email.com"
              />
            </label>

            <label className="text-sm font-medium text-black/70">
              Role
              <select
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
              >
                <option value="farmer">Farmer</option>
                <option value="buyer">Buyer</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label className="text-sm font-medium text-black/70">
              Password
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Minimum 6 characters"
                required
              />
            </label>

            <label className="text-sm font-medium text-black/70">
              Confirm password
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
              Create account
            </button>
            <a
              className="rounded-full border border-black/15 px-5 py-3 text-sm text-black/70"
              href="/login"
            >
              Already have an account?
            </a>
          </div>
          <p className="mt-3 text-sm text-black/60">{status ?? "Password is required."}</p>
        </form>

        <aside className="rounded-3xl border border-black/10 bg-white/80 p-6">
          <h2 className="text-lg font-semibold text-[color:var(--forest)]">
            Recent registrations
          </h2>
          <p className="mt-2 text-sm text-black/60">
            Showing the latest 20 users from Convex.
          </p>
          <div className="mt-4 space-y-3 text-sm text-black/70">
            {!users && <p>Loading users...</p>}
            {users?.length === 0 && <p>No users yet.</p>}
            {users?.map((user) => (
              <div key={user._id} className="rounded-2xl bg-[color:var(--mist)] px-4 py-3">
                <p className="font-semibold text-[color:var(--forest)]">{user.name}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">{user.role}</p>
                <p className="text-xs text-black/60">{user.phone}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
