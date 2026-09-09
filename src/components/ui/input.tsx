import * as React from "react"
import { cn } from "cn"

// Deviates from the stock shadcn preset, which ships a `rounded-3xl` pill
// with a transparent border over a grey fill. That reads soft and unfinished
// on a data-entry surface: with no border there is no defined edge, so the
// field looks like a smudge rather than an input. This version gives it a
// real hairline edge, a subtle inset shadow, and a hover state — the same
// square-edged language as button.tsx.

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-muted/40 px-3 py-1 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 hover:border-ring/50 hover:bg-muted/60 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/18 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/18 md:text-sm dark:bg-input/30 dark:hover:bg-input/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
