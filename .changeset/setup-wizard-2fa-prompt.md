---
'@rocket.chat/meteor': patch
---

Fixed the Setup Wizard incorrectly prompting for a password/2FA confirmation between steps on a fresh installation.

The post-registration grace window that skips two-factor checks right after a user is created was being short-circuited by the `disableRememberMe` option (set by `POST /v1/settings`, which the wizard calls between steps). The grace-window check now runs before the `disableRememberMe` early-return, so a freshly registered admin can complete the wizard without intermediate verifications, while sensitive endpoints that set `disableRememberMe` (reset TOTP, reset E2E key, disable 2FA email) keep requiring a fresh confirmation outside that short window.
