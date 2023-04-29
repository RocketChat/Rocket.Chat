import { ajv } from '../../helpers/schemas';

export type DeleteOAuthAppParams = {
	appId: string;
};

const DeleteOAuthAppParamsSchema = {
	type: 'object',
	properties: {
		appId: {
			type: 'string',
		},
	},
	required: ['appId'],
	additionalProperties: false,
};

export const isDeleteOAuthAppParams = ajv.compile<DeleteOAuthAppParams>(DeleteOAuthAppParamsSchema);
