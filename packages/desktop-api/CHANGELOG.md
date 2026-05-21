# @rocket.chat/desktop-api

## 1.2.0-rc.0

### Minor Changes

- ([#39760](https://github.com/RocketChat/Rocket.Chat/pull/39760)) ## Phishing-Resistant Multi-Factor Authentication

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

## 1.1.1

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

## 1.1.1-rc.0

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

## 1.1.0

### Minor Changes

- ([#36912](https://github.com/RocketChat/Rocket.Chat/pull/36912)) Defines `reloadServer()` method for the context bridge object type.

## 1.1.0-rc.0

### Minor Changes

- ([#36912](https://github.com/RocketChat/Rocket.Chat/pull/36912)) Defines `reloadServer()` method for the context bridge object type.

## 1.0.0

### Major Changes

- ([#36770](https://github.com/RocketChat/Rocket.Chat/pull/36770)) Adds a new package (`@rocket.chat/desktop-api`) to interface the desktop app's injected context

## 1.0.0-rc.0

### Major Changes

- ([#36770](https://github.com/RocketChat/Rocket.Chat/pull/36770)) Adds a new package (`@rocket.chat/desktop-api`) to interface the desktop app's injected context
