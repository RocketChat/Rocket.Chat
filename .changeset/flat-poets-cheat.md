---
'@rocket.chat/web-ui-registration': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/desktop-api': minor
'@rocket.chat/models': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

## Phishing-Resistant Multi-Factor Authentication

Introduces a more secure and reliable server-side OAuth authentication flow.

### What’s New

- **Improved OAuth login security**  
  OAuth authentication now happens fully on the server, reducing the risk of token theft, phishing attacks, and client-side credential interception.

- **Built-in CSRF, state validation, and PKCE protection**  
  OAuth logins now include stronger protection against CSRF attacks, request tampering, and authorization code interception through secure state validation and PKCE support.

- **Improved two-step verification with OAuth logins**  
  Users with email or TOTP two-factor authentication enabled will now be asked to complete 2FA even when signing in with providers like Google, GitHub, GitLab, and others.

- **Improved mobile & desktop app login**  
  Mobile and desktop apps now support a smoother and more secure deep-link OAuth login flow.
