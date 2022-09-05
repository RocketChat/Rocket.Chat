import { ajv } from '../Ajv';

export type DeleteOAuthAppParams = {
	id: string;
	appId: string;
};

const DeleteOAuthAppParamsSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
		},
		appId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['id', 'appId'],
};

export const isDeleteOAuthAppParams = ajv.compile<DeleteOAuthAppParams>(DeleteOAuthAppParamsSchema);
