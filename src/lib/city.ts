/**
 * Dire Dawa city discovery data — landmarks, markets, parks, culture.
 *
 * Data policy (same discipline as facilities.ts):
 *  - Photographs come from Wikimedia Commons under CC BY / CC BY-SA licences and
 *    are bundled locally in /public/images/city. Every photo is used only for the
 *    place/scene it documents; places without a verified photo use a designed
 *    "photo coming soon" tile instead of a stand-in image.
 *  - Locations are linked with Google Maps *name search* links (and name-based
 *    embeds) unless a verified pin exists. Coordinates are NOT guessed.
 *  - Descriptions stay conservative: nothing historical that cannot be checked
 *    is stated, and venues that need on-site confirmation say so.
 */

export type CityPlaceKind = "landmark" | "market" | "park";

export type CityPhoto = {
  src: string;
  alt: string;
  /** Short human credit shown where relevant */
  credit: string;
  /** Set when the photo shows a typical city scene rather than the exact venue */
  sceneNote?: string;
};

export type CityPlace = {
  id: string;
  name: string;
  nativeName?: string;
  kind: CityPlaceKind;
  kindLabel: string;
  tagline: string;
  description: string;
  neighborhood: string;
  /** Query used for the Google Maps search link and the map embed */
  mapsQuery: string;
  photo?: CityPhoto;
  /** only for facility-backed places (verified pins) */
  facilityId?: string;
};

const photo = (
  src: string,
  alt: string,
  credit: string,
  sceneNote?: string,
): CityPhoto => ({ src, alt, credit, sceneNote });

/* ------------------------------------------------------------------ */
/* Landmarks                                                           */
/* ------------------------------------------------------------------ */

