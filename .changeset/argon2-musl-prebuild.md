---
'@rocket.chat/meteor': patch
---

Fixes the Docker image crashing at boot on arm64 with `Error loading shared library ld-linux-aarch64.so.1` while loading `argon2.node`. The Meteor bundle carries `build/Release` output compiled on the glibc-based CI host, and `node-gyp-build` prefers it over the musl binaries shipped under `prebuilds/` in the same package, so the wrong one was selected at runtime.
