---
'@rocket.chat/meteor': patch
---

Bump the Node.js base image of the Docker images to 22.23.4 (the Debian image moves from bullseye to bookworm), which fixes a Brotli decoder out-of-bounds write (CVE-2026-111497).
