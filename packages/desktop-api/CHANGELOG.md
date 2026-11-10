# @rocket.chat/desktop-api

## 1.5.0-rc.0

### Minor Changes

- ([#42968](https://github.com/RocketChat/Rocket.Chat/pull/42968)) Adds the web client's side of the desktop bridge contract: `setWebClientBridgeVersion(1)`, which a web client calls to announce that it pushes the server info, URL resolver, title, favicon, user roles, badge, login state, unread alert preference, git commit hash and Outlook credentials itself (presence is not part of version 1), `setUnreadAlertEnabled`, and the `DesktopWindowEvent` names the web client fires on `window`

- ([#42916](https://github.com/RocketChat/Rocket.Chat/pull/42916)) Adds a presence contract for the desktop app. Through `setUserPresenceState`, the web client sends the status, custom status text, expiration, connection and login state of the user. It also sends the statuses that the user can select and the custom statuses of the workspace. Through `setUserStatusChangeHandler`, the desktop tray changes the status with the same flow as the user menu.

### Patch Changes

- ([#42692](https://github.com/RocketChat/Rocket.Chat/pull/42692)) Types the desktop app's video call window bridge where desktop 4.18 exposes it, `RocketChatDesktop.videoCall`, and marks `getAuthCredentials`, which the desktop app removed, as deprecated and optional

## 1.4.0

### Minor Changes

- ([#40915](https://github.com/RocketChat/Rocket.Chat/pull/40915)) Desktop markdown attachments now open in the desktop document viewer directly instead of relying on download interception

## 1.4.0-rc.0

### Minor Changes

- ([#40915](https://github.com/RocketChat/Rocket.Chat/pull/40915)) Desktop markdown attachments now open in the desktop document viewer directly instead of relying on download interception

## 1.3.0

### Minor Changes

- ([#40721](https://github.com/RocketChat/Rocket.Chat/pull/40721)) ## Phishing-Resistant Multi-Factor Authentication

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
  - **A new setting to enable/disable new OAuth Flow**
    Enable this new setting `Accounts_OAuth_Use_Modern_Flow` to use all of the above mentioned features.

- ([#41056](https://github.com/RocketChat/Rocket.Chat/pull/41056)) Added a `setUserRoles` bridge method to the desktop API and pushed the logged-in user's roles to the desktop app. This lets the desktop client restrict supportedVersions messages (such as version-expiration warnings) to specific roles like admins, instead of showing them to every user. The push is reactive to role changes; desktop builds without the bridge method fall back to their own role lookup.

## 1.3.0-rc.0

### Minor Changes

- ([#40721](https://github.com/RocketChat/Rocket.Chat/pull/40721)) ## Phishing-Resistant Multi-Factor Authentication

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
  - **A new setting to enable/disable new OAuth Flow**
    Enable this new setting `Accounts_OAuth_Use_Modern_Flow` to use all of the above mentioned features.

- ([#41056](https://github.com/RocketChat/Rocket.Chat/pull/41056)) Added a `setUserRoles` bridge method to the desktop API and pushed the logged-in user's roles to the desktop app. This lets the desktop client restrict supportedVersions messages (such as version-expiration warnings) to specific roles like admins, instead of showing them to every user. The push is reactive to role changes; desktop builds without the bridge method fall back to their own role lookup.

## 1.2.0

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
