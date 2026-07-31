#!/usr/bin/env bash
#
# Runs on the HOST from devcontainer.json's initializeCommand, before the
# container is created.
#
# The first two steps are prerequisites of container create, not setup that
# could be deferred to a later lifecycle hook — see each script's header for
# what breaks without it. Ordered chain: if init-worktree.sh fails there is no
# override file, and starting the cache would be pointless.
#
# The third has to run here for a different reason: it is the only hook that
# executes on the host, and the files it stages exist nowhere the container can
# reach until it does.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Writes docker-compose.worktree.yml, the override that devcontainer.json
# includes unconditionally — the git-dir bind mount when this checkout is a
# linked worktree, an empty stub otherwise.
bash "$here/init-worktree.sh"

# Brings up the shared Turborepo remote cache. The devcontainer attaches to its
# network as external, so the network must exist before compose runs.
bash "$here/ensure-turbo-cache.sh"

# Copies your user-level Claude Code skills into the workspace so the bind mount
# carries them in; install-skills.sh puts them in place inside the container.
bash "$here/stage-skills.sh"
