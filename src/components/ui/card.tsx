import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border",
        elevated: "bg-surface-elevated text-card-foreground border-border shadow-md",
        primary: "bg-card text-card-foreground border-accent-primary/20 shadow-[0_0_16px_rgba(59,130,246,0.05)]",
        ghost: "bg-transparent text-card-foreground border-transparent shadow-none",
        camo: "relative bg-gradient-to-br from-[#27272a] to-[#18181b] text-card-foreground border-2 border-[#3f3f46] shadow-[0_4px_20px_rgba(255,140,0,0.1)] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[#FF8C00] before:via-[#CC5500] before:to-[#FF8C00] before:content-['']",
        bracket: "relative overflow-visible rounded-none bg-[#0d0b09] text-card-foreground border border-[#2a2418]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    >
      {variant === 'bracket' && (
        <>
          <span aria-hidden="true" className="pointer-events-none absolute top-[-1px] left-[-1px] w-[13px] h-[13px] border-t-2 border-l-2 border-[#CC8800] z-10" />
          <span aria-hidden="true" className="pointer-events-none absolute top-[-1px] right-[-1px] w-[13px] h-[13px] border-t-2 border-r-2 border-[#CC8800] z-10" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-[-1px] left-[-1px] w-[13px] h-[13px] border-b-2 border-l-2 border-[#CC8800] z-10" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-[-1px] right-[-1px] w-[13px] h-[13px] border-b-2 border-r-2 border-[#CC8800] z-10" />
        </>
      )}
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
}
