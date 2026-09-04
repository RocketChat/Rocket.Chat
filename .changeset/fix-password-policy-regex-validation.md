---
'@rocket.chat/password-policies': patch
---

Fixed the `forbidRepeatingCharactersCount` password policy silently turning itself off when configured with an invalid value. A negative, fractional, `NaN`, unsafely large or non-numeric count produced an invalid quantifier (`{-1,}`, `{1.5,}`, `{NaN,}`, `{1e+21,}`), which the regex engine reads as a literal, so passwords made entirely of repeated characters were accepted. A count of `0` had the opposite effect, rejecting every non-empty password and locking users out of setting one. Both cases now fall back to the default of `3`.
