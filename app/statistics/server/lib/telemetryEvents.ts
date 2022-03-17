import { ITelemetryEvent, TelemetryEvents } from '../../../../server/sdk/types/ITelemetryEvent';

type TelemetryEventResponse = Promise<any> | void;
type TelemetryEventFunction = (...args: any) => TelemetryEventResponse;

class TelemetryEvent implements ITelemetryEvent {
	private events = new Map<string, TelemetryEventFunction | void>();

	register(name: string, fn: TelemetryEventFunction | void): void {
		this.events.set(name, fn);
	}

	call(eventName: TelemetryEvents, data: Record<string, any>): TelemetryEventResponse {
		const event = this.events.get(eventName);
		if (!event) {
			throw new Error('event not found');
		}

		return event(data);
	}
}

const telemetryEvent = new TelemetryEvent();
export default telemetryEvent;
