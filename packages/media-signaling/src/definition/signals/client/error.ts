// Client is reporting an error
export type ClientMediaSignalError = {
	callId: string;
	contractId: string;
	type: 'error';

	errorCode: string;
};

export const clientMediaSignalErrorSchema = {
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
			const: 'error',
		},
		errorCode: {
			type: 'string',
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'errorCode'],
} as const;
