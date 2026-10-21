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

## API

### `IRocketChatDesktop`

| Member                                                                                                                 | Description                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `onReady(cb)`                                                                                                          | Registers a callback that receives a `ServerInfo`.                                          |
| `setServerInfo(serverInfo)`                                                                                            | Reports the server's `ServerInfo` (`{ version }`).                                          |
| `setUrlResolver(getAbsoluteUrl)`                                                                                       | Gives the app a function that turns a relative path into an absolute URL.                   |
| `setBadge(badge)`                                                                                                      | Sets the unread badge: a count, or `'•'` for unread without a count.                        |
| `setFavicon(url)`, `setBackground(url)`, `setTitle(title)`                                                             | Update the app's icon, background image and window title.                                   |
| `setSidebarCustomTheme(css)`                                                                                           | Passes the workspace's custom sidebar theme.                                                |
| `setUserLoggedIn(loggedIn)`, `setUserRoles(roles)`                                                                     | Report the login state and the user's roles.                                                |
| `setUserToken(token, userId)`                                                                                          | Passes the user's credentials to the app.                                                   |
| `setUserPresenceDetection(options)`                                                                                    | Configures auto-away: `isAutoAwayEnabled`, `idleThreshold`, and a `setUserOnline` callback. |
| `setUserThemeAppearance(appearance)`                                                                                   | Reports the theme: `'dark'`, `'light'`, `'auto'`, `'high-contrast'` or `undefined`.         |
| `createNotification(options)`, `destroyNotification(id)`                                                               | Show and remove a native notification. `options` extends `NotificationOptions`.             |
| `dispatchCustomNotification(options)`, `closeCustomNotification(id)`                                                   | Show and close a custom `'voice'` or `'text'` notification.                                 |
| `getInternalVideoChatWindowEnabled()`                                                                                  | Whether the app opens video calls in its own window.                                        |
| `openInternalVideoChatWindow(url, options)`                                                                            | Opens a video call in the app's window.                                                     |
| `openDocumentViewer(url, format, options)`                                                                             | Opens a document in the app's viewer.                                                       |
| `supportedDocumentViewerFormats?()`                                                                                    | Formats the viewer supports. Optional: older app versions lack it.                          |
| `getE2ePdfPreviewSizeLimit()`                                                                                          | Size limit for previewing encrypted PDFs.                                                   |
| `getOutlookEvents(date)`, `setOutlookExchangeUrl(url, userId)`, `hasOutlookCredentials()`, `clearOutlookCredentials()` | Outlook calendar integration.                                                               |
| `writeTextToClipboard(text)`                                                                                           | Writes text to the clipboard.                                                               |
| `openInBrowser(url)`                                                                                                   | Opens a URL in the system browser.                                                          |
| `reloadServer()`                                                                                                       | Reloads the workspace.                                                                      |
| `setGitCommitHash(hash)`                                                                                               | Reports the server build's commit hash.                                                     |
| `videoCall?`                                                                                                           | The `IVideoCallWindow`, present only in the video call window.                              |

### `IVideoCallWindow`

| Member                   | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `openInMainWindow(path)` | Opens a path in the app's main window.                             |
| `close()`                | Closes the video call window.                                      |
| `requestScreenSharing()` | Asks for a screen-sharing source. Resolves to a string, or `null`. |
| `getAuthCredentials?()`  | Deprecated. Removed in desktop 4.18.                               |

### Other types

`ServerInfo`, `Badge`, `ThemeAppearance`, `VideoChatWindowOptions`, `OutlookEventsResponse`, `CustomNotificationOptions`.

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
