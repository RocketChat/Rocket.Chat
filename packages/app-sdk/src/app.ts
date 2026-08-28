/**
 * The composition root.
 *
 * Legacy apps are a subclass of a god-class `App` that registers capabilities
 * imperatively inside `extendConfiguration(configuration, environment)`:
 *
 * ```ts
 * // legacy
 * export class MyApp extends App {
 *   protected async extendConfiguration(c: IConfigurationExtend) {
 *     await c.slashCommands.provideSlashCommand(new GreetCommand());
 *     await c.scheduler.registerProcessors([new DigestProcessor()]);
 *     await c.settings.provideSetting({ ... });
 *   }
 * }
 * ```
 *
 * The SDK is declarative, exactly like Mastra's `new Mastra({ agents, workflows,
 * tools })`. You compose an app from definitions registered *by value* in one
 * object. There is no base class and no `this`.
 *
 * Two entry points:
 *   - `defineApp(config)` — standalone, list every capability directly.
 *   - `createApp({ manifest, settings, store })` — returns a kit whose factory
 *     methods (`app.slashCommand`, `app.job`, …) are pre-bound to the app's
 *     inferred env, so `ctx.settings`/`ctx.store` are fully typed everywhere.
 *
 * Registration is also the dependency-injection seam. In Mastra, registering a
 * primitive calls `__registerMastra(this)` + `__registerPrimitives({ logger,
 * storage, … })` to push shared deps into it. The analogue here: definitions are
 * inert; at load the runtime binds a `ctx` (local object or NATS-RPC proxy) and
 * invokes them. The app never imports platform internals, which is what lets the
 * apps runtime run in-process or as a separate service unchanged.
 */

import type { ActionButton } from './ui';
import type { AppContext, AppEnv, BaseEnv } from './context';
import type { Endpoint, EndpointDef } from './endpoints';
import type { EventName, Listener, ListenerDef } from './listeners';
import type { Job, JobDef } from './jobs';
import type { AppManifest } from './manifest';
import type { OutboundProvider, OutboundProviderDef, VideoConfProvider, VideoConfProviderDef } from './providers';
import type { Schema } from './schema';
import type { SettingsDefinition, InferSettings } from './settings';
import type { SlashCommand, SlashCommandDef } from './commands';
import type { StoreDefinition, InferStore } from './store';
import type { UserId } from './models';

import { defineEndpoint } from './endpoints';
import { defineJob } from './jobs';
import { defineListener } from './listeners';
import { defineOutboundProvider, defineVideoConfProvider } from './providers';
import { defineSlashCommand } from './commands';

/** Lifecycle hooks — one `ctx` each, replacing the positional accessor tuples. */
export interface AppLifecycle<Env extends AppEnv> {
	onInstall?(ctx: AppContext<Env> & { installer?: { id: UserId } }): Promise<void>;
	/** Return `false` to refuse enabling (e.g. missing required settings). */
	onEnable?(ctx: AppContext<Env>): Promise<boolean | void>;
	onDisable?(ctx: AppContext<Env>): Promise<void>;
	onUninstall?(ctx: AppContext<Env>): Promise<void>;
	onUpdate?(ctx: AppContext<Env> & { previousVersion: string }): Promise<void>;
	/** React to one of the app's own settings changing. */
	onSettingUpdated?(ctx: AppContext<Env> & { settingId: string }): Promise<void>;
}

export interface AppRegistration<Env extends AppEnv> {
	commands?: SlashCommand<Env, any>[];
	jobs?: Job<Env, any>[];
	endpoints?: Endpoint<Env, any, any, any>[];
	listeners?: Listener<Env, any>[];
	actionButtons?: ActionButton<Env>[];
	providers?: {
		videoConf?: VideoConfProvider<Env>[];
		outbound?: OutboundProvider<Env>[];
	};
	lifecycle?: AppLifecycle<Env>;
}

