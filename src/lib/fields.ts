import BOOKING_CATALOG from "./booking-catalog.json";

/**
 * Football field data for Dire Dawa, Ethiopia.
 *
 * Data policy:
 *  - `plusCode` / `latitude` / `longitude` come from the mapped Google listings for
 *    each ground (decoded with the official Open Location Code algorithm).
 *  - `hourlyPrice`, `surface` and `capacity` are `null` when unverified. Hourly
 *    prices supplied for specific pitches are listed; other details flagged as
 *    unverified should be confirmed on site before being presented as facts.
 *  - Conel Football Field has no verified map pin yet, so its coordinates stay null.
 */

export type FootballField = {
  id: string;
  name: string;
  alternativeNames: string[];
  neighborhood: string;
  plusCode: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  hourlyPrice: number | null;
  priceVerified: boolean;
  surface: string | null;
  surfaceVerified: boolean;
  capacity: number | null;
  capacityVerified: boolean;
  imageUrl: string;
  notes: string;
  availableTimeSlots: string[];
};

export const FIELD_IMAGE_PLACEHOLDER = "/images/fields/field-placeholder.svg";

export const DEFAULT_MAP_CENTER = { latitude: 9.5978, longitude: 41.8608 };

export const DEFAULT_BOOKING_TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const mapsUrlFor = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;

