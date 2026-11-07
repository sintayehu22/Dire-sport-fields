import { notFound } from "next/navigation";
import FacilityDetailsView from "@/src/components/FacilityDetailsView";
import { facilities, getFacilityById } from "@/src/lib/facilities";

export function generateStaticParams() {
  return facilities.map((facility) => ({ id: facility.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const facility = getFacilityById(id);
  if (!facility) return { title: "Facility not found" };
  return {
    title: `${facility.name} — Dire Sport Fields`,
    description: `${facility.description}`,
  };
}

export default async function FacilityPage({ params }) {
  const { id } = await params;
  const facility = getFacilityById(id);
  if (!facility) notFound();
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <FacilityDetailsView facility={facility} />
    </main>
  );
}
