---
'@rocket.chat/password-policies': patch
---

Fixed a crash where an invalid `forbidRepeatingCharactersCount` password policy setting (negative, non-integer, `NaN`, unsafely large, or non-numeric) could throw a `SyntaxError` when building the repeating-characters `RegExp`. Invalid values now fall back to the default of `3`. A configured value of `0` is preserved as a valid, distinct setting instead of being treated as "unset".