export const CITY_LANDMARKS: CityPlace[] = [
  {
    id: "city-railway-station",
    name: "Historic Railway Station",
    nativeName: "የድሬዳዋ ባቡር ማረፊያ",
    kind: "landmark",
    kindLabel: "Historic landmark",
    tagline: "The building that gave Dire Dawa its beginning.",
    description:
      "Dire Dawa grew around the Franco–Ethiopian Railway in the early 1900s, and the original station still faces the old station square. The yellow façade, vintage rolling stock and the station district make this the city’s signature sight.",
    neighborhood: "Station district",
    mapsQuery: "Dire Dawa Railway Station",
    photo: photo(
      "/images/city/railway-station.jpg",
      "The historic Dire Dawa railway station building of the Djibouti–Ethiopia railway",
      "Photo: Bamse, Wikimedia Commons, CC BY-SA 3.0",
    ),
  },
  {
    id: "city-kefira-market",
    name: "Kefira Market",
    nativeName: "ከፊራ ገበያ",
    kind: "landmark",
    kindLabel: "Market & landmark",
    tagline: "The city’s great open-air market.",
    description:
      "Behind the famous arched gate, Kefira is Dire Dawa’s biggest market — a maze of grain sacks, spices, cloth, household goods and trading from across the eastern lowlands. Busiest mornings; go with cash and time to wander.",
    neighborhood: "Kezira side",
    mapsQuery: "Kefira Market Dire Dawa",
    photo: photo(
      "/images/city/kefira-market.jpg",
      "The arched entrance gate of Kafira Market in Dire Dawa stacked with produce crates",
      "Photo: Qprt, via Wikimedia Commons, CC BY 3.0",
    ),
  },
  {
    id: "city-kezira",
    name: "Kezira",
    nativeName: "ከዚራ",
    kind: "landmark",
    kindLabel: "Historic quarter",
    tagline: "The grid-street commercial heart.",
    description:
      "The old trading quarter laid out beside the railway station — compact blocks, old stone and plaster buildings, cafés, mosques and churches a street apart. Best explored slowly on foot; respect residents’ privacy when photographing.",
    neighborhood: "Central Dire Dawa",
    mapsQuery: "Kezira Dire Dawa",
    photo: photo(
      "/images/city/kezira-old-town.jpg",
      "Colourful street in the old town of Dire Dawa with a mosque minaret and palm trees",
      "Photo: Wikilolo, Wikimedia Commons, CC BY-SA 2.0",
    ),
  },
  {
    id: "city-megala",
    name: "Megala",
    nativeName: "መገላ",
    kind: "landmark",
    kindLabel: "Historic quarter",
    tagline: "Cross the wadi to Dire Dawa’s other half.",
    description:
      "On the far side of the seasonal Dechatu channel from Kezira, Megala climbs the hillside with tens of thousands of homes and busy centre-of-neighbourhood markets. Enjoy the views and streets — and support local shops along the way.",
    neighborhood: "Western Dire Dawa",
    mapsQuery: "Megala Dire Dawa",
    photo: photo(
      "/images/city/megala.jpg",
      "The Megala quarter of Dire Dawa rising uphill above street market stalls",
      "Photo: Qprt, via Wikimedia Commons, CC BY 3.0",
    ),
  },
  {
    id: "city-dechatu-river",
    name: "Dechatu River",
    kind: "landmark",
    kindLabel: "Seasonal river",
    tagline: "The sandy spine of the city.",
    description:
      "The Dechatu wanders through the city as a wide sandy riverbed — quiet most of the year, and fast and high at the peak of the rains. Cross its bridges and you understand how Kezira and Megala fit together.",
    neighborhood: "Crosses central Dire Dawa",
    mapsQuery: "Dechatu River Dire Dawa",
    photo: photo(
      "/images/city/dechatu-river.jpg",
      "The wide sandy bed of the Dechatu river crossing Dire Dawa",
      "Photo: Qprt, via Wikimedia Commons, CC BY 3.0",
    ),
  },
  {
    id: "city-jumaa-mosque",
    name: "Grand Juma'a Mosque",
    kind: "landmark",
    kindLabel: "Place of worship",
    tagline: "A landmark of the Kezira skyline.",
    description:
      "The grand Friday mosque of Dire Dawa, whose minaret rises over the old town streets. Visiting is for worshippers; admire the exterior from the street and confirm any visits with the local community.",
    neighborhood: "Kezira side",
    mapsQuery: "Grand Jumaa Mosque Dire Dawa",
    photo: photo(
      "/images/city/jumaa-mosque.jpg",
      "The minaret of the Grand Jumaa Mosque over a street in Dire Dawa",
      "Photo: Knipptang (Wikipedia user), CC BY-SA 3.0",
    ),
  },
  {
    id: "city-bete-mikael-church",
    name: "Bete Mikael (St Michael) Church",
    kind: "landmark",
    kindLabel: "Place of worship",
    tagline: "A colourfully painted Orthodox church.",
    description:
      "A circular, richly decorated Orthodox church serving Dire Dawa’s Orthodox community, with a painted drum roof and cross-topped cupola. Services follow the Ethiopian calendar — check locally before visiting.",
    neighborhood: "Dire Dawa",
    mapsQuery: "Bete Mikael Church Dire Dawa",
    photo: photo(
      "/images/city/bete-mikael-church.jpg",
      "The circular Bete Mikael Orthodox Church in Dire Dawa painted in tricolour bands",
      "Photo: 500px contributor, via Wikimedia Commons, CC BY 3.0",
    ),
  },
  {
    id: "city-palace",
    name: "Dire Dawa Palace",
    kind: "landmark",
    kindLabel: "Historic building",
    tagline: "The old governor’s residence.",
    description:
      "The gate and grounds of the former governor’s palace survive in the city centre. It is not a museum — view the exterior from the street and confirm locally what it holds today.",
    neighborhood: "Central Dire Dawa",
    mapsQuery: "Dire Dawa Palace",
    photo: photo(
      "/images/city/palace-entrance.jpg",
      "The entrance of the former governor's palace building in Dire Dawa",
      "Photo: Sailko, Wikimedia Commons, CC BY 3.0",
    ),
  },
  {
    id: "city-gash-abe-mountain",
    name: "Gash Abe Mountain",
    nativeName: "ጋሽ አቤ ጋራ",
    kind: "landmark",
    kindLabel: "Nature & viewpoints",
    tagline: "The green ridge over the city.",
    description:
      "The hills around Dire Dawa turn surprisingly green after the rains, and the ridge above the city is the classic backdrop in local photography. Trails are informal and not marked — go with someone who knows the way.",
    neighborhood: "City outskirts",
    mapsQuery: "Gash Abe mountain Dire Dawa",
    photo: photo(
      "/images/city/mountains.jpg",
      "Green mountains on the outskirts of Dire Dawa",
      "Photo: Qprt, via Wikimedia Commons, CC BY 3.0",
      "Representative scenery: hills around Dire Dawa, not a specific summit",
    ),
  },
  {
    id: "city-porc-epic-cave",
    name: "Porc-Epic Cave",
    kind: "landmark",
    kindLabel: "Archaeological site",
    tagline: "A Stone Age time capsule outside the city.",
    description:
      "A limestone cave site south of Dire Dawa, studied by archaeologists for decades; tens of thousands of Middle Stone Age stone tools and worked ochre pieces were recovered here, making it one of the Horn of Africa’s key prehistoric sites. The cave is not developed for tourism — verify access with local authorities before attempting a visit.",
    neighborhood: "South of Dire Dawa",
    mapsQuery: "Porc-Epic Cave Dire Dawa",
  },
];

