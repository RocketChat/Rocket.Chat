import type { JSONSchemaType } from 'ajv';

// Client is reporting an error
export type ClientMediaSignalError = {
	callId: string;
	contractId: string;
	type: 'error';

	errorCode: string;
};

export const clientMediaSignalErrorSchema: JSONSchemaType<ClientMediaSignalError> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		contractId: {
			type: 'string',
			nullable: false,
		},
		type: {
			type: 'string',
			const: 'error',
		},
		errorCode: {
			type: 'string',
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'errorCode'],
};
