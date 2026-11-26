import type { JSONSchemaType } from 'ajv';

/**
 * Client is finishing an attended transfer: it drops out so the actor on the held call and the actor
 * it was consulting are connected to each other.
 * The `callId` is the consultation call; the held call is the parent of that call.
 */
export type ClientMediaSignalCompleteAttendedTransfer = {
	callId: string;
	type: 'complete-attended-transfer';
	contractId: string;
};

export const clientMediaSignalCompleteAttendedTransferSchema: JSONSchemaType<ClientMediaSignalCompleteAttendedTransfer> = {
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
			const: 'complete-attended-transfer',
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type'],
};