export interface AppConfig<Env extends AppEnv> extends AppRegistration<Env> {
	manifest: AppManifest;
	settings?: SettingsDefinition<any>;
	store?: StoreDefinition<any>;
}

export const APP = Symbol.for('rc.app-sdk.app');

/** The normalized app the runtime loads. */
export interface AppDefinition<Env extends AppEnv = AppEnv> {
	readonly [APP]: true;
	readonly manifest: AppManifest;
	readonly settings?: SettingsDefinition<any>;
	readonly store?: StoreDefinition<any>;
	readonly registration: AppRegistration<Env>;
}

/** Standalone composition root. */
export function defineApp<Env extends AppEnv = BaseEnv>(config: AppConfig<Env>): AppDefinition<Env> {
	const { manifest, settings, store, ...registration } = config;
	if (!/^[0-9a-f-]{36}$/i.test(manifest.id)) {
		throw new Error(`defineApp: manifest.id must be a UUID (got ${JSON.stringify(manifest.id)})`);
	}
	return { [APP]: true, manifest, settings, store, registration };
}

/* ------------------------------------------------------------------ *
 * The env-bound kit (recommended).
 * ------------------------------------------------------------------ */

// `settings`/`store` are optional on `createApp`, so their generics arrive as
// `Def | undefined`. Strip the `undefined` before inferring, and treat the
// absent (`undefined`) case as an empty map. See schema.ts `InferArg` for the
// same pattern on handler payloads.
type EnvOf<S, T> = {
	settings: [S] extends [undefined] ? Record<string, never> : InferSettings<NonNullable<S>>;
	store: [T] extends [undefined] ? Record<string, never> : InferStore<NonNullable<T>>;
};

export interface AppKit<Env extends AppEnv> {
	/** Env-bound `defineSlashCommand`. */
	slashCommand<A extends Schema | undefined = undefined>(def: SlashCommandDef<Env, A>): SlashCommand<Env, A>;
	/** Env-bound `defineJob`. */
	job<D extends Schema | undefined = undefined>(def: JobDef<Env, D>): Job<Env, D>;
	/** Env-bound `defineEndpoint`. */
	endpoint<
		B extends Schema | undefined = undefined,
		Q extends Schema | undefined = undefined,
		P extends Schema | undefined = undefined,
	>(def: EndpointDef<Env, B, Q, P>): Endpoint<Env, B, Q, P>;
	/** Env-bound `defineListener`. */
	listener<E extends EventName>(def: ListenerDef<Env, E>): Listener<Env, E>;
	/** Env-bound `defineVideoConfProvider`. */
	videoConfProvider(def: VideoConfProviderDef<Env>): VideoConfProvider<Env>;
	/** Env-bound `defineOutboundProvider`. */
	outboundProvider(def: OutboundProviderDef<Env>): OutboundProvider<Env>;
	/** Finalize the app by registering the capabilities. */
	build(registration: AppRegistration<Env>): AppDefinition<Env>;
}

/**
 * Create an env-bound app kit. `settings` and `store` are used both to register
 * the definitions and — via `InferSettings`/`InferStore` — to type `ctx.settings`
 * and `ctx.store` in every handler the kit produces.
 */
export function createApp<
	S extends SettingsDefinition<any> | undefined = undefined,
	T extends StoreDefinition<any> | undefined = undefined,
>(base: { manifest: AppManifest; settings?: S; store?: T }): AppKit<EnvOf<S, T>> {
	type Env = EnvOf<S, T>;
	return {
		slashCommand: (def) => defineSlashCommand<any, Env>(def),
		job: (def) => defineJob<any, Env>(def),
		endpoint: (def) => defineEndpoint<any, any, any, Env>(def),
		listener: (def) => defineListener<any, Env>(def),
		videoConfProvider: (def) => defineVideoConfProvider<Env>(def),
		outboundProvider: (def) => defineOutboundProvider<Env>(def),
		build: (registration) =>
			defineApp<Env>({
				manifest: base.manifest,
				settings: base.settings,
				store: base.store,
				...registration,
			}),
	};
}
