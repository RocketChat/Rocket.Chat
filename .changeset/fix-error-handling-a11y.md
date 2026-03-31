---
"@rocket.chat/meteor": patch
"@rocket.chat/livechat": patch
---

Replace unsafe non-null assertions with proper error handling in RealAppsEngineUIHost.ts. Add missing alt attribute to livechat ImageAttachment for WCAG accessibility. Use console.error instead of console.log for error logging in AudioMessageRecorder.
