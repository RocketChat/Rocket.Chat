---
"@rocket.chat/meteor": patch
---

fix(avatar): handle invalid size parameter gracefully

- Fix avatar size parameter validation to properly handle zero and invalid inputs
- Keep undefined return for missing size parameter to preserve existing default behavior (200px)
- Add proper NaN and zero/negative value checks
- Add warning log for invalid size parameters
- Clamp parsed sizes between MIN_SVG_AVATAR_SIZE (16px) and MAX_SVG_AVATAR_SIZE (1024px)
