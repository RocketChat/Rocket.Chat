import type { JSONSchemaType } from 'ajv';

/**
 * Client is putting a call on hold to first talk to a new actor, to whom it may later transfer the call.
 * The `callId` is the call being held; the call to the new actor is identified by `requestedCallId`,
 * a temporary id that is never propagated to other agents.
 */
export type ClientMediaSignalAttendedTransfer = {
	callId: string;
	type: 'attended-transfer';
	contractId: string;

	requestedCallId: string;
	to: {
		type: 'user' | 'sip';
		id: string;
	};
};

export const clientMediaSignalAttendedTransferSchema: JSONSchemaType<ClientMediaSignalAttendedTransfer> = {
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
			const: 'attended-transfer',
		},
		requestedCallId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		to: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: ['user', 'sip'],
					nullable: false,
				},
				id: {
					type: 'string',
					nullable: false,
					minLength: 1,
				},
			},
			required: ['type', 'id'],
			additionalProperties: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'requestedCallId', 'to'],
};
