import { useState } from "react";
import { Home, Search, FileText, PackageSearch, HandHelping, ShieldCheck, Inbox, Bell, ChevronRight, CheckCircle2 } from "lucide-react";
import { CATEGORIES, PLACES, USERS, catIcon } from "@/lib/perdiu/data";
import { useStore } from "@/lib/perdiu/store";
import type { FoundItem, LostReport } from "@/lib/perdiu/types";
import { cn } from "@/lib/utils";
import {
  type Errs, BackHeader, BienestarCard, Empty, Field, IdBlock, LevelChip, PhotoInput, Row, StatusChip, Thumb, fmtDate, nowLocal,
} from "./ui";

type View =
  | { v: "home" }
  | { v: "explore" }
  | { v: "mine"; tab?: "found" | "lost" }
  | { v: "newFound" }
  | { v: "newLost" }
  | { v: "item"; id: string }
  | { v: "myFound"; id: string }
  | { v: "myLost"; id: string; fresh?: boolean | undefined };

export function CommunityApp() {
  const [view, setView] = useState<View>({ v: "home" });
  const go = (x: View) => {
    setView(x);
    window.scrollTo({ top: 0 });
  };
  const tab = view.v === "explore" || view.v === "item" ? "explore" : view.v === "mine" || view.v === "myFound" || view.v === "myLost" ? "mine" : "home";

  return (
    <div className="mx-auto max-w-lg pb-24">
      <div className="px-4 pt-5">
        {view.v === "home" && <HomeScreen go={go} />}
        {view.v === "explore" && <Explore go={go} />}
        {view.v === "item" && <ItemDetail id={view.id} back={() => go({ v: "explore" })} />}
        {view.v === "mine" && <Mine go={go} tab={view.tab ?? "found"} />}
        {view.v === "newFound" && <NewFound go={go} />}
        {view.v === "newLost" && <NewLost go={go} />}
        {view.v === "myFound" && <MyFound id={view.id} back={() => go({ v: "mine", tab: "found" })} />}
        {view.v === "myLost" && <MyLost id={view.id} fresh={view.fresh} back={() => go({ v: "mine", tab: "lost" })} />}
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-n-200 bg-n-0">
        <div className="mx-auto flex max-w-lg">
          {([
            ["home", "Inicio", Home, { v: "home" }],
            ["explore", "Explorar", Search, { v: "explore" }],
            ["mine", "Mis reportes", FileText, { v: "mine" }],
          ] as const).map(([k, label, Icon, target]) => (
            <button
              key={k}
              onClick={() => go(target as View)}
              className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium", tab === k ? "text-brand-500" : "text-n-500")}
            >
              <span className={cn("rounded-full px-4 py-1", tab === k && "bg-brand-50")}>
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function HomeScreen({ go }: { go: (v: View) => void }) {
  const { db, userId } = useStore();
  const user = USERS[userId];
  const myLost = db.lost.filter((l) => l.ownerId === userId && l.status === "coincidencias");
  const nMatches = db.matches.filter((m) => m.status === "sugerida" && myLost.some((l) => l.id === m.lostId)).length;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-n-500">¡Hola, {user.name.split(" ")[0]}! 👋</p>
        <h1 className="mt-1 text-2xl leading-tight font-extrabold text-brand-700">
          ¿Lo perdi-U? <span className="bg-sun-500 px-1">¡Lo encontr-U!</span>
        </h1>
        <p className="mt-2 text-sm text-n-600">Si lo pierdes, te ayudamos a encontrarlo.</p>
      </div>

      {nMatches > 0 && (
        <button onClick={() => go({ v: "myLost", id: myLost[0].id })} className="flex w-full items-center gap-3 rounded-2xl bg-brand-500 p-4 text-left text-n-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-500 text-brand-700">
            <Bell className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">
              {nMatches} {nMatches === 1 ? "coincidencia nueva" : "coincidencias nuevas"}
            </span>
            <span className="text-sm text-brand-200">En tus reportes de pérdida. Revísalas.</span>
          </span>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => go({ v: "newFound" })} className="card flex flex-col items-start gap-3 p-4 text-left transition hover:border-brand-300">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sun-500 text-brand-700">
            <HandHelping className="h-6 w-6" />
          </span>
          <span className="text-base font-bold text-brand-700">Encontré un objeto</span>
          <span className="text-xs text-n-500">Repórtalo y llévalo a Bienestar</span>
        </button>
        <button onClick={() => go({ v: "newLost" })} className="card flex flex-col items-start gap-3 p-4 text-left transition hover:border-brand-300">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-n-0">
            <PackageSearch className="h-6 w-6" />
          </span>
          <span className="text-base font-bold text-brand-700">Perdí un objeto</span>
          <span className="text-xs text-n-500">Búsqueda inteligente asistida por IA</span>
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-n-700">Oficina de objetos perdidos</h2>
        <BienestarCard />
      </div>

      <button onClick={() => go({ v: "explore" })} className="btn-outline w-full">
        <Search className="h-4 w-4" /> Explorar objetos publicados
      </button>
    </div>
  );
}

function Explore({ go }: { go: (v: View) => void }) {
  const { db } = useStore();
  const [cat, setCat] = useState<string>("");
  const items = db.found.filter((f) => f.status === "publicado" && (!cat || f.category === cat));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-brand-700">Objetos publicados</h1>
        <p className="text-sm text-n-500">Objetos que están en Bienestar Estudiantil.</p>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {["", ...CATEGORIES.map((c) => c.name)].map((c) => (
          <button
            key={c || "all"}
            onClick={() => setCat(c)}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium", cat === c ? "border-brand-300 bg-brand-50 text-brand-500" : "border-n-200 bg-n-0 text-n-600")}
          >
            {c || "Todas"}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <Empty icon={Inbox} title="No hay objetos aquí" text="Por ahora no hay objetos publicados en esta categoría. Vuelve pronto." />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((f) => (
            <button key={f.id} onClick={() => go({ v: "item", id: f.id })} className="card overflow-hidden text-left transition hover:border-brand-300">
              <Thumb photo={f.photo} category={f.category} className="aspect-square w-full rounded-none" />
              <div className="space-y-0.5 p-3">
                <p className="text-xs font-semibold text-brand-300">{f.category}</p>
                <p className="line-clamp-1 text-sm font-medium text-n-900">{f.place}</p>
                <p className="text-xs text-n-500">{fmtDate(f.date)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemDetail({ id, back }: { id: string; back: () => void }) {
  const { db } = useStore();
  const f = db.found.find((x) => x.id === id);
  if (!f) return null;
  return (
    <div className="space-y-4">
      <BackHeader title="Detalle del objeto" onBack={back} />
      <Thumb photo={f.photo} category={f.category} className="aspect-video w-full" />
      <div className="card p-4">
        <p className="text-lg font-semibold text-brand-700">{f.description}</p>
        <div className="mt-2">
          <Row k="ID" v={<span className="font-mono">{f.id}</span>} />
          <Row k="Categoría" v={f.category} />
          <Row k="Lugar" v={f.place} />
          <Row k="Fecha" v={fmtDate(f.date)} />
        </div>
      </div>
      <div className="alert-sun">¿Es tuyo? Acércate a Bienestar Estudiantil con el ID <b className="font-mono">{f.id}</b>. Te recomendamos reportar tu pérdida para registrar la coincidencia.</div>
      <BienestarCard />
    </div>
  );
}

function Mine({ go, tab: initial }: { go: (v: View) => void; tab: "found" | "lost" }) {
  const { db, userId } = useStore();
  const [tab, setTab] = useState(initial);
  const found = db.found.filter((f) => f.finderId === userId);
  const lost = db.lost.filter((l) => l.ownerId === userId);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand-700">Mis reportes</h1>
      <div className="seg">
        <button className={cn("seg-item", tab === "found" && "seg-item-active")} onClick={() => setTab("found")}>Encontrados ({found.length})</button>
        <button className={cn("seg-item", tab === "lost" && "seg-item-active")} onClick={() => setTab("lost")}>Perdidos ({lost.length})</button>
      </div>
      {tab === "found" ? (
        found.length === 0 ? (
          <Empty icon={HandHelping} title="Aún no reportaste hallazgos" text="Cuando encuentres algo, repórtalo desde Inicio." />
        ) : (
          <div className="space-y-2">
            {found.map((f) => (
              <button key={f.id} onClick={() => go({ v: "myFound", id: f.id })} className="card flex w-full items-center gap-3 p-3 text-left">
                <Thumb photo={f.photo} category={f.category} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-n-500">{f.id}</p>
                  <p className="truncate text-sm font-semibold text-brand-700">{f.category}</p>
                  <p className="text-xs text-n-500">{fmtDate(f.date)}</p>
                </div>
                <StatusChip status={f.status} />
              </button>
            ))}
          </div>
        )
      ) : lost.length === 0 ? (
        <Empty icon={PackageSearch} title="Sin reportes de pérdida" text="Si pierdes algo, repórtalo y te avisaremos de las coincidencias." />
      ) : (
        <div className="space-y-2">
          {lost.map((l) => {
            const n = db.matches.filter((m) => m.lostId === l.id && m.status === "sugerida").length;
            return (
              <button key={l.id} onClick={() => go({ v: "myLost", id: l.id })} className="card flex w-full items-center gap-3 p-3 text-left">
                <Thumb photo={l.photo} category={l.category} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-n-500">{l.id}</p>
                  <p className="truncate text-sm font-semibold text-brand-700">{l.description}</p>
                  {n > 0 && <p className="text-xs font-semibold text-brand-300">{n} coincidencia(s)</p>}
                </div>
                <StatusChip status={l.status} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MyFound({ id, back }: { id: string; back: () => void }) {
  const { db } = useStore();
  const f = db.found.find((x) => x.id === id);
  if (!f) return null;
  return (
    <div className="space-y-4">
      <BackHeader title="Reporte de hallazgo" onBack={back} />
      <IdBlock id={f.id} />
      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-n-500">Estado</span>
          <StatusChip status={f.status} />
        </div>
        <FoundRows f={f} />
      </div>
      {f.status === "pendiente" && (
        <>
          <div className="alert-sun">Lleva el objeto a Bienestar y muestra este ID o QR. Tu reporte es privado hasta que lo reciban.</div>
          <BienestarCard />
        </>
      )}
    </div>
  );
}

function FoundRows({ f }: { f: FoundItem }) {
  return (
    <>
      {f.photo && <img src={f.photo} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />}
      <Row k="Descripción" v={f.description} />
      <Row k="Categoría" v={f.category} />
      <Row k="Lugar" v={f.place + (f.placeRef ? ` · ${f.placeRef}` : "")} />
      <Row k="Fecha y hora" v={fmtDate(f.date, true)} />
    </>
  );
}

function MyLost({ id, back, fresh }: { id: string; back: () => void; fresh?: boolean | undefined }) {
  const { db, setMatch } = useStore();
  const l = db.lost.find((x) => x.id === id);
  if (!l) return null;
  const matches = db.matches.filter((m) => m.lostId === l.id && m.status !== "descartada").sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-4">
      <BackHeader title="Reporte de pérdida" onBack={back} />
      {fresh && (
        <div className="flex items-center gap-2 rounded-xl bg-st-green-bg p-3 text-sm font-medium text-st-green-fg">
          <CheckCircle2 className="h-5 w-5" /> Reporte enviado correctamente
        </div>
      )}
      <IdBlock id={l.id} />
      <div className="alert-sun flex gap-2">
        <ShieldCheck className="h-5 w-5 shrink-0" />
        Tu reporte es privado y solo lo ve Bienestar. Quedará activo aunque no haya coincidencias.
      </div>

      <section>
        <h2 className="mb-2 text-base font-bold text-brand-700">
          {matches.length ? "Encontramos objetos parecidos al tuyo" : "Coincidencias"}
        </h2>
        {l.status === "recuperado" ? (
          <div className="rounded-xl bg-st-green-bg p-4 text-sm font-medium text-st-green-fg">¡Recuperaste tu objeto! Este reporte está cerrado.</div>
        ) : matches.length === 0 ? (
          <Empty icon={Search} title="Aún no hay coincidencias" text="Tu reporte quedará activo. Cuando Bienestar publique algo parecido, aparecerá aquí." />
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const f = db.found.find((x) => x.id === m.foundId)!;
              return (
                <div key={m.id} className="card space-y-3 p-3">
                  <div className="flex gap-3">
                    <Thumb photo={f.photo} category={f.category} className="h-20 w-20 shrink-0" />
                    <div className="min-w-0 space-y-1">
                      <p className="font-mono text-xs text-n-500">{f.id}</p>
                      <p className="text-sm font-semibold text-brand-700">{f.description}</p>
                      <p className="text-xs text-n-500">{f.place} · {fmtDate(f.date)}</p>
                    </div>
                  </div>
                  <LevelChip score={m.score} />
                  {m.status === "sugerida" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button className="btn-outline" onClick={() => setMatch(m.id, "descartada")}>No es mío</button>
                      <button className="btn-primary" onClick={() => setMatch(m.id, "recoger")}>Pasaré a recoger</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="alert-sun">
                        <b>Bienestar ya sabe que pasarás.</b> Lleva el ID de tu reporte <b className="font-mono">{l.id}</b>.
                      </div>
                      <BienestarCard compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-n-500">Estado</span>
          <StatusChip status={l.status} />
        </div>
        <LostRows l={l} />
      </div>
    </div>
  );
}

export function LostRows({ l }: { l: LostReport }) {
  return (
    <>
      {l.photo && <img src={l.photo} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />}
      <Row k="Descripción" v={l.description} />
      <Row k="Categoría" v={l.category} />
      <Row k="Lugares posibles" v={l.places.join(", ")} />
      {l.placesText && <Row k="Detalle" v={l.placesText} />}
      <Row k="Fechas" v={`${fmtDate(l.dateFrom)} – ${fmtDate(l.dateTo)}`} />
    </>
  );
}

function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CATEGORIES.map((c) => {
        const Icon = catIcon(c.name);
        return (
          <button
            type="button"
            key={c.name}
            onClick={() => onChange(c.name)}
            className={cn("flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] leading-tight font-medium", value === c.name ? "border-brand-300 bg-brand-50 text-brand-500" : "border-n-200 bg-n-0 text-n-600")}
          >
            <Icon className="h-5 w-5" />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-4 flex gap-2">
      {["Datos", "Revisión"].map((s, i) => (
        <div key={s} className="flex-1">
          <div className={cn("h-1.5 rounded-full", i < step ? "bg-brand-500" : "bg-n-200")} />
          <p className={cn("mt-1 text-xs", i < step ? "text-brand-500 font-semibold" : "text-n-500")}>{i + 1}. {s}</p>
        </div>
      ))}
    </div>
  );
}

function NewFound({ go }: { go: (v: View) => void }) {
  const { addFound } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [doneId, setDoneId] = useState("");
  const [f, setF] = useState({ photo: undefined as string | undefined, description: "", category: "", place: "", placeRef: "", date: nowLocal() });
  const [err, setErr] = useState<Errs>({});

  const validate = () => {
    const e: Errs = {};
    if (!f.description.trim()) e.description = "Describe el objeto.";
    if (!f.category) e.category = "Elige una categoría.";
    if (!f.place) e.place = "Elige el lugar.";
    if (!f.date) e.date = "Indica fecha y hora.";
    setErr(e);
    return !Object.keys(e).length;
  };

  if (step === 3)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl bg-st-green-bg p-3 text-sm font-medium text-st-green-fg">
          <CheckCircle2 className="h-5 w-5" /> ¡Gracias! Tu reporte fue enviado
        </div>
        <IdBlock id={doneId} />
        <div className="alert-sun flex gap-2">
          <ShieldCheck className="h-5 w-5 shrink-0" /> Tu reporte es privado hasta que Bienestar reciba el objeto.
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-brand-700">Ahora lleva el objeto a Bienestar y muestra este ID:</p>
          <BienestarCard />
        </div>
        <button className="btn-primary w-full" onClick={() => go({ v: "mine", tab: "found" })}>Ver mis reportes</button>
        <button className="btn-ghost w-full" onClick={() => go({ v: "home" })}>Volver al inicio</button>
      </div>
    );

  return (
    <div>
      <BackHeader title="Encontré un objeto" onBack={() => (step === 2 ? setStep(1) : go({ v: "home" }))} />
      <Stepper step={step} />
      {step === 1 ? (
        <div className="space-y-4">
          <PhotoInput label="Foto del objeto" value={f.photo} onChange={(photo) => setF({ ...f, photo })} />
          <Field label="Descripción" error={err.description}>
            <textarea className="field min-h-24" placeholder="Ej. Celular Samsung con funda azul" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
          <Field label="Categoría" error={err.category}>
            <CategoryPicker value={f.category} onChange={(category) => setF({ ...f, category })} />
          </Field>
          <Field label="¿Dónde lo encontraste?" error={err.place}>
            <select className="field" value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })}>
              <option value="">Selecciona un lugar</option>
              {PLACES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Referencia adicional" optional>
            <input className="field" placeholder="Ej. Segundo piso, cerca de la ventana" value={f.placeRef} onChange={(e) => setF({ ...f, placeRef: e.target.value })} />
          </Field>
          <Field label="Fecha y hora del hallazgo" error={err.date}>
            <input type="datetime-local" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
          <button className="btn-primary w-full" onClick={() => validate() && setStep(2)}>Revisar reporte</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <FoundRows f={{ ...f, id: "", finderId: "ana", status: "pendiente", createdAt: "", date: new Date(f.date).toISOString() }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-outline" onClick={() => setStep(1)}>Editar</button>
            <button
              className="btn-primary"
              onClick={() => {
                setDoneId(addFound({ ...f, placeRef: f.placeRef || undefined, date: new Date(f.date).toISOString() }));
                setStep(3);
              }}
            >
              Enviar reporte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewLost({ go }: { go: (v: View) => void }) {
  const { addLost } = useStore();
  const today = nowLocal().slice(0, 10);
  const [step, setStep] = useState<1 | 2>(1);
  const [f, setF] = useState({ photo: undefined as string | undefined, description: "", category: "", places: [] as string[], placesText: "", dateFrom: today, dateTo: today });
  const [err, setErr] = useState<Errs>({});

  const validate = () => {
    const e: Errs = {};
    if (!f.description.trim()) e.description = "Describe tu objeto.";
    if (!f.category) e.category = "Elige una categoría.";
    if (!f.places.length) e.places = "Elige al menos un lugar.";
    if (!f.dateFrom || !f.dateTo) e.dates = "Indica el rango de fechas.";
    else if (f.dateFrom > f.dateTo) e.dates = "La fecha 'desde' debe ser anterior a 'hasta'.";
    setErr(e);
    return !Object.keys(e).length;
  };

  return (
    <div>
      <BackHeader title="Perdí un objeto" onBack={() => (step === 2 ? setStep(1) : go({ v: "home" }))} />
      <Stepper step={step} />
      {step === 1 ? (
        <div className="space-y-4">
          <PhotoInput label="Foto de referencia" value={f.photo} onChange={(photo) => setF({ ...f, photo })} />
          <Field label="Descripción" error={err.description}>
            <textarea className="field min-h-24" placeholder="Ej. Llaves con llavero rojo de la universidad" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
          <Field label="Categoría" error={err.category}>
            <CategoryPicker value={f.category} onChange={(category) => setF({ ...f, category })} />
          </Field>
          <Field label="¿Dónde pudiste perderlo?" error={err.places}>
            <div className="flex flex-wrap gap-2">
              {PLACES.map((p) => {
                const on = f.places.includes(p);
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setF({ ...f, places: on ? f.places.filter((x) => x !== p) : [...f.places, p] })}
                    className={cn("rounded-full border px-3 py-1.5 text-sm", on ? "border-brand-300 bg-brand-50 font-semibold text-brand-500" : "border-n-300 bg-n-0 text-n-600")}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Describe por dónde pudiste extraviarlo" optional>
            <input className="field" placeholder="Ej. Fui de la biblioteca a la cafetería" value={f.placesText} onChange={(e) => setF({ ...f, placesText: e.target.value })} />
          </Field>
          <Field label="¿Cuándo pudiste perderlo?" error={err.dates}>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="field" value={f.dateFrom} onChange={(e) => setF({ ...f, dateFrom: e.target.value })} aria-label="Desde" />
              <input type="date" className="field" value={f.dateTo} onChange={(e) => setF({ ...f, dateTo: e.target.value })} aria-label="Hasta" />
            </div>
          </Field>
          <button className="btn-primary w-full" onClick={() => validate() && setStep(2)}>Revisar reporte</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-4">
            <LostRows l={{ ...f, id: "", ownerId: "ana", status: "buscando", createdAt: "" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-outline" onClick={() => setStep(1)}>Editar</button>
            <button
              className="btn-primary"
              onClick={() => {
                const id = addLost({ ...f, placesText: f.placesText || undefined });
                go({ v: "myLost", id, fresh: true });
              }}
            >
              Enviar reporte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
