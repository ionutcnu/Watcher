import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-tertiary mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-secondary mb-1">{title}</h3>
      <p className="text-sm text-text-tertiary max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}
