# npm publishing

The 15 public `@rocket.chat/*` packages under `packages/` are published to npm by
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
- **`E401` despite a correct registration** — something wrote an auth line into `~/.npmrc`, which
  takes precedence over the OIDC exchange. `createNpmFile()` skips writing when `NPM_TOKEN` is
  unset; `.github/actions/setup-node` writes one whenever its `NPM_TOKEN` input is set.
- **422 on publish** — provenance mismatch; check the package's `repository` field.
- **Silent fallback to token auth** — if a valid token is present npm may authenticate with it
  instead. Confirm via `dist.attestations` rather than the job log.
