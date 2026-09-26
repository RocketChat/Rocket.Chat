# @rocket.chat/apps-engine

The public API and type definitions for building Rocket.Chat Apps.

A Rocket.Chat App is a TypeScript package that runs inside a Rocket.Chat
workspace. It listens to what happens there, adds to the interface, and talks to
services outside. This package is what an App is written against: it declares
the classes it extends, the interfaces it implements, and the accessors it
reaches the workspace through.

The workspace supplies the implementation at runtime, so an App depends on this
package only to compile.

> [!NOTE]
> Full guides, tutorials and the App submission process live at
> [developer.rocket.chat](https://developer.rocket.chat/docs/rocketchat-apps-engine).
> This page is the short version.

## Quick start

Install the CLI and scaffold an App:

```sh
npm install -g @rocket.chat/apps-cli
rc-apps create
```

The generated project already depends on this package and contains the two files
every App needs: an `app.json` manifest and a class extending `App`.

```ts
import { App } from '@rocket.chat/apps-engine/definition/App';
import type { IAppAccessors, IConfigurationExtend, ILogger } from '@rocket.chat/apps-engine/definition/accessors';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

export class HelloWorldApp extends App {
	constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
		super(info, logger, accessors);
	}

	protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
		await configuration.slashCommands.provideSlashCommand(new HelloCommand());
	}
}
```

`extendConfiguration` runs once, when the workspace loads the App. Everything the
App offers — slash commands, settings, HTTP endpoints, UI buttons, scheduled
jobs — is registered from there.

A slash command implements `ISlashCommand`. The accessors it is handed are how it
reaches the workspace: `read` to look things up, `modify` to change them, `http`
to call out, `persis` to store data of its own. Take only the ones you need —
the example below stops at `modify`.

```ts
import type { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

class HelloCommand implements ISlashCommand {
	public command = 'hello';

	public i18nParamsExample = '';

	public i18nDescription = 'Says hello back';

	public providesPreview = false;

	public async executor(context: SlashCommandContext, read: IRead, modify: IModify): Promise<void> {
		const creator = modify.getCreator();
		const message = creator.startMessage().setRoom(context.getRoom()).setText(`Hello, ${context.getSender().name}!`);

		await creator.finish(message);
	}
}
```

Nothing is written until `finish` is called with the builder, so a message can be
passed around and changed first.

To install the App on a local workspace:

```sh
rc-apps deploy --url http://localhost:3000 --username <admin> --password <password>
```

`rc-apps watch` takes the same flags and redeploys on every change, which is the
loop to work in.

## What an App can do

Register its own surfaces:

- slash commands
- HTTP endpoints, public or private
- settings an administrator fills in
- UI action buttons, modals and contextual bars built from UIKit blocks
- scheduled jobs
- video conference and outbound messaging providers

React to what happens in the workspace, by implementing the matching handler
interface:

- messages sent, updated, deleted, reacted to, pinned, starred or reported
- rooms created or deleted, and users joining or leaving them
- users created, updated, deleted, logging in or out
- Livechat conversations starting, being assigned, transferred or closed
- media calls, file uploads and outgoing email

A handler named `Post…` runs after the action is final and only observes. One
named `Pre…` runs before, and the suffix says what it may do. For a given event
they run in this order:

1. `Pre…Prevent` — decides whether the action happens at all
2. `Pre…Extend` — adds to the data without overwriting what is there
3. `Pre…Modify` — changes the data freely
4. `Post…` — observes the finished action

So: reach for `Extend` when adding an attachment to somebody else's message, and
`Modify` only when a value really has to be replaced.

Reach outside its own code, through the accessors:

- read and write rooms, messages, users, uploads and Livechat records
- call external HTTP services
- store data of its own, keyed to a room, message or user
- sign a user into an outside service over OAuth2

Every one of these is gated by a permission the App declares in its manifest.

## Versioning

An App declares the Apps-Engine version it needs in its manifest:

```json
{
	"requiredApiVersion": "^1.66.0"
}
```

A workspace refuses to install an App whose required version it cannot satisfy,
so this is the number that decides where the App runs. This package follows
[semver](https://semver.org): a minor release adds to the API, a major release
may remove from it.

## API reference

The generated TypeDoc reference documents every exported symbol:

```sh
yarn gen-doc
```

## Contributing

The Apps-Engine lives in the
[Rocket.Chat monorepo](https://github.com/RocketChat/Rocket.Chat) under
`packages/apps-engine`. See the repository's
[contributing guide](https://github.com/RocketChat/Rocket.Chat/blob/develop/.github/CONTRIBUTING.md)
to get a development workspace running.

The engine only declares this API. A host — Rocket.Chat itself — implements it by
supplying the storage and bridges the definitions expect.

## Engage with us

### Share your story

We'd love to hear about [your experience](https://survey.zohopublic.com/zs/e4BUFG)
and potentially feature it on our
[Blog](https://rocket.chat/case-studies/?utm_source=github&utm_medium=readme&utm_campaign=community).

### Subscribe for Updates

Once a month our marketing team releases an email update with news about product
releases, company related topics, events and use cases.
[Sign Up!](https://rocket.chat/newsletter/?utm_source=github&utm_medium=readme&utm_campaign=community)
