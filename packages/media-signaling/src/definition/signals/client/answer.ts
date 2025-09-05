import type { JSONSchemaType } from 'ajv';

import type { CallAnswer } from '../../call';

/** Client is saying that the user accepted or rejected a call, or simply reporting that the user can or can't be reached */
export type ClientMediaSignalAnswer = {
	callId: string;
	type: 'answer';
	contractId: string;

	answer: CallAnswer;
};

export const clientMediaSignalAnswerSchema: JSONSchemaType<ClientMediaSignalAnswer> = {
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
			const: 'answer',
		},
		answer: {
			type: 'string',
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'answer'],
};
