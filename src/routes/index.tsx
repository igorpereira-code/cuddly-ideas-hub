import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { Toaster } from "sonner";
import { USERS } from "@/lib/perdiu/data";
import { StoreProvider, useStore } from "@/lib/perdiu/store";
import type { UserId } from "@/lib/perdiu/types";
import { CommunityApp } from "@/components/perdiu/Community";
import { BienestarApp } from "@/components/perdiu/Bienestar";
import { Logo } from "@/components/perdiu/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Perdi-U — Objetos perdidos de la universidad" },
      { name: "description", content: "¿Lo perdi-U? ¡Lo encontr-U! Reporta y recupera objetos perdidos en el campus con búsqueda asistida por IA." },
      { property: "og:title", content: "Perdi-U — Objetos perdidos de la universidad" },
      { property: "og:description", content: "Reporta y recupera objetos perdidos en el campus con búsqueda asistida por IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <StoreProvider>
      <App />
      <Toaster position="top-center" richColors />
    </StoreProvider>
  ),
});

const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");

function App() {
  const { userId, setUserId, reset } = useStore();
  const user = USERS[userId];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-brand-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Logo light />
          {user.role === "bienestar" && <span className="rounded-full bg-sun-500 px-2 py-0.5 text-xs font-bold text-brand-700">Bienestar</span>}
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-brand-200 sm:inline">Ver como:</span>
            <div className="flex rounded-full bg-brand-700 p-1">
              {(Object.keys(USERS) as UserId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setUserId(id);
                    window.scrollTo({ top: 0 });
                  }}
                  title={`${USERS[id].name} · ${USERS[id].email}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-xs font-semibold transition",
                    userId === id ? "bg-n-0 text-brand-700" : "text-brand-200 hover:text-n-0",
                  )}
                >
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px]", userId === id ? "bg-sun-500 text-brand-700" : "bg-brand-500 text-n-0")}>
                    {initials(USERS[id].name)}
                  </span>
                  <span className="hidden sm:inline">{USERS[id].name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => confirm("¿Reiniciar todos los datos de demo?") && reset()}
              className="rounded-full p-2 text-brand-200 hover:bg-brand-700 hover:text-n-0"
              title="Reiniciar datos de demo"
              aria-label="Reiniciar datos de demo"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-7xl truncate px-4 pb-2 text-[11px] text-brand-200">{user.name} · {user.email}</p>
      </header>
      {user.role === "bienestar" ? <BienestarApp key="b" /> : <CommunityApp key={userId} />}
    </div>
  );
}
