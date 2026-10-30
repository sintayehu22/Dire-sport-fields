export type FootballField = {
  id: string;
  name: string;
  location: string;
  hourlyPrice: number;
  surface: string;
  capacity: number;
  imagePlaceholder: string;
  availableTimeSlots: string[];
};

export const fields: FootballField[] = [
  {
    id: "sabiyan-football-field",
    name: "Sabiyan Football Field",
    location: "Sabiyan, Dire Dawa",
    hourlyPrice: 1_200,
    surface: "Natural grass",
    capacity: 22,
    imagePlaceholder: "/field-placeholder.svg",
    availableTimeSlots: ["06:00", "07:00", "16:00", "17:00", "18:00"],
  },
  {
    id: "sebategna-football-pitch",
    name: "Sebategna Football Pitch",
    location: "Sebategna, Dire Dawa",
    hourlyPrice: 900,
    surface: "Artificial turf",
    capacity: 14,
    imagePlaceholder: "/field-placeholder.svg",
    availableTimeSlots: ["07:00", "08:00", "15:00", "17:00", "19:00"],
  },
  {
    id: "conel-football-field",
    name: "Conel Football Field",
    location: "Conel, Dire Dawa",
    hourlyPrice: 1_000,
    surface: "Natural grass",
    capacity: 18,
    imagePlaceholder: "/field-placeholder.svg",
    availableTimeSlots: ["06:00", "08:00", "16:00", "18:00", "19:00"],
  },
  {
    id: "dire-dawa-international-stadium",
    name: "Dire Dawa International Stadium",
    location: "Dire Dawa, Ethiopia",
    hourlyPrice: 2_500,
    surface: "Natural grass",
    capacity: 30,
    imagePlaceholder: "/field-placeholder.svg",
    availableTimeSlots: ["07:00", "09:00", "15:00", "17:00", "18:00"],
  },
];
