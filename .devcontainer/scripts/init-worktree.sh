#!/usr/bin/env bash
#
# Runs on the HOST from initialize.sh (devcontainer.json's initializeCommand),
# before the container is created.
#
# Why this exists: in a linked git worktree, `.git` is not a directory but a
# file containing an absolute host path, e.g.
#
#     gitdir: /home/you/dev/Rocket.Chat/.git/worktrees/my-branch
#
# The workspace bind mount carries that file into the container verbatim, but
# the path it names does not exist there — so every git command inside the
# container fails with "not a git repository". The fix is to bind the real git
# dir into the container at the *same absolute path* it has on the host, which
# makes the pointer resolve as-is. No rewriting of git metadata, nothing copied.
#
# Since compose files are static, the mount is injected as a fragment of the
# generated docker-compose.overrides.yml that devcontainer.json always includes.
# In the normal (non-worktree) checkout there is nothing to mount and this
# contributes nothing at all.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"

source "$here/lib/overrides.sh"

# --git-common-dir is the shared git dir: the worktree's own .git in a normal
# checkout, the *main* repo's .git when called from a linked worktree.
common="$(git -C "$root" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"

# Not a git repo at all, or the primary worktree (its git dir sits inside the
# workspace, so the bind mount already covers it) — nothing to contribute.
if [ -z "$common" ] || [ "$common" = "$root/.git" ]; then
	exit 0
fi

# The admin dir for *this* worktree: <common>/worktrees/<id>. git writes HEAD,
# index, logs and refs in here constantly, so it must stay writable.
admin="$(git -C "$root" rev-parse --path-format=absolute --git-dir)"

# Trailing slashes would produce a doubled separator in the mount spec.
common="${common%/}"
admin="${admin%/}"

{
	echo "# Linked worktree detected; exposing the real git dir to the container."
	# Identical host and container path, so the `gitdir:` pointer in the
	# workspace's .git file — and the `commondir` relative link beside it —
	# resolve unchanged inside the container.
	echo "- \"$common:$common\""
	# The back-pointer: .git/worktrees/<name>/gitdir records where the worktree's
	# .git file lives on the host. Inside the container that path is somewhere
	# under /workspaces instead, so without this git sees a worktree
	# pointing at a non-existent location and considers it prunable — meaning a
	# `git gc` in the container could eventually delete the worktree's admin dir
	# out of the shared repo. Binding the single file keeps the check satisfied.
	echo "- \"$root/.git:$root/.git\""
	# Every OTHER worktree still looks prunable from in here (their host paths
	# are not mounted), and they are all registered in this one shared directory.
	# Read-only makes deleting any of them fail at the kernel with EROFS, so no
	# git command — however invoked, whatever its arguments — can unregister a
	# worktree that is perfectly healthy on the host.
	echo "- \"$common/worktrees:$common/worktrees:ro\""
	# ...with a writable hole for this worktree's own admin dir, or git could not
	# even commit. Docker orders bind mounts by path depth, so this nests inside
	# the read-only mount above regardless of the order they appear here.
	echo "- \"$admin:$admin\""
} | overrides_add worktree service-volumes
