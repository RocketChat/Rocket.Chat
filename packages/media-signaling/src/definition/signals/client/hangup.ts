import type { JSONSchemaType } from 'ajv';

import { callHangupReasonList, type CallHangupReason } from '../../call';

/** Client is saying they hanged up from a call. The reason specifies if its a clean hangup or an error */
export type ClientMediaSignalHangup = {
	callId: string;
	contractId: string;
	type: 'hangup';

	reason: CallHangupReason;
};

export const clientMediaSignalHangupSchema: JSONSchemaType<ClientMediaSignalHangup> = {
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
			const: 'hangup',
		},
		reason: {
			type: 'string',
			enum: callHangupReasonList,
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'reason'],
};
