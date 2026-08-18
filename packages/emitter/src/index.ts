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

const once = Symbol('once');
const evts = Symbol('evts');

/**
 * The event emitter class.
 *
 * @public
 */
export class Emitter<EventMap extends DefaultEventMap = DefaultEventMap> implements IEmitter<EventMap> {
	private [evts] = new Map<AnyEventTypeOf<EventMap>, AnyEventHandlerOf<EventMap>[]>();

	private [once] = new WeakMap<AnyEventHandlerOf<EventMap>, number>();

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
	 * @returns a function to unsubscribe the handler invoking `this.off(type, handler)`
	 */
	on<T extends AnyEventOf<EventMap>, TType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: TType,
		handler: EventHandlerOf<EventMap, TType>,
	): OffCallbackHandler;

	on(type: keyof EventMap, handler: (...args: any[]) => void) {
		const handlers = this[evts].get(type) ?? [];
		handlers.push(handler);
		this[evts].set(type, handlers);
		return () => this.off(type, handler);
	}

	/**
	 * Adds a *one-time* `handler` function for the event of the `type` type.
	 *
	 * @returns a function to unsubscribe the handler invoking `this.off(type, handler)`
	 */
	once<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		handler: EventHandlerOf<EventMap, EventType>,
	): OffCallbackHandler;

	once(type: keyof EventMap, handler: (...args: any[]) => void) {
		const counter = this[once].get(handler) || 0;
		this[once].set(handler, counter + 1);
		return this.on(type, handler);
	}

	/**
	 * Removes the specified `handler` from the list of handlers of the event of the `type` type
	 */
	off<T extends AnyEventOf<EventMap>, EventType extends AnyEventTypeOf<EventMap> = EventTypeOf<EventMap, T>>(
		type: EventType,
		handler: EventHandlerOf<EventMap, EventType>,
	): void;

	off(type: keyof EventMap, handler: (...args: any[]) => void) {
		const handlers = this[evts].get(type);
		if (!handlers) {
			return;
		}

		const counter = this[once].get(handler) ?? 0;
		if (counter > 1) {
			this[once].set(handler, counter - 1);
		} else {
			this[once].delete(handler);
		}

		handlers.splice(handlers.findIndex((callback) => callback === handler) >>> 0, 1);

		if (handlers.length === 0) {
			this[evts].delete(type);
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
		[...(this[evts].get(type) ?? [])].forEach((handler) => {
			handler(event);

			if (this[once].get(handler)) {
				this.off(type, handler);
			}
		});
	}
}
