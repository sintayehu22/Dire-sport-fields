import FacilityDetailsView from "@/src/components/FacilityDetailsView";
import { facilities, getFacilityById } from "@/src/lib/facilities";

export function generateStaticParams() {
  return facilities.map((facility) => ({ id: facility.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const facility = getFacilityById(id);
  if (!facility) {
    return {
      title: "Sports Facility — Dire Sport Fields",
      description: "View sports facility details, availability, and reviews in Dire Dawa.",
    };
  }
  return {
    title: `${facility.name} — Dire Sport Fields`,
    description: `${facility.description}`,
  };
}

export default async function FacilityPage({ params }) {
  const { id } = await params;
  const initialFacility = getFacilityById(id) ?? null;
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <FacilityDetailsView facilityId={id} initialFacility={initialFacility} />
    </main>
  );
}
