---
'@rocket.chat/meteor': patch
---

Load `apps/meteor/.env` in the `dev` script via `dotenv-cli` so the documented dev environment variables (including tool-managed ones like `MONGO_URL`/`PORT`/`ROOT_URL`) actually take effect, and create `.env` from `.env.example` on first run.