export const fields: FootballField[] = [
  {
    id: "dire-dawa-international-stadium",
    name: "Dire Dawa International Stadium",
    alternativeNames: ["Dire Dawa Stadium", "Diredawa Stadium"],
    neighborhood: "Kezira (city center)",
    plusCode: "6HX3HVJ5+R8",
    latitude: 9.582063,
    longitude: 41.858312,
    googleMapsUrl: mapsUrlFor(9.582063, 41.858312),
    hourlyPrice: BOOKING_CATALOG["dire-dawa-international-stadium"].hourlyPriceEtb,
    priceVerified: true,
    surface: "Artificial turf",
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes:
      "Main multi-purpose stadium of Dire Dawa, an AFCON 1976 venue, renovated 2018–2024. Artificial turf and a 25,000-seat capacity are reported for the renovated stadium; confirm the current state and booking terms with the stadium office.",
    availableTimeSlots:
      BOOKING_CATALOG["dire-dawa-international-stadium"].availableTimeSlots,
  },
  {
    id: "diredawa-trainstation-football-pitch",
    name: "Diredawa Trainstation Football Pitch",
    alternativeNames: ["Train Station Pitch", "Trainstation Field"],
    neighborhood: "Train station district",
    plusCode: "6HX3HVR4+VF2",
    latitude: 9.592137,
    longitude: 41.856141,
    googleMapsUrl: mapsUrlFor(9.592137, 41.856141),
    hourlyPrice: BOOKING_CATALOG["diredawa-trainstation-football-pitch"].hourlyPriceEtb,
    priceVerified: true,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes:
      "Neighborhood pitch by the historic railway station area. Surface and capacity to be confirmed with the caretaker.",
    availableTimeSlots:
      BOOKING_CATALOG["diredawa-trainstation-football-pitch"].availableTimeSlots,
  },
  {
    id: "sebategna-football-pitch",
    name: "Sebategna Football Pitch",
    alternativeNames: ["Sebategna Field"],
    neighborhood: "Sebategna",
    plusCode: "6HX3JR5Q+F2G",
    latitude: 9.608688,
    longitude: 41.837578,
    googleMapsUrl: mapsUrlFor(9.608688, 41.837578),
    hourlyPrice: BOOKING_CATALOG["sebategna-football-pitch"].hourlyPriceEtb,
    priceVerified: true,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes: "Neighborhood ground in Sebategna. Confirm other booking details with the venue.",
    availableTimeSlots: BOOKING_CATALOG["sebategna-football-pitch"].availableTimeSlots,
  },
  {
    id: "sabiyan-kuwas-meda",
    name: "Sabiyan Kuwas Meda",
    alternativeNames: ["Sabiyan Turf Field", "Kuwas Meda, Sabiyan"],
    neighborhood: "Sabiyan",
    plusCode: "6HX3JR2V+JPP",
    latitude: 9.601588,
    longitude: 41.844328,
    googleMapsUrl: mapsUrlFor(9.601588, 41.844328),
    hourlyPrice: null,
    priceVerified: false,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes:
      "Mapped in Sabiyan as Sabiyan Kuwas Meda; locally also called Sabiyan Turf Field. May be the same ground as the earlier Sabiyan Turf Field listing — confirm with locals.",
    availableTimeSlots: ["06:00", "07:00", "16:00", "17:00", "18:00", "19:00"],
  },
  {
    id: "air-force-football-pitch",
    name: "Air Force Football Pitch",
    alternativeNames: ["Air Force Field"],
    neighborhood: "Air Force area",
    plusCode: "6HX3HVX6+584",
    latitude: 9.597888,
    longitude: 41.860828,
    googleMapsUrl: mapsUrlFor(9.597888, 41.860828),
    hourlyPrice: null,
    priceVerified: false,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes: "Pitch named for the Air Force area. Booking details to be confirmed.",
    availableTimeSlots: DEFAULT_BOOKING_TIME_SLOTS,
  },
  {
    id: "siesta-football-pitch",
    name: "Siesta Football Pitch",
    alternativeNames: ["Siesta Field"],
    neighborhood: "Siesta",
    plusCode: "6HX3HRWX+MW4",
    latitude: 9.596637,
    longitude: 41.849828,
    googleMapsUrl: mapsUrlFor(9.596637, 41.849828),
    hourlyPrice: null,
    priceVerified: false,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes: "Neighborhood pitch in the Siesta area. Booking details to be confirmed.",
    availableTimeSlots: DEFAULT_BOOKING_TIME_SLOTS,
  },
  {
    id: "gtz-football-field",
    name: "GTZ Football Field",
    alternativeNames: ["GTZ Field"],
    neighborhood: "Northern Dire Dawa, near Dire Dawa University",
    plusCode: "6HX3JR8P+F45",
    latitude: 9.616138,
    longitude: 41.835359,
    googleMapsUrl: mapsUrlFor(9.616138, 41.835359),
    hourlyPrice: null,
    priceVerified: false,
    surface: "Sandy ground",
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes:
      "Ground next to the former GTZ project area; sandy surface reported. Possibly the same ground as the Ali Kalageye Stadium map listing — keep as one record until confirmed on site.",
    availableTimeSlots: DEFAULT_BOOKING_TIME_SLOTS,
  },
  {
    id: "astatke-field",
    name: "Astatke Field",
    alternativeNames: ["አስታጥቄ ሜዳ", "Astatke Meda"],
    neighborhood: "Astatke",
    plusCode: "6HX3HVRH+M7M",
    latitude: 9.591713,
    longitude: 41.878172,
    googleMapsUrl: mapsUrlFor(9.591713, 41.878172),
    hourlyPrice: null,
    priceVerified: false,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes:
      "Known locally as አስታጥቄ ሜዳ (Astatke Meda). Booking details to be confirmed.",
    availableTimeSlots: DEFAULT_BOOKING_TIME_SLOTS,
  },
  {
    id: "youth-football-pitch",
    name: "Youth Football Pitch",
    alternativeNames: ["Youth Pitch"],
    neighborhood: "Central Dire Dawa",
    plusCode: "6HX3JV45+CPF",
    latitude: 9.606063,
    longitude: 41.859297,
    googleMapsUrl: mapsUrlFor(9.606063, 41.859297),
    hourlyPrice: null,
    priceVerified: false,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes: "Youth-oriented ground from the map listings. Booking details to be confirmed.",
    availableTimeSlots: DEFAULT_BOOKING_TIME_SLOTS,
  },
  {
    id: "small-football-stadium",
    name: "Small Football Stadium",
    alternativeNames: ["Small Stadium"],
    neighborhood: "North-west Dire Dawa",
    plusCode: "6HX3JR5P+J3G",
    latitude: 9.609063,
    longitude: 41.835203,
    googleMapsUrl: mapsUrlFor(9.609063, 41.835203),
    hourlyPrice: null,
    priceVerified: false,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes:
      "Smaller stadium in the map listings, separate from Dire Dawa International Stadium. Booking details to be confirmed.",
    availableTimeSlots: DEFAULT_BOOKING_TIME_SLOTS,
  },
  {
    id: "tesfaye-memorial-football-field",
    name: "Tesfaye Memorial Football Field",
    alternativeNames: ["Ababa Tesfaye Football Field (possible same ground)", "Tesfaye Memorial Field"],
    neighborhood: "Kezira (city center)",
    plusCode: "6HX3HVM8+H6H",
    latitude: 9.583938,
    longitude: 41.865609,
    googleMapsUrl: mapsUrlFor(9.583938, 41.865609),
    hourlyPrice: null,
    priceVerified: false,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes:
      "May be the same ground as the Ababa Tesfaye Football Field listing — confirm with locals before relying on the name.",
    availableTimeSlots: DEFAULT_BOOKING_TIME_SLOTS,
  },
  {
    id: "conel-football-field",
    name: "Conel Football Field",
    alternativeNames: ["Konel Field"],
    neighborhood: "Conel",
    plusCode: null,
    latitude: null,
    longitude: null,
    googleMapsUrl: null,
    hourlyPrice: BOOKING_CATALOG["conel-football-field"].hourlyPriceEtb,
    priceVerified: true,
    surface: null,
    surfaceVerified: false,
    capacity: null,
    capacityVerified: false,
    imageUrl: FIELD_IMAGE_PLACEHOLDER,
    notes:
      "No verified map pin found for the Conel pitch yet. Map location, surface and capacity pending; confirm the address with locals.",
    availableTimeSlots: BOOKING_CATALOG["conel-football-field"].availableTimeSlots,
  },
];
