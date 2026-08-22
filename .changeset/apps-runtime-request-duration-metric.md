---
'@rocket.chat/apps': minor
'@rocket.chat/meteor': minor
---

Adds a Prometheus histogram (`rocketchat_apps_engine_runtime_request_duration_seconds`) measuring how long requests sent from the host to an app's runtime take. The histogram is labelled by `app_id`, `app_name`, `version`, `engine_version`, `runtime`, `method` and `status` (`success`/`error`). To keep cardinality bounded, the method label keeps the name for `app:*` lifecycle/event methods (e.g. `executePostMessageSent`) and collapses categories that embed unbounded ids (api paths, slashcommand names, scheduler ids, provider names) to the category alone (e.g. `api`, `slashcommand`, `scheduler`).
