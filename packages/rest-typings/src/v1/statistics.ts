import type { IStats } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

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
		GET: (params: PaginatedRequest<{ fields?: string }>) => PaginatedResult<{
			statistics: IStats[];
			total: number;
		}>;
	};
	'statistics.telemetry': {
		POST: (params: TelemetryPayload) => any;
	};
};
