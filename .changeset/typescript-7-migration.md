---
'@rocket.chat/core-typings': patch
'@rocket.chat/ui-kit': patch
'@rocket.chat/meteor': patch
---

Migrates the workspace to TypeScript 7 (native compiler). The typia toolchain moves to ttsc/tsgo and typia is bumped from a patched 9.7.2 to 13.0.2, with its JSON schema emit normalized to the JSON Schema 2020-12 dialect the runtime Ajv uses (OpenAPI document now reports 3.1.0). No API surface changes.
