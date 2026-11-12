"use client";

import Link from "next/link";
import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/src/lib/firebase";

const initialForm = {
  name: "",
  email: "",
  topic: "general",
  message: "",
};

function getSubmissionErrorMessage(error) {
  const connectionErrors = [
    "unavailable",
    "firestore/unavailable",
    "network-request-failed",
    "firestore/network-request-failed",
  ];

  if (connectionErrors.includes(error?.code)) {
    return "We could not connect to the feedback service. Check your connection and try again.";
  }

  return "Your feedback could not be sent right now. Please try again later.";
}

export default function FeedbackPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!db) {
        throw new Error("Firestore is not configured.");
      }

      const feedbackDocument = await addDoc(collection(db, "feedback"), {
        name: form.name.trim(),
        email: form.email.trim(),
        topic: form.topic,
        message: form.message.trim(),
        createdAt: new Date(),
      });

      setForm(initialForm);
      setSuccess(
        `Thank you for your feedback. Your reference is ${feedbackDocument.id}.`,
      );
    } catch (submissionError) {
      console.error("Unable to submit feedback:", submissionError);
      setError(getSubmissionErrorMessage(submissionError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white"
        >
          ← Back to Dire Sport Fields
        </Link>

        <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            Customer feedback
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
            Help us improve the platform
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Tell us about a booking, facility, payment, or technical issue. Do
            not include passwords or payment card details.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-200">
                Name
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-semibold text-slate-200">
                Email
                <input
                  required
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  disabled={isSubmitting}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-200">
              Topic
              <select
                value={form.topic}
                onChange={(event) => updateField("topic", event.target.value)}
                disabled={isSubmitting}
                className={inputClass}
              >
                <option value="general">General feedback</option>
                <option value="booking">Booking</option>
                <option value="payment">Payment</option>
                <option value="facility">Facility information</option>
                <option value="technical">Technical problem</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-200">
              Message
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={7}
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Describe what happened and include a booking reference when relevant."
                disabled={isSubmitting}
                className={`${inputClass} py-3`}
              />
            </label>

            <div aria-live="polite">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </p>
              )}
              {success && (
                <p
                  role="status"
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
                >
                  {success}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="min-h-12 w-full rounded-xl bg-emerald-500 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sending feedback…" : "Send feedback"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
