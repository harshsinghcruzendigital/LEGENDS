"use client";

import { Toaster as Sonner } from "sonner";
import { useTheme } from "next-themes";

/** Sonner toaster wired to the app theme (docs/06 §10 mutation feedback). */
export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={(theme as "light" | "dark" | "system") ?? "dark"}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "glass-panel !bg-popover/90 !text-foreground !border-border",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground",
        },
      }}
    />
  );
}
