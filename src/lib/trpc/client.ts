"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/root";

/** Typed tRPC React hooks — `trpc.leads.list.useQuery(...)` etc. */
export const trpc = createTRPCReact<AppRouter>();
