"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  rangeClassName,
  rangeStyle,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  rangeClassName?: string;
  rangeStyle?: React.CSSProperties;
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-slate-100 rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5 relative grow overflow-hidden data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn("bg-slate-900 absolute select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full", rangeClassName)}
          style={rangeStyle}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          className="border-slate-200 ring-slate-950/50 relative size-4 rounded-full border bg-white shadow-sm transition-[color,box-shadow] after:absolute after:-inset-2 hover:ring-2 focus-visible:ring-2 focus-visible:outline-none active:ring-2 block shrink-0 select-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
