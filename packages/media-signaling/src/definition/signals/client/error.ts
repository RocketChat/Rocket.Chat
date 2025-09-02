import type { JSONSchemaType } from 'ajv';

/** Client is reporting an error */
export type ClientMediaSignalError = {
	callId: string;
	contractId: string;
	type: 'error';

	errorType?: 'signaling' | 'service' | 'other';
	errorCode?: string;
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
		errorType: {
			type: 'string',
			nullable: true,
		},
		errorCode: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type'],
};
