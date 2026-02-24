import { ajv } from '../../Ajv';

export type IntegrationsHooksAddProps = {
	event: string;
	name: string;
	target_url: string;
	data?: {
		channel_name?: string;
		trigger_words?: string[];
		username?: string;
	};
};

const integrationsHooksAddSchema = {
	type: 'object',
	properties: {
		event: {
			type: 'string',
			enum: ['newMessageOnChannel', 'newMessageToUser'],
			nullable: false,
		},
		name: {
			type: 'string',
			nullable: false,
		},
		target_url: {
			type: 'string',
			nullable: false,
		},
		data: {
			type: 'object',
			properties: {
				channel_name: {
					type: 'string',
				},
				trigger_words: {
					type: 'string',
				},
				username: {
					type: 'string',
				},
			},
		},
	},
	required: ['event', 'name', 'target_url'],
	additionalProperties: false,
};

export const isIntegrationsHooksAddSchema = ajv.compile<IntegrationsHooksAddProps>(integrationsHooksAddSchema);
