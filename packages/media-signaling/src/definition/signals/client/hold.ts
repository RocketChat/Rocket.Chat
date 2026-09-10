import type { JSONSchemaType } from 'ajv';

/**
 * Client is requesting its own leg of the call to be put on hold / resumed.
 * For webrtc calls hold is handled locally on the client, so this signal is only used by services
 * where the media lives elsewhere (e.g. `cti`) and the hold must be applied by the call backend.
 */
export type ClientMediaSignalHold = {
	callId: string;
	type: 'hold';
	contractId: string;

	held: boolean;
};

export const clientMediaSignalHoldSchema: JSONSchemaType<ClientMediaSignalHold> = {
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
			const: 'hold',
		},
		held: {
			type: 'boolean',
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'held'],
};
