export type TelemetryEvents = 'otrStats' | 'slashCommandsStats' | 'updateCounter';

export interface ITelemetryEvent {
	register: (name: string, fn: () => Promise<any> | void) => void;
	call: (eventName: TelemetryEvents, data: any) => Promise<any> | void;
}
