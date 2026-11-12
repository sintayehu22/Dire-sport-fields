"use client";

import { useCallback, useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  getAdminProfile,
  getPlatformSettings,
  updateAdminProfile,
  updatePlatformSettings,
} from "@/src/lib/admin";
import { adminAuth } from "@/src/lib/firebase";
import {
  ErrorBanner,
  LoadingState,
  PageHeader,
  Panel,
  SuccessBanner,
  formatAdminTime,
  inputClass,
} from "@/src/components/admin/AdminUi";

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const [profileData, settingsData] = await Promise.all([
        getAdminProfile(),
        getPlatformSettings(),
      ]);
      setProfile(profileData);
      setSettings(settingsData);
    } catch (nextError) {
      setError(nextError?.message ?? "Administrator settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    setSuccess("");
    try {
      await updateAdminProfile({ displayName: profile.displayName, phone: profile.phone });
      setSuccess("Administrator profile updated.");
      await load();
    } catch (nextError) {
      setError(nextError?.message ?? "Profile could not be updated.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSettings(event) {
    event.preventDefault();
    setSavingSettings(true);
    setError("");
    setSuccess("");
    try {
      await updatePlatformSettings({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        maintenanceMessage: settings.maintenanceMessage,
        bookingEnabled: Boolean(settings.bookingEnabled),
      });
      setSuccess("Platform settings updated. Booking availability now applies to server-side booking and facility-request creation.");
      await load();
    } catch (nextError) {
      setError(nextError?.message ?? "Platform settings could not be updated.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handlePasswordReset() {
    if (!adminAuth || !profile?.email) return;
    setResetting(true);
    setError("");
    setSuccess("");
    try {
      await sendPasswordResetEmail(adminAuth, profile.email);
      setSuccess("Firebase sent a password reset email to the signed-in administrator address.");
    } catch (nextError) {
      setError(nextError?.message ?? "Password reset email could not be sent.");
    } finally {
      setResetting(false);
    }
  }

  if (loading && (!profile || !settings)) return <LoadingState label="Loading secure settings…" />;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Admin settings and profile" title="Workspace settings" description="Manage the signed-in administrator profile and safe public platform controls. Payment credentials and webhook secrets are intentionally excluded and remain in Firebase Secret Manager." />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      {profile && settings && (
        <section className="grid gap-5 xl:grid-cols-2">
          <Panel title="Administrator profile" description="Connected to this Firebase Authentication UID.">
            <form onSubmit={handleProfile} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-300">Display name<input required minLength={2} maxLength={100} value={profile.displayName} onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))} className={`mt-2 ${inputClass}`} /></label>
                <label className="text-xs font-bold text-slate-300">Phone<input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} className={`mt-2 ${inputClass}`} /></label>
              </div>
              <label className="block text-xs font-bold text-slate-300">Authentication email<input value={profile.email} disabled className={`mt-2 ${inputClass}`} /></label>
              <label className="block text-xs font-bold text-slate-300">Firebase UID<input value={profile.uid} disabled className={`mt-2 font-mono ${inputClass}`} /></label>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.05] p-4"><p className="text-xs font-bold text-emerald-200">Role: Administrator</p><p className="mt-1 text-xs leading-5 text-slate-500">Access is granted by the protected <code className="text-emerald-300">users/{profile.uid}</code> record when its role is <code className="text-emerald-300">admin</code> and status is <code className="text-emerald-300">active</code>.</p></div>
              <div className="grid grid-cols-2 gap-3"><button type="button" disabled={resetting} onClick={handlePasswordReset} className="min-h-11 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">{resetting ? "Sending…" : "Send password reset"}</button><button type="submit" disabled={savingProfile} className="min-h-11 rounded-xl bg-emerald-400 text-xs font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-50">{savingProfile ? "Saving…" : "Save profile"}</button></div>
              {profile.updatedAt && <p className="text-[10px] text-slate-600">Profile last updated {formatAdminTime(profile.updatedAt)}</p>}
            </form>
          </Panel>

          <Panel title="Platform operations" description="Safe customer-facing and booking availability controls.">
            <form onSubmit={handleSettings} className="space-y-4 p-5">
              <label className="block text-xs font-bold text-slate-300">Platform name<input required minLength={2} maxLength={80} value={settings.platformName} onChange={(event) => setSettings((current) => ({ ...current, platformName: event.target.value }))} className={`mt-2 ${inputClass}`} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-300">Support email<input type="email" value={settings.supportEmail} onChange={(event) => setSettings((current) => ({ ...current, supportEmail: event.target.value }))} className={`mt-2 ${inputClass}`} /></label>
                <label className="text-xs font-bold text-slate-300">Support phone<input value={settings.supportPhone} onChange={(event) => setSettings((current) => ({ ...current, supportPhone: event.target.value }))} className={`mt-2 ${inputClass}`} /></label>
              </div>
              <label className="block text-xs font-bold text-slate-300">Maintenance / booking notice<textarea rows={3} maxLength={500} value={settings.maintenanceMessage} onChange={(event) => setSettings((current) => ({ ...current, maintenanceMessage: event.target.value }))} placeholder="Optional explanation shown when bookings are paused" className={`mt-2 py-3 ${inputClass}`} /></label>
              <label className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${settings.bookingEnabled ? "border-emerald-400/20 bg-emerald-400/[0.05]" : "border-rose-400/20 bg-rose-400/[0.05]"}`}>
                <span><span className="block text-sm font-bold text-white">Accept new bookings and facility requests</span><span className="mt-1 block text-xs leading-5 text-slate-500">Disabling this is enforced by Cloud Functions. Existing bookings and payment verification continue safely.</span></span>
                <input type="checkbox" checked={Boolean(settings.bookingEnabled)} onChange={(event) => setSettings((current) => ({ ...current, bookingEnabled: event.target.checked }))} className="h-5 w-5 shrink-0 accent-emerald-400" />
              </label>
              <button type="submit" disabled={savingSettings} className="min-h-11 w-full rounded-xl bg-emerald-400 text-xs font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-50">{savingSettings ? "Saving settings…" : "Save platform settings"}</button>
              {settings.updatedAt && <p className="text-[10px] text-slate-600">Settings last updated {formatAdminTime(settings.updatedAt)}</p>}
            </form>
          </Panel>

          <Panel title="Protected infrastructure" description="These values cannot be viewed or changed from the browser." className="xl:col-span-2">
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              {[{ title: "Chapa secret key", detail: "Firebase Secret Manager · server only" }, { title: "Webhook signing secret", detail: "Firebase Secret Manager · server only" }, { title: "Admin role assignment", detail: "Protected Firestore users record" }].map((item) => <div key={item.title} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><p className="text-xs font-bold text-white">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p></div>)}
            </div>
          </Panel>
        </section>
      )}
    </div>
  );
}
