import { ajv } from '../../helpers/schemas';

export type UpdateOAuthAppParams = {
	appId: string;
	name: string;
	active: boolean;
	clientId?: string | undefined;
	clientSecret?: string | undefined;
	redirectUri: string;
};

const UpdateOAuthAppParamsSchema = {
	type: 'object',
	properties: {
		appId: {
			type: 'string',
		},
		name: {
			type: 'string',
		},
		active: {
			type: 'boolean',
		},
		redirectUri: {
			type: 'string',
		},
	},
	required: ['appId', 'name', 'active', 'redirectUri'],
	additionalProperties: false,
};

export const isUpdateOAuthAppParams = ajv.compile<UpdateOAuthAppParams>(UpdateOAuthAppParamsSchema);
