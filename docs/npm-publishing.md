# npm publishing

The public `@rocket.chat/*` packages under `packages/` are published to npm by
`.github/workflows/release.yml`, which delegates to the local `packages/release-action`.
Everything else in the workspace is `private: true` and never published.

## How a publish happens

`release.yml` is the **only** workflow that publishes. It carries three triggers and maps each one
to a `release-action` mode:

| Trigger                       | `action`        | Publishes? | dist-tag        |
| ----------------------------- | --------------- | ---------- | --------------- |
| `push` to `master`            | `publish-final` | yes        | `latest`        |
| `schedule` (monthly, 20th)    | `next`          | yes        | `rc`            |
| `workflow_dispatch` → `cut`   | `cut`           | yes        | `latest` / `rc` |
| `workflow_dispatch` → `next`  | `next`          | yes        | `rc`            |
| `workflow_dispatch` → `patch` | `patch`         | no         | —               |

`publishRelease.ts` and `bumpNextVersion.ts` both end with `yarn changeset publish --no-git-tag`.
Changesets then spawns `npm publish <packageDir> --access public --tag <tag>` from the repo root, so
**the npm CLI on `PATH` is what authenticates** — not yarn.

## Trusted publishing (OIDC)

Publishing authenticates via [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
rather than a long-lived token. GitHub Actions mints a short-lived, job-scoped credential at publish
time, and npm attaches a provenance attestation to every published tarball.

Two hard requirements, both handled in `release.yml`:

- `permissions: id-token: write` on the publishing job — without it the runner never exposes
  `ACTIONS_ID_TOKEN_REQUEST_URL` and the OIDC exchange cannot happen.
- **npm >= 11.5.1** (the `Setup npm` step installs it). `engines.node` is 22.x, which bundles npm 10.

### How `NPM_TOKEN` interacts with the exchange

`npm publish` runs the OIDC exchange *before* it reads credentials, and on success it overrides the
`~/.npmrc` auth line with the freshly minted token. A present `NPM_TOKEN` therefore does **not**
prevent trusted publishing — the exchange still wins whenever it succeeds.

The token matters only when the exchange fails. npm's `oidc()` is written to never throw: every
failure path (missing `id-token` permission, package not registered, exchange rejected) returns
quietly, and `publish` then proceeds with the npmrc token — no provenance, no error, exit code 0.

That makes the token a **migration aid and a hazard at the same time**:

- While packages are being registered one at a time, it keeps releases from hard-failing on the
  ones that are not registered yet.
- Once everything is registered, it hides regressions — a broken registration keeps publishing
  under token auth instead of failing.

So `release.yml` keeps `NPM_TOKEN` only until every package publishes with provenance, then drops
both references (the `setup-node` input and the `Release` step's `env`).

### Migrating packages incrementally

npm allows one trusted publisher per package, so packages move over one at a time:

1. Register the package (see below). Watch for packages previously released from another repo —
   `@rocket.chat/emitter`'s last provenance came from `RocketChat/fuselage`'s `cd.yml`, and that
   registration has to be re-pointed here before this workflow can publish it.
2. Let a release run. The job log is not evidence — a token fallback looks identical to success.
3. Confirm with `npm view @rocket.chat/<name> --json dist.attestations`; non-null means the package
   is publishing through OIDC.
4. When all published packages are attested, remove `NPM_TOKEN` from `release.yml`.

### Why there is only one release workflow

npm allows **one trusted publisher per package**, and it validates the _entry-point_ workflow
filename — the `workflow_ref` OIDC claim. `workflow_call` reusable workflows inherit the caller's
`workflow_ref`, so splitting the publish step into a shared workflow does not help: every caller
would need its own registration. Hence the single `release.yml` with three triggers.

**Renaming or moving `release.yml` breaks publishing** until every package's trusted publisher is
updated on npmjs.com.

### Registering a newly published package

npm cannot configure a trusted publisher for a package that does not exist yet, so a brand-new
package needs one manual first publish before it can be registered.

Register from a machine with npm >= 11.15.0 and account-level 2FA (granular tokens with the
bypass-2FA option are rejected):

```sh
npm trust github @rocket.chat/<name> \
  --file release.yml \
  --repo RocketChat/Rocket.Chat \
  --allow-publish

npm trust list @rocket.chat/<name>
```

Or on `npmjs.com/package/@rocket.chat/<name>/access`:

| Field             | Value                                  |
| ----------------- | -------------------------------------- |
| Provider          | GitHub Actions                         |
| Organization      | `RocketChat`                           |
| Repository        | `Rocket.Chat`                          |
| Workflow filename | `release.yml` (filename only, no path) |
| Environment       | _(blank)_                              |
| Allowed actions   | `npm publish`                          |

No GitHub Environment is configured: the monthly RC cron and the push-to-master final release both
run unattended, and an environment with required reviewers would stall them.

### Provenance requires a correct `repository` field

npm generates provenance automatically for public packages published from a public repo via OIDC,
and **rejects the publish (422) when `repository.url` does not match the repository the workflow ran
in**. Every published package therefore needs:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/RocketChat/Rocket.Chat.git",
  "directory": "packages/<name>"
}
```

The org/repo casing (`RocketChat/Rocket.Chat`) has to match too.

Verify after a release:

```sh
npm view @rocket.chat/<name> --json dist.attestations
```

A non-null result is proof the publish went through OIDC — token-based publishes from this repo
never carried provenance.

## Troubleshooting

- **`E404` / `ENEEDAUTH` on `/-/npm/v1/oidc/token/exchange/package/…`** — almost always a
  trusted-publisher mismatch: wrong repository, or the workflow filename entered with a path
  (`.github/workflows/release.yml`) instead of bare `release.yml`.
- **`E401` / `ENEEDAUTH` with no token configured** — the exchange failed and there was nothing to
  fall back to. Run with `--loglevel verbose`: `oidc()` logs its reason (`Skipped because incorrect
  permissions`, `Failed token exchange request…`) instead of throwing.
- **422 on publish** — provenance mismatch; check the package's `repository` field.
- **Silent fallback to token auth** — if a valid token is present npm may authenticate with it
  instead. Confirm via `dist.attestations` rather than the job log.
