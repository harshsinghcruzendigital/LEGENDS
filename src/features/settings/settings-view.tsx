"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { User, Building2, Palette, Users, CreditCard, Check, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlassCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

const TEAM = [
  { name: "Alex Rivera", email: "alex@brightpixel.agency", role: "Owner" },
  { name: "Jordan Blake", email: "jordan@brightpixel.agency", role: "Manager" },
  { name: "Sam Okafor", email: "sam@brightpixel.agency", role: "Member" },
  { name: "Taylor Chen", email: "taylor@brightpixel.agency", role: "Member" },
];

export function SettingsView({ user }: { user: SessionUser }) {
  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="profile"><User className="h-4 w-4" /> Profile</TabsTrigger>
        <TabsTrigger value="org"><Building2 className="h-4 w-4" /> Organization</TabsTrigger>
        <TabsTrigger value="appearance"><Palette className="h-4 w-4" /> Appearance</TabsTrigger>
        <TabsTrigger value="team"><Users className="h-4 w-4" /> Team</TabsTrigger>
        <TabsTrigger value="billing"><CreditCard className="h-4 w-4" /> Billing</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <GlassCard className="max-w-2xl">
          <CardHeader><CardTitle className="text-base">Profile</CardTitle><CardDescription>Your personal details</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={() => toast.info("Avatar upload arrives with the API milestone")}>Change avatar</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="Full name" defaultValue={user.name} />
              <FieldRow label="Email" defaultValue={user.email} type="email" />
              <FieldRow label="Role" defaultValue={user.role} disabled />
              <FieldRow label="Timezone" defaultValue="America/Chicago" />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Profile saved")}>Save changes</Button>
            </div>
          </CardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="org">
        <GlassCard className="max-w-2xl">
          <CardHeader><CardTitle className="text-base">Organization</CardTitle><CardDescription>Branding used on public reports & emails</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label="Organization name" defaultValue={user.org} />
              <FieldRow label="Workspace slug" defaultValue="brightpixel" />
            </div>
            <div className="space-y-2">
              <Label>Brand color</Label>
              <div className="flex gap-2">
                {["#6D5EF6", "#22D3EE", "#22C55E", "#F59E0B", "#EF4444", "#EC4899"].map((c, i) => (
                  <button key={c} className={cn("h-8 w-8 rounded-lg ring-offset-2 ring-offset-background transition-transform hover:scale-110", i === 0 && "ring-2 ring-primary")} style={{ backgroundColor: c }} aria-label={c} />
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Organization saved")}>Save changes</Button>
            </div>
          </CardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="appearance">
        <AppearanceCard />
      </TabsContent>

      <TabsContent value="team">
        <GlassCard className="max-w-2xl">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div><CardTitle className="text-base">Team members</CardTitle><CardDescription>Manage roles and access (docs/14 RBAC)</CardDescription></div>
            <Button size="sm" onClick={() => toast.info("Invite flow arrives in Milestone 2")}>Invite</Button>
          </CardHeader>
          <CardContent className="p-2">
            {TEAM.map((m, i) => (
              <div key={m.email}>
                {i > 0 && <Separator />}
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9"><AvatarFallback>{initials(m.name)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{m.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                  </div>
                  <Badge variant={m.role === "Owner" ? "default" : "secondary"}>{m.role}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </GlassCard>
      </TabsContent>

      <TabsContent value="billing">
        <div className="grid max-w-3xl gap-4 lg:grid-cols-2">
          <GlassCard>
            <CardHeader><CardTitle className="text-base">Current plan</CardTitle><CardDescription>docs/17 pricing</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/[0.06] p-4">
                <div>
                  <div className="text-lg font-semibold">Growth</div>
                  <div className="text-sm text-muted-foreground">$149 / month</div>
                </div>
                <Button size="sm">Upgrade</Button>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {["5 seats", "12,000 monthly credits", "50,000 leads stored", "All wave-1 integrations"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {f}</li>
                ))}
              </ul>
            </CardContent>
          </GlassCard>
          <GlassCard>
            <CardHeader><CardTitle className="text-base">Usage this cycle</CardTitle><CardDescription>Resets in 12 days</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Credits", 8240, 12000],
                ["Leads stored", 140, 50000],
                ["Emails sent", 1240, 10000],
              ].map(([label, used, cap]) => (
                <div key={label as string} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="tabular-nums">{(used as number).toLocaleString()} / {(cap as number).toLocaleString()}</span>
                  </div>
                  <Progress value={((used as number) / (cap as number)) * 100} indicatorClassName="bg-gradient-to-r from-primary to-accent" />
                </div>
              ))}
            </CardContent>
          </GlassCard>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const options = [
    { key: "light", label: "Light", icon: Sun },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "system", label: "System", icon: Monitor },
  ];
  return (
    <GlassCard className="max-w-2xl">
      <CardHeader><CardTitle className="text-base">Appearance</CardTitle><CardDescription>Choose how Lead Gen Engine looks</CardDescription></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {options.map((o) => {
            const active = mounted && theme === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setTheme(o.key)}
                className={cn("flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors", active ? "border-primary bg-primary/[0.06]" : "border-border hover:bg-secondary/40")}
              >
                <o.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-medium">{o.label}</span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </CardContent>
    </GlassCard>
  );
}

function FieldRow({ label, defaultValue, type = "text", disabled }: { label: string; defaultValue: string; type?: string; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} type={type} disabled={disabled} />
    </div>
  );
}
