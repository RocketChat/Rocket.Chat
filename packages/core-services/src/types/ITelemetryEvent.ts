import type { TelemetryEvents, TelemetryMap } from '@rocket.chat/rest-typings';

export type { TelemetryEvents, TelemetryMap };

export interface ITelemetryEvent {
	register: (name: TelemetryEvents, fn: () => Promise<any> | void) => void;
	call: <T extends TelemetryEvents>(eventName: T, data: TelemetryMap[T]) => Promise<any> | void;
}
