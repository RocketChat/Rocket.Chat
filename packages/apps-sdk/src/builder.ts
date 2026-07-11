import type { EventName, Handler } from './events';

/** One subscription, as reported to the host on `load` (0005 §4, invariant #3). Filters (0004) deferred. */
export type Registration = {
	readonly event: EventName;
};

/**
 * The mutable authoring surface passed to the `defineApp` factory (0001 §2). Slice 1 exposes only
 * `on`; `registerSlashcommand` and the other contributions (pillar 2) are deferred.
 */
export type AppBuilder = {
	on<E extends EventName>(event: E, handler: Handler<E>): void;
};

export type HandlerMap = {
	[E in EventName]?: Handler<E>[];
};

/** What the runtime reads back after driving the factory: the manifest plus the live handlers. */
export type BuilderCollection = {
	readonly registrations: readonly Registration[];
	readonly handlers: HandlerMap;
};

/**
 * Internal — used by `@rocket.chat/apps-runtime` to drive a definition; not part of the
 * app-facing contract. Builds a fresh `AppBuilder` and collects everything the factory registers.
 */
export function createBuilder(): { builder: AppBuilder; collection: BuilderCollection } {
	const registrations: Registration[] = [];
	const handlers: HandlerMap = {};

	const builder: AppBuilder = {
		on(event, handler) {
			registrations.push({ event });

			if (!handlers[event]) {
				handlers[event] = [];
			}

			handlers[event].push(handler);
		},
	};

	return { builder, collection: { registrations, handlers } };
}
