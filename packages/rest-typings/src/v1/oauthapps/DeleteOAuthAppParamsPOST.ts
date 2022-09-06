import { ajv } from '../Ajv';

export type DeleteOAuthAppParams = {
	applicationId: string;
};

const DeleteOAuthAppParamsSchema = {
	type: 'object',
	properties: {
		applicationId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['applicationId'],
};

export const isDeleteOAuthAppParams = ajv.compile<DeleteOAuthAppParams>(DeleteOAuthAppParamsSchema);
