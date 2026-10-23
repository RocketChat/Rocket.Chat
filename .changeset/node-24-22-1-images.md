---
'@rocket.chat/meteor': patch
---

Bump the Node.js base image of the Docker images to 24.22.1 (the Debian image moves from bullseye to bookworm), which fixes a Brotli decoder out-of-bounds write (CVE-2026-111497).
