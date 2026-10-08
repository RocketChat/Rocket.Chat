---
'@rocket.chat/meteor': patch
'@rocket.chat/web-ui-registration': patch
---

Adds standard HTML `autoComplete` tokens to the login, registration, password reset and email confirmation form inputs, so browsers and password managers can reliably identify each field's purpose and tell existing passwords apart from newly created ones (WCAG 2.1 SC 1.3.5 Identify Input Purpose)
