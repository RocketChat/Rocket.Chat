---
"@rocket.chat/meteor": patch
"@rocket.chat/rest-typings": patch
"@rocket.chat/ui-client": patch
"@rocket.chat/ui-contexts": patch
"@rocket.chat/web-ui-registration": patch
---

✅ Created useVerifyPassword.ts hook in `packages/ui-contexts`
✅ Created PasswordVerifier.tsx component in `packages/ui-client`
✅ Implemented the password verification flow in the "my profile" page
✅ Implemented the password verification flow in the "Create new user" page
✅ Implemented the password verification flow in the "Reset password" page
✅/🔀/❌ Created/Changed/removed i18n entries
🔀 Changed the pw.getPolicy endpoint to be open to non-loggedin users
🔀 Changed the "my profile" page layout
🔀 Changed typing of pw.getPolicy in `packages/rest-typings` to better represent its return
🔀 Deprecated pw.getPolicyReset
❌ Removed test that verified logged in status of user calling pw.getPolicy
❌ Removed token param from usePasswordPolicy hook
