import { TutorSidebar } from "@/components/layout/TutorSidebar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <OfflineBanner />
      <TutorSidebar />
      <main className="ml-[236px] flex-1 p-8 max-w-[1400px]">{children}</main>
    </div>
  );
}
