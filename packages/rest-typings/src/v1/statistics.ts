import type { IStats } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';

type OTREnded = { rid: string };

type SlashCommand = { command: string };

type SettingsCounter = { settingsId: string };

export type TelemetryMap = { otrStats: OTREnded; slashCommandsStats: SlashCommand; updateCounter: SettingsCounter };

export type TelemetryEvents = keyof TelemetryMap;

type Param = {
	eventName: TelemetryEvents;
	timestamp?: number;
} & (OTREnded | SlashCommand | SettingsCounter);

type TelemetryPayload = {
	params: Param[];
};

const ajv = new Ajv({
	coerceTypes: true,
});

type StatisticsProps = { refresh?: 'true' | 'false' };

const StatisticsSchema = {
	type: 'object',
	properties: {
		refresh: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isStatisticsProps = ajv.compile<StatisticsProps>(StatisticsSchema);

type StatisticsListProps = PaginatedRequest<{ fields?: string }>;

const StatisticsListSchema = {
	type: 'object',
	properties: {
		fields: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isStatisticsListProps = ajv.compile<StatisticsListProps>(StatisticsListSchema);

export type StatisticsEndpoints = {
	'/v1/statistics': {
		GET: (params: StatisticsProps) => IStats;
	};
	'/v1/statistics.list': {
		GET: (params: StatisticsListProps) => {
			statistics: IStats[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/statistics.telemetry': {
		POST: (params: TelemetryPayload) => any;
	};
};
