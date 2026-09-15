# Release Process

This document describes how Rocket.Chat releases are produced, from the moment a release is started until all artifacts are published and users are notified. It covers the automation implemented by the GitHub workflows in `.github/workflows/` and the custom changesets-based release action in `packages/release-action`.

## Overview

Releases are driven by **git tags**: the release action bumps versions, publishes npm packages, creates an annotated git tag, and pushes it. The tag push triggers the main CI pipeline (`.github/workflows/ci.yml`), which builds, tests, and publishes all release artifacts.

The GitHub Release is created as a **draft** at the moment the tag is pushed and is only flipped to a published release at the end of the pipeline, after the Docker images are available on Docker Hub. This guarantees that a release is never announced before its artifacts exist. If the pipeline fails midway, the release stays a draft until the workflow is re-run (or the release is published manually after fixing the problem).

Versioning and changelogs are managed with [changesets](https://github.com/changesets/changesets). Every PR that should be mentioned in the changelog adds a changeset file under `.changeset/`; the release action consumes them when bumping versions.

## Release types and entry points

### Develop builds

Every push to the `develop` branch runs the full CI pipeline and publishes:

- Docker images to GHCR and Docker Hub with the `develop` tag.
- A build tarball to S3, named `rocket.chat-<version>.<commit-sha>.tgz`.
- A registration on `releases.rocket.chat` with `releaseType: develop`.

No git tag, npm publish, or GitHub Release is involved.

### Release candidate (`next`)

A release candidate is started by the scheduled workflow `release-candidate.yml` (monthly cron) or manually via `new-release.yml` (`workflow_dispatch` with action `next`). It runs the release action's `bumpNextVersion`, which:

1. Enters changesets pre-release mode (`rc`) and bumps all packages (e.g. `7.10.0-rc.0`, or `-rc.N` for subsequent candidates).
2. Updates version references across the repo files.
3. Creates (or force-pushes) the `release-X.Y.Z` branch with the bump commit.
4. Publishes the npm packages.
5. Creates the annotated tag `X.Y.Z-rc.N` and pushes branch and tag.
6. For the first candidate (`rc.0`) only: opens the `Release X.Y.Z` pull request from `release-X.Y.Z` to `master`.
7. Creates a **draft, pre-release** GitHub Release for the tag.

The tag push then triggers the CI pipeline described below.

### Final release (`publish-final`)

When the `Release X.Y.Z` pull request is merged into `master`, the push to `master` triggers `publish-release.yml`, which runs the release action's `publishRelease` with `mergeFinal: true`. It:

1. Exits changesets pre-release mode and bumps all packages to the final version.
2. Commits the bump, publishes the npm packages.
3. Creates the annotated tag `X.Y.Z` and pushes it (`git push --follow-tags`).
4. Creates a **draft** GitHub Release for the tag.

### Patch release (`cut`)

Patch releases are started manually via `new-release.yml` (`workflow_dispatch` with action `cut` and the release branch as base ref, e.g. `release-7.9.2`). `publishRelease` runs without `mergeFinal`:

1. Bumps the patch version from the pending changesets on the release branch.
2. If the new version is the newest stable release, merges the release branch back into `master` (patches to older LTS branches skip this).
3. Publishes npm packages, tags, pushes, and creates a **draft** GitHub Release.

There is also a `patch` action (`startPatchRelease`) that only prepares a patch release branch from an existing tag so fixes can be cherry-picked onto it; the actual release is then done with `cut`.

> **Note:** all release workflows check out the repo with the `CI_PAT` token. This is required — tags pushed with the default `GITHUB_TOKEN` do **not** trigger workflows, so the CI pipeline would never run for the release.

## The tag-push pipeline (`ci.yml`)

Pushing a tag (any tag) triggers `ci.yml`. The relevant stages, in order:

1. **`release-versions`** — classifies the tag by name: `X.Y.Z` → release `latest`, `X.Y.Z-rc.N` → `release-candidate`. It also computes `latest-release`, the newest non-rc/non-beta tag in the repo, used later to decide whether this tag should become `latest` on Docker Hub and GitHub.
2. **`notify-draft-services`** — registers the version on `releases.rocket.chat` as a draft (`draftAs: candidate` or `stable`), so internal services know a release is in flight.
3. **Build and tests** — packages and the Meteor app are built, and the full test suite (unit, API, UI, apps, federation) runs. Tag pushes never skip tests: the merge-queue test-guard only skips when the exact commit already has a successful "Tests Done" check, which release bump commits don't.
4. **GHCR publish** — Docker images (rocketchat + services, including `-fips` variants) are built and pushed to GHCR tagged with the tag name.
5. **`deploy`** — the production build tarball is GPG-signed and uploaded to S3 as `rocket.chat-<version>.tgz`.
6. **`docker-image-publish`** — images are copied from GHCR to Docker Hub with:
   - the version tag (e.g. `7.10.0` or `7.10.0-rc.3`);
   - `release-candidate` for RCs, or `latest` for the newest stable version;
   - the commit sha (`sha-<short>`);
   - `-fips` suffixed variants of all of the above for FIPS images.
7. **`notify-services`** — flips the `releases.rocket.chat` registration from draft to final and verifies the release info endpoint responds.
8. **`publish-github-release`** — finds the draft GitHub Release for the tag and publishes it (`draft: false`), setting `make_latest` only when the tag is the newest stable release (RCs and patches to older versions never become `latest`).
9. **`docs-update`** — updates the version durability table in the documentation.

### Draft release lifecycle

| Moment | GitHub Release state |
| --- | --- |
| Release action pushes tag + creates release | Draft (invisible to users) |
| CI builds/tests/publishes artifacts | Draft |
| `publish-github-release` (after Docker Hub publish) | Published; `latest` when applicable |

If any stage fails, the release remains a draft. Re-running the failed workflow resumes publication; alternatively the draft can be published manually once the artifacts are confirmed in place.

## Secrets involved

| Secret | Used for |
| --- | --- |
| `CI_PAT` | Checkout/push in release workflows so tag pushes trigger CI |
| `NPM_TOKEN` | Publishing packages to npm |
| `UPDATE_TOKEN` | Registering releases on `releases.rocket.chat` |
| `CR_USER` / `CR_PAT` | GHCR push/pull |
| `DOCKER_USER` / `DOCKER_PASS` | Docker Hub publish |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | S3 tarball upload |
| `GPG_PASSWORD` | Signing the build tarball |
| `D360_TOKEN` / `D360_USER_ID` | Documentation version durability update |

The `publish-github-release` job uses the built-in `GITHUB_TOKEN` with job-level `contents: write` permission — publishing the release does not need to trigger any other workflow.
