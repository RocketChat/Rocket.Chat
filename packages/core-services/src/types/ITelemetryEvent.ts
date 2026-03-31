import type { TelemetryMap, TelemetryEvents } from '@rocket.chat/rest-typings';

export interface ITelemetryEvent {
	register: (name: TelemetryEvents, fn: () => Promise<any> | void) => void;
	call: <T extends TelemetryEvents>(eventName: T, data: TelemetryMap[T]) => Promise<any> | void;
}
