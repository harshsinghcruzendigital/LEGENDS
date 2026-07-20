"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User, Building2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup" | "forgot";

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
  login: { title: "Welcome back", subtitle: "Sign in to your workspace", cta: "Sign in" },
  signup: { title: "Create your workspace", subtitle: "Start finding opportunities in minutes", cta: "Create account" },
  forgot: { title: "Reset your password", subtitle: "We'll email you a reset link", cta: "Send reset link" },
};

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const copy = COPY[mode];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      if (mode === "forgot") {
        await new Promise((r) => setTimeout(r, 700));
        setSent(true);
        toast.success("Reset link sent — check your inbox.");
        return;
      }
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      toast.success(mode === "login" ? "Signed in" : "Workspace created");
      router.push(params.get("next") ?? "/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function demoLogin() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "alex@brightpixel.agency", password: "demodemo", demo: true }),
      });
      if (!res.ok) throw new Error("Demo login failed");
      toast.success("Signed in to the demo workspace");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Demo login failed");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "forgot" && sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <Mail className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-muted-foreground">We sent a password reset link to your inbox.</p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <Field label="Full name" htmlFor="name">
            <User className="input-icon" />
            <Input id="name" name="name" placeholder="Alex Rivera" required className="pl-9" autoComplete="name" />
          </Field>
        )}
        {mode === "signup" && (
          <Field label="Organization" htmlFor="org">
            <Building2 className="input-icon" />
            <Input id="org" name="org" placeholder="Your Agency" className="pl-9" autoComplete="organization" />
          </Field>
        )}
        <Field label="Email" htmlFor="email">
          <Mail className="input-icon" />
          <Input id="email" name="email" type="email" placeholder="you@agency.com" required className="pl-9" autoComplete="email" />
        </Field>
        {mode !== "forgot" && (
          <Field
            label="Password"
            htmlFor="password"
            aside={
              mode === "login" ? (
                <Link href="/forgot" className="text-xs text-primary hover:underline">
                  Forgot?
                </Link>
              ) : undefined
            }
          >
            <Lock className="input-icon" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="pl-9"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </Field>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{copy.cta} <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      {mode === "login" && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="glass" className="w-full" onClick={demoLogin} disabled={loading}>
            <Sparkles className="h-4 w-4 text-accent" /> Use demo account
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>Don&apos;t have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></>
        )}
      </p>

      <style>{`.input-icon{position:absolute;left:0.75rem;top:50%;transform:translateY(-50%);height:1rem;width:1rem;color:hsl(var(--muted-foreground));pointer-events:none}`}</style>
    </motion.div>
  );
}

function Field({
  label,
  htmlFor,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {aside}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
