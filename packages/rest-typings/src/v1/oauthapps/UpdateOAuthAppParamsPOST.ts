import { ajv } from '../Ajv';

export type UpdateOAuthAppParams = {
	applicationId: string;
	application: {
		name: string;
		redirectUri: string;
		active: boolean;
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
				redirectUri: {
					type: 'string',
				},
				active: {
					type: 'boolean',
				},
			},
			required: ['name', 'redirectUri', 'active'],
			additionalProperties: false,
		},
	},
	additionalProperties: false,
	required: ['applicationId', 'application'],
};

export const isUpdateOAuthAppParams = ajv.compile<UpdateOAuthAppParams>(UpdateOAuthAppParamsSchema);
