import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/src/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    {/* Inline CSS ensures a consistent modern scrollbar across browsers */}
    <style>{`
      .cvf-scroll-viewport {
        scrollbar-width: thin; /* Firefox */
        scrollbar-color: rgba(99,102,241,0.9) rgba(15,23,42,0.06);
      }

      .cvf-scroll-viewport::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      .cvf-scroll-viewport::-webkit-scrollbar-track {
        background: transparent;
        margin: 8px 0;
        border-radius: 9999px;
      }

      .cvf-scroll-viewport::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(99,102,241,0.95), rgba(56,189,248,0.9));
        border-radius: 9999px;
        border: 2px solid rgba(15,23,42,0.06);
      }

      .cvf-scroll-viewport::-webkit-scrollbar-thumb:hover {
        filter: brightness(0.9);
      }
    `}</style>

    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] outline-none cvf-scroll-viewport">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
