"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { archiveFacility, saveFacility } from "@/src/lib/admin";
import { getManagedFacilities } from "@/src/lib/facilityStore";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  MetricCard,
  PageHeader,
  Panel,
  StatusPill,
  SuccessBanner,
  formatMoney,
  inputClass,
} from "@/src/components/admin/AdminUi";

const EMPTY_FACILITY = {
  id: "",
  name: "",
  category: "football",
  activities: ["football"],
  description: "",
  neighborhood: "",
  latitude: null,
  longitude: null,
  plusCode: "",
  googleMapsUrl: "",
  images: ["/images/fields/field-placeholder.svg"],
  pricingType: "contact",
  hourlyPrice: null,
  perPersonPrice: null,
  sessionPrice: null,
  capacity: null,
  maxPlayers: 22,
  openingHours: "",
  phone: "",
  amenities: [],
  availability: "contact",
  verificationStatus: "unverified",
  notes: "",
  availableTimeSlots: [],
  isPublished: false,
  source: "custom",
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function toForm(facility) {
  return {
    ...facility,
    latitude: facility.latitude ?? "",
    longitude: facility.longitude ?? "",
    hourlyPrice: facility.hourlyPrice ?? "",
    perPersonPrice: facility.perPersonPrice ?? "",
    sessionPrice: facility.sessionPrice ?? "",
    capacity: facility.capacity ?? "",
    maxPlayers: facility.maxPlayers ?? 22,
    imagesText: (facility.images ?? []).join("\n"),
    amenitiesText: (facility.amenities ?? []).join(", "),
    slotsText: (facility.availableTimeSlots ?? []).join(", "),
  };
}

function listFromText(value) {
  return [...new Set(String(value).split(/[\n,]+/).map((item) => item.trim()).filter(Boolean))];
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}

function toPayload(form) {
  return {
    id: form.id,
    name: form.name,
    category: form.category,
    activities: [form.category],
    description: form.description,
    neighborhood: form.neighborhood,
    latitude: numberOrNull(form.latitude),
    longitude: numberOrNull(form.longitude),
    plusCode: form.plusCode || null,
    googleMapsUrl: form.googleMapsUrl || null,
    images: listFromText(form.imagesText),
    pricingType: form.pricingType,
    hourlyPrice: numberOrNull(form.hourlyPrice),
    perPersonPrice: numberOrNull(form.perPersonPrice),
    sessionPrice: numberOrNull(form.sessionPrice),
    capacity: numberOrNull(form.capacity),
    maxPlayers: numberOrNull(form.maxPlayers),
    openingHours: form.openingHours || null,
    phone: form.phone || null,
    amenities: listFromText(form.amenitiesText),
    availability: form.availability,
    verificationStatus: form.verificationStatus,
    notes: form.notes,
    availableTimeSlots: listFromText(form.slotsText),
    isPublished: Boolean(form.isPublished),
  };
}

function FacilityEditor({ initialFacility, isNew, onClose, onSaved }) {
  const [form, setForm] = useState(() => toForm(initialFacility));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveFacility(toPayload(form), form.source);
      await onSaved(isNew ? "Facility created." : "Facility changes published.");
    } catch (nextError) {
      setError(nextError?.message ?? "The facility could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const labelClass = "block text-xs font-bold text-slate-300";
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-0 backdrop-blur-sm sm:p-5">
      <div className="ml-auto min-h-full w-full max-w-3xl border-l border-white/10 bg-[#0a1712] shadow-2xl sm:min-h-0 sm:rounded-2xl sm:border">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.08] bg-[#0a1712]/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">{isNew ? "New listing" : "Edit listing"}</p>
            <h2 className="mt-1 text-xl font-black text-white">{isNew ? "Add a sports facility" : form.name}</h2>
            <p className="mt-1 text-xs text-slate-500">Changes are validated on the server and recorded in the activity log.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5">Close</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 p-5 sm:p-7">
          <ErrorBanner message={error} />
          <section>
            <h3 className="text-sm font-bold text-white">Identity and publishing</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Facility name
                <input
                  required
                  value={form.name}
                  onChange={(event) => {
                    update("name", event.target.value);
                    if (isNew && (!form.id || form.id === slugify(form.name))) update("id", slugify(event.target.value));
                  }}
                  className={`mt-2 ${inputClass}`}
                />
              </label>
              <label className={labelClass}>
                Facility ID
                <input
                  required
                  value={form.id}
                  disabled={!isNew}
                  onChange={(event) => update("id", slugify(event.target.value))}
                  className={`mt-2 font-mono ${inputClass}`}
                />
              </label>
              <label className={labelClass}>
                Primary sport
                <select value={form.category} onChange={(event) => update("category", event.target.value)} className={`mt-2 ${inputClass}`}>
                  <option value="football">Football</option>
                  <option value="basketball">Basketball</option>
                  <option value="volleyball">Volleyball</option>
                </select>
              </label>
              <label className={labelClass}>
                Verification
                <select value={form.verificationStatus} onChange={(event) => update("verificationStatus", event.target.value)} className={`mt-2 ${inputClass}`}>
                  <option value="verified">Verified</option>
                  <option value="reported">Reported</option>
                  <option value="unverified">Unverified</option>
                </select>
              </label>
            </div>
            <label className={`${labelClass} mt-4`}>
              Description
              <textarea required minLength={10} rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} className={`mt-2 py-3 ${inputClass}`} />
            </label>
            <label className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <span>
                <span className="block text-sm font-bold text-white">Published on the customer site</span>
                <span className="mt-1 block text-xs text-slate-500">Unpublished facilities remain in the admin catalog only.</span>
              </span>
              <input type="checkbox" checked={Boolean(form.isPublished)} onChange={(event) => update("isPublished", event.target.checked)} className="h-5 w-5 shrink-0 accent-emerald-400" />
            </label>
          </section>

          <section className="border-t border-white/[0.07] pt-6">
            <h3 className="text-sm font-bold text-white">Location and contact</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>Neighborhood<input required value={form.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Plus code<input value={form.plusCode ?? ""} onChange={(event) => update("plusCode", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Latitude<input type="number" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Longitude<input type="number" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={`${labelClass} sm:col-span-2`}>Google Maps URL<input type="url" value={form.googleMapsUrl ?? ""} onChange={(event) => update("googleMapsUrl", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Phone<input value={form.phone ?? ""} onChange={(event) => update("phone", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Opening hours<input value={form.openingHours ?? ""} onChange={(event) => update("openingHours", event.target.value)} placeholder="e.g. Mon–Sun, 6:00 AM–8:00 PM" className={`mt-2 ${inputClass}`} /></label>
            </div>
          </section>

          <section className="border-t border-white/[0.07] pt-6">
            <h3 className="text-sm font-bold text-white">Pricing and availability</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>Pricing model<select value={form.pricingType} onChange={(event) => update("pricingType", event.target.value)} className={`mt-2 ${inputClass}`}><option value="hourly">Hourly</option><option value="per_person">Per person</option><option value="per_session">Per session</option><option value="contact">Contact for price</option></select></label>
              <label className={labelClass}>Availability<select value={form.availability} onChange={(event) => update("availability", event.target.value)} className={`mt-2 ${inputClass}`}><option value="bookable">Online bookable</option><option value="contact">Request / contact</option><option value="unavailable">Unavailable</option></select></label>
              <label className={labelClass}>Capacity<input type="number" min="1" value={form.capacity} onChange={(event) => update("capacity", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Hourly price (ETB)<input type="number" min="1" value={form.hourlyPrice} onChange={(event) => update("hourlyPrice", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Per-person price (ETB)<input type="number" min="1" value={form.perPersonPrice} onChange={(event) => update("perPersonPrice", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Session price (ETB)<input type="number" min="1" value={form.sessionPrice} onChange={(event) => update("sessionPrice", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Maximum booking players<input type="number" min="1" max="30" value={form.maxPlayers} onChange={(event) => update("maxPlayers", event.target.value)} className={`mt-2 ${inputClass}`} /></label>
              <label className={`${labelClass} sm:col-span-2`}>Bookable hour slots<input value={form.slotsText} onChange={(event) => update("slotsText", event.target.value)} placeholder="06:00, 07:00, 16:00" className={`mt-2 ${inputClass}`} /><span className="mt-1.5 block font-normal text-slate-600">Whole-hour EAT values. Required when online bookable.</span></label>
            </div>
          </section>

          <section className="border-t border-white/[0.07] pt-6">
            <h3 className="text-sm font-bold text-white">Presentation details</h3>
            <div className="mt-4 grid gap-4">
              <label className={labelClass}>Image paths or HTTPS URLs<textarea required rows={3} value={form.imagesText} onChange={(event) => update("imagesText", event.target.value)} className={`mt-2 py-3 ${inputClass}`} /><span className="mt-1.5 block font-normal text-slate-600">One image per line. Existing local placeholders may be used until a verified image is available.</span></label>
              <label className={labelClass}>Amenities<input value={form.amenitiesText} onChange={(event) => update("amenitiesText", event.target.value)} placeholder="Parking, changing rooms, floodlights" className={`mt-2 ${inputClass}`} /></label>
              <label className={labelClass}>Internal/public notes<textarea rows={3} value={form.notes ?? ""} onChange={(event) => update("notes", event.target.value)} className={`mt-2 py-3 ${inputClass}`} /></label>
            </div>
          </section>

          <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-white/[0.08] bg-[#0a1712]/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-xl border border-white/10 px-5 text-sm font-bold text-slate-300 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-emerald-400 px-5 text-sm font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-50">{saving ? "Saving securely…" : isNew ? "Create facility" : "Save changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [archiving, setArchiving] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      setFacilities(await getManagedFacilities());
    } catch (nextError) {
      setError(nextError?.message ?? "Facilities could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    return facilities.filter((facility) => {
      if (search && ![facility.name, facility.neighborhood, facility.id].join(" ").toLowerCase().includes(search)) return false;
      if (category !== "all" && facility.category !== category) return false;
      if (visibility === "published" && (facility.isPublished === false || facility.archivedAt)) return false;
      if (visibility === "unpublished" && facility.isPublished !== false && !facility.archivedAt) return false;
      return true;
    });
  }, [facilities, queryText, category, visibility]);

  async function handleSaved(message) {
    setEditing(null);
    setSuccess(message);
    await load();
  }

  async function handleArchive(facility) {
    if (!window.confirm(`Unpublish and archive ${facility.name}? Existing bookings and reports will be preserved.`)) return;
    setArchiving(facility.id);
    setError("");
    try {
      await archiveFacility(toPayload(toForm(facility)), facility.source);
      setSuccess(`${facility.name} was archived.`);
      await load();
    } catch (nextError) {
      setError(nextError?.message ?? "The facility could not be archived.");
    } finally {
      setArchiving("");
    }
  }

  if (loading && facilities.length === 0) return <LoadingState label="Loading facility catalog…" />;

  const published = facilities.filter((item) => item.isPublished !== false && !item.archivedAt).length;
  const bookable = facilities.filter((item) => item.availability === "bookable" && item.isPublished !== false).length;
  const managed = facilities.filter((item) => item.hasManagedRecord).length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Facility management"
        title="Facility catalog"
        description="Create, verify, publish, update, or archive venues. The original code catalog remains the baseline; Firestore stores only administrator-managed records and overrides."
        actions={<button type="button" onClick={() => { setEditing({ ...EMPTY_FACILITY }); setIsNew(true); setSuccess(""); }} className="min-h-11 rounded-xl bg-emerald-400 px-5 text-sm font-extrabold text-[#07110d] hover:bg-emerald-300">+ Add facility</button>}
      />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Catalog facilities" value={facilities.length} detail="No generated or sample venues" color="blue" symbol="F" />
        <MetricCard label="Published" value={published} detail={`${bookable} accept online booking`} color="emerald" symbol="✓" />
        <MetricCard label="Managed in Firestore" value={managed} detail="Custom listings and catalog overrides" color="violet" symbol="DB" />
      </section>

      <Panel>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <input type="search" value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search name, ID, or neighborhood…" className={inputClass} />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}><option value="all">All sports</option><option value="football">Football</option><option value="basketball">Basketball</option><option value="volleyball">Volleyball</option></select>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className={inputClass}><option value="all">Any visibility</option><option value="published">Published</option><option value="unpublished">Unpublished / archived</option></select>
        </div>
      </Panel>

      <Panel title={`${filtered.length} facilit${filtered.length === 1 ? "y" : "ies"}`} description="Every action is applied through an admin-only Cloud Function.">
        {filtered.length === 0 ? (
          <EmptyState title="No facilities match these filters" description="Clear a filter or add a verified facility listing." />
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((facility) => (
              <article key={facility.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#091510]">
                <div className="relative h-36 bg-black/20">
                  {/* Native image supports administrator-provided HTTPS URLs without changing Next image hosts. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={facility.images?.[0]} alt="" className="h-full w-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091510] via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <StatusPill status={facility.isPublished !== false && !facility.archivedAt ? "published" : "archived"} label={facility.isPublished !== false && !facility.archivedAt ? "Published" : "Unpublished"} />
                    <StatusPill status={facility.availability === "bookable" ? "confirmed" : "draft"} label={facility.availability} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-white">{facility.name}</h3>
                      <p className="mt-1 truncate text-xs text-slate-500">{facility.neighborhood}</p>
                    </div>
                    <span className="rounded-lg border border-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">{facility.source}</span>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div><dt className="text-slate-600">Sport</dt><dd className="mt-1 capitalize text-slate-300">{facility.category}</dd></div>
                    <div><dt className="text-slate-600">Price</dt><dd className="mt-1 text-slate-300">{facility.hourlyPrice ? `${formatMoney(facility.hourlyPrice)} / hr` : "Contact"}</dd></div>
                    <div><dt className="text-slate-600">Verification</dt><dd className="mt-1 capitalize text-slate-300">{facility.verificationStatus}</dd></div>
                    <div><dt className="text-slate-600">Slots</dt><dd className="mt-1 text-slate-300">{facility.availableTimeSlots?.length ?? 0}</dd></div>
                  </dl>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => { setEditing(facility); setIsNew(false); setSuccess(""); }} className="min-h-9 rounded-lg bg-emerald-400 text-[11px] font-extrabold text-[#07110d] hover:bg-emerald-300">Edit</button>
                    {facility.isPublished !== false && !facility.archivedAt ? <Link href={`/facilities/${facility.id}`} className="flex min-h-9 items-center justify-center rounded-lg border border-white/10 text-[11px] font-bold text-slate-300 hover:bg-white/5">View</Link> : <span className="flex min-h-9 items-center justify-center rounded-lg border border-white/[0.05] text-[10px] text-slate-700">Hidden</span>}
                    <button type="button" disabled={archiving === facility.id || facility.isPublished === false} onClick={() => handleArchive(facility)} className="min-h-9 rounded-lg border border-rose-400/20 text-[11px] font-bold text-rose-300 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-40">Archive</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {editing && (
        <FacilityEditor
          initialFacility={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
