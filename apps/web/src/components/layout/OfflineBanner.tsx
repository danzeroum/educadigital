"use client";

import { useEffect } from "react";
import { useOfflineStore } from "@/store/offline.store";

export function OfflineBanner() {
  const { isOnline, setOnline } = useOfflineStore();

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setOnline]);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 animate-slide-down">
      <div className="bg-ink text-surface text-sm font-500 px-4 py-2.5 flex items-center gap-2">
        <span>📵</span>
        <span>Sem conexão — usando conteúdo salvo</span>
      </div>
    </div>
  );
}
