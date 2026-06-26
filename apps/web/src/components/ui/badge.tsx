import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-600 font-sans",
  {
    variants: {
      variant: {
        default: "bg-green-tint text-green-700",
        amber: "bg-amber-tint text-amber-deep border border-amber-border",
        sky: "bg-sky-tint text-sky-deep",
        purple: "bg-purple-tint text-purple-deep",
        coral: "bg-coral/10 text-coral",
        muted: "bg-line-soft text-ink-soft",
        critical: "bg-[#FDE7E7] text-[#C5292E]",
        high: "bg-[#FEEBD6] text-[#B45309]",
        medium: "bg-[#FEF6D6] text-[#A16207]",
        low: "bg-green-tint text-green-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
