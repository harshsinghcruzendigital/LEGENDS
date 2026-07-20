"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { TrpcProvider } from "@/lib/trpc/provider";

/** Global client providers: tRPC/Query, theme (dark/light/system), tooltips, toasts. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TrpcProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </TrpcProvider>
  );
}
