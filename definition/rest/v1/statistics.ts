import Ajv, { JSONSchemaType } from 'ajv';

import type { IStats } from '../../IStats';

const ajv = new Ajv();

type StatisticsProps = {
	refresh?: 'true' | 'false';
};

const StatisticsPropsSchema: JSONSchemaType<StatisticsProps> = {
	type: 'object',
	properties: {
		refresh: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isStatisticsProps = ajv.compile(StatisticsPropsSchema);

export type StatisticsEndpoints = {
	statistics: {
		GET: (params: StatisticsProps) => IStats;
	};
};
