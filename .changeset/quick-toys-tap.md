---
"@rocket.chat/meteor": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/model-typings": patch
"@rocket.chat/models": patch
---

chore: Add new data migration solution for safe migrations

New framework for managing "data migrations" in the app, allowing for versioned, ordered, and safely executed changes to persistent data. It adds a dedicated system for registering, running, and tracking data migrations, including locking and manual reversion handling, and integrates this system with the app's startup process. The implementation includes new database models, migration templates, and scripts for generating migration files.

