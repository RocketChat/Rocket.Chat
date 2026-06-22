1:

It's not simply about runtimes in @packages/apps, which already has deno-runtime and node-runtime available. I'm thinking we need a new package at @packages/apps-next or something similar, brand new and indepentend from the original @packages/apps. @packages/apps-engine can maybe export a new `v2` folder, or we can also create a new package and publish as @rocket.chat/apps-engine@next.

The core may not _need_ to know about the 2 coexisting versions - we may unify the calls to a single AppOrchestrator method, and the orchestrator fans out requests to both versions of the apps. The ordering should be apps v1 -> v2 - if v1 blocks a message, for instance, it doesn't follow through to the next API. If the v2 call throws, the flow needs to continue as if v1 was the only implementation available. We must keep the current flow working.

An app can only support v1 or v2. The v2 manifest _may_ be incompatible with the v1 manifest.

The v1 will be deprecated and will eventually be sunsetted in a major Rocket.Chat release, but we don't have a hard date for that to happen. Ideally, we'd be able to provide code mods that can "upgrade" an app from v1 to v2, but that's a concern for the future.

2:

I'm envisioning something along these lines:

```typescript
import { Engine } from '@rocket.chat/apps-engine/next'; // path to be defined

const app = Engine.createApp();

// Object shape is not set in stone
app.registerSlashcommand({
	command: 'hello',
	i18nDescription: 'i18n_description_key',
	i18nParams: 'i18n_params_key',
	actions: {
		async run(ctx: SlashcommandExecutionContext): Promise<SlashcommandResponse> {
			const roomId = ctx.get('rid');

			// things to consider here: operation atomicity, metaproperties (e.g. $inc, $unset, etc.)
			await ctx.rooms.update({ _id: roomId }, { /* ... properties */ }, { /* options? */});

			return ctx.success(); // I don't have a clear view of the possibilities here
		},
		async preview?(ctx: SlashcommandPreviewContext): Promise<SlashcommandPreviewResponse>,
	},
});

// Use typescript to clearly define available events with the correct parameters

// Lifecycle events
app.on('installed', /* maybe allow for middlewares? */, (ctx: AppInstallationContext): Promise<void>);
app.on('updated', /* maybe allow for middlewares? */, (ctx: AppInstallationContext): Promise<void>);

// Event subscription
Engine.on('message:pre', async (ctx: MessageEventContext) => {
	const message = ctx.get('message');

	const { _id: roomId } = await ctx.rooms.findById(); // simple example

	// Modify message data
	message.rid = roomId;
	message.msg = `${message.msg} - Validated by test app`;

	return ctx.patch(message);
	// return ctx.continue | ctx.allow;
	// return ctx.prevent({ message: string } | { i18n: string });
});
````

Lots of things here are stylistic of course, as essentially the execution model for apps could be boiled down to "message handlers" - an interface similar to Express would be able to cover all possibilities properly.

The ubiquitous `ctx` seems to be the best way to control what is available for different... well... contexts. And having one "provider" object to pass to utility functions the app itself defines is better ergonomics than passing read, modify, persistence and http objects as parameters.

3.

You've convinced me on the _timing_ axis, but not the others. We should have pre/post markers for events (syntax TBD), where pre events return a Decision (allow, prevent(reason), patch when applicable, maybe others). Ordering is first-come, first-served; handlers are executed in registration order and apps shouldn't rely on ordering expectations. The first app to prevent the action short-circuits others. Changes cascade from a handler to the next. Here I'd also like to analyze the potential benefits of running the event handlers as a "middleware" apprach, where handlers get a `next` function they should call when they're done.

A note on Round 3.

The distributed nature of the apps-engine is about to change, it's not worth it to dwell on that now. Each instance should only be aware of itself. Changes to the target state will be propagated by the system when necessary, and each instance should respond accordingly.
