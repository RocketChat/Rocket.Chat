import type { JSONSchemaType } from 'ajv';

/** Client is reporting an error */
export type ClientMediaSignalError = {
	callId: string;
	contractId: string;
	type: 'error';

	errorType?: 'signaling' | 'service' | 'other';
	errorCode?: string;
	negotiationId?: string;
	critical?: boolean;
	errorDetails?: string;
};

export const clientMediaSignalErrorSchema: JSONSchemaType<ClientMediaSignalError> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		contractId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		type: {
			type: 'string',
			const: 'error',
		},
		errorType: {
			type: 'string',
			enum: ['signaling', 'service', 'other'],
			nullable: true,
		},
		errorCode: {
			type: 'string',
			nullable: true,
		},
		negotiationId: {
			type: 'string',
			nullable: true,
		},
		critical: {
			type: 'boolean',
			nullable: true,
		},
		errorDetails: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type'],
};
