type updateCounterDataType = { settingsId: string };
type slashCommandsDataType = { command: string };
type otrDataType = { rid: string };

export type TelemetryMap = { otrStats: otrDataType; slashCommandsStats: slashCommandsDataType; updateCounter: updateCounterDataType };
export type TelemetryEvents = keyof TelemetryMap;

export interface ITelemetryEvent {
	register: (name: TelemetryEvents, fn: () => Promise<any> | void) => void;
	call: <T extends TelemetryEvents>(eventName: T, data: TelemetryMap[T]) => Promise<any> | void;
}
