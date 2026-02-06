---
"@rocket.chat/meteor": patch
---

fix: override emoji reaction background for better contrast (#36160)

Emoji reaction pills now use neutral surface colors with proper hover states instead of inheriting from message bubble backgrounds, improving visibility and contrast across all themes.
