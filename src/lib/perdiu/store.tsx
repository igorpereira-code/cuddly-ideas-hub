import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { seed } from "./data";
import { MIN_SCORE, similarity } from "./matching";
import type { DB, FoundItem, LostReport, Match, UserId } from "./types";

const KEY = "perdiu-demo-v1";
const UKEY = "perdiu-user-v1";

const pad = (n: number) => String(n).padStart(4, "0");
const uid = () => Math.random().toString(36).slice(2, 9);

function refreshLostStatuses(db: DB): DB {
  const lost = db.lost.map((l) => {
    if (l.status === "recuperado") return l;
    const ms = db.matches.filter((m) => m.lostId === l.id);
    const status = ms.some((m) => m.status === "recoger")
      ? "recojo"
      : ms.some((m) => m.status === "sugerida")
        ? "coincidencias"
        : "buscando";
    return { ...l, status } as LostReport;
  });
  return { ...db, lost };
}

function runMatching(db: DB, pairs: [FoundItem, LostReport][]): { db: DB; count: number } {
  const matches = [...db.matches];
  let count = 0;
  for (const [f, l] of pairs) {
    if (matches.some((m) => m.foundId === f.id && m.lostId === l.id)) continue;
    const score = similarity(f, l);
    if (score >= MIN_SCORE) {
      matches.push({ id: "M-" + uid(), foundId: f.id, lostId: l.id, score, status: "sugerida" });
      count++;
    }
  }
  return { db: refreshLostStatuses({ ...db, matches }), count };
}

interface Ctx {
  db: DB;
  userId: UserId;
  setUserId: (u: UserId) => void;
  reset: () => void;
  addFound: (f: Omit<FoundItem, "id" | "status" | "createdAt" | "finderId">) => string;
  addLost: (l: Omit<LostReport, "id" | "status" | "createdAt" | "ownerId">) => string;
  confirmReception: (id: string) => void;
  publish: (id: string) => number;
  setMatch: (matchId: string, status: Match["status"]) => void;
  deliver: (d: { foundId: string; lostId?: string; name: string; email: string; code: string }) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(seed);
  const [userId, setUserIdState] = useState<UserId>("ana");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDb(JSON.parse(raw));
      const u = localStorage.getItem(UKEY) as UserId | null;
      if (u) setUserIdState(u);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(db));
  }, [db, loaded]);

  const setUserId = (u: UserId) => {
    setUserIdState(u);
    localStorage.setItem(UKEY, u);
  };

  const reset = () => {
    setDb(seed());
    setUserId("ana");
  };

  const addFound: Ctx["addFound"] = (f) => {
    const n = db.seq.found + 1;
    const id = "HZ-" + pad(n);
    const item: FoundItem = { ...f, id, finderId: userId, status: "pendiente", createdAt: new Date().toISOString() };
    setDb((d) => ({ ...d, found: [item, ...d.found], seq: { ...d.seq, found: n } }));
    return id;
  };

  const addLost: Ctx["addLost"] = (l) => {
    const n = db.seq.lost + 1;
    const id = "PR-" + pad(n);
    const rep: LostReport = { ...l, id, ownerId: userId, status: "buscando", createdAt: new Date().toISOString() };
    setDb((d) => {
      const next = { ...d, lost: [rep, ...d.lost], seq: { ...d.seq, lost: n } };
      const pub = d.found.filter((f) => f.status === "publicado");
      return runMatching(next, pub.map((f) => [f, rep] as [FoundItem, LostReport])).db;
    });
    return id;
  };

  const confirmReception = (id: string) =>
    setDb((d) => ({ ...d, found: d.found.map((f) => (f.id === id ? { ...f, status: "custodia" } : f)) }));

  const publish = (id: string) => {
    const f = db.found.find((x) => x.id === id);
    if (!f || f.status !== "custodia") return 0;
    const pubF = { ...f, status: "publicado" as const };
    const active = db.lost.filter((l) => l.status !== "recuperado");
    const base = { ...db, found: db.found.map((x) => (x.id === id ? pubF : x)) };
    const res = runMatching(base, active.map((l) => [pubF, l] as [FoundItem, LostReport]));
    setDb(res.db);
    return res.count;
  };

  const setMatch = (matchId: string, status: Match["status"]) =>
    setDb((d) => {
      const m = d.matches.find((x) => x.id === matchId);
      if (!m) return d;
      const matches = d.matches.map((x) => (x.id === matchId ? { ...x, status } : x));
      const lost = d.lost.find((l) => l.id === m.lostId)!;
      const pickups =
        status === "recoger" && !d.pickups.some((p) => p.matchId === matchId)
          ? [
              { id: "RC-" + uid(), matchId, foundId: m.foundId, lostId: m.lostId, ownerId: lost.ownerId, createdAt: new Date().toISOString(), done: false },
              ...d.pickups,
            ]
          : d.pickups;
      return refreshLostStatuses({ ...d, matches, pickups });
    });

  const deliver: Ctx["deliver"] = (x) =>
    setDb((d) => {
      const found = d.found.map((f) => (f.id === x.foundId ? { ...f, status: "entregado" as const } : f));
      const matches = d.matches.filter((m) => m.foundId !== x.foundId || m.lostId === x.lostId);
      const pickups = d.pickups.map((p) => (p.foundId === x.foundId ? { ...p, done: true } : p));
      const deliveries = [{ id: "EN-" + uid(), ...x, createdAt: new Date().toISOString() }, ...d.deliveries];
      const next = refreshLostStatuses({ ...d, found, matches, pickups, deliveries });
      return {
        ...next,
        lost: next.lost.map((l) => (l.id === x.lostId ? { ...l, status: "recuperado" as const } : l)),
      };
    });

  return (
    <StoreCtx.Provider
      value={{ db, userId, setUserId, reset, addFound, addLost, confirmReception, publish, setMatch, deliver }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}
export const useCallbackStable = useCallback;
