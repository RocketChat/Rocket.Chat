import type { IStats } from '@rocket.chat/core-typings';

type OTREnded = { rid: string };

type SlashCommand = { command: string };

type SettingsCounter = { settingsId: string };

export type TelemetryMap = { otrStats: OTREnded; slashCommandsStats: SlashCommand; updateCounter: SettingsCounter };

export type TelemetryEvents = keyof TelemetryMap;

type Param = {
	eventName: TelemetryEvents;
} & (OTREnded | SlashCommand | SettingsCounter);

export type TelemetryPayload = {
	params: Param[];
};

export type StatisticsEndpoints = {
	'statistics': {
		GET: (params: { refresh?: 'true' | 'false' }) => IStats;
	};
	'statistics.list': {
		GET: (params: { offset?: number; count?: number; sort?: string; fields?: string; query?: string }) => {
			statistics: IStats[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'statistics.telemetry': {
		POST: (params: TelemetryPayload) => any;
	};
};
