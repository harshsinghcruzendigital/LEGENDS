# 14 — Security, RBAC & Multi-tenancy

The one class of bug that kills a B2B SaaS is a **cross-tenant data leak**. Everything here is designed so that
leak is *unrepresentable*, with defense-in-depth.

## 1. Multi-tenancy model

- **Shared schema, row-level isolation.** Every tenant row has `orgId`. Isolation enforced at **three** layers:
  1. **App layer** — `TenantPrisma` wrapper injects `orgId` into every query; typed repositories make an unscoped query a compile error.
  2. **Postgres RLS** — policies `USING (org_id = current_setting('app.org_id')::text)` on every tenant table; the API sets `app.org_id` per request/transaction. Even a raw query bug can't cross tenants.
  3. **Object storage** — keys namespaced by `orgId`; signed URLs scoped + short-lived.
- Enterprise option (post-MVP): dedicated schema or DB per large tenant for isolation/residency.

## 2. Authentication

- **Sessions:** httpOnly, Secure, SameSite=Lax cookies; server-side session store (Redis) with rotation + absolute + idle expiry.
- **Password:** Argon2id hashing; breach-check against HaveIBeenPwned k-anonymity API; strong-password policy.
- **OAuth / SSO:** Google + Microsoft social login; **SAML/OIDC SSO** and **SCIM** provisioning for Enterprise.
- **MFA:** TOTP + WebAuthn/passkeys; enforced-MFA org policy option.
- **Mailbox/Integration OAuth** tokens stored encrypted (see §6), never in the session.

## 3. RBAC — roles & permissions

Roles (`Membership.role`): **Owner · Admin · Manager · Member · Viewer**, plus platform **Staff** (separate scope).

Permission = `resource:action`. The policy engine resolves `(role, permission, context)` → allow/deny. Guards
(`@RequirePermission('lead:delete')`) protect every mutating handler.

| Permission (sample) | Owner | Admin | Manager | Member | Viewer |
|---|:-:|:-:|:-:|:-:|:-:|
| `org:manage` (billing, delete org) | ✅ | – | – | – | – |
| `member:invite` / `member:role` | ✅ | ✅ | – | – | – |
| `lead:read` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `lead:write` / `lead:delete` | ✅ | ✅ | ✅ | ✅ (own/assigned) | – |
| `discovery:run` (metered) | ✅ | ✅ | ✅ | ✅ | – |
| `campaign:send` | ✅ | ✅ | ✅ | ✅ | – |
| `workflow:publish` | ✅ | ✅ | ✅ | – | – |
| `integration:manage` | ✅ | ✅ | – | – | – |
| `export:data` | ✅ | ✅ | ✅ | limited | limited |
| `audit-log:read` | ✅ | ✅ | – | – | – |

- **Ownership scoping:** Members act on leads/deals **assigned to them or their team**; Managers on their team; Admin/Owner org-wide. Enforced in the policy engine with `context.assignedToId`/`teamId`.
- **Field-level:** billing details, API keys, and audit logs gated beyond the row check.
- Roles/permissions are data-driven (a `permissions` map), so plans can gate features by flag without code changes.

## 4. Audit logging

- Append-only `AuditLog` (partitioned monthly) for every sensitive action: auth events, role changes, member add/remove, lead/deal **delete**, exports, integration connect/disconnect, API-key create, **impersonation start/end**, plan changes.
- Records `actorId, action, target, ip, meta, createdAt`. Immutable (no update/delete via app; retention per plan).
- Surfaced at `/app/settings/audit-log` (Admin) and `/admin/audit` (Staff).

## 5. Staff access & impersonation

- Platform staff (`User.isStaff`) have a **separate** RBAC scope and cannot silently read tenant data.
- Impersonation is possible for support but: requires reason, is time-boxed, shows a persistent banner in the impersonated session, and writes `impersonate.start`/`end` to the audit log. No exceptions.

## 6. Encryption & secrets

- **In transit:** TLS 1.2+ everywhere; HSTS.
- **At rest:** DB + object storage encrypted (cloud-managed KMS).
- **App-level envelope encryption** for high-value secrets (OAuth tokens, SMTP creds, BYO AI keys): KMS master key → per-secret data key (DEK); DB stores ciphertext + `secretRef`; plaintext only in memory at use. Key rotation supported.
- Secrets never logged; log redaction middleware scrubs tokens/emails/keys from structured logs.

## 7. Application security

- **Input validation:** zod on every boundary; the Filter DSL is allowlist-compiled (no raw SQL from clients).
- **SSRF:** the render/audit service blocks private/link-local/metadata IPs, non-http(s) schemes, DNS-rebind, and caps redirects/size (Doc 10 §4). This is critical — we fetch attacker-influenced URLs.
- **Injection:** Prisma parameterizes; no string-built SQL. Prompt-injection handling for LLM inputs (Doc 09 §3).
- **XSS/CSRF:** React escaping + strict CSP; SameSite cookies + CSRF tokens on state-changing REST; sanitize any rendered user/scraped HTML (audit report never executes fetched markup).
- **Rate limiting & abuse:** per-IP + per-token + per-org limits; bot/abuse detection on auth + discovery bursts.
- **Dependency & supply chain:** lockfile pinning, `pnpm audit`/Snyk in CI, SBOM, signed images, least-privilege service accounts.
- **Secrets scanning + SAST/DAST** in CI (Doc 15).

## 8. Privacy & compliance (data-subject reality)

- **Lawful basis config** per campaign (legitimate interest vs consent) with region awareness (GDPR/CCPA/CASL/CAN-SPAM).
- **Outreach compliance:** enforced unsubscribe link + honoring, suppression list, sender identity, and per-region opt-in rules; no sending to `DO_NOT_CONTACT`.
- **Data-subject requests:** export + delete by email across leads/contacts/events; deletion cascades + tombstones.
- **Data residency:** EU region option (post-MVP) via per-region deployment.
- **DPA + subprocessor list** maintained (providers in Doc 10 are subprocessors).
- **Retention:** configurable; stale PII purged per policy; audit/usage retained per plan.

## 9. Incident readiness

- Structured, correlated logs (Doc 15); alerting on anomalies (auth failures, tenant-scope violations = page immediately).
- Runbooks for: suspected tenant leak, key compromise, mailbox/domain blacklist, provider breach.
- Regular backups + tested restore; RPO/RTO targets in Doc 15.
