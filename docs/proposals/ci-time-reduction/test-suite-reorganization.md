# Test Suite Reorganization — Domain Grouping as TIA Groundwork

Status: Proposal
Owner: Platform / DevEx
Companion to: [`strategy.md`](./strategy.md) (Change-Aware Test Selection)
Scope: `apps/meteor/tests/e2e/**`, `apps/meteor/tests/end-to-end/**`,
`apps/meteor/playwright.config.ts`, `apps/meteor/.mocharc.api*.js`,
`.github/workflows/ci-test-e2e.yml`, `.github/workflows/ci.yml`, `CODEOWNERS`

## 1. Why this document exists

[`strategy.md`](./strategy.md) makes the case for **change-aware test selection**
and Test Impact Analysis (TIA). Its §10.3 ("architectural changes to make tests
more splittable") and §10.6 ("how the pieces reinforce each other") both land on
the same conclusion:

> Selective execution is only as good as the granularity of the units you can
> select. Foldering the root specs + Playwright projects is the highest-leverage
> starting point.

TIA — static or coverage-driven — maps *changed files → the tests that must run*.
That mapping is only useful if "the tests that must run" is a set you can
**actually address and invoke** without booting the whole suite. Today it is not:
the suite is physically organized so that no domain can be run in isolation. This
document is the **groundwork PR track** that makes the suite selectable, so that
the TIA layers in `strategy.md` (Layers 3–4) have real units to select.

Crucially, this reorganization is **behavior-preserving on its own**. It moves
and regroups tests; it does **not** skip any. Skipping is a later, separately
gated change (`strategy.md` §10.2 shadow mode). Keeping the two concerns apart is
the single most important correctness decision here: a pure reorg can never cause
an escaped regression, because every test still runs every time until selection
is deliberately switched on.

## 2. Current layout — and exactly why it blocks TIA

Verified against the tree at time of writing:

### UI (Playwright)

- **80 `.spec.ts` files sit flat at the root** of `apps/meteor/tests/e2e/`, with
  no domain structure. Only four domains are foldered today:
  `omnichannel/` (66 specs), `apps/` (5), `e2e-encryption/` (8), and
  `federation/` (11, its own config, already excluded via `testIgnore`).
- `playwright.config.ts` has `testDir: 'tests/e2e'`, `workers: 1`, **no
  `projects`, no tags, no `testMatch` per domain**.
- CI shards with `--shard=i/N` (CE 4, EE 5) in `ci-test-e2e.yml`. Playwright's
  `--shard` is a **global round-robin over the whole file list**, so every
  domain's specs are scattered across every shard. You cannot drop a shard for a
  domain — each shard boots a full Rocket.Chat stack regardless.
- Sharding is badly unbalanced: `omnichannel/` alone is 66 specs, `apps/` is 5,
  and 80 specs sit flat at the root with no way to weight or route them.

### API (Mocha)

- `.mocharc.api.js` is a single flat glob:
  `tests/end-to-end/api/*.ts` **+** `api/helpers/**` + `api/methods/**` +
  `tests/end-to-end/apps/*`. That's **47 top-level API specs + 19 apps specs**
  run as one monolith by `npm run testapi`, with **no sharding and no domain
  split**. There is no way to run "just the channels API tests."
- `.mocharc.api.livechat.js` globs `api/livechat/**` (28 specs) and runs with
  **`bail: true`** — the livechat suite is *order-sensitive*, and its files are
  deliberately numeric-prefixed (`00-rooms`, `01-agents`, …). This is a
  correctness constraint any reshuffle must respect (see §7).
- `.mocharc.api.apps.js` globs `tests/end-to-end/apps/*` (19 specs) — the only
  domain that already has a dedicated config.

### Coverage / TIA blindness

- The UI fixture `tests/e2e/utils/test.ts` captures `window.__coverage__` per
  page but writes randomly-named JSON and immediately `nyc merge`s them,
  **discarding spec identity**. API coverage is one accumulator across the whole
  mocha process. So even though CI already emits coverage, nothing today maps a
  covered source file back to *which spec* exercised it. Per-domain foldering is
  the cheapest way to recover attribution granularity (per-domain, then per-spec).

**Net:** the units TIA would select (domains) don't exist as addressable units.
This proposal creates them.

## 3. Target domain taxonomy

Grounded in the actual specs and the hub/leaf model from `strategy.md` §10.4.
A **hub** is depended on by other domains (change ⇒ full run — not safely
scopable); a **leaf** has little/nothing depending on it (change ⇒ run that
domain + smoke). The taxonomy below is the *organizing* axis for folders; it is
independent of, and finer than, the eventual selection policy.

| Domain | Type | UI specs (today, approx) | API specs (today, approx) |
|---|---|---|---|
| **auth** (login, register, password reset, SAML, OAuth, 2FA/TOTP, sessions, account, devices, anonymous) | hub | ~19 root specs (`account-*`, `login`, `register`, `forgot-password`, `reset-password`, `oauth`, `saml`, `enforce-2FA`, `iframe-authentication`, `anonymous-user`, `session-expiration-redirect`, `user-required-password-change`, `delete-account`) | `users`, `roles`, `permissions`, `login-code`, `LDAP`, `oauth*`, `guest-permissions`, `failed-login-attempts` |
| **admin** (administration, settings, feature-preview, permissions mgmt, translations) | hub | ~15 root specs (`admin-*`, `administration*`, `settings-*`, `permissions`, `feature-preview`, `translations`, `sidebar-administration-menu`) | `settings`, `miscellaneous`, `statistics`, `licenses`, `cloud`, `banners`, `moderation`, `audit` |
| **messaging** (messages, threads, mentions, reactions, quotes, read-receipts, retention, channels, rooms, teams, discussions, files, search, sidebar, presence) | **hub** | ~40 root specs (`messaging*`, `message-*`, `threads`, `thread-*`, `jump-to-thread-message`, `quote-*`, `read-receipts*`, `mark-unread`, `prune-messages`, `retention-policy`, `report-message`, `system-messages`, `emojis`, `export-messages`, `channel-management`, `create-*`, `rooms-join`, `preview-public-channel`, `team-management`, `global-search`, `search-discussion`, `sidebar*`, `homepage`, `embedded-layout`, `file-upload`, `files-management`, `image-*`, `user-card-*`, `presence`, `notification-sounds`, `avatar-settings`, `calendar`) | `channels`, `groups`, `rooms`, `chat`, `direct-message`, `subscriptions`, `teams`, `threads`, `commands`, `emoji-custom`, `custom-sounds`, `custom-user-status`, `file-upload-image-rotation`, `webdav`, `invites` |
| **apps** (Apps-Engine) | leaf* | `apps/` (5) — already foldered | `apps/*` (19) — already `.mocharc.api.apps.js` |
| **omnichannel** (livechat) | leaf | `omnichannel/` (66) — already foldered + `email-inboxes` | `api/livechat/**` (28) — already `.mocharc.api.livechat.js` |
| **e2e-encryption** | leaf | `e2e-encryption/` (8) — already foldered | — |
| **video-conference** | leaf | `video-conference*`, `voice-calls-ee` (3) | `video-conferences` (under apps), `call-history` |
| **federation** | leaf | `federation/` (11) — already isolated config | `federation` |
| **import** | leaf | `imports` (1) | `import.spec`, `assets*` |

\* Apps is a *broad* leaf: it can inject messages / register slash commands /
open UIKit modals, so an Apps-only run should also include a messaging smoke
slice (see §5 and `strategy.md` §10.4).

Notes on judgement calls (to be reviewed with domain owners, not decided here):

- `messaging` is deliberately large and remains a **hub**. Foldering it does not
  make it selectable-away; it makes it *addressable* (so a leaf change can run a
  messaging *smoke* subset instead of all ~40) and gives it per-domain coverage.
- Files/uploads, search, sidebar, presence, teams could later split out of
  `messaging` into sub-domains. Start coarse; sub-folder within `messaging/`
  rather than proliferating top-level domains (fixed Docker-boot overhead per CI
  job — `strategy.md` §10.3.4).
- The taxonomy must match on **both** axes (UI folder name == API config domain
  == CI job label == coverage flag) so one flag cleanly addresses one domain.

## 4. Target directory layout

Only **spec files move**. Shared harness — `page-objects/`, `fixtures/`,
`utils/`, `config/`, `containers/`, `.mocharc.base.json`,
`tests/end-to-end/teardown.ts` — **stays put**. Minimizing what moves minimizes
the blast radius and keeps the guardrails in §7 tractable.

### UI

```
apps/meteor/tests/e2e/
  _smoke/                      # NEW: always-on cross-cutting critical paths (§5)
  auth/                        # NEW: account-*, login, register, saml, oauth, 2fa, sessions…
  admin/                       # NEW: admin-*, administration*, settings-*, feature-preview…
  messaging/                   # NEW: messages, threads, channels, rooms, teams, files, search…
  omnichannel/                 # exists (66)
  apps/                        # exists (5)
  e2e-encryption/              # exists (8)
  video-conference/            # NEW: video-conference*, voice-calls-ee
  import/                      # NEW: imports
  federation/                  # exists (own config, unchanged)
  page-objects/ fixtures/ utils/ config/ containers/   # unchanged (shared)
```

### API

```
apps/meteor/tests/end-to-end/
  api/
    auth/         # users, roles, permissions, LDAP, oauth*, login-code…
    admin/        # settings, statistics, licenses, cloud, moderation…
    messaging/    # channels, groups, rooms, chat, dm, teams, threads, subscriptions…
    video-conference/
    import/
    livechat/     # exists (28, order-sensitive, bail:true) — unchanged in place
    helpers/ methods/         # unchanged (shared)
  apps/           # exists (19) — unchanged in place
  teardown.ts reporter.ts     # unchanged (shared)
```

## 5. Config & tooling changes

### 5.1 Playwright `projects` per domain

Replace the single `testDir` with one project per domain, so a domain-scoped run
is `--project=<domain>` instead of hoping round-robin sharding lands right:

```ts
// playwright.config.ts (sketch)
const DOMAINS = ['_smoke','auth','admin','messaging','omnichannel','apps',
                 'e2e-encryption','video-conference','import'] as const;

projects: DOMAINS.map((d) => ({
  name: d,
  testDir: `tests/e2e/${d}`,
}))
// federation keeps its separate playwright-federation.config.ts
```

Benefits: (a) selection becomes `--project=apps`; (b) sharding can apply *within*
a project and be **balanced by historical duration** instead of file count,
killing the omnichannel straggler-shard tax; (c) per-project coverage output is
free. `_smoke` is a project that **always runs** regardless of selection —
cheap insurance against Mode-B under-selection.

### 5.2 Per-domain Mocha configs (or tags)

Two viable mechanisms; recommend starting with **per-domain `.mocharc`** because
it's explicit and mirrors the existing `.mocharc.api.livechat.js` pattern:

- `.mocharc.api.messaging.js`, `.mocharc.api.auth.js`, … each globbing
  `tests/end-to-end/api/<domain>/**`.
- A thin `.mocharc.api.js` that unions the per-domain globs remains the
  "run everything" entry point for full runs and protected refs.

Alternative for later: spec **tags** + `mocha --grep`, or a changed-files→spec
resolver passing an explicit file list to mocha (`strategy.md` §10.3.3). Tags
avoid config sprawl but are less greppable; defer.

### 5.3 CI wiring

Thread a `project`/`spec-filter` input through `ci-test-e2e.yml` (already
parameterized by `type`, `shard`, `total-shard`) and select the mocharc by
domain. **In this reorg track, wire the plumbing but leave the inputs defaulted
to "everything"** — selection values come later from the `changes` classifier
(`strategy.md` §5). This lets the plumbing land and be exercised at full scope
before it ever narrows anything.

## 6. Phased implementation

Each phase is independently shippable, independently revertable, and — through
Phase 4 — **behavior-preserving** (full suite still runs every time). Selection
(actual skipping) is explicitly out of scope here; it resumes in `strategy.md`
Layers 1–4 once these units exist.

- **Phase 0 — Freeze & inventory.** Land the guardrail tooling in §7 *first*:
  the spec-inventory snapshot, the no-orphan glob-coverage check, and the
  title-set diff, all wired into CI against the *current* layout (they must pass
  as a no-op today). Nothing moves yet. This is the safety net every later phase
  leans on.

- **Phase 1 — UI foldering, one domain per PR.** `git mv` root specs into
  `auth/`, then `admin/`, then `video-conference/`, `import/`, then carve
  `messaging/`. One domain = one PR. Each PR: move-only commit + a mechanical
  import-path-fix commit, and the Phase-0 checks must stay green (identical title
  set). `playwright.config.ts` still uses a single `testDir` covering the new
  subfolders, so nothing about execution changes yet.

- **Phase 2 — Playwright `projects` + `_smoke`.** Introduce the per-domain
  projects (§5.1) and the always-on `_smoke` project (seed it with login, send
  message, create channel, admin loads). CI still runs *all* projects at full
  shard count — this only changes *how* tests are addressed, not *which* run.
  Rebalance shards by duration within projects.

- **Phase 3 — API foldering + per-domain configs.** `git mv` API specs into
  `api/<domain>/`, update `.mocharc.api.js` globs to `api/**/*.ts`, add
  per-domain configs (§5.2). **Handle order-sensitivity explicitly** (§7):
  livechat and any order-coupled API specs keep numeric prefixes / explicit
  ordering; confirm parity by running the full API suite before/after and
  diffing results, not just counts.

- **Phase 4 — CI plumbing (defaulted to full).** Thread `project`/mocharc
  selection inputs through the workflows, defaulted to "everything." Confirm a
  week of green full runs. At this point the suite is fully selectable but
  nothing is being selected away.

- **Handoff — selection resumes in `strategy.md`.** With addressable domains in
  place, the `changes` classifier + shadow mode (Layers 1–2) and domain/coverage
  TIA (Layers 3–4) plug directly into these projects/configs. That is where
  skipping is introduced, behind shadow validation.

## 7. Guardrails for correctness

The whole risk of a reorg is **silently losing, disabling, duplicating, or
reordering a test**. Every guardrail below targets one of those failure modes.
They are the deliverable of Phase 0 and gate every later phase.

1. **Selection stays OFF (the meta-guardrail).** This track never adds an `if:`
   skip or a narrowed glob that excludes specs from a run. The full suite runs
   on every PR through Phase 4. Therefore a reorg bug can at worst *fail* a run
   (loud), never *hide* a regression (silent). Skipping is introduced only later,
   behind `strategy.md` shadow mode.

2. **Move-only commits.** Each move is `git mv` with **zero content changes** in
   that commit; import-path fixups land in a separate, mechanical, reviewable
   commit. Preserves `git log --follow` / blame and makes the diff trivially
   auditable ("did anything other than paths change? no").

3. **Spec-inventory invariant.** A CI check snapshots the full set of resolved
   test *files* (Playwright `--list`, mocha spec resolution) and asserts the set
   is **identical** before and after each move — same count, same basenames. A
   dropped or double-counted file fails the PR.

4. **Title-set diff (stronger than counts).** Run `playwright test --list` and a
   mocha dry pass to emit the full set of **test titles** (`describe > it`),
   normalized, and diff against a committed baseline. Foldering must not change
   any title; the diff must be empty. This catches a spec that silently stopped
   being collected even when file counts happen to match.

5. **No-orphan / no-overlap glob-coverage check.** A script asserts every spec
   file is claimed by **exactly one** domain project/mocharc glob, and that the
   union of all domain globs **equals** the full spec set. Fails CI if a file is
   unclaimed (would never run) or double-claimed (would run twice / attribute
   wrong). This is the guardrail that makes the projects/configs in §5
   trustworthy as they evolve.

6. **Order-dependency audit (API).** Mocha executes files in glob order
   (alphabetical); foldering changes resolution order, which can break specs that
   share state or rely on run order. Before Phase 3: (a) keep numeric prefixes
   for the known order-sensitive suite (livechat, `bail: true`); (b) audit other
   API domains for implicit ordering (shared fixtures, sequential data setup);
   (c) pin per-domain execution order explicitly in each `.mocharc` (`spec:`
   array or preserved prefixes) rather than relying on incidental alphabetical
   order; (d) prove parity by running the **full** API suite pre/post and
   diffing pass/fail per test, not just totals.

7. **Full parity window per phase.** Every phase ships with the full suite still
   running. Require N consecutive green full runs on `develop`/merge-queue after
   each phase before the next. Any new red that correlates with a move → revert
   that one domain PR (cheap, isolated).

8. **Config/reference sweep.** A move breaks anything that hard-codes a spec
   path: `CODEOWNERS`, CI globs, reporters (`tests/e2e/reporters/*`), Qase/Jira
   mappings, docs. A checklist + a grep-based CI check for references to moved
   paths runs in each phase. Update `CODEOWNERS` so each new domain folder maps
   to its owning team.

9. **Fixtures/harness are untouchable in this track.** Only spec files move.
   `page-objects/`, `fixtures/`, `utils/`, `config/`, `.mocharc.base.json`,
   `teardown.ts` do not move. Any change to those is a separate PR reviewed on
   its own merits, never bundled into a domain move.

10. **Revertability.** One domain per PR, small diffs, no cross-domain coupling
    in a single PR — so any single move can be reverted without unwinding others.

## 8. What this unlocks for TIA

Once the suite is domain-addressable (end of Phase 4), the `strategy.md` layers
attach with minimal new machinery:

- **Static TIA (Layers 1–3).** The `changes` classifier maps changed files →
  domain flags → `--project=<domain>` (UI) / `.mocharc.api.<domain>.js` (API).
  The hand-authored coupling map (§10.4) governs which E2E domains fire.
- **Per-domain coverage → dynamic TIA (Layer 4).** Domain projects emit separate
  coverage, giving "changed file → impacted domain" for free — the pragmatic
  middle ground before per-spec attribution. Per-spec attribution then needs only
  the small `utils/test.ts` change described in `strategy.md` §10.5.
- **Smoke insurance.** `_smoke` always runs, bounding the downside of any
  under-selection.
- **Shadow validation.** Because units are stable and named, shadow mode
  (`strategy.md` §10.2) can report "would run: messaging, apps; would skip:
  omnichannel, federation" in terms owners recognize.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| A spec silently stops running after a move | Title-set diff (§7.4) + inventory invariant (§7.3) — empty-diff gate |
| API test order coupling breaks after foldering | Order-dependency audit + pinned ordering + full pre/post parity (§7.6) |
| Overlapping/greedy globs run a spec twice or misattribute coverage | No-orphan / no-overlap check (§7.5) |
| Broken external references (CODEOWNERS, reporters, Qase) | Reference sweep + CI grep check (§7.8) |
| Over-splitting domains inflates Docker-boot overhead | Keep coarse; sub-folder within `messaging` rather than adding top-level jobs (§3, `strategy.md` §10.3.4) |
| Reorg PRs collide with in-flight feature branches touching specs | Land domain-by-domain, quickly, announce freeze windows; small diffs rebase easily |
| Someone bundles selection/skipping into a reorg PR | Explicit meta-guardrail (§7.1); review gate rejects any `if:`/glob-narrowing in this track |

## 10. Sequenced checklist

1. **Phase 0** — land inventory snapshot, title-set diff, no-orphan glob check,
   reference-grep check; all green as no-ops on today's layout.
2. **Phase 1** — UI foldering, one domain PR at a time (`auth` → `admin` →
   `video-conference` → `import` → `messaging`); `testDir` still single.
3. **Phase 2** — Playwright `projects` per domain + always-on `_smoke`;
   duration-balanced shards; still runs everything.
4. **Phase 3** — API foldering + per-domain `.mocharc` with pinned ordering;
   full-suite parity proven.
5. **Phase 4** — thread selection plumbing through CI, defaulted to full; bank a
   green week.
6. **Handoff** — selection + TIA resume in `strategy.md` Layers 1–4, behind
   shadow mode, using these domains as the selectable units.
</content>
</invoke>
