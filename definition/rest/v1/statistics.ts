import type { IStats } from '../../IStats';

export type StatisticsEndpoints = {
	'statistics': {
		GET: (params: { refresh?: boolean }) => IStats;
	};
	'statistics.telemetry': {
		POST: (params: TelemetryEvent[] | OTREnded[] | SlashCommand[]) => any;
	};
};

export type TelemetryEvent = {
	eventName: string;
	timestamp: number;
};

export type OTREnded = TelemetryEvent & { roomId: string };

export type SlashCommand = TelemetryEvent & { command: string };
