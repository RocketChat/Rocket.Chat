import { ajv } from '../Ajv.js';

export type IntegrationsClearHistoryProps = {
	integrationId: string;
};

const IntegrationsClearHistorySchema = {
	type: 'object',
	properties: {
		integrationId: { type: 'string', minLength: 1 },
	},
	required: ['integrationId'],
	additionalProperties: false,
};

export const isIntegrationsClearHistoryProps = ajv.compile<IntegrationsClearHistoryProps>(IntegrationsClearHistorySchema);
