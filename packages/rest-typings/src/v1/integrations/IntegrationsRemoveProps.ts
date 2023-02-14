import Ajv from 'ajv';

const ajv = new Ajv();

export type IntegrationsRemoveProps =
	| { type: 'webhook-incoming'; integrationId: string }
	| { type: 'webhook-outgoing'; integrationId?: string; target_url?: string };

const integrationsRemoveSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					nullable: false,
					pattern: 'webhook-incoming',
				},
				integrationId: {
					type: 'string',
					nullable: false,
				},
			},
			required: ['type', 'integrationId'],
		},
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					nullable: false,
					pattern: 'webhook-outgoing',
				},
				target_url: {
					type: 'string',
					nullable: false,
				},
			},
			required: ['type', 'target_url'],
		},
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					nullable: false,
					pattern: 'webhook-outgoing',
				},
				integrationId: {
					type: 'string',
					nullable: false,
				},
			},
			required: ['type', 'integrationId'],
		},
	],
};

export const isIntegrationsRemoveProps = ajv.compile<IntegrationsRemoveProps>(integrationsRemoveSchema);
