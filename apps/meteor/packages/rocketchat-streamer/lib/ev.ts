export type StreamArgs = unknown[];
export type EventHandler<TArgs extends unknown[] = any> = (...args: TArgs) => void;

type HandlerMap = Record<string, EventHandler[] | undefined>;

export class EV {
	private handlers: HandlerMap = {};

	emit(event: string, ...args: StreamArgs): void {
		this.handlers[event]?.forEach((handler) => handler.apply(this, args));
	}

	emitWithScope(event: string, scope: unknown, ...args: StreamArgs): void {
		this.handlers[event]?.forEach((handler) => handler.apply(scope, args));
	}

	listenerCount(event: string): number {
		return this.handlers[event]?.length ?? 0;
	}

	on<TArgs extends unknown[]>(event: string, callback: EventHandler<TArgs>): void {
		if (!this.handlers[event]) {
			this.handlers[event] = [];
		}
		this.handlers[event]!.push(callback);
	}

	once(event: string, callback: EventHandler): void {
		const onetimeCallback: EventHandler = (...args) => {
			this.removeListener(event, onetimeCallback);
			callback.apply(this, args);
		};
		this.on(event, onetimeCallback);
	}

	removeListener(event: string, callback: EventHandler): void {
		const handlers = this.handlers[event];
		if (!handlers) {
			return;
		}
		const index = handlers.indexOf(callback);
		if (index > -1) {
			handlers.splice(index, 1);
		}
	}

	removeAllListeners(event: string): void {
		this.handlers[event] = undefined;
	}
}

export default EV;
