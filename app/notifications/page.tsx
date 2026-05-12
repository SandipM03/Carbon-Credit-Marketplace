"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionFromDocumentCookie } from "../lib/session";
import type { Id } from "../../convex/_generated/dataModel";

export default function NotificationsPage() {
  const [session, setSession] = useState<{ userId: string; role: "farmer" | "buyer" | "admin" } | null>(null);

  useEffect(() => {
    setSession(getSessionFromDocumentCookie());
  }, []);

  const userId = session?.userId as Id<"users"> | null;
  const notifications = useQuery(
    api.notifications.listByUser,
    userId ? { userId } : "skip",
  );
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const guardMessage = useMemo(() => {
    if (!session) {
      return "No active session. Please login to view notifications.";
    }
    return null;
  }, [session]);

  const filtered = useMemo(() => {
    if (!notifications) {
      return null;
    }
    if (filter === "unread") {
      return notifications.filter((n) => !n.readAt);
    }
    return notifications;
  }, [notifications, filter]);

  const categoryCounts = useMemo(() => {
    if (!notifications) {
      return {};
    }
    return notifications.reduce<Record<string, number>>((acc, notif) => {
      acc[notif.category] = (acc[notif.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [notifications]);

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case "status":
        return "Status Updates";
      case "purchase":
        return "Buyer Interest";
      case "recommendation":
        return "Recommendations";
      case "inquiry":
        return "Inquiries";
      default:
        return cat;
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "status":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "purchase":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "recommendation":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "inquiry":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 pb-16 pt-12">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--leaf)]">
          Notifications
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
          Your messages
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Stay updated on land approvals, buyer interest, and recommendations.
        </p>
      </header>

      {guardMessage && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
          {guardMessage}
        </div>
      )}

      {notifications && (
        <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--forest)]">
                Categories
              </h2>
              <p className="text-sm text-black/60">
                Filter notifications by type.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <span key={cat} className={`rounded-full px-3 py-1 text-xs font-semibold border ${categoryColor(cat)}`}>
                  {categoryLabel(cat)} ({count})
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[color:var(--forest)]">
            Messages
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                filter === "all"
                  ? "bg-[color:var(--forest)] text-white"
                  : "border border-black/10 text-black/70"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                filter === "unread"
                  ? "bg-[color:var(--forest)] text-white"
                  : "border border-black/10 text-black/70"
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {!filtered && (
            <div className="rounded-2xl border border-black/10 bg-white px-6 py-6 text-sm text-black/60">
              Loading notifications...
            </div>
          )}
          {filtered?.length === 0 && (
            <div className="rounded-2xl border border-black/10 bg-white px-6 py-6 text-sm text-black/60">
              No {filter === "unread" ? "unread " : ""}notifications yet.
            </div>
          )}
          {filtered?.map((notif) => (
            <div
              key={notif._id}
              className={`rounded-2xl border p-4 ${categoryColor(notif.category)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-current">{notif.title}</p>
                  <p className="mt-1 text-sm text-current/80">{notif.message}</p>
                  <p className="mt-2 text-xs text-current/60">
                    {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                    {new Date(notif.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                {notif.link && (
                  <a
                    href={notif.link}
                    className="rounded-full bg-current/20 px-3 py-1 text-xs font-semibold text-current hover:bg-current/30"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
