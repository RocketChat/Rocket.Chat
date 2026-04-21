import { ajv } from '@rocket.chat/rest-typings';
export const errorResponse = ajv.compile<{
	success: false;
	error: string;
	status?: string;
	message?: string;
}>({
	type: 'object',
	additionalProperties: false,
	properties: {
		success: {
			type: 'boolean',
			enum: [false],
			description: 'Indicates if the request was successful.',
		},
		error: {
			type: 'string',
		},
		status: {
			type: 'string',
			nullable: true,
		},
		message: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['success', 'error'],
});