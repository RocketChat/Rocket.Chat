import type { JSONSchemaType } from 'ajv';

import type { CallAnswer, CallFeature } from '../../call';
import { callFeatureList } from '../../call/IClientMediaCall';

/** Client is saying that the user accepted or rejected a call, or simply reporting that the user can or can't be reached */
export type ClientMediaSignalAnswer = {
	callId: string;
	type: 'answer';
	contractId: string;

	answer: CallAnswer;

	supportedFeatures?: CallFeature[];
};

export const clientMediaSignalAnswerSchema: JSONSchemaType<ClientMediaSignalAnswer> = {
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
			const: 'answer',
		},
		answer: {
			type: 'string',
			enum: ['accept', 'reject', 'ack', 'unavailable'],
			nullable: false,
		},
		supportedFeatures: {
			type: 'array',
			items: {
				type: 'string',
				enum: callFeatureList,
				nullable: false,
			},
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'answer'],
};
