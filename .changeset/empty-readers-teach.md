---
"@rocket.chat/meteor": patch
"@rocket.chat/tools": patch
"@rocket.chat/account-service": patch
---

Fixed an inconsistent evaluation of the `Accounts_LoginExpiration` setting over the codebase. In some places, it was being used as milliseconds while in others as days. Invalid values produced different results. A helper function was created to centralize the setting validation and the proper value being returned to avoid edge cases.
Negative values may be saved on the settings UI panel but the code will interpret any negative, NaN or 0 value to the default expiration which is 90 days. 
