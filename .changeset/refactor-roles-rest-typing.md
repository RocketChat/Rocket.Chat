---
"@rocket.chat/rest-typings": minor
"@rocket.chat/meteor": minor
---

# Types
- Added explicitly exported `isRoleSyncProps` and `RoleSyncPropsSchema` for the API parameters validation mapping.

# Refactor
Migrated legacy endpoints inside `roles.ts` to natively use the `validateParams` router declaration with `@rocket.chat/rest-typings` rather than executing custom syntax validation inside the controller block.

# Endpoints modified
- `roles.addUserToRole`
- `roles.getUsersInRole`
- `roles.delete`
- `roles.removeUserFromRole`
- `roles.sync`
