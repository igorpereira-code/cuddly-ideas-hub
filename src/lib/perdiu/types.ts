export type UserId = "ana" | "luis" | "bienestar";

export interface DemoUser {
  id: UserId;
  name: string;
  email: string;
  code?: string;
  role: "comunidad" | "bienestar";
}

export type FoundStatus = "pendiente" | "custodia" | "publicado" | "entregado";
export type LostStatus = "buscando" | "coincidencias" | "recojo" | "recuperado";
export type MatchStatus = "sugerida" | "recoger" | "descartada";

export interface FoundItem {
  id: string;
  finderId: UserId;
  photo?: string;
  description: string;
  category: string;
  place: string;
  placeRef?: string;
  date: string; // ISO
  status: FoundStatus;
  createdAt: string;
}

export interface LostReport {
  id: string;
  ownerId: UserId;
  photo?: string;
  description: string;
  category: string;
  places: string[];
  placesText?: string;
  dateFrom: string; // yyyy-mm-dd
  dateTo: string;
  status: LostStatus;
  createdAt: string;
}

export interface Match {
  id: string;
  foundId: string;
  lostId: string;
  score: number;
  status: MatchStatus;
}

export interface Pickup {
  id: string;
  matchId: string;
  foundId: string;
  lostId: string;
  ownerId: UserId;
  createdAt: string;
  done: boolean;
}

export interface Delivery {
  id: string;
  foundId: string;
  lostId?: string;
  name: string;
  email: string;
  code: string;
  createdAt: string;
}

export interface DB {
  found: FoundItem[];
  lost: LostReport[];
  matches: Match[];
  pickups: Pickup[];
  deliveries: Delivery[];
  seq: { found: number; lost: number };
}
