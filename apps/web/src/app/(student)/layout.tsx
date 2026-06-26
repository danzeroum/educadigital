import { BottomNav } from "@/components/layout/BottomNav";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <main className="min-h-screen bg-paper pb-safe">{children}</main>
      <BottomNav />
    </>
  );
}
