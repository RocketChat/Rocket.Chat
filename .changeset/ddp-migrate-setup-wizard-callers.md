---
'@rocket.chat/meteor': patch
'@rocket.chat/ui-client': patch
---

Migrates the setup wizard off the `getSetupWizardParameters`, `cloud:getWorkspaceRegisterData` and `registerUser` real-time API methods, in favor of `GET /v1/setupWizard.parameters`, `GET /v1/cloud.workspaceRegisterData` and `POST /v1/users.register`. The first two methods are now deprecated and keep working until they are removed in 9.0.0.
