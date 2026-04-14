import type { JSONSchemaType } from 'ajv';

/** Client is sending DTMF tones to the other side of the call */
export type ClientMediaSignalDTMF = {
	callId: string;
	type: 'dtmf';
	contractId: string;

	dtmf: string;
	duration?: number;
};

export const clientMediaSignalDTMFSchema: JSONSchemaType<ClientMediaSignalDTMF> = {
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
			const: 'dtmf',
		},
		dtmf: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		duration: {
			type: 'number',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'dtmf'],
};
