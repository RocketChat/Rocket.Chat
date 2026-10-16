# `@rocket.chat/apps-engine`

> The public API and TypeScript definitions for building Rocket.Chat Apps.

[![npm](https://img.shields.io/npm/v/@rocket.chat/apps-engine?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/apps-engine) [![downloads](https://img.shields.io/npm/dw/@rocket.chat/apps-engine?style=flat-square)](https://www.npmjs.com/package/@rocket.chat/apps-engine)

The Apps-Engine is Rocket.Chat's plugin framework. This package holds the surface an App is written against: the `App` base class, the event handler interfaces, the accessors an App uses to read and change the workspace, and the related types and enums. The Rocket.Chat server loads your App, calls its handlers and hands it implementations of these accessors.

With it, an App can:

- listen to events on messages, rooms, users, livechat, file uploads, emails and media calls, and prevent, extend or modify many of them before they happen;
- register slash commands, HTTP endpoints, settings, action buttons and scheduled jobs;
- send messages, create rooms and discussions, and open UiKit modals, banners and contextual bars;
- store data in a per-App key-value persistence and make outbound HTTP requests.

The package only ships definitions. The code that installs and runs Apps lives inside Rocket.Chat itself.

## Installation

```sh
npm install @rocket.chat/apps-engine
```

Everything is published under the `definition/` directory, as CommonJS with TypeScript declarations. There is no root entry point: import from the module that declares what you need, for example `@rocket.chat/apps-engine/definition/App` or `@rocket.chat/apps-engine/definition/accessors`.

Some message and UiKit types refer to `@rocket.chat/ui-kit`. If you use those types, install it too:

```sh
npm install @rocket.chat/apps-engine @rocket.chat/ui-kit
```

## Usage

An App is a class that extends `App`, plus an `app.json` manifest that points to it. Apps are usually scaffolded, packaged and deployed with the Rocket.Chat Apps CLI (`rc-apps`), which sets up this package for you. See the [Rocket.Chat developer documentation](https://developer.rocket.chat/) for the full workflow.

### The App class

```ts
import type {
	IAppAccessors,
	IConfigurationExtend,
	IEnvironmentRead,
	IHttp,
	ILogger,
	IModify,
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import type { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType } from '@rocket.chat/apps-engine/definition/settings';

import { HelloCommand } from './HelloCommand';

export class HelloApp extends App implements IPostMessageSent {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
		await configuration.settings.provideSetting({
			id: 'greeting',
			type: SettingType.STRING,
			packageValue: 'Hello',
			required: true,
			public: false,
			i18nLabel: 'Greeting',
		});

		await configuration.slashCommands.provideSlashCommand(new HelloCommand());
	}

	public async executePostMessageSent(
		message: IMessage,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void> {
		this.getLogger().debug(`Message sent in ${message.room.id}`);
	}
}
```

`extendConfiguration` runs when the App is initialized. Use the `IConfigurationExtend` accessors to declare what the App provides: `settings`, `slashCommands`, `api`, `ui`, `scheduler`, `externalComponents`, `videoConfProviders`, `outboundCommunication` and `http`.

Override the lifecycle methods you need. Two have defaults that matter if you override them:

- `onEnable` returns `true`. Return `false` to keep the App from being enabled.
- `onPreSettingUpdate` returns `context.newSetting`, so the proposed value is saved. Return a different setting to change what gets saved.

`onDisable`, `onInstall`, `onUninstall`, `onUpdate` and `onSettingUpdated` do nothing by default.

### Slash commands

```ts
import type { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

export class HelloCommand implements ISlashCommand {
	public command = 'hello';

	public i18nParamsExample = '';

	public i18nDescription = 'Says hello';

	public providesPreview = false;

	public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
		const greeting = await read.getEnvironmentReader().getSettings().getValueById('greeting');

		const builder = modify
			.getCreator()
			.startMessage()
			.setSender(context.getSender())
			.setRoom(context.getRoom())
			.setText(`${greeting}, ${context.getArguments().join(' ') || 'world'}!`);

		await modify.getCreator().finish(builder);
	}
}
```

### The manifest

`app.json` describes the App. The Apps CLI generates it; the schema lives in [`definition/app-schema.json`](https://github.com/RocketChat/Rocket.Chat/blob/develop/packages/apps-engine/src/definition/app-schema.json).

```json
{
	"id": "6f1d4ad5-41b4-4f1d-9e9c-2a3d1b4c5e6f",
	"name": "Hello",
	"nameSlug": "hello",
	"version": "1.0.0",
	"description": "Says hello",
	"requiredApiVersion": "^1.0.0",
	"author": {
		"name": "Jane Doe",
		"support": "https://example.com/support"
	},
	"classFile": "HelloApp.ts",
	"iconFile": "icon.png"
}
```

`id` should be a UUID v4. `requiredApiVersion` is checked against the Apps-Engine version of the server the App is installed on.

### Event handlers

Handlers are interfaces your App class implements, such as `IPostMessageSent` above. The full list is the `AppInterface` enum in `definition/metadata`.

Most events have `Pre` and `Post` handlers. `Pre` handlers run before the event is finalized; `Post` handlers run after it. If you want to change the data behind an event, do it in a `Pre` handler. If you only want to react to it, use `Post`.

They run in this order:

1. `Pre<Event>Prevent` decides whether the event should be prevented. Return `true` to stop it.
2. `Pre<Event>Extend` adds to the data without being destructive, for example by adding an attachment to a message.
3. `Pre<Event>Modify` can change anything in the data.
4. `Post<Event>` is for listening. Changes to the data are not possible here.

Some handlers also declare an optional `check<Handler>` method (for example `checkPostMessageSent`). When it returns `false`, the handler is skipped. Only the handlers for messages being sent, updated or deleted and for rooms being created or deleted have one; the others, such as `IPostUserCreated`, always run.

### UiKit

Messages and UiKit surfaces take blocks from [`@rocket.chat/ui-kit`](https://www.npmjs.com/package/@rocket.chat/ui-kit). To handle clicks and form submissions, implement `IUIKitInteractionHandler` (`executeBlockActionHandler`, `executeViewSubmitHandler`, `executeViewClosedHandler`, `executeActionButtonHandler`) from `definition/uikit`.

`BlockBuilder` and the `I*Block` interfaces in `definition/uikit/blocks` are deprecated; pass `LayoutBlock` objects instead.

## API

Each directory under `definition/` is a module you can import. The main ones:

| Module                     | Contents                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `definition/App`           | `App`, the abstract base class for every App                                                                                                                                   |
| `definition/AppStatus`     | `AppStatus` enum and `AppStatusUtils`                                                                                                                                          |
| `definition/accessors`     | Accessor interfaces: `IRead`, `IModify`, `IHttp`, `IPersistence`, `IConfigurationExtend`, `IEnvironmentRead`, `ILogger`, builders such as `IMessageBuilder` and `IRoomBuilder` |
| `definition/metadata`      | `IAppInfo`, `IAppAuthorInfo`, `AppInterface`, `AppMethod`, `AppPermissions`, `RocketChatAssociationModel`, `RocketChatAssociationRecord`                                       |
| `definition/messages`      | `IMessage`, attachments, reactions and the message event handlers (`IPreMessageSentPrevent`, `IPostMessageSent`, ...)                                                          |
| `definition/rooms`         | `IRoom`, `RoomType` and the room event handlers                                                                                                                                |
| `definition/users`         | `IUser` types and the user event handlers                                                                                                                                      |
| `definition/livechat`      | Livechat rooms, visitors, departments and their event handlers                                                                                                                 |
| `definition/slashcommands` | `ISlashCommand`, `SlashCommandContext`, slash command previews                                                                                                                 |
| `definition/settings`      | `ISetting`, `SettingType`                                                                                                                                                      |
| `definition/api`           | `IApi`, `ApiEndpoint`, `ApiVisibility`, `ApiSecurity` for HTTP endpoints                                                                                                       |
| `definition/uikit`         | UiKit interaction handlers, contexts and responders                                                                                                                            |
| `definition/ui`            | Action buttons (`IUIActionButtonDescriptor`, `UIActionButtonContext`)                                                                                                          |
| `definition/scheduler`     | Scheduled and recurring jobs                                                                                                                                                   |
| `definition/persistence`   | Persistence association types                                                                                                                                                  |
| `definition/exceptions`    | `AppsEngineException` and the exceptions an App can throw to block an action                                                                                                   |

The other directories (`uploads`, `email`, `videoConferences`, `videoConfProviders`, `externalComponent`, `oauth2`, `cloud`, `roles`, `permissions`, `federation`, `mediaCalls`, `outboundCommunication`, `abac`, `assets`, `eventResult`) follow the same pattern.

## Development

This package lives in the [Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/apps-engine). From the repository root:

```sh
yarn workspace @rocket.chat/apps-engine build
yarn workspace @rocket.chat/apps-engine dev
yarn workspace @rocket.chat/apps-engine lint
yarn workspace @rocket.chat/apps-engine typecheck
yarn workspace @rocket.chat/apps-engine gen-doc
```

`build` compiles `src/` into `definition/` at the package root, which is what gets published. `dev` does the same in watch mode. `typecheck` also checks the type tests in `tests/`. `gen-doc` generates API documentation with TypeDoc into `docs/`.

### Working with a local Rocket.Chat

The Rocket.Chat app in `apps/meteor` depends on this package through the workspace, so it always uses your local copy. Run `build` (or keep `dev` running) after changing the definitions, then restart the server if it does not pick up the change.

### Scope of this package

Only the public surface that Apps use belongs here. Server-side App management lives in the private `@rocket.chat/apps` package. See [docs/apps-engine-migration.md](https://github.com/RocketChat/Rocket.Chat/blob/develop/docs/apps-engine-migration.md) for the background.

## License

MIT — see [LICENSE](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE).
