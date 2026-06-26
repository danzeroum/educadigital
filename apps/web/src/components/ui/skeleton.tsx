import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-inner", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-line p-5 flex flex-col gap-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function ResourceCardSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-line overflow-hidden">
      <Skeleton className="h-[84px] rounded-none" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}
