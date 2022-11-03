import type { TelemetryMap, ITelemetryEvent, TelemetryEvents } from '../../../../server/sdk/types/ITelemetryEvent';

type TelemetryEventResponse = Promise<any> | void;
type TelemetryEventFunction<T extends TelemetryEvents> = (data: TelemetryMap[T]) => TelemetryEventResponse;

class TelemetryEvent implements ITelemetryEvent {
	private events = new Map<string, (...args: any[]) => any>();

	register<T extends TelemetryEvents>(name: T, fn: TelemetryEventFunction<T>): void {
		this.events.set(name, fn);
	}

	call<T extends TelemetryEvents>(eventName: T, data: TelemetryMap[T]): TelemetryEventResponse {
		const fn = this.events.get(eventName) as TelemetryEventFunction<T>;
		if (!fn) {
			throw new Error('event not found');
		}

		return fn(data);
	}
}

const telemetryEvent = new TelemetryEvent();
export default telemetryEvent;
