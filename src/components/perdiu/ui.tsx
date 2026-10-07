import { useState, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Camera, Clock, MapPin, Sparkles, X, ChevronLeft } from "lucide-react";
import { BIENESTAR_INFO, catIcon } from "@/lib/perdiu/data";
import type { FoundStatus, LostStatus } from "@/lib/perdiu/types";
import { level } from "@/lib/perdiu/matching";
import { cn } from "@/lib/utils";

export const FOUND_LABEL: Record<FoundStatus, string> = {
  pendiente: "Pendiente de entrega",
  custodia: "En custodia",
  publicado: "Publicado",
  entregado: "Entregado",
};
export const LOST_LABEL: Record<LostStatus, string> = {
  buscando: "Buscando",
  coincidencias: "Con coincidencias",
  recojo: "Pendiente de recojo",
  recuperado: "Recuperado",
};
const CHIP: Record<string, string> = {
  pendiente: "bg-st-amber-bg text-st-amber-fg",
  custodia: "bg-brand-100 text-brand-500",
  publicado: "bg-brand-500 text-n-0",
  entregado: "bg-st-green-bg text-st-green-fg",
  buscando: "bg-n-100 text-n-700",
  coincidencias: "bg-sun-500 text-brand-700",
  recojo: "bg-st-amber-bg text-st-amber-fg",
  recuperado: "bg-st-green-bg text-st-green-fg",
};

export function StatusChip({ status }: { status: FoundStatus | LostStatus }) {
  const label = (FOUND_LABEL as Record<string, string>)[status] ?? (LOST_LABEL as Record<string, string>)[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", CHIP[status])}>
      {label}
    </span>
  );
}

export function LevelChip({ score }: { score: number }) {
  const l = level(score);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", l === "Alta" ? "bg-st-green-bg text-st-green-fg" : "bg-st-amber-bg text-st-amber-fg")}>
        Similitud {l} · {score}%
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-sun-500 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
        <Sparkles className="h-3 w-3" /> Sugerido por IA
      </span>
    </span>
  );
}

export function Thumb({ photo, category, className }: { photo?: string | undefined; category: string; className?: string | undefined }) {
  const Icon = catIcon(category);
  return photo ? (
    <img src={photo} alt={category} className={cn("rounded-xl object-cover", className)} />
  ) : (
    <div className={cn("flex items-center justify-center rounded-xl bg-brand-50 text-brand-300", className)}>
      <Icon className="h-1/2 w-1/2 max-h-12 max-w-12" strokeWidth={1.5} />
    </div>
  );
}

export function BienestarCard({ compact }: { compact?: boolean | undefined }) {
  return (
    <div className={cn("card flex gap-3 p-4", compact && "p-3")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-300">
        <MapPin className="h-5 w-5" />
      </div>
      <div className="text-sm">
        <p className="font-semibold text-brand-700">{BIENESTAR_INFO.place}</p>
        <p className="mt-0.5 flex items-center gap-1 text-n-500">
          <Clock className="h-3.5 w-3.5" /> {BIENESTAR_INFO.hours}
        </p>
      </div>
    </div>
  );
}

export function IdBlock({ id, size = 140 }: { id: string; size?: number | undefined }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-5">
      <p className="text-xs font-medium tracking-wide text-n-500 uppercase">ID de tu reporte</p>
      <p className="font-mono text-4xl font-bold tracking-wider text-brand-700">{id}</p>
      <div className="rounded-xl border border-n-200 bg-n-0 p-3">
        <QRCodeSVG value={id} size={size} fgColor="#0B274F" />
      </div>
    </div>
  );
}

export function PhotoInput({ value, onChange, label }: { value?: string | undefined; onChange: (v?: string) => void; label: string }) {
  return (
    <div>
      <span className="label">{label} <span className="font-normal text-n-500">(opcional)</span></span>
      {value ? (
        <div className="relative">
          <img src={value} alt="Vista previa" className="h-48 w-full rounded-xl object-cover" />
          <button type="button" onClick={() => onChange(undefined)} className="absolute top-2 right-2 rounded-full bg-n-0 p-1.5 text-n-700 shadow" aria-label="Quitar foto">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-n-300 bg-n-50 text-sm text-n-600 hover:bg-brand-50">
          <Camera className="h-6 w-6 text-brand-300" />
          Tomar foto o subir desde la galería
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const r = new FileReader();
              r.onload = () => {
                const img = new Image();
                img.onload = () => {
                  const c = document.createElement("canvas");
                  const s = Math.min(1, 640 / Math.max(img.width, img.height));
                  c.width = img.width * s;
                  c.height = img.height * s;
                  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
                  onChange(c.toDataURL("image/jpeg", 0.75));
                };
                img.src = r.result as string;
              };
              r.readAsDataURL(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

export function Field({ label, error, children, optional }: { label: string; error?: string | undefined; children: ReactNode; optional?: boolean | undefined }) {
  return (
    <div>
      <span className="label">
        {label} {optional && <span className="font-normal text-n-500">(opcional)</span>}
      </span>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <button onClick={onBack} className="btn-ghost -ml-2 min-h-10 px-2" aria-label="Volver">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-bold text-brand-700">{title}</h1>
    </div>
  );
}

export function Empty({ icon: Icon, title, text }: { icon: typeof X; title: string; text: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-300">
        <Icon className="h-6 w-6" />
      </div>
      <p className="font-semibold text-brand-700">{title}</p>
      <p className="max-w-xs text-sm text-n-500">{text}</p>
    </div>
  );
}

export function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-n-100 py-2 text-sm last:border-0">
      <span className="text-n-500">{k}</span>
      <span className="text-right font-medium text-n-900">{v}</span>
    </div>
  );
}

export const fmtDate = (iso: string, time = false) =>
  new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

export const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function useToggle(init = false) {
  return useState(init);
}

export function Logo({ light }: { light?: boolean | undefined }) {
  return (
    <span className={cn("text-xl font-extrabold tracking-tight", light ? "text-n-0" : "text-brand-700")}>
      Perdi<span className="relative">-U<span className="absolute -bottom-0.5 left-0 h-1 w-full rounded bg-sun-500" /></span>
    </span>
  );
}
export type Errs = Partial<Record<"description" | "category" | "place" | "date" | "places" | "dates" | "foundId" | "name" | "email" | "code" | "lostId", string>>;
