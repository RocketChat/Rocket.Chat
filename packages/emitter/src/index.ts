/** @public */
export type DefaultEventMap = Record<string | symbol, any>;

/** @public */
export type AnyEventTypeOf<EventMap extends DefaultEventMap> = keyof EventMap;

/** @public */
export type AnyEventOf<EventMap extends DefaultEventMap> = EventMap[keyof EventMap];

/** @public */
export type AnyEventHandlerOf<EventMap extends DefaultEventMap> = {
	[EventType in keyof EventMap]: EventMap[EventType] extends void ? () => void : (event: EventMap[EventType]) => void;
}[keyof EventMap];

/** @public */
export type EventTypeOf<EventMap extends DefaultEventMap, EventValue extends EventMap[keyof EventMap]> = {
	[EventType in keyof EventMap]: EventMap[EventType] extends EventValue ? EventType : never;
}[keyof EventMap];

/** @public */
export type EventOf<EventMap extends DefaultEventMap, EventType extends AnyEventTypeOf<EventMap>> = EventMap[EventType] extends void
	? never
	: EventMap[EventType];

/** @public */
export type EventHandlerOf<EventMap extends DefaultEventMap, EventType extends AnyEventTypeOf<EventMap>> = EventMap[EventType] extends void
	? () => void
	: (event: EventMap[EventType]) => void;

/** @public */
export type OffCallbackHandler = () => void;

/** @public */
export interface IEmitter<EventMap extends DefaultEventMap = DefaultEventMap> {
	on<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		handler: EventHandlerOf<EventMap, EventType>,
	): OffCallbackHandler;
	once<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		handler: EventHandlerOf<EventMap, EventType>,
	): OffCallbackHandler;
	off<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		handler: EventHandlerOf<EventMap, EventType>,
	): void;
	emit<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		...[event]: EventOf<EventMap, EventType> extends void ? [undefined?] : [EventOf<EventMap, EventType>]
	): void;
	has(key: AnyEventTypeOf<EventMap>): boolean;
	events(): AnyEventTypeOf<EventMap>[];
}

const evts = Symbol('evts');

type Registration<EventMap extends DefaultEventMap> = {
	handler: AnyEventHandlerOf<EventMap>;
	once: boolean;
};

/**
 * The event emitter class.
 *
 * @public
 */
export class Emitter<EventMap extends DefaultEventMap = DefaultEventMap> implements IEmitter<EventMap> {
	private [evts] = new Map<AnyEventTypeOf<EventMap>, Registration<EventMap>[]>();

	/**
	 * Returns the whole EventType list
	 */
	events(): AnyEventTypeOf<EventMap>[] {
		return Array.from(this[evts].keys());
	}

	/**
	 * Returns `true` if this emmiter has a listener attached to the `key` event type
	 */
	has(key: AnyEventTypeOf<EventMap>): boolean {
		return this[evts].has(key);
	}

	/**
	 * Adds the `handler` function to listen events of the `type` type.
	 *
	 * @returns a function to unsubscribe this registration of the handler
	 */
	on<T extends AnyEventOf<EventMap>, TType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: TType,
		handler: EventHandlerOf<EventMap, TType>,
	): OffCallbackHandler;

	on(type: keyof EventMap, handler: (...args: any[]) => void) {
		return this.register(type, { handler, once: false });
	}

	/**
	 * Adds a *one-time* `handler` function for the event of the `type` type.
	 *
	 * @returns a function to unsubscribe this registration of the handler
	 */
	once<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		handler: EventHandlerOf<EventMap, EventType>,
	): OffCallbackHandler;

	once(type: keyof EventMap, handler: (...args: any[]) => void) {
		return this.register(type, { handler, once: true });
	}

	/**
	 * Removes the specified `handler` from the list of handlers of the event of the `type` type
	 */
	off<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		handler: EventHandlerOf<EventMap, EventType>,
	): void;

	off(type: keyof EventMap, handler: (...args: any[]) => void) {
		const registration = this[evts].get(type)?.find((registration) => registration.handler === handler);
		if (registration) {
			this.unregister(type, registration);
		}
	}

	/**
	 * Calls each of the handlers registered for the event of `type` type, in the
	 * order they were registered, passing the supplied argument `e` to each.
	 */
	emit<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		...[event]: EventOf<EventMap, EventType> extends void ? [undefined?] : [EventOf<EventMap, EventType>]
	): void;

	emit(type: keyof EventMap, ...[event]: any[]) {
		[...(this[evts].get(type) ?? [])].forEach((registration) => {
			if (registration.once) {
				if (!this[evts].get(type)?.includes(registration)) {
					return;
				}

				this.unregister(type, registration);
			}

			registration.handler(event);
		});
	}

	private register(type: keyof EventMap, registration: Registration<EventMap>): OffCallbackHandler {
		const registrations = this[evts].get(type) ?? [];
		registrations.push(registration);
		this[evts].set(type, registrations);
		return () => this.unregister(type, registration);
	}

	private unregister(type: keyof EventMap, registration: Registration<EventMap>) {
		const registrations = this[evts].get(type);
		const index = registrations?.indexOf(registration) ?? -1;
		if (!registrations || index === -1) {
			return;
		}

		registrations.splice(index, 1);

		if (registrations.length === 0) {
			this[evts].delete(type);
		}
	}
}
