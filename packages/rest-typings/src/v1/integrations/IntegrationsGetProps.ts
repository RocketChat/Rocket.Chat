import { ajvQuery } from '../Ajv.js';

export type IntegrationsGetProps = { integrationId: string; createdBy?: string };

const integrationsGetSchema = {
	type: 'object',
	properties: {
		integrationId: {
			type: 'string',
			nullable: false,
		},
		createdBy: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['integrationId'],
};

export const isIntegrationsGetProps = ajvQuery.compile<IntegrationsGetProps>(integrationsGetSchema);
