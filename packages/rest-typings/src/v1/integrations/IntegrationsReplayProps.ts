import { ajv } from '../Ajv.js';

export type IntegrationsReplayProps = {
	integrationId: string;
	historyId: string;
};

const IntegrationsReplaySchema = {
	type: 'object',
	properties: {
		integrationId: { type: 'string', minLength: 1 },
		historyId: { type: 'string', minLength: 1 },
	},
	required: ['integrationId', 'historyId'],
	additionalProperties: false,
};

export const isIntegrationsReplayProps = ajv.compile<IntegrationsReplayProps>(IntegrationsReplaySchema);
