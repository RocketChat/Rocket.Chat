import { ajv } from '../Ajv';

export type UpdateOAuthAppParams = {
	applicationId: string;
	application: {
		name: string;
		active: boolean;
		clientId?: string | undefined;
		clientSecret?: string | undefined;
		redirectUri: string;
	};
};

const UpdateOAuthAppParamsSchema = {
	type: 'object',
	properties: {
		applicationId: {
			type: 'string',
		},
		application: {
			type: 'object',
			properties: {
				name: {
					type: 'string',
				},
				active: {
					type: 'boolean',
				},
				clientId: {
					type: 'string',
					nullable: true,
				},
				clientSecret: {
					type: 'string',
					nullable: true,
				},
				redirectUri: {
					type: 'string',
				},
			},
			required: ['name', 'active', 'redirectUri'],
			additionalProperties: false,
		},
	},
	additionalProperties: false,
	required: ['applicationId', 'application'],
};

export const isUpdateOAuthAppParams = ajv.compile<UpdateOAuthAppParams>(UpdateOAuthAppParamsSchema);
