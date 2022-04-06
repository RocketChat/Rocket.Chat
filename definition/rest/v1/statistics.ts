import type { IStats } from '../../IStats';

export type StatisticsEndpoints = {
	'statistics': {
		GET: (params: { refresh?: boolean }) => IStats;
	};
	'statistics.telemetry': {
		POST: (params: TelemetryPayload) => any;
	};
};

export type TelemetryBase = {
	eventName: string;
	timestamp: number;
};

type OTREnded = TelemetryBase & { rid: string };

type SlashCommand = TelemetryBase & { command: string };

export type StatsCounter = TelemetryBase & { settingsId: string };

type Params = TelemetryBase | OTREnded | SlashCommand | StatsCounter;

export type TelemetryPayload = { params: Params[] };