/* ------------------------------------------------------------------ */
/* Markets & shopping                                                  */
/* ------------------------------------------------------------------ */

export const CITY_MARKETS: CityPlace[] = [
  {
    id: "market-kefira",
    name: "Kefira Market",
    nativeName: "ከፊራ ገበያ",
    kind: "market",
    kindLabel: "Open-air market",
    tagline: "Grain, spice and everything markets.",
    description:
      "The main open-air market of the city, from the famous arched entrance outward. Trade in grains, spices, coffee, cloth and household goods — morning is the beating time. See the landmark listing for the gate itself.",
    neighborhood: "Kezira side",
    mapsQuery: "Kefira Market Dire Dawa",
    photo: photo(
      "/images/city/kefira-market.jpg",
      "The arched entrance gate of Kafira Market in Dire Dawa stacked with produce crates",
      "Photo: Qprt, via Wikimedia Commons, CC BY 3.0",
    ),
  },
  {
    id: "market-taiwan",
    name: "Taiwan Shopping Center",
    kind: "market",
    kindLabel: "Shopping centre & market",
    tagline: "The market locals call “Taiwan”.",
    description:
      "A well-known local shopping centre and market quarter — a fixture for gadgets, shoes, fabrics and imported goods. Confirm opening hours and the exact block on site; ask any bajaj driver for the Taiwan market.",
    neighborhood: "Central Dire Dawa",
    mapsQuery: "Taiwan Market Dire Dawa",
    photo: photo(
      "/images/city/market-scene.jpg",
      "A colourful household-goods shopfront in a Dire Dawa market street",
      "Photo: Watyein iki, Wikimedia Commons, CC BY 2.0",
      "Representative scene: a Dire Dawa market shopfront",
    ),
  },
  {
    id: "market-ashewa",
    name: "Ashewa Market",
    kind: "market",
    kindLabel: "Neighbourhood market",
    tagline: "Morning produce and household wares.",
    description:
      "A neighbourhood market district known to local households — fruit, vegetables and daily goods, busiest in the first half of the day. Small stalls and plenty of life; confirm exact location with locals.",
    neighborhood: "Dire Dawa",
    mapsQuery: "Ashewa Market Dire Dawa",
    photo: photo(
      "/images/city/market-day.jpg",
      "A busy market street with stalls, donkey carts and shoppers in Dire Dawa",
      "Photo: Qprt, via Wikimedia Commons, CC BY 3.0",
      "Representative scene: a Dire Dawa market street",
    ),
  },
  {
    id: "market-megala",
    name: "Megala Market",
    kind: "market",
    kindLabel: "Street market",
    tagline: "Stalls threading through Megala.",
    description:
      "Street market life across the Dechatu in the Megala quarter — spices, grains, cloth and household wares sold stall to stall. Explore on foot and support the vendors you meet. Confirm days/times with locals.",
    neighborhood: "Megala, western Dire Dawa",
    mapsQuery: "Megala Market Dire Dawa",
    photo: photo(
      "/images/city/megala.jpg",
      "Market stalls below the hillside homes of the Megala quarter in Dire Dawa",
      "Photo: Qprt, via Wikimedia Commons, CC BY 3.0",
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Parks & recreation                                                  */
/* ------------------------------------------------------------------ */

export const CITY_PARKS: CityPlace[] = [
  {
    id: "park-dr-ali-birraa",
    name: "Dr Ali Birraa Park",
    kind: "park",
    kindLabel: "City park",
    tagline: "Named for Dire Dawa-born music legend Ali Birraa.",
    description:
      "A city green space honouring Ali Birraa, the celebrated Oromo singer born in Dire Dawa. An easy evening stroll and family spot — hours and facilities vary, confirm on site.",
    neighborhood: "Dire Dawa",
    mapsQuery: "Dr Ali Birraa Park Dire Dawa",
  },
  {
    id: "park-elinam",
    name: "Elinam Park",
    kind: "park",
    kindLabel: "Neighbourhood park",
    tagline: "A relaxed pocket of green.",
    description:
      "A neighbourhood green space popular with families — children’s play, shaded walks and weekend gatherings. Facilities are simple; go with locals’ advice.",
    neighborhood: "Dire Dawa",
    mapsQuery: "Elinam Park Dire Dawa",
  },
  {
    id: "park-sami-menafesha",
    name: "Sami Menafesha",
    kind: "park",
    kindLabel: "Leisure garden",
    tagline: "A ‘menafesha’ — the word says it: refreshment.",
    description:
      "A local leisure garden — ‘menafesha’ (መናፈሻ) is the Amharic word for a refreshment garden. Expect shaded seating, snacks and tea among neighbours.",
    neighborhood: "Dire Dawa",
    mapsQuery: "Sami Menafesha Dire Dawa",
  },
  {
    id: "park-papa-recreation-centre",
    name: "Papa Recreation Centre",
    kind: "park",
    kindLabel: "Recreation centre",
    tagline: "A mapped recreation listing in Papa.",
    description:
      "A recreation centre listed on the map in the Papa area on the Sabian side of the city. Which facilities are open to visitors should be confirmed on site.",
    neighborhood: "Papa, Sabian side",
    mapsQuery: "Papa Recreation Centre Dire Dawa",
  },
];

/* ------------------------------------------------------------------ */
/* Culture & lifestyle tiles                                           */
/* ------------------------------------------------------------------ */

export type CityCultureTile = {
  id: string;
  title: string;
  text: string;
  photo?: CityPhoto;
};

export const CITY_CULTURE: CityCultureTile[] = [
  {
    id: "culture-communities",
    title: "Many communities, one city",
    text: "Oromo, Somali, Amhara, Harari, Gurage and other families have made Dire Dawa home for generations — Oromo and Amharic are the city’s two working languages. Neighbouring worship places have shared streets in Kezira for over a century. Every community keeps its own traditions; none is assumed to speak for all.",
  },
  {
    id: "culture-coffee",
    title: "The coffee ceremony",
    text: "Green beans roasted over coals, ground, brewed in a jebena and poured in small rounds while guests talk — the Ethiopian coffee ceremony is the signature welcome in Dire Dawa’s homes and cafés alike. If you are offered a cup, it is a warm gesture; take your time.",
    photo: photo(
      "/images/city/coffee-ceremony.jpg",
      "A woman roasting coffee beans during an Ethiopian coffee ceremony",
      "Photo: R Haussmann, Wikimedia Commons, CC BY 2.0",
      "A traditional Ethiopian coffee ceremony",
    ),
  },
  {
    id: "culture-food",
    title: "Food from market to table",
    text: "Injera with stews and salads, sambusa from street trays, fruit off the market stalls and glasses of spiced tea — Dire Dawa’s kitchens reflect every community that traded here.",
  },
  {
    id: "culture-architecture",
    title: "A century of architecture",
    text: "The city’s walk is a timeline: railway-era stations and villas, old-town stone houses with Moorish arches, mid-century offices and arcades. Look up along the older streets.",
    photo: photo(
      "/images/city/kezira-arches.jpg",
      "An old Dire Dawa building with Moorish-style arches",
      "Photo: Sailko, Wikimedia Commons, CC BY 3.0",
    ),
  },
  {
    id: "culture-music",
    title: "Music that travels the region",
    text: "Dire Dawa remains a railway town of music — from Oromo music legend Ali Birraa, born here, to the sounds spilling from cafés at night and the cultural troupes performing through the year.",
  },
  {
    id: "culture-streetlife",
    title: "Everyday street life",
    text: "Blue bajaj tuk-tuks, donkey carts, busy mornings around the markets and shaded afternoons under the trees — Dire Dawa moves at its own pace.",
    photo: photo(
      "/images/city/street-bajaj.jpg",
      "A blue bajaj tuk-tuk on a tree-shaded Dire Dawa street with a minaret behind",
      "Photo: Knipptang (Wikipedia user), CC BY-SA 3.0",
    ),
  },
  {
    id: "culture-celebrations",
    title: "Celebrations you may be lucky to meet",
    text: "Different parts of the city celebrate different calendars — Eid and other Muslim feasts, Meskel, Timket and Ethiopian New Year among them. If you are visiting then, ask around; communities are generous with explanations and invitations.",
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function cityMapsUrl(place: Pick<CityPlace, "mapsQuery">): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.mapsQuery}, Dire Dawa, Ethiopia`,
  )}`;
}

/** Map embed — name search keeps unverified places honest (no invented pins). */
export function cityMapEmbedUrl(place: Pick<CityPlace, "mapsQuery">): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(
    `${place.mapsQuery}, Dire Dawa, Ethiopia`,
  )}&z=15&output=embed`;
}

export const CITY_PLACES: CityPlace[] = [
  ...CITY_LANDMARKS,
  ...CITY_MARKETS,
  ...CITY_PARKS,
];

export function getCityPlaceById(id: string): CityPlace | undefined {
  return CITY_PLACES.find((place) => place.id === id);
}
