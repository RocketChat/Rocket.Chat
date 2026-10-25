# `@rocket.chat/desktop-api`

> TypeScript types for the bridge the Rocket.Chat Desktop app exposes to the web client it loads.

[![npm](https://img.shields.io/npm/v/@rocket.chat/desktop-api?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/desktop-api) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/desktop-api?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/desktop-api)

The [Rocket.Chat Desktop app](https://github.com/RocketChat/Rocket.Chat.Electron) loads a workspace's web client and injects a `window.RocketChatDesktop` object into it. The web client calls that object to update the app's badge, title and favicon, show native notifications, report the user's presence, open the video call window, and more.

This package is the contract between the two sides. It contains types only: `IRocketChatDesktop`, which describes `window.RocketChatDesktop`, `IVideoCallWindow`, which describes the video call window's bridge, and the option types they use.

## Installation

```sh
npm install --save-dev @rocket.chat/desktop-api
```

The package has no runtime code and no dependencies. It is published as an ES module.

## Usage

### Declaring the global

The package does not declare `window.RocketChatDesktop` itself. Add the declaration to your project:

```ts
import type { IRocketChatDesktop } from '@rocket.chat/desktop-api';

declare global {
	interface Window {
		RocketChatDesktop?: IRocketChatDesktop;
	}
}
```

Keep the property optional: it only exists when the page runs inside the desktop app.

### Calling the desktop app

```ts
if (window.RocketChatDesktop) {
	window.RocketChatDesktop.setTitle('Rocket.Chat');
	window.RocketChatDesktop.setBadge(3);
	window.RocketChatDesktop.setUserLoggedIn(true);
}
```

### The video call window

In the desktop app's video call window (desktop 4.18 and later), `RocketChatDesktop.videoCall` holds an `IVideoCallWindow`. There, the main window's setters are no-ops.

```ts
const callWindow = window.RocketChatDesktop?.videoCall;

callWindow?.openInMainWindow('/home');
callWindow?.close();
```

### User presence

Rocket.Chat 8.10.0 and later use two members for the presence of the user:

- `setUserPresenceState` receives the presence of the user.
- `setUserStatusChangeHandler` receives the function that changes the status of the user.

Both members are optional, and they are not part of contract version 1 (`WebClientBridgeVersion`). Desktop app versions that do not have them ignore the presence.

The web client calls `setUserPresenceState` when it starts and again after each change. It also calls it when no user session exists. The first call tells the desktop app that the workspace supports the presence contract. The announced `WebClientBridgeVersion` does not tell it that.

Desktop 4.18 already has a `setUserPresence` member with a different payload. Do not use that name for these members. If you do, a new server sends the wrong payload to a released desktop app.

```ts
window.RocketChatDesktop?.setUserPresenceState?.({
	loggedIn: true,
	connection: 'connected',
	status: 'busy',
	statusText: 'In a meeting',
	statusExpiresAt: '2026-10-19T18:00:00.000Z',
	availableStatuses: ['online', 'away', 'busy'],
	customStatuses: [{ id: 'abc123', name: 'In a meeting', status: 'busy' }],
});
```

| Field               | Description                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loggedIn`          | `true` when a user session exists.                                                                                                                                     |
| `connection`        | The state of the connection: `'connected'`, `'connecting'` or `'disconnected'`.                                                                                        |
| `status`            | The status of the user: `'online'`, `'away'`, `'busy'` or `'offline'`. The field is absent when no user session exists, or while the web client loads the user record. |
| `statusText`        | The custom status text. The field is absent when the user has no text.                                                                                                 |
| `statusExpiresAt`   | The date and time when the current status ends, in ISO 8601 format. The field is absent when the status has no end.                                                    |
| `availableStatuses` | The statuses that the user can select now. The list is empty when the workspace or an administrator disabled presence, or while the web client loads the user record.  |
| `customStatuses`    | The custom statuses that the workspace administrator created. Each item has an `id`, a `name` and a base `status`. The list is empty when the user cannot select them. |

The handler receives a `DesktopUserStatusChangeRequest` (`{ status, customStatusId? }`). To select one of the `customStatuses`, send its `id` in `customStatusId`.

The handler uses the same flow as the user menu of the web client. Thus the rate limit, permissions and settings of the server apply.

- A status from `availableStatuses` removes the custom status text and its expiration. Exception: when the workspace setting `Accounts_AllowUserStatusMessageChange` is off, `'away'`, `'busy'` and `'offline'` keep the current text. `'online'` always removes it.
- A custom status sets its base status and uses its name as the text.

The returned promise rejects when the server refuses the change.

## API

### `IRocketChatDesktop`

| Member                                                                                                                 | Description                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onReady(cb)`                                                                                                          | Registers a callback that receives a `ServerInfo`.                                                                                                                                                                                                                                                                                                                 |
| `setServerInfo(serverInfo)`                                                                                            | Reports the server's `ServerInfo` (`{ version }`).                                                                                                                                                                                                                                                                                                                 |
| `setUrlResolver(getAbsoluteUrl)`                                                                                       | Gives the app a function that turns a relative path into an absolute URL.                                                                                                                                                                                                                                                                                          |
| `setBadge(badge)`                                                                                                      | Sets the unread badge: a count, or `'•'` for unread without a count.                                                                                                                                                                                                                                                                                               |
| `setFavicon(url)`, `setBackground(url)`, `setTitle(title)`                                                             | Update the app's icon, background image and window title.                                                                                                                                                                                                                                                                                                          |
| `setSidebarCustomTheme(css)`                                                                                           | Passes the workspace's custom sidebar theme.                                                                                                                                                                                                                                                                                                                       |
| `setUserLoggedIn(loggedIn)`, `setUserRoles(roles)`                                                                     | Report the login state and the user's roles.                                                                                                                                                                                                                                                                                                                       |
| `setUnreadAlertEnabled?(enabled)`                                                                                      | Whether the user wants the unread indicator in the badge (the `unreadAlert` preference). Optional: older app versions lack it.                                                                                                                                                                                                                                     |
| `setWebClientBridgeVersion?(version)`                                                                                  | Announces the contract version the web client implements (`WebClientBridgeVersion`, currently `1`). From version 1 the web client pushes the server info, URL resolver, title, favicon, user roles, badge, login state, unread alert preference, git commit hash and Outlook credentials itself; presence is not part of it. Optional: older app versions lack it. |
| `setUserToken(token, userId)`                                                                                          | Passes the user's credentials to the app.                                                                                                                                                                                                                                                                                                                          |
| `setUserPresenceDetection(options)`                                                                                    | Configures auto-away: `isAutoAwayEnabled`, `idleThreshold`, and a `setUserOnline` callback.                                                                                                                                                                                                                                                                        |
| `setUserPresenceState?(presence)`                                                                                      | Receives the presence of the user. Optional, and not part of contract version 1. See [User presence](#user-presence).                                                                                                                                                                                                                                              |
| `setUserStatusChangeHandler?(handler)`                                                                                 | Receives the status-change function. Optional, and not part of contract version 1. See [User presence](#user-presence).                                                                                                                                                                                                                                            |
| `setUserThemeAppearance(appearance)`                                                                                   | Reports the theme: `'dark'`, `'light'`, `'auto'`, `'high-contrast'` or `undefined`.                                                                                                                                                                                                                                                                                |
| `createNotification(options)`, `destroyNotification(id)`                                                               | Show and remove a native notification. `options` extends `NotificationOptions`.                                                                                                                                                                                                                                                                                    |
| `dispatchCustomNotification(options)`, `closeCustomNotification(id)`                                                   | Show and close a custom `'voice'` or `'text'` notification.                                                                                                                                                                                                                                                                                                        |
| `getInternalVideoChatWindowEnabled()`                                                                                  | Whether the app opens video calls in its own window.                                                                                                                                                                                                                                                                                                               |
| `openInternalVideoChatWindow(url, options)`                                                                            | Opens a video call in the app's window.                                                                                                                                                                                                                                                                                                                            |
| `openDocumentViewer(url, format, options)`                                                                             | Opens a document in the app's viewer.                                                                                                                                                                                                                                                                                                                              |
| `supportedDocumentViewerFormats?()`                                                                                    | Formats the viewer supports. Optional: older app versions lack it.                                                                                                                                                                                                                                                                                                 |
| `getE2ePdfPreviewSizeLimit()`                                                                                          | Size limit for previewing encrypted PDFs.                                                                                                                                                                                                                                                                                                                          |
| `getOutlookEvents(date)`, `setOutlookExchangeUrl(url, userId)`, `hasOutlookCredentials()`, `clearOutlookCredentials()` | Outlook calendar integration.                                                                                                                                                                                                                                                                                                                                      |
| `writeTextToClipboard(text)`                                                                                           | Writes text to the clipboard.                                                                                                                                                                                                                                                                                                                                      |
| `openInBrowser(url)`                                                                                                   | Opens a URL in the system browser.                                                                                                                                                                                                                                                                                                                                 |
| `reloadServer()`                                                                                                       | Reloads the workspace.                                                                                                                                                                                                                                                                                                                                             |
| `setGitCommitHash(hash)`                                                                                               | Reports the server build's commit hash.                                                                                                                                                                                                                                                                                                                            |
| `videoCall?`                                                                                                           | The `IVideoCallWindow`, present only in the video call window.                                                                                                                                                                                                                                                                                                     |

### `IVideoCallWindow`

| Member                   | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `openInMainWindow(path)` | Opens a path in the app's main window.                             |
| `close()`                | Closes the video call window.                                      |
| `requestScreenSharing()` | Asks for a screen-sharing source. Resolves to a string, or `null`. |
| `getAuthCredentials?()`  | Deprecated. Removed in desktop 4.18.                               |

### Other types

`ServerInfo`, `Badge`, `ThemeAppearance`, `VideoChatWindowOptions`, `OutlookEventsResponse`, `CustomNotificationOptions`, `WebClientBridgeVersion`, `DesktopWindowEvent` (the names of the `CustomEvent`s the web client fires on `window` for the app), `DesktopUserStatus`, `DesktopUserPresence`, `DesktopCustomUserStatus` and `DesktopUserStatusChangeRequest`.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/desktop-api). From the repository root:

```sh
yarn workspace @rocket.chat/desktop-api build
yarn workspace @rocket.chat/desktop-api lint
yarn workspace @rocket.chat/desktop-api typecheck
```

Changes to these types change the contract with the desktop app.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
