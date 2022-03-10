import type { IStats } from '../../IStats';

export type StatisticsEndpoints = {
	'statistics': {
		GET: (params: { refresh?: boolean }) => IStats;
	};
	'statistics.telemetry': {
		POST: (params: ITelemetryEvent[]) => any;
	};
};

export interface ITelemetryEvent {
	eventName: string;
	timestamp: number;
}

export interface IOTREnded extends ITelemetryEvent {
	roomId: string;
}

export interface ISlashCommand extends ITelemetryEvent {
	command: string;
}
