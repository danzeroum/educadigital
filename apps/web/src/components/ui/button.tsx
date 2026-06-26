"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-600 transition-all active:scale-97 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "gradient-green text-white shadow-green-cta rounded-btn",
        outline:
          "border border-line-2 bg-surface text-ink hover:bg-paper rounded-btn",
        ghost: "text-ink hover:bg-line-soft rounded-btn",
        amber:
          "gradient-amber text-white shadow-amber-cta rounded-btn",
        destructive:
          "bg-risk-critical text-white rounded-btn",
        link: "text-green underline-offset-4 hover:underline min-h-0 min-w-0",
      },
      size: {
        default: "h-12 px-6 text-[17px]",
        sm: "h-10 px-4 text-[15px]",
        lg: "h-14 px-8 text-[18px]",
        icon: "h-11 w-11",
        "icon-lg": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
