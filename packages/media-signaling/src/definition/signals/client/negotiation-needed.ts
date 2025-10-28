import type { JSONSchemaType } from 'ajv';

/** Client is reporting they need a new service negotiation */
export type ClientMediaSignalNegotiationNeeded = {
	callId: string;
	type: 'negotiation-needed';
	contractId: string;

	oldNegotiationId: string;
};

export const clientMediaSignalNegotiationNeededSchema: JSONSchemaType<ClientMediaSignalNegotiationNeeded> = {
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
			const: 'negotiation-needed',
		},
		oldNegotiationId: {
			type: 'string',
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'oldNegotiationId'],
};
