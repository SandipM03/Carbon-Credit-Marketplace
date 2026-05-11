"use client";

import Link from "next/link";
import {
  clearSessionCookies,
  getSessionFromDocumentCookie,
  type Role,
} from "../lib/session";

const ROLE_LABELS: Record<Role, string> = {
  farmer: "Farmer dashboard",
  buyer: "Buyer dashboard",
  admin: "Admin console",
};

export function RoleNavigation() {
  const session = getSessionFromDocumentCookie();
  const role = session?.role ?? null;

  const handleLogout = () => {
    clearSessionCookies();
    window.location.href = "/login";
  };

  return (
    <header className="mx-auto mt-6 w-full max-w-6xl px-6">
      <nav className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/70 p-4 text-sm shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="font-semibold uppercase tracking-[0.25em] text-[color:var(--forest)]"
        >
          GreenCredits
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-black/70">
          {!role && (
            <>
              <Link className="hover:text-black" href="/register">
                Register
              </Link>
              <Link className="hover:text-black" href="/login">
                Login
              </Link>
            </>
          )}
          {role && (
            <>
              <Link className="hover:text-black" href={`/${role}`}>
                {ROLE_LABELS[role]}
              </Link>
              <Link className="hover:text-black" href="/register">
                Add account
              </Link>
              <button
                type="button"
                className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
