import Image from "next/image";
import CityIcon from "@/src/components/CityIcon";
import CitySection from "@/src/components/CitySection";
import { CITY_CULTURE } from "@/src/lib/city";

function CultureTile({ tile }) {
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 transition duration-200 hover:-translate-y-1 hover:border-amber-400/40 ${
        tile.photo ? "" : "justify-center p-6"
      }`}
    >
      {tile.photo ? (
        <>
          <div className="relative h-52 overflow-hidden">
            <Image
              src={tile.photo.src}
              alt={tile.photo.alt}
              width={768}
              height={432}
              loading="lazy"
              className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-6">
            <h3 className="text-lg font-bold tracking-tight text-white font-display">
              {tile.title}
            </h3>
            <p className="text-sm leading-7 text-slate-400">{tile.text}</p>
            <p className="mt-auto pt-3 text-[10px] leading-4 text-slate-600">
              {tile.photo.credit}
              {tile.photo.sceneNote ? ` — ${tile.photo.sceneNote.toLowerCase()}` : ""}
            </p>
          </div>
        </>
      ) : (
        <>
          <CityIcon
            icon="culture"
            className="h-7 w-7 text-amber-400/70 transition group-hover:text-amber-300"
          />
          <h3 className="mt-4 text-lg font-bold tracking-tight text-white font-display">
            {tile.title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">{tile.text}</p>
        </>
      )}
    </article>
  );
}

export default function CityCulture() {
  return (
    <CitySection
      id="culture"
      tone="warm"
      eyebrow="Culture & daily life"
      title="The city's heartbeat"
      subtitle="Dire Dawa is less a sight-list than a way of life: coffee ceremonies, mix-and-match architecture, and a hundred years of communities living block by block. Linger here before you go exploring."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {CITY_CULTURE.map((tile) => (
          <CultureTile key={tile.id} tile={tile} />
        ))}
      </div>
    </CitySection>
  );
}
