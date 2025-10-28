import Ajv from 'ajv';

const ajv = new Ajv();

export type IntegrationsHooksRemoveProps = {
	target_url: string;
};

const integrationsHooksRemoveSchema = {
	type: 'object',
	properties: {
		target_url: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['target_url'],
	additionalProperties: false,
};

export const isIntegrationsHooksRemoveSchema = ajv.compile<IntegrationsHooksRemoveProps>(integrationsHooksRemoveSchema);
