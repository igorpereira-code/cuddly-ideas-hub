import { useState } from "react";
import { toast } from "sonner";
import { Inbox, Archive, FileSearch, HandCoins, Search, PackageCheck, User } from "lucide-react";
import { USERS } from "@/lib/perdiu/data";
import { useStore } from "@/lib/perdiu/store";
import type { FoundItem } from "@/lib/perdiu/types";
import { cn } from "@/lib/utils";
import { type Errs, Empty, Field, LevelChip, Row, StatusChip, Thumb, fmtDate } from "./ui";
import { LostRows } from "./Community";

type Sec = "solicitudes" | "custodia" | "perdidas" | "recojos" | "entrega";
interface Prefill { foundId?: string | undefined; lostId?: string | undefined; name?: string | undefined; email?: string | undefined; code?: string | undefined }

export function BienestarApp() {
  const { db } = useStore();
  const [sec, setSec] = useState<Sec>("solicitudes");
  const [prefill, setPrefill] = useState<Prefill>({});
  const pending = db.pickups.filter((p) => !p.done).length;
  const reqs = db.found.filter((f) => f.status === "pendiente").length;
  const toDeliver = (p: Prefill) => {
    setPrefill(p);
    setSec("entrega");
  };

  const nav: [Sec, string, typeof Inbox, number?][] = [
    ["solicitudes", "Solicitudes de hallazgo", Inbox, reqs],
    ["custodia", "Objetos en custodia", Archive],
    ["perdidas", "Reportes de pérdida", FileSearch],
    ["recojos", "Recojos pendientes", HandCoins, pending],
    ["entrega", "Registrar entrega", PackageCheck],
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
      <aside className="md:w-64 md:shrink-0">
        <p className="mb-2 hidden px-3 text-xs font-semibold tracking-wide text-n-500 uppercase md:block">Panel de Bienestar</p>
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:px-0">
          {nav.map(([k, label, Icon, count]) => (
            <button
              key={k}
              onClick={() => {
                setSec(k);
                if (k === "entrega") setPrefill({});
              }}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                sec === k ? "bg-brand-50 text-brand-500" : "text-n-600 hover:bg-n-100",
              )}
            >
              <Icon className={cn("h-5 w-5", sec === k && "text-brand-300")} />
              <span className="flex-1 text-left whitespace-nowrap">{label}</span>
              {!!count && <span className="rounded-full bg-sun-500 px-2 py-0.5 text-xs font-bold text-brand-700">{count}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        {sec === "solicitudes" && <Requests />}
        {sec === "custodia" && <Custody toDeliver={toDeliver} />}
        {sec === "perdidas" && <LostReports />}
        {sec === "recojos" && <Pickups toDeliver={toDeliver} />}
        {sec === "entrega" && <DeliveryForm key={JSON.stringify(prefill)} prefill={prefill} done={() => setSec("custodia")} />}
      </main>
    </div>
  );
}

function H({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold text-brand-700">{title}</h1>
      <p className="text-sm text-n-500">{sub}</p>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-4">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-n-500" />
      <input className="field pl-9 font-mono uppercase placeholder:font-sans placeholder:normal-case" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

const match = (id: string, q: string) => id.toUpperCase().includes(q.trim().toUpperCase());

function TwoPane({ list, detail }: { list: React.ReactNode; detail: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-2">{list}</div>
      <div className="lg:sticky lg:top-24 lg:self-start">{detail}</div>
    </div>
  );
}

function ItemRow({ f, active, onClick, extra }: { f: FoundItem; active: boolean; onClick: () => void; extra?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("card flex w-full items-center gap-3 p-3 text-left", active && "border-brand-300 ring-2 ring-brand-300/20")}>
      <Thumb photo={f.photo} category={f.category} className="h-14 w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-bold text-brand-700">{f.id}</p>
        <p className="truncate text-sm text-n-700">{f.category} · {f.place}</p>
        <p className="text-xs text-n-500">{fmtDate(f.date, true)}{extra}</p>
      </div>
      <StatusChip status={f.status} />
    </button>
  );
}

function Requests() {
  const { db, confirmReception } = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>();
  const list = db.found.filter((f) => f.status === "pendiente" && match(f.id, q));
  const f = db.found.find((x) => x.id === sel && x.status === "pendiente") ?? (q && list.length === 1 ? list[0] : undefined);
  return (
    <>
      <H title="Solicitudes de hallazgo" sub="Reportes privados esperando que el hallador traiga el objeto." />
      <SearchBox value={q} onChange={setQ} placeholder="Buscar por ID, ej. HZ-0007" />
      <TwoPane
        list={list.length ? list.map((x) => <ItemRow key={x.id} f={x} active={f?.id === x.id} onClick={() => setSel(x.id)} extra={` · ${USERS[x.finderId].name}`} />) : <Empty icon={Inbox} title="Sin solicitudes" text={q ? "No hay solicitudes con ese ID." : "No hay objetos pendientes de entrega."} />}
        detail={
          f ? (
            <div className="card space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-2xl font-bold text-brand-700">{f.id}</p>
                <StatusChip status={f.status} />
              </div>
              <Thumb photo={f.photo} category={f.category} className="aspect-video w-full" />
              <div>
                <Row k="Descripción" v={f.description} />
                <Row k="Categoría" v={f.category} />
                <Row k="Lugar" v={f.place + (f.placeRef ? ` · ${f.placeRef}` : "")} />
                <Row k="Fecha y hora" v={fmtDate(f.date, true)} />
                <Row k="Hallador" v={USERS[f.finderId].name} />
                <Row k="Correo" v={USERS[f.finderId].email} />
              </div>
              <button
                className="btn-primary w-full"
                onClick={() => {
                  confirmReception(f.id);
                  toast.success(`Recepción confirmada: ${f.id} está en custodia`);
                  setSel(undefined);
                  setQ("");
                }}
              >
                <PackageCheck className="h-4 w-4" /> Confirmar recepción
              </button>
            </div>
          ) : (
            <Empty icon={Search} title="Selecciona una solicitud" text="Busca el ID que te muestra el hallador para ver el detalle." />
          )
        }
      />
    </>
  );
}

function Custody({ toDeliver }: { toDeliver: (p: Prefill) => void }) {
  const { db, publish } = useStore();
  const [filter, setFilter] = useState<"activos" | "entregados">("activos");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>();
  const list = db.found.filter((f) => (filter === "activos" ? f.status === "custodia" || f.status === "publicado" : f.status === "entregado") && match(f.id, q));
  const f = db.found.find((x) => x.id === sel);
  const delivery = f && db.deliveries.find((d) => d.foundId === f.id);
  return (
    <>
      <H title="Objetos en custodia" sub="Objetos recibidos en la oficina. Publícalos para que la comunidad los vea." />
      <div className="mb-3 flex flex-col gap-3 sm:flex-row">
        <div className="seg sm:w-72">
          <button className={cn("seg-item", filter === "activos" && "seg-item-active")} onClick={() => setFilter("activos")}>En oficina</button>
          <button className={cn("seg-item", filter === "entregados" && "seg-item-active")} onClick={() => setFilter("entregados")}>Entregados</button>
        </div>
        <div className="flex-1 [&>div]:mb-0">
          <SearchBox value={q} onChange={setQ} placeholder="Buscar por ID" />
        </div>
      </div>
      <TwoPane
        list={list.length ? list.map((x) => <ItemRow key={x.id} f={x} active={sel === x.id} onClick={() => setSel(x.id)} />) : <Empty icon={Archive} title="Nada por aquí" text="No hay objetos en esta vista." />}
        detail={
          f ? (
            <div className="card space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-2xl font-bold text-brand-700">{f.id}</p>
                <StatusChip status={f.status} />
              </div>
              <Thumb photo={f.photo} category={f.category} className="aspect-video w-full" />
              <div>
                <Row k="Descripción" v={f.description} />
                <Row k="Categoría" v={f.category} />
                <Row k="Lugar" v={f.place} />
                <Row k="Fecha" v={fmtDate(f.date, true)} />
                <Row k="Visibilidad" v={f.status === "publicado" ? "Visible a la comunidad" : f.status === "custodia" ? "No publicado" : "Retirado"} />
              </div>
              {delivery && (
                <div className="rounded-xl bg-st-green-bg p-3 text-sm text-st-green-fg">
                  Entregado a <b>{delivery.name}</b> ({delivery.email}, cód. {delivery.code}) el {fmtDate(delivery.createdAt, true)}
                  {delivery.lostId && <> · Reporte {delivery.lostId}</>}
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {f.status === "custodia" && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const n = publish(f.id);
                      if (n > 0) toast.success(`Objeto publicado. Se encontraron ${n} coincidencia${n > 1 ? "s" : ""} con reportes de pérdida`);
                      else toast("Objeto publicado. Sin coincidencias por ahora");
                    }}
                  >
                    Publicar
                  </button>
                )}
                {f.status !== "entregado" && (
                  <button className="btn-outline" onClick={() => toDeliver({ foundId: f.id })}>Registrar entrega</button>
                )}
              </div>
            </div>
          ) : (
            <Empty icon={Archive} title="Selecciona un objeto" text="Elige un objeto para ver su detalle y acciones." />
          )
        }
      />
    </>
  );
}

function LostReports() {
  const { db } = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>();
  const list = db.lost.filter((l) => l.status !== "recuperado" && match(l.id, q));
  const l = db.lost.find((x) => x.id === sel) ?? (q && list.length === 1 ? list[0] : undefined);
  const ms = l ? db.matches.filter((m) => m.lostId === l.id && m.status !== "descartada").sort((a, b) => b.score - a.score) : [];
  return (
    <>
      <H title="Reportes de pérdida" sub="Busca el ID que muestra el propietario al llegar a la oficina." />
      <SearchBox value={q} onChange={setQ} placeholder="Buscar por ID, ej. PR-0012" />
      <TwoPane
        list={
          list.length ? (
            list.map((x) => (
              <button key={x.id} onClick={() => setSel(x.id)} className={cn("card flex w-full items-center gap-3 p-3 text-left", l?.id === x.id && "border-brand-300 ring-2 ring-brand-300/20")}>
                <Thumb photo={x.photo} category={x.category} className="h-14 w-14 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-bold text-brand-700">{x.id}</p>
                  <p className="truncate text-sm text-n-700">{x.category} · {USERS[x.ownerId].name}</p>
                  <p className="text-xs text-n-500">{fmtDate(x.createdAt)}</p>
                </div>
                <StatusChip status={x.status} />
              </button>
            ))
          ) : (
            <Empty icon={FileSearch} title="Sin reportes" text={q ? "No hay reportes activos con ese ID." : "No hay reportes de pérdida activos."} />
          )
        }
        detail={
          l ? (
            <div className="card space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-2xl font-bold text-brand-700">{l.id}</p>
                <StatusChip status={l.status} />
              </div>
              <div>
                <LostRows l={l} />
                <Row k="Propietario" v={USERS[l.ownerId].name} />
                <Row k="Correo" v={USERS[l.ownerId].email} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-brand-700">Objetos coincidentes</p>
                {ms.length === 0 ? (
                  <p className="text-sm text-n-500">Sin coincidencias por ahora.</p>
                ) : (
                  <div className="space-y-2">
                    {ms.map((m) => {
                      const f = db.found.find((x) => x.id === m.foundId)!;
                      return (
                        <div key={m.id} className="flex items-center gap-3 rounded-xl border border-n-200 p-2">
                          <Thumb photo={f.photo} category={f.category} className="h-12 w-12 shrink-0" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="flex items-center gap-2 font-mono text-sm font-bold text-brand-700">
                              {f.id} {m.status === "recoger" && <span className="font-sans text-xs font-semibold text-brand-300">· Pasará a recoger</span>}
                            </p>
                            <LevelChip score={m.score} />
                          </div>
                          <StatusChip status={f.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Empty icon={Search} title="Selecciona un reporte" text="Busca por ID para ver la descripción y los objetos coincidentes." />
          )
        }
      />
    </>
  );
}

function Pickups({ toDeliver }: { toDeliver: (p: Prefill) => void }) {
  const { db } = useStore();
  const list = db.pickups.filter((p) => !p.done);
  return (
    <>
      <H title="Recojos pendientes" sub="Personas que avisaron que pasarán a recoger un objeto." />
      {list.length === 0 ? (
        <Empty icon={HandCoins} title="No hay recojos pendientes" text="Cuando alguien pulse “Pasaré a recoger”, aparecerá aquí." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((p) => {
            const f = db.found.find((x) => x.id === p.foundId)!;
            const u = USERS[p.ownerId];
            return (
              <div key={p.id} className="card space-y-3 p-4">
                <div className="flex gap-3">
                  <Thumb photo={f.photo} category={f.category} className="h-16 w-16 shrink-0" />
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-brand-700"><User className="mr-1 inline h-4 w-4 text-brand-300" />{u.name}</p>
                    <p className="truncate text-n-500">{u.email}</p>
                    <p className="mt-1 text-n-700">vendrá a recoger <b className="font-mono">{f.id}</b> ({f.category})</p>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-n-500">
                  <span>Reporte: <b className="font-mono text-brand-700">{p.lostId}</b></span>
                  <span>Aviso: {fmtDate(p.createdAt, true)}</span>
                </div>
                <button className="btn-primary w-full" onClick={() => toDeliver({ foundId: f.id, lostId: p.lostId, name: u.name, email: u.email, code: u.code })}>
                  Registrar entrega
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function DeliveryForm({ prefill, done }: { prefill: Prefill; done: () => void }) {
  const { db, deliver } = useStore();
  const [v, setV] = useState({ foundId: prefill.foundId ?? "", lostId: prefill.lostId ?? "", name: prefill.name ?? "", email: prefill.email ?? "", code: prefill.code ?? "" });
  const [err, setErr] = useState<Errs>({});
  const deliverable = db.found.filter((f) => f.status === "custodia" || f.status === "publicado");
  const f = deliverable.find((x) => x.id === v.foundId.trim().toUpperCase());

  const submit = () => {
    const e: Errs = {};
    if (!f) e.foundId = "Ingresa el ID de un objeto en custodia o publicado.";
    if (!v.name.trim()) e.name = "Nombre obligatorio.";
    if (!/^[^@\s]+@universidad\.edu\.bo$/i.test(v.email.trim())) e.email = "Usa un correo institucional (@universidad.edu.bo).";
    if (!v.code.trim()) e.code = "Código universitario obligatorio.";
    const lid = v.lostId.trim().toUpperCase();
    if (lid && !db.lost.some((l) => l.id === lid && l.status !== "recuperado")) e.lostId = "No existe un reporte activo con ese ID.";
    setErr(e);
    if (Object.keys(e).length) return;
    deliver({ foundId: f!.id, lostId: lid || undefined, name: v.name.trim(), email: v.email.trim(), code: v.code.trim() });
    toast.success(`Entrega registrada: ${f!.id} entregado a ${v.name}`);
    done();
  };

  return (
    <>
      <H title="Registrar entrega" sub="Verifica la propiedad en persona antes de registrar la entrega." />
      <div className="card max-w-2xl space-y-4 p-5">
        <Field label="Objeto que se entrega (ID)" error={err.foundId}>
          <input className="field font-mono uppercase" list="deliverable" value={v.foundId} onChange={(e) => setV({ ...v, foundId: e.target.value })} placeholder="HZ-0001" />
          <datalist id="deliverable">{deliverable.map((x) => <option key={x.id} value={x.id}>{x.description}</option>)}</datalist>
        </Field>
        {f && (
          <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-3">
            <Thumb photo={f.photo} category={f.category} className="h-12 w-12 shrink-0" />
            <p className="flex-1 text-sm text-brand-700">{f.description}</p>
            <StatusChip status={f.status} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" error={err.name}>
            <input className="field" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
          </Field>
          <Field label="Código universitario" error={err.code}>
            <input className="field" value={v.code} onChange={(e) => setV({ ...v, code: e.target.value })} />
          </Field>
        </div>
        <Field label="Correo institucional" error={err.email}>
          <input className="field" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
        </Field>
        <Field label="Reporte de pérdida vinculado (ID)" optional error={err.lostId}>
          <input className="field font-mono uppercase" value={v.lostId} onChange={(e) => setV({ ...v, lostId: e.target.value })} placeholder="PR-0001" />
        </Field>
        <div className="alert-sun">Al confirmar, el objeto pasará a <b>Entregado</b>, dejará de verse en Explorar y el reporte vinculado se cerrará como <b>Recuperado</b>.</div>
        <button className="btn-primary w-full sm:w-auto" onClick={submit}>
          <PackageCheck className="h-4 w-4" /> Confirmar entrega
        </button>
      </div>
    </>
  );
}
