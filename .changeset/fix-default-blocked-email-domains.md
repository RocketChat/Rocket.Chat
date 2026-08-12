---
'@rocket.chat/meteor': patch
---

Fixes the default blocked email domains list (`Accounts_UseDefaultBlockedDomainsList`) being ignored during registration unless a custom `Accounts_BlockedDomainsList` was also set. The two settings are now independent, so the built-in list of disposable/throwaway domains is enforced on a stock install as intended.
