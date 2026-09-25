---
'@rocket.chat/stylis-logical-props-middleware': patch
---

Support root selectors (`html` and `:root`) directly without descendant combinators in `createLogicalPropertiesMiddleware` so physical fallbacks match the document root in LTR and RTL.
