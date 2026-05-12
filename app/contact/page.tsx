"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionFromDocumentCookie } from "../lib/session";
import type { Id } from "../../convex/_generated/dataModel";

export default function ContactAdminPage() {
  const [session, setSession] = useState<{ userId: string; role: "farmer" | "buyer" | "admin" } | null>(null);

  useEffect(() => {
    setSession(getSessionFromDocumentCookie());
  }, []);

  const userId = session?.userId as Id<"users"> | null;
  const createInquiry = useMutation(api.inquiries.create);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guardMessage = useMemo(() => {
    if (!session) {
      return "No active session. Please login to contact the admin.";
    }
    if (session.role === "admin") {
      return "Admin accounts should use the admin dashboard for internal communications.";
    }
    return null;
  }, [session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(null);

    if (!userId) {
      setActionMessage("User session missing. Please login again.");
      return;
    }

    const subjectTrimmed = subject.trim();
    const messageTrimmed = message.trim();

    if (!subjectTrimmed) {
      setActionMessage("Subject is required.");
      return;
    }

    if (!messageTrimmed) {
      setActionMessage("Message is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInquiry({
        userId,
        subject: subjectTrimmed,
        message: messageTrimmed,
      });
      setActionMessage("Your message has been sent. Our team will respond shortly.");
      setSubject("");
      setMessage("");
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unable to send message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 pb-16 pt-12">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--leaf)]">
          Support
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
          Contact admin
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Have questions or need assistance? Send a message to our admin team.
        </p>
      </header>

      {guardMessage && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
          {guardMessage}
        </div>
      )}

      {actionMessage && (
        <div
          className={`rounded-3xl border px-6 py-4 text-sm ${
            actionMessage.includes("sent")
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-black/10 bg-white/80 text-black/70"
          }`}
        >
          {actionMessage}
        </div>
      )}

      {!guardMessage && (
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/10 bg-white/80 p-6"
        >
          <div className="grid gap-4">
            <label className="text-sm font-medium text-black/70">
              Subject
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="e.g., Question about land verification"
                disabled={isSubmitting}
              />
            </label>
            <label className="text-sm font-medium text-black/70">
              Message
              <textarea
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Describe your question or concern..."
                disabled={isSubmitting}
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-[color:var(--forest)] px-6 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send message"}
            </button>
          </div>
        </form>
      )}

      <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <h2 className="text-lg font-semibold text-[color:var(--forest)]">
          Common questions
        </h2>
        <div className="mt-4 space-y-3 text-sm text-black/70">
          <div>
            <p className="font-semibold text-black/80">How long does verification take?</p>
            <p className="mt-1 text-black/60">
              Land verification typically takes 5-10 business days after submission.
            </p>
          </div>
          <div>
            <p className="font-semibold text-black/80">Can I edit my land details?</p>
            <p className="mt-1 text-black/60">
              You can update your submission until it's under review by the admin team.
            </p>
          </div>
          <div>
            <p className="font-semibold text-black/80">When will I be notified?</p>
            <p className="mt-1 text-black/60">
              You'll receive notifications as your land progresses through each stage.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
