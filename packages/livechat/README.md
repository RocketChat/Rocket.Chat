# `@rocket.chat/livechat`

> The Rocket.Chat Livechat widget: a chat window that website visitors use to talk to Omnichannel agents.

[![npm](https://img.shields.io/npm/v/@rocket.chat/livechat?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/livechat) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/livechat?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/livechat)

Livechat is a small [Preact](https://preactjs.com) application for business-to-customer conversations between Omnichannel agents and the visitors of a website. Every Rocket.Chat server builds and serves it under `/livechat`.

The build has two parts:

- `rocketchat-livechat.min.js`, a loader script that a website embeds. It adds an iframe to the page and exposes the `RocketChat` global used to control the widget.
- The widget application itself (`index.html` plus its bundles), which runs inside that iframe and talks to the Rocket.Chat server.

## Installation

You do not need to install this package to add Livechat to a website. Use the script that your Rocket.Chat server already serves (see [Usage](#usage)).

The npm package exists so the widget is versioned with the rest of the monorepo. Its `files` field lists only `build/`, while the build writes to `dist/`, so the published tarball currently contains no build output.

## Usage

### Embedding the widget

Paste this snippet before the closing `</body>` tag of your site, replacing `https://your.server` with your Rocket.Chat site URL. The same snippet is shown in Rocket.Chat under **Omnichannel > Installation**.

```html
<!-- Start of Rocket.Chat Livechat Script -->
<script type="text/javascript">
	(function (w, d, s, u) {
		w.RocketChat = function (c) {
			w.RocketChat._.push(c);
		};
		w.RocketChat._ = [];
		w.RocketChat.url = u;
		var h = d.getElementsByTagName(s)[0],
			j = d.createElement(s);
		j.async = true;
		j.src = 'https://your.server/livechat/rocketchat-livechat.min.js?_=201903270000';
		h.parentNode.insertBefore(j, h);
	})(window, document, 'script', 'https://your.server/livechat');
</script>
```

### Controlling the widget

Calls to `RocketChat(fn)` are queued until the loader script is ready. Each callback runs with the widget API as `this`:

```js
RocketChat(function () {
	this.setTheme({
		color: '#04436A', // title bar background
		fontColor: '#FFFFFF', // title bar text
		iconColor: '#1D74F5', // widget icon
		title: 'Welcome to Rocket.Chat', // title when agents are online
		offlineTitle: 'Service is offline', // title when no agent is online
		position: 'right', // 'left' or 'right'
	});

	this.setDepartment('sales');

	this.onChatStarted(function () {
		console.log('chat started');
	});
});
```

You can also pass several settings at once with `initialize`:

```js
RocketChat(function () {
	this.initialize({
		theme: { title: 'Need help?' },
		department: 'sales',
		guestName: 'Jane Doe',
		guestEmail: 'jane@example.com',
		language: 'en',
	});
});
```

### Screenshots

These come from the widget's original 2018 design, so details may differ from the current UI.

![Header actions: toggle sounds, minimize and expand the chat](https://user-images.githubusercontent.com/5263975/44279585-497b2980-a228-11e8-81a2-36bc3389549e.png)
![Typing and sending a message, with the agent's typing indicator](https://user-images.githubusercontent.com/5263975/44279599-5730af00-a228-11e8-8873-553ef53ee25a.png)
![Unread messages banner and divider, and the minimized widget with an unread badge](https://user-images.githubusercontent.com/5263975/44279626-6f083300-a228-11e8-8886-c430b28a8e75.png)
![Options menu and the change department form](https://user-images.githubusercontent.com/5263975/44279634-74657d80-a228-11e8-9583-bf8079972696.png)
![Finishing a chat: confirmation, rating and feedback, and the closing screen](https://user-images.githubusercontent.com/5263975/44279639-7b8c8b80-a228-11e8-9815-1a0e3540c4f5.png)
![Attachment menu and a file message with its download button](https://user-images.githubusercontent.com/5263975/44279643-847d5d00-a228-11e8-804e-27b973dee8b2.png)
![Uploading a file by drag and drop](https://user-images.githubusercontent.com/5263975/44279655-90691f00-a228-11e8-8511-4a328a77e5bb.png)

## API

The object bound to `this` inside a `RocketChat(fn)` callback (also available as `RocketChat.livechat`).

### Methods

| Method                                        | Description                                                                                                                                                                                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize(params)`                          | Applies several settings at once. Keys: `theme`, `department`, `businessUnit`, `guestToken`, `guestName`, `guestEmail`, `registerGuest`, `language`, `agent`, `parentUrl`, `customField`, `setCustomFields`, `setGuestMetadata`, `hiddenSystemMessages`. |
| `setTheme(theme)`                             | Sets `title`, `offlineTitle`, `color`, `fontColor`, `iconColor`, `position` (`'left'` or `'right'`), `background`, `guestBubbleBackgroundColor`, `agentBubbleBackgroundColor`, `hideGuestAvatar`, `hideAgentAvatar`, `hideExpandChat`.                   |
| `setDepartment(id)` / `clearDepartment()`     | Selects or clears the department that receives the chat.                                                                                                                                                                                                 |
| `setBusinessUnit(id)` / `clearBusinessUnit()` | Selects or clears the business unit.                                                                                                                                                                                                                     |
| `setAgent(agent)`                             | Sets the default agent.                                                                                                                                                                                                                                  |
| `setGuestToken(token)`                        | Sets the visitor token.                                                                                                                                                                                                                                  |
| `setGuestName(name)`                          | Sets the visitor name.                                                                                                                                                                                                                                   |
| `setGuestEmail(email)`                        | Sets the visitor email.                                                                                                                                                                                                                                  |
| `registerGuest(guest)`                        | Registers the visitor, for example `{ token, name, email }`.                                                                                                                                                                                             |
| `setGuestMetadata(metadata)`                  | Attaches a `Record<string, string>` of metadata to the visitor.                                                                                                                                                                                          |
| `setCustomField(key, value, overwrite?)`      | Sets a visitor custom field. `overwrite` defaults to `true`.                                                                                                                                                                                             |
| `setLanguage(lang)`                           | Sets the widget language.                                                                                                                                                                                                                                |
| `setParentUrl(url)`                           | Sets the URL reported as the page that hosts the widget.                                                                                                                                                                                                 |
| `setHiddenSystemMessages(types)`              | Hides system messages of the given types: `'uj'`, `'ul'`, `'livechat-close'`, `'livechat-started'`, `'livechat_transfer_history'`.                                                                                                                       |
| `transferChat(department)`                    | Transfers the current conversation to another department, given by ID or name. Fails if no conversation has started or the department is not available.                                                                                                  |
| `pageVisited(change)`                         | Reports the current page to the agent. The loader already reports URL and title changes on its own.                                                                                                                                                      |
| `showWidget()` / `hideWidget()`               | Shows or hides the widget.                                                                                                                                                                                                                               |
| `maximizeWidget()` / `minimizeWidget()`       | Opens or collapses the chat window.                                                                                                                                                                                                                      |
| `clearAllCallbacks()`                         | Meant to remove every callback registered with the `on*` methods, but currently removes none of them. The `on*` methods return nothing, so registered callbacks cannot be removed.                                                                       |

### Callbacks

Each method takes a function that runs when the event happens.

| Method                      | Fires when                                   |
| --------------------------- | -------------------------------------------- |
| `onChatMaximized(fn)`       | The chat window opens.                       |
| `onChatMinimized(fn)`       | The chat window collapses.                   |
| `onChatStarted(fn)`         | A chat starts.                               |
| `onChatEnded(fn)`           | A chat ends.                                 |
| `onPrechatFormSubmit(fn)`   | The visitor submits the pre-chat form.       |
| `onOfflineFormSubmit(fn)`   | The visitor submits the offline form.        |
| `onWidgetShown(fn)`         | The widget is shown.                         |
| `onWidgetHidden(fn)`        | The widget is hidden.                        |
| `onAssignAgent(fn)`         | An agent is assigned to the chat.            |
| `onAgentStatusChange(fn)`   | The assigned agent's status changes.         |
| `onQueuePositionChange(fn)` | The visitor's position in the queue changes. |
| `onServiceOffline(fn)`      | No agent is online.                          |

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/livechat). From the repository root:

```sh
yarn workspace @rocket.chat/livechat build       # production build into dist/
yarn workspace @rocket.chat/livechat start       # dev server with hot reload at http://localhost:8080
yarn workspace @rocket.chat/livechat lint        # eslint + stylelint
yarn workspace @rocket.chat/livechat typecheck
yarn workspace @rocket.chat/livechat storybook   # Storybook at http://localhost:9001
```

Other scripts: `dev` (same as `build`), `clean`, `eslint`, `stylelint` and `build-storybook`.

When Rocket.Chat itself is built, it copies `dist/` into the server, which serves it under `/livechat`.

### Running the widget locally

1. Run a Rocket.Chat server at `http://localhost:3000`.
2. Build once, so `dist/rocketchat-livechat.min.js` exists: `yarn workspace @rocket.chat/livechat build`.
3. Start the dev server: `yarn workspace @rocket.chat/livechat start`.
4. Open `packages/livechat/widget-demo.html` in a browser. It loads the loader script from `dist/` and the widget from `http://localhost:8080`. Serving the file over HTTP (for example with [http-server](https://github.com/http-party/http-server)) makes it load faster.

### Using a different server

The widget picks its Rocket.Chat server from, in order:

1. `window.SERVER_URL`;
2. the `serverUrl` query parameter of the widget URL;
3. `http://localhost:3000` in development builds.

So to test against another server, change the widget URL in `widget-demo.html` to `http://localhost:8080/?serverUrl=https://your.server`.

## License

MIT — see [LICENSE](LICENSE).
