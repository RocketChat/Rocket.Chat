type updateCounterDataType = { settingsId: string };
type slashCommandsDataType = { command: string };

export type TelemetryMap = { slashCommandsStats: slashCommandsDataType; updateCounter: updateCounterDataType };
export type TelemetryEvents = keyof TelemetryMap;

export interface ITelemetryEvent {
	register: (name: TelemetryEvents, fn: () => Promise<any> | void) => void;
	call: <T extends TelemetryEvents>(eventName: T, data: TelemetryMap[T]) => Promise<any> | void;
}
