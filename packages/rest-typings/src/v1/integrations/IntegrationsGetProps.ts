import { ajv } from '../../helpers/schemas';

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

export const isIntegrationsGetProps = ajv.compile<IntegrationsGetProps>(integrationsGetSchema);
