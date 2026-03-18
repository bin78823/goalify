"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../lib/utils"

function Progress({
  className,
  value,
  indicatorClassName,
  indicatorStyle,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { 
  indicatorClassName?: string;
  indicatorStyle?: React.CSSProperties;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-slate-100 h-1 rounded-full relative flex w-full items-center overflow-x-hidden",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("bg-slate-900 size-full flex-1 transition-all", indicatorClassName)}
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          ...indicatorStyle
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
