import {
  Smartphone, Backpack, Shirt, KeyRound, CupSoda, BookOpen, IdCard, Package, type LucideIcon,
} from "lucide-react";
import type { DB, DemoUser, UserId } from "./types";

export const BIENESTAR_INFO = {
  place: "Bienestar Estudiantil – Bloque A, planta baja",
  hours: "Lunes a viernes, 08:00 a 18:00",
};

export const USERS: Record<UserId, DemoUser> = {
  ana: { id: "ana", name: "Ana Rojas", email: "ana.rojas@universidad.edu.bo", code: "2021-0451", role: "comunidad" },
  luis: { id: "luis", name: "Luis Mamani", email: "luis.mamani@universidad.edu.bo", code: "2020-1187", role: "comunidad" },
  bienestar: { id: "bienestar", name: "Bienestar Estudiantil", email: "bienestar@universidad.edu.bo", role: "bienestar" },
};

export const CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: "Electrónicos", icon: Smartphone },
  { name: "Mochilas y bolsos", icon: Backpack },
  { name: "Ropa y accesorios", icon: Shirt },
  { name: "Llaves", icon: KeyRound },
  { name: "Botellas y termos", icon: CupSoda },
  { name: "Útiles y libros", icon: BookOpen },
  { name: "Documentos y carnets", icon: IdCard },
  { name: "Otros", icon: Package },
];
export const catIcon = (c: string) => CATEGORIES.find((x) => x.name === c)?.icon ?? Package;

export const PLACES = [
  "Bloque A", "Bloque B", "Bloque C", "Biblioteca", "Cafetería", "Canchas deportivas",
  "Parqueo", "Auditorio", "Laboratorios de computación", "Baños", "Patio central",
];

const daysAgo = (n: number, h = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 15, 0, 0);
  return d.toISOString();
};
const dayStr = (n: number) => {
  const d = new Date(daysAgo(n));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function seed(): DB {
  return {
    found: [
      { id: "HZ-0001", finderId: "luis", description: "Celular Samsung Galaxy con funda azul", category: "Electrónicos", place: "Biblioteca", placeRef: "Segundo piso, mesas de estudio", date: daysAgo(3, 11), status: "publicado", createdAt: daysAgo(3, 11) },
      { id: "HZ-0002", finderId: "ana", description: "Mochila negra marca Totto con cuadernos", category: "Mochilas y bolsos", place: "Cafetería", date: daysAgo(4, 13), status: "publicado", createdAt: daysAgo(4, 13) },
      { id: "HZ-0003", finderId: "luis", description: "Botella metálica verde con stickers", category: "Botellas y termos", place: "Canchas deportivas", date: daysAgo(2, 17), status: "publicado", createdAt: daysAgo(2, 17) },
      { id: "HZ-0004", finderId: "ana", description: "Llaves con llavero rojo de la universidad", category: "Llaves", place: "Parqueo", date: daysAgo(1, 8), status: "custodia", createdAt: daysAgo(1, 8) },
      { id: "HZ-0005", finderId: "luis", description: "Calculadora Casio fx-82 gris", category: "Útiles y libros", place: "Bloque B", placeRef: "Aula 204", date: daysAgo(0, 9), status: "pendiente", createdAt: daysAgo(0, 9) },
      { id: "HZ-0006", finderId: "ana", description: "Chamarra gris con capucha talla M", category: "Ropa y accesorios", place: "Auditorio", date: daysAgo(0, 12), status: "pendiente", createdAt: daysAgo(0, 12) },
    ],
    lost: [
      { id: "PR-0001", ownerId: "ana", description: "Perdí mi celular Samsung, tiene funda azul", category: "Electrónicos", places: ["Biblioteca", "Cafetería"], placesText: "Estuve estudiando en la biblioteca", dateFrom: dayStr(4), dateTo: dayStr(3), status: "coincidencias", createdAt: daysAgo(3, 15) },
      { id: "PR-0002", ownerId: "ana", description: "Llaves de mi casa con llavero rojo de la universidad", category: "Llaves", places: ["Parqueo", "Bloque A"], dateFrom: dayStr(2), dateTo: dayStr(1), status: "buscando", createdAt: daysAgo(1, 16) },
      { id: "PR-0003", ownerId: "luis", description: "Mochila negra Totto con laptop", category: "Mochilas y bolsos", places: ["Cafetería"], dateFrom: dayStr(5), dateTo: dayStr(4), status: "recojo", createdAt: daysAgo(4, 18) },
    ],
    matches: [
      { id: "M-1", foundId: "HZ-0001", lostId: "PR-0001", score: 100, status: "sugerida" },
      { id: "M-2", foundId: "HZ-0002", lostId: "PR-0003", score: 90, status: "recoger" },
    ],
    pickups: [
      { id: "RC-1", matchId: "M-2", foundId: "HZ-0002", lostId: "PR-0003", ownerId: "luis", createdAt: daysAgo(1, 9), done: false },
    ],
    deliveries: [],
    seq: { found: 6, lost: 3 },
  };
}
